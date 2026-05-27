# Escenas Phaser — Dark Flag

> Phaser 4.1 + TypeScript 5.5. Renderizado oscuro con raycasting, overlay de oscuridad y conos de linterna.

---

## Escenas implementadas

| Escena | Responsabilidad |
|--------|----------------|
| `PreloadScene` | Carga de assets, barra de progreso, transición a GameScene |
| `GameScene` | Escena principal: lógica de juego, renderizado oscuro, sincronización |

---

## PreloadScene (`scenes/PreloadScene.ts`)

Carga todos los assets antes de entrar al juego.

**Responsabilidades:**
- Mostrar fondo negro y barra de progreso centrada
- Cargar sprites (jugador, bandera, destino, trampas, power-ups, faro)
- Cargar audio (pasos, mazo, stun, recoger bandera, entregar bandera, power-up)
- Emitir evento de progreso al HUD de carga
- Al completar: iniciar `GameScene`

```typescript
class PreloadScene extends Phaser.Scene {
  preload(): void {
    this.load.on('progress', (value: number) => this.updateProgressBar(value));
    this.load.on('complete', () => this.scene.start('GameScene'));
    // ... carga de assets
  }
}
```

**Barra de progreso**: `Graphics` centrado, fondo gris oscuro, fill blanco, texto de porcentaje.

---

## GameScene (`scenes/GameScene.ts`)

Escena principal. Orquesta todos los objetos del juego, el renderizado oscuro y la sincronización con el servidor.

**No contiene lógica de negocio** — coordina y delega.

```typescript
class GameScene extends Phaser.Scene {
  // Jugadores
  private player: DarkFlagPlayer;
  private remotePlayers: Map<string, RemoteDarkFlagPlayer>;

  // Objetos de juego
  private flag: FlagObject;
  private destination: DestinationZone;
  private traps: TrapObject[];
  private powerUps: PowerUpObject[];
  private faro: FaroLight;

  // UI
  private hud: HUD;
  private miniMap: MiniMap;
  private systemMessages: SystemMessages;

  // Input
  private inputStrategy: InputStrategy;
  private isMobile: boolean;

  // Renderizado oscuro
  private darkOverlay: Phaser.GameObjects.RenderTexture;
  private lightMask: Phaser.GameObjects.Graphics;

  // Sincronización
  private socketService: GameSocketService;
  private stateBuffer: ServerStateSnapshot[];
}
```

---

### Estados de GameScene

| Estado | Descripción |
|--------|-------------|
| `LOADING` | Esperando confirmación de sala del servidor, objetos no actualizados |
| `PLAYING` | Juego activo, game loop completo |
| `STUNNED_LOCAL` | Jugador local stunneado (5s): input bloqueado, HUD muestra countdown |
| `PAUSED` | Partida pausada (desconexión temporal, modal de opciones) |

Las transiciones entre estados se gestionan en `GameScene.setState(newState)`.

---

### Game loop — `update(time, delta)`

```
1. InputStrategy.capture()
   └─ emitir player_input al servidor vía socket (throttled 30Hz desktop / 10Hz mobile)
   └─ client-side prediction: mover player local antes de confirmación

2. interpolateRemotePlayers(now - INTERP_DELAY_MS)
   └─ consumir buffer de estados del servidor (3 frames de delay)
   └─ interpolar posición y ángulo de linterna de cada RemoteDarkFlagPlayer

3. updateFlashlightCones()
   └─ raycasting para el jugador local: calcular polígono de visibilidad
   └─ conos simples (sin raycasting completo) para jugadores remotos visibles

4. updateDarkOverlay()
   └─ renderizar RenderTexture negra opaca sobre todo el mapa
   └─ perforar con polígono de raycasting del jugador local
   └─ perforar conos de remotos con Graphics simples
   └─ perforar círculo fijo del FaroLight (300px radio)

5. updateGameObjects()
   └─ FlagObject.update()         // pulso ámbar, check de visibilidad
   └─ DestinationZone.update()    // pulso teal, check de visibilidad
   └─ TrapObject[].update()       // check de visibilidad por proximidad (<40px)
   └─ PowerUpObject[].update()    // animaciones de íconos

6. HUD.update()
   └─ nivel, score, leaderboard, cooldown mazo, power-up activo, indicador bandera

7. MiniMap.update()
   └─ RenderTexture 80×80px con posiciones de todos los jugadores

8. SystemMessages.update()
   └─ fade/scroll de mensajes del sistema
```

