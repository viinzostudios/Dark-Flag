# Sistema de Input — Dark Flag

> **REGLA CRÍTICA**: Los controles de PC y móvil son dos implementaciones completamente
> separadas. Modificar una **no puede** afectar a la otra. Nunca mezclar rutas de input.

---

## Arquitectura: Strategy Pattern

```
InputStrategy (interfaz)
    ├── DesktopInput   → mouse + teclado (PC/Mac)
    └── MobileInput    → joystick virtual + botones táctiles (celular)
```

`GameScene` detecta el dispositivo una sola vez al iniciar y crea la instancia correcta.
El jugador local (`DarkFlagPlayer`) solo conoce la interfaz `InputStrategy`.

```typescript
// GameScene.create() — único punto de detección
const strategy = this.isMobile ? new MobileInput(this) : new DesktopInput(this);
this.player.setStrategy(strategy);
```

---

## Detección de dispositivo

```typescript
// frontend/src/app/game/scenes/GameScene.ts
const isMobile: boolean =
  window.innerWidth < 768 || 'ontouchstart' in window;
```

Si `isMobile`:
- Se instancia `MobileInput`
- Se oculta el cursor del navegador (`canvas.style.cursor = 'none'`)
- Se muestran los controles táctiles (joystick + botones)

Si no:
- Se instancia `DesktopInput`
- Se ocultan botones táctiles

**Por qué no `navigator.maxTouchPoints`:** devuelve `true` en Windows 10/11 aunque el monitor no tenga pantalla táctil. El check de `ontouchstart` es suficiente para browsers móviles reales.

---

## Interfaz `InputStrategy`

Archivo: `frontend/src/app/game/input/InputStrategy.ts`

```typescript
export interface InputStrategy {
  capture(time: number, playerX: number, playerY: number): PlayerInput;
  onResize(): void;   // llamado en cambio de viewport
  destroy(): void;    // limpia listeners y recursos
}
```

---

## `PlayerInput` interface

```typescript
export interface PlayerInput {
  mouseAngle:   number;   // ángulo de dirección de movimiento (0-2π, desde cursor)
  speedFactor:  number;   // 0–1 (distancia cursor-jugador normalizada; 0 = quieto)
  aimAngle:     number;   // ángulo de la linterna (= mouseAngle en modo normal)
  mace:         boolean;  // true el frame en que el jugador activa el mazo
  toggleLight:  boolean;  // true el frame en que el jugador presiona spacebar
  pulse:        boolean;  // true el frame en que el jugador activa el Pulso (nivel 6+)
  clientTick:   number;   // contador de frame para reconciliación
}
```

`mace`, `toggleLight` y `pulse` son **edge-triggered**: `true` solo en el frame del press, no mientras se mantiene la tecla.

---

## DesktopInput (PC/Mac)

Archivo: `frontend/src/app/game/input/DesktopInput.ts`

### Tabla de controles

| Acción | Control |
|--------|---------|
| Movimiento | Cursor del mouse — dirección y velocidad relativas al jugador |
| Linterna | Siempre apunta hacia el cursor |
| Girar sin mover | Barra espaciadora (spacebar) |
| Mazo | Click izquierdo **o** tecla Q |
| Pulso (nivel 6+) | Tecla E |

### Comportamiento de movimiento

- `mouseAngle` = `atan2(cursor.y - player.y, cursor.x - player.x)` en coordenadas mundo
- `speedFactor` = `0` si la distancia mundo cursor→jugador (convertida a px pantalla con zoom) es menor a `MOUSE_MIN_DIST` (30px); `1` si es mayor
- Se usa la posición del jugador en espacio mundo (no el centro de pantalla) para evitar oscilación por el lag del lerp de cámara

### Spacebar (toggleLight)

- `toggleLight = true` durante **un único frame** al presionar spacebar
- Permite girar el personaje hacia el cursor sin que avance
- El servidor recibe el evento y congela el movimiento ese tick

### Mazo

- `mace = true` un frame al hacer click izquierdo o presionar Q
- El servidor valida si hay un objetivo en rango (el cliente no decide el resultado)

### Pulso

- `pulse = true` un frame al presionar E
- Solo disponible si el jugador tiene nivel ≥ 6 y el power-up Pulso activo
- El servidor ignora este input si las condiciones no se cumplen

### Resize y bug de DevTools

`DesktopInput` guarda estado del puntero. Al cambiar viewport (DevTools responsive mode), el puntero puede quedar en coordenadas inconsistentes.

**Fix**: `GameScene` escucha `scale.on('resize')` y llama `player.onResize()` → `strategy.onResize()`. `DesktopInput.onResize()` resetea el estado del puntero.

```typescript
// GameScene.create()
this.scale.on('resize', () => this.player?.onResize());
```

---

## MobileInput (touch)

Archivo: `frontend/src/app/game/input/MobileInput.ts`

### Layout en pantalla

```
┌──────────────────────────────────────┐
│                        [L]    [M]    │  ← L = toggleLight, M = mazo
│                                      │
│                                      │
│   ◯  ← joystick flotante             │
└──────────────────────────────────────┘
  mano izquierda         mano derecha
```