---

### Técnica de renderizado oscuro

El efecto de oscuridad se implementa con una `RenderTexture` del tamaño del mapa que actúa como overlay.

**Cada frame:**

1. Limpiar la `RenderTexture` (`rt.clear()`)
2. Dibujar un rectángulo negro opaco (`alpha 0.97`) cubriendo todo el mapa
3. Usar `blendMode: ERASE` para "perforar" las zonas iluminadas:
   - Polígono de raycasting del jugador local (cono completo con sombras reales)
   - Conos simples (triángulo o sector de círculo) para cada `RemoteDarkFlagPlayer` visible
   - Círculo fijo de 300px de radio centrado en el `FaroLight`
4. Aplicar la `RenderTexture` sobre todos los game objects con `setDepth(HIGH)`

```typescript
// Pseudo-código de updateDarkOverlay()
this.darkOverlay.clear();
this.darkOverlay.fill(0x000000, 0.97);

// Perforar con modo ERASE
this.darkOverlay.draw(this.raycasting.getPolygon(player), player.x, player.y);

for (const remote of this.remotePlayers.values()) {
  if (this.isVisible(remote)) {
    this.darkOverlay.draw(this.getSimpleCone(remote), remote.x, remote.y);
  }
}

this.darkOverlay.draw(this.faro.getLightCircle(), this.faro.x, this.faro.y);
```

---

### Raycasting (jugador local)

- Se calcula una vez por frame en `updateFlashlightCones()`
- Lanza rayos desde `player.x, player.y` en el sector de la linterna (ángulo ± `FLASHLIGHT_HALF_ANGLE`)
- Los obstáculos (muros del mapa, bordes del mapa) bloquean los rayos
- El resultado es un polígono de visibilidad que se usa para perforar el overlay oscuro
- Resolución: 120 rayos por cono (configurable con `RAYCAST_RESOLUTION`)

Para jugadores remotos **no** se hace raycasting completo: se usa un cono simplificado (`Graphics.fillTriangle` o `fillArc`) en la dirección de su `aimAngle`.

---

## Objetos del juego

### `DarkFlagPlayer` (`objects/DarkFlagPlayer.ts`)

Jugador local controlado por el input del usuario.

| Elemento visual | Descripción |
|----------------|-------------|
| Figura | Sprite chibi top-down, se orienta hacia `aimAngle` |
| Cono de linterna | Generado por raycasting, perforado en el overlay |
| Aura de nivel | Halo circular, tamaño/color según nivel (1–15) |
| Ícono de bandera | Sprite flotante sobre la cabeza cuando porta la bandera |

Expone: `x`, `y`, `aimAngle`, `speedFactor`, `isCarryingFlag`, `level`, `stunned`.

---

### `RemoteDarkFlagPlayer` (`objects/RemoteDarkFlagPlayer.ts`)

Renderiza otros jugadores recibidos del servidor.

| Elemento visual | Descripción |
|----------------|-------------|
| Figura | Sprite chibi, misma orientación por `aimAngle` interpolado |
| Nombre | Texto flotante sobre la cabeza |
| Cono de linterna | Cono simple (sin raycasting), reducido si tiene power-up Ghost activo |

Expone: `update(snapshot: PlayerStateSnapshot)`, buffer de interpolación FIFO.

---

### `FlagObject` (`objects/FlagObject.ts`)

- Círculo ámbar pulsante (tween de escala 0.9↔1.1, 800ms loop)
- Solo visible cuando está dentro del cono de linterna de algún jugador
- Cuando es recogida: desaparece del mapa, aparece ícono sobre el portador
- Posición inicial: centro del mapa o aleatoria según config de sala

---

### `DestinationZone` (`objects/DestinationZone.ts`)

- Círculo teal pulsante, radio ~60px
- Visible únicamente para el portador de la bandera **o** cuando algún jugador está a menos de 150px
- Indica dónde entregar la bandera para puntuar
- Cambia de posición tras cada entrega exitosa

---

### `TrapObject` (`objects/TrapObject.ts`)

- Marca sutil en el suelo (icono de calavera semitransparente)
- Solo visible cuando el cono de linterna de algún jugador está a menos de 40px
- Al activarse: aplica stun de 5 segundos al jugador que la pisa
- Desaparece tras activarse; reaparece en nueva posición tras cooldown