| Control | Acción |
|---------|--------|
| Joystick izquierdo | Movimiento: `speedFactor` + `mouseAngle` / `aimAngle` |
| Botón `[L]` arriba-derecha | `toggleLight = true` (edge-trigger) |
| Botón `[M]` abajo-derecha | `mace = true` (edge-trigger) |

### Joystick flotante

- Base se reposiciona al punto de primer toque en `pointerdown` (no tiene posición fija)
- Permite jugar con el pulgar en cualquier zona de la mitad izquierda de la pantalla
- `speedFactor` = desplazamiento del pulgar normalizado (`0–1`)
- `mouseAngle` y `aimAngle` = dirección del desplazamiento del joystick

### Inercia al soltar joystick

Cuando el dedo levanta sin haber hecho toggleLight:
- `speedFactor` y `mouseAngle` se **conservan** — el jugador sigue moviéndose en la última dirección
- Solo se detiene por acción explícita (`toggleLight` detiene el movimiento el siguiente tick)
- `releaseJoy()` solo resetea el visual del joystick

### Fix: joystick pegado (`pointerupoutside`)

Si el dedo desliza hasta el borde del canvas y levanta fuera, Phaser puede no disparar `pointerup` en el canvas → joystick queda pegado.

**Solución:**
1. Registrar `pointerupoutside` junto con `pointerup`
2. Verificar `joyPointer.isDown` cada frame como fallback
3. Identificar toque por `pointerId` (no por referencia al objeto `Pointer`)

### Constantes visuales

```typescript
const JOY_RADIUS    = 55;   // radio base del joystick (px pantalla)
const THUMB_RADIUS  = 24;   // radio del pulgar
const JOY_MAX_DIST  = 50;   // desplazamiento máximo del pulgar
const BTN_RADIUS    = 40;   // radio botones de acción
const DEADZONE      = 15;   // px mínimos para activar movimiento
```

### Compensación de zoom

Los objetos del joystick usan `setScrollFactor(0)` pero viven en espacio mundo. Con zoom ≠ 1:

```typescript
const worldX = cx + (screenX - cx) / zoom;
const worldY = cy + (screenY - cy) / zoom;
```

`zoom` se captura en el constructor (después de que `GameScene` aplica el zoom de cámara).

### `capture()` en MobileInput

El estado se actualiza 100% vía eventos de toque (`pointerdown/move/up`). `capture()` solo lee el estado actual y devuelve el `PlayerInput` — no hace cálculos por frame.

---

## Reconciliación con el servidor

El servidor es la **autoridad de posición**. El cliente hace predicción local, el servidor corrige.

### Client-side prediction

1. Al capturar input, el cliente mueve al jugador local inmediatamente (antes de la respuesta del servidor)
2. El servidor procesa el input y responde con la posición autoritativa
3. Si la posición del servidor difiere más de **50px**, se aplica corrección:

```typescript
if (dist > 50) {
  // lerp suave hacia la posición del servidor en 200ms
  this.player.lerpToServerPosition(serverPos, 200);
}
```

### Validación en servidor

- `speedFactor > 1.1` → rechazar (cheat de velocidad)
- `mace = true` sin objetivo en rango → ignorar
- `pulse = true` sin nivel 6+ o sin power-up activo → ignorar

### Interpolación de remotos

`INTERP_DELAY_MS` controla cuánto atrás en el tiempo se renderiza cada jugador remoto:

| Dispositivo | Delay | Frecuencia servidor |
|-------------|-------|---------------------|
| Desktop | `100ms` | ~30Hz |
| Mobile | `200ms` | ~10Hz |

`BUFFER_SIZE = 5` en `RemoteDarkFlagPlayer`: cubre jitter de red en ambos casos.

---

## Flujo de input por frame (GameScene)

```
update(time, delta)
  │
  ├─ input = inputStrategy.capture(time, player.x, player.y)
  │
  ├─ player.applyPrediction(input)          // mover localmente
  │
  └─ [throttled 30Hz desktop / 10Hz mobile]
       └─ socketService.sendPlayerInput(input)
```

---

## Qué NO hacer

- No agregar flag `isMobile` a `DarkFlagPlayer` — ese conocimiento pertenece a `GameScene`
- No importar `MobileInput` desde `DesktopInput` ni viceversa
- No usar `navigator.maxTouchPoints` para detectar dispositivo (falsos positivos en Windows)
- No usar `pointer.coarse` para detectar dispositivo (falsos positivos en laptops con trackpad)
- No calcular `speedFactor` midiendo distancia mouse→centro de pantalla: con lerp de cámara el tank oscila. Usar siempre `worldPoint - playerPos`
- No usar `p === pointer` para comparar toques en multi-touch — usar `p.pointerId === id`
- No olvidar registrar `pointerupoutside` en el joystick — sin él queda pegado al sacar el dedo del canvas
- No crear un segundo `MobileInput` si `GameScene.create()` se llama dos veces — destruir la estrategia anterior antes de crear la nueva

---

## Archivos relevantes

| Archivo | Rol |
|---------|-----|
| `game/input/InputStrategy.ts` | Interfaz (contrato) |
| `game/input/DesktopInput.ts` | Implementación PC/Mac |
| `game/input/MobileInput.ts` | Implementación móvil |
| `game/objects/DarkFlagPlayer.ts` | Delega 100% en la estrategia |
| `game/scenes/GameScene.ts` | Detecta dispositivo, instancia estrategia, reconcilia |