---

### `PowerUpObject` (`objects/PowerUpObject.ts`)

6 variantes según tipo de power-up:

| ID | Nombre | Ícono |
|----|--------|-------|
| `speed_boost` | Turbo | rayo amarillo |
| `ghost` | Ghost | fantasma azul |
| `wide_light` | Linterna amplia | cono blanco |
| `pulse` | Pulso | onda circular |
| `shield` | Escudo | burbuja verde |
| `trap` | Trampa | calavera roja |

Animación: rotación continua + bob vertical suave.

---

### `FaroLight` (`objects/FaroLight.ts`)

- Círculo de luz siempre visible, radio 300px, centrado en el mapa
- Implementado como perforación fija en el overlay oscuro (no se recalcula por raycasting)
- Sirve de punto de orientación en la arena

---

### `MiniMap` (`ui/MiniMap.ts`)

- `RenderTexture` de 80×80px en la esquina inferior izquierda
- `setScrollFactor(0)` — fijo en pantalla
- Muestra puntos de colores para cada jugador (local = blanco, remotos = colores asignados)
- Muestra icono de bandera si está libre, ícono de portador si está recogida
- Se actualiza cada frame con las posiciones interpoladas

---

### `HUD` (`ui/HUD.ts`)

Todos los elementos con `setScrollFactor(0)`.

| Elemento | Posición | Contenido |
|----------|----------|-----------|
| Nivel | Arriba izquierda | `Nv. X` + barra de XP |
| Score | Arriba centro | puntos del jugador local |
| Leaderboard | Arriba derecha | top-3 con nombres y puntos |
| Cooldown mazo | Abajo centro | barra de recarga, ícono de mazo |
| Power-up activo | Abajo derecha | ícono + timer countdown |
| Indicador bandera | Abajo izquierda | `TIENES LA BANDERA` / flecha hacia bandera |
| Stun overlay | Centro pantalla | countdown de 5s cuando stunneado |

---

### `SystemMessages` (`ui/SystemMessages.ts`)

- Cola de mensajes de texto que aparecen en el centro inferior de la pantalla
- Fade-in 200ms, visible 2.5s, fade-out 300ms
- Ejemplos: `"VIINZO recogió la bandera"`, `"VIINZO entregó la bandera (+5pts)"`, `"VIINZO fue stunneado"`

---

## Configuración Phaser (`game.config.ts`)

```typescript
{
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  fps: { target: 60 },
  backgroundColor: '#000000',
  scene: [PreloadScene, GameScene],
}
```

Sin Arcade Physics — colisiones manuales y lógica de proximidad.

---

## Constantes relevantes

```typescript
const FLASHLIGHT_HALF_ANGLE = Math.PI / 4;  // 45° a cada lado = cono de 90°
const RAYCAST_RESOLUTION    = 120;           // rayos por cono
const FARO_RADIUS           = 300;           // px, círculo central siempre iluminado
const TRAP_VISIBLE_DIST     = 40;            // px, distancia para ver trampas
const DEST_VISIBLE_DIST     = 150;           // px, distancia para ver destino (no portador)
const INTERP_DELAY_MS       = 100;           // delay de interpolación (desktop)
const STUN_DURATION_MS      = 5000;          // duración del stun del mazo
```

---

## Archivos relevantes

| Archivo | Rol |
|---------|-----|
| `game/scenes/PreloadScene.ts` | Carga de assets y transición |
| `game/scenes/GameScene.ts` | Orquestador principal |
| `game/objects/DarkFlagPlayer.ts` | Jugador local |
| `game/objects/RemoteDarkFlagPlayer.ts` | Jugadores remotos |
| `game/objects/FlagObject.ts` | Bandera |
| `game/objects/DestinationZone.ts` | Zona de entrega |
| `game/objects/TrapObject.ts` | Trampas de suelo |
| `game/objects/PowerUpObject.ts` | Power-ups (6 tipos) |
| `game/objects/FaroLight.ts` | Círculo central iluminado |
| `game/rendering/RaycastEngine.ts` | Cálculo de polígonos de visibilidad |
| `game/ui/HUD.ts` | HUD completo |
| `game/ui/MiniMap.ts` | Mini-mapa |
| `game/ui/SystemMessages.ts` | Mensajes de evento en partida |
