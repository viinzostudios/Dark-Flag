# Plan de Calidad — Dark Flag (Fases 7–12)

> Análisis completo del estado actual y plan de ejecución para llevar el juego
> a un nivel de estética y funcionalidad excelente.
> Ejecutar en orden: F5.5 → F5.6 → F7 → F8 → F9 → F10 → F11 → F12 → F13
> La F6 original (assets completos múltiples personajes) se pospone al final.

---

## Diagnóstico del estado actual

| Área | Estado | Detalle |
|------|--------|---------|
| Lógica de juego | ✅ Completo | Game loop 30Hz, server-autoritativo |
| Mecánica de oscuridad | ✅ Funciona | RenderTexture + erase de cono |
| Bordes de la linterna | ⚠️ Bruscos | Polígono duro, sin gradiente de borde |
| Zona central iluminada | ❌ Ausente | No existe fuente de luz fija |
| Luces ambientales | ❌ Ausente | Solo linterna del jugador |
| Personajes | ⚠️ Primitiva | `Phaser.GameObjects.Arc` (círculo azul) |
| Animación de walk/ataque | ❌ Ausente | No hay sprite sheets |
| Ghost / shield / sprint visual | ❌ Ausente | Solo lógica server, sin feedback visual |
| VFX (mace, stun, levelup) | ⚠️ Placeholder | Arcos individuales con tweens manuales |
| Sistema de partículas | ❌ Ausente | `Phaser.GameObjects.Particles` no usado |
| Audio | ⚠️ AST legado | AudioManager existe pero tiene sonidos de tanques |
| Sprites de power-ups | ❌ Ausente | 6 archivos `power-*.png` inexistentes → fallback a Arc |
| Spritesheet VFX | ❌ Ausente | `vfx-mace-impact`, `vfx-trap-trigger` inexistentes |
| Lobby | ⚠️ AST legado | LEVEL_DATA tiene perks de tanques, diseño Arena Siege |
| Minimap | ❌ Ausente | No implementado |
| Settings in-game | ❌ Ausente | Sin control de volumen ni idioma en partida |

---

## F5.5 — Assets mínimos para jugar (1 escenario, 1 personaje)

> Prerequisito: nada funciona visualmente sin esto.

### F5.5.1 — Sprite sheet personaje "Azure" (4 frames walk + attack)

**Formato**: grid 2×2 en imagen 1024×1024 → Sharp recorta 4 PNGs de 256×256 → juego usa 64×64.

```
┌──────────┬──────────┐
│  idle    │  walk_a  │  ← frame 0 y 1
├──────────┼──────────┤
│  walk_b  │  attack  │  ← frame 2 y 3
└──────────┴──────────┘
```

- **idle**: personaje de pie con linterna apuntando al frente, postura relajada
- **walk_a**: pierna izquierda adelantada, cuerpo ligeramente inclinado
- **walk_b**: pierna derecha adelantada (par de walk_a)
- **attack**: brazo extendido con maza, leve twist del torso

Output: `frontend/public/assets/characters/char-azure.png` (spritesheet 256×256 × 4 = 512×512)

### F5.5.2 — Sprites de objetos del juego en una sola imagen

**Grid 3×2 en 1024×1024** → 6 sprites de 341×170px → Sharp recorta individualmente:

```
┌───────────┬───────────┬───────────┐
│   bandera │  destino  │   trampa  │
├───────────┼───────────┼───────────┤
│  antorcha │  glow dot │  (spare)  │
└───────────┴───────────┴───────────┘
```

Outputs:
- `frontend/public/assets/environment/flag-icon.png`
- `frontend/public/assets/environment/destination-ring.png`
- `frontend/public/assets/environment/trap-icon.png`
- `frontend/public/assets/environment/torch-light.png` (fuente de luz central)

### F5.5.3 — Sprites de power-ups (grid 2×3 en 1024×1024)

```
┌──────────────┬──────────────┐
│ MACE_SHIELD  │  REVELATION  │
├──────────────┼──────────────┤
│    SPRINT    │   BLACKOUT   │
├──────────────┼──────────────┤
│  SUPER_MACE  │    GHOST     │
└──────────────┴──────────────┘
```

Outputs: `frontend/public/assets/pickups/power-MACE_SHIELD.png` ... (6 archivos)

### F5.5.4 — Spritesheets VFX (los 2 críticos faltantes)

- `vfx-mace-impact.png`: 6 frames de 128×128 en tira horizontal 768×128
  - Flash blanco → chispas → desvanece (18fps, 333ms total)
- `vfx-trap-trigger.png`: 4 frames de 96×96 en tira horizontal 384×96
  - Humo + destello rojo (12fps, 333ms total)

Outputs: `frontend/public/assets/effects/vfx-mace-impact.png`, `vfx-trap-trigger.png`

### F5.5.5 — Fondo de arena "default" (textura oscura tileable)

- 1024×1024 px, fondo piedra/suelo oscuro texturizado
- Debe hacer `tileSprite()` sin costuras visibles
- Paleta: muy oscuro (#080810 base) con variaciones sutiles de textura

Output: `frontend/public/assets/environment/arenas/dark-arena.png`

### F5.5.6 — Obstáculos (3 tipos en 1 imagen 1536×1024)

```
┌──────────────┬──────────────┬──────────────┐
│    BUNKER    │   BARRIER    │    ROUND     │
│  (300×200)   │  (400×100)   │  (160×160)   │
└──────────────┴──────────────┴──────────────┘
```

Sharp recorta 3 PNGs individuales.
Outputs: `obs-bunker.png`, `obs-barrier.png`, `obs-round.png` (en `/environment/`)

### F5.5.7 — Conectar assets en PreloadScene + GameScene

- Actualizar `PreloadScene.ts`: cargar sprites con sus claves correctas
- Actualizar `FlagObject.ts`, `TrapObject.ts`, `PowerUpPickup.ts`: usar sprites en lugar de primitivas
- Actualizar `BaseTank.ts`: usar char-azure si existe (con fallback al Arc actual)
- Script: `scripts/process-game-assets.js` — crop y resize con Sharp

**Done cuando**: el juego se ve con sprites reales, sin un solo Arc visible como personaje o power-up.

---

## F5.6 — Lobby reescrito para Dark Flag

### F5.6.1 — Eliminar todo el contenido de Arena Siege Tanks

- Eliminar `LEVEL_DATA` con perks de tanques (velocidad, HP, cañón, balas tóxicas, radioactivo)
- Crear `DARK_FLAG_LEVEL_DATA` con beneficios correctos:
  - Nivel 3: Linterna más potente (+15% rango)
  - Nivel 5: Mayor alcance de maza
  - Nivel 6: Pulso desbloqueado
  - Nivel 8: Stun reducido al recibir mazo
  - Nivel 10: Contramazo — atacante stunned 2s
  - Nivel 12: Sprint leve permanente
  - Nivel 14: Contramazo mejorado
  - Nivel 15: Destino visible 3s al puntuar

### F5.6.2 — Panel central: Dark Flag theme

- Reemplazar `arena-preview` con visualización de arena oscura con halo de luz
- Texto del botón: "EXPLORAR" en lugar de genérico
- Añadir mini-descripción del modo de juego bajo el botón

### F5.6.3 — Panel izquierdo: personaje en lugar de tanque

- Mostrar el sprite del personaje activo (char-azure por defecto)
- Remover referencias a `skinId` de tanque
- Renombrar "Elegir skin" → "Elegir personaje"

### F5.6.4 — Textos i18n

- Revisar todas las claves de traducción del lobby con referencias a balas/muros/tanques
- Actualizarlas para Dark Flag

**Done cuando**: el lobby no menciona tanques, balas ni Arena Siege en ningún texto visible.

---

## F7 — Sistema de Iluminación Avanzado

> La linterna es la mecánica CORE del juego. Debe sentirse cinematográfica.

### F7.1 — Gradiente suave en bordes del cono

**Problema actual**: el cono es un polígono sólido con borde abrupto.

**Solución**: tres passes de erase con alpha decreciente:
1. Pass 1 (inner): cono al 100% rango, alpha 1.0 → borra completamente
2. Pass 2 (mid): cono al 115% rango pero solo ±20% del ángulo en los bordes laterales, alpha 0.5
3. Pass 3 (outer): halo circular de radio 80px alrededor del jugador, alpha 0.3 (siempre visible)

Resultado: transición suave en la frontera del cono, sin borde duro.

**Archivo**: `GameScene.ts` → `drawFlashlightCone()` y `updateDarkness()`

### F7.2 — Zona central permanente iluminada

**Concepto**: una antorcha/lámpara fija en el centro del mapa. Crea un punto de referencia visual y estratégico — los jugadores se pueden ver mutuamente cerca de ella.

**Implementación**:
- En `createDarkOverlay()`: calcular posición central `(mapW/2, mapH/2)`
- En `updateDarkness()`: antes de erasing los conos personales, hacer erase de un círculo central (radio 180px, alpha total)
- Añadir objeto visual `torchSprite` en el centro del mapa (si existe `torch-light.png`)
- Añadir tween de pulso al sprite (escala 1.0 → 1.05, alpha 0.9 → 1.0, 2s loop)

**Archivo**: `GameScene.ts` + `createWorldObjects()`

### F7.3 — Luces ambientales puntuales (antorchas en el mapa)

- 4 luces fijas colocadas simétricamente en el mapa (ej: cuadrantes a 25% del borde)
- Cada una: radio ~80px, implementadas igual que la zona central pero más pequeñas
- Representan antorchas en las paredes — dan orientación espacial sin romper la oscuridad

**Archivo**: `GameScene.ts` → array `ambientLights: {x, y, radius}[]`

### F7.4 — Glow del portador de bandera

- Cuando `state.flag.carriedBy !== null`, el portador tiene un halo ámbar débil
- Radio 50px, alpha 0.25 → visible a través de la oscuridad pero apenas (tensión)
- Mecánica: ayuda a los perseguidores a saber aproximadamente dónde está el portador

**Archivo**: `GameScene.ts` → `updateDarkness()` sección de erasing

### F7.5 — Mejora visual del Blackout

- Al activarse: breve flash blanco (alpha 1.0 → 0, 150ms) sobre toda la pantalla
- Durante: `darkOverlay.fill(0x000000, 0.98)` en vez de 0.97 (más oscuro)
- Cada jugador: solo ve un halo tiny (radio 25px) alrededor de sí mismo
- Los power-ups con glow siguen siendo visibles débilmente (no completamente apagado)

**Archivo**: `GameScene.ts`

### F7.6 — Glow de objetos en la oscuridad

Objetos que deben ser vagamente perceptibles incluso sin linterna directa:

| Objeto | Color | Radio visible | Efecto |
|--------|-------|--------------|--------|
| Bandera (en suelo) | 0xf59e0b | 30px | Pulso suave |
| Destino | 0x10b981 | 50px | Pulso verde |
| Power-up | por tipo | 20px | Flotación + pulso |
| Trampa (activa) | 0xff4444 | 10px | Sin glow (invisible — sorpresa) |

Implementación: cada objeto agrega un círculo de `erase` pequeño con alpha bajo (0.15–0.25), dando un halo apenas perceptible.

**Archivos**: `FlagObject.ts`, `DestinationZone.ts`, `PowerUpPickup.ts`

---

## F8 — Sistema de Animación de Personajes

> Los personajes deben parecer vivos — caminar, flotar, golpear.

### F8.1 — Definir AnimState en BaseTank

```typescript
type AnimState = 'idle' | 'walk' | 'attack' | 'stun';
```

Transiciones:
- `idle` → `walk` cuando `speed > 0.08`
- `walk` → `idle` cuando `speed < 0.05`
- Cualquier estado → `attack` cuando se activa mace (200ms, luego vuelve)
- Cualquier estado → `stun` cuando `isStunned` (sobreescribe todo)

### F8.2 — Reemplazar Arc por sprite animado en BaseTank

```typescript
// ANTES:
readonly body: Phaser.GameObjects.Arc;

// DESPUÉS:
private sprite: Phaser.GameObjects.Sprite;
```

- `idle`: frame 0 + tween de bob vertical suave (±2px, 1.2s loop)
- `walk`: animar frames 1 → 2 a 8fps (ciclo A→B→A→B)
- `attack`: frame 3 durante 200ms (flash rápido)
- `stun`: frame 0 + tint rojo (0xff4444) + tween de wobble horizontal

Preservar todos los indicators encima (nombre, badge, flag dot, stun ring).

### F8.3 — Variación visual bot vs jugador

- Jugador local: sprite normal (tint por defecto)
- Jugadores remotos: tint sutil (ej: 0xcc9966 — tono más cálido) para distinguirlos
- Bots: tint ligeramente rojizo (0xcc4444)

### F8.4 — Escala del sprite por nivel

- Nivel 1–5: escala 1.0
- Nivel 6–10: escala 1.05 (apenas perceptible)
- Nivel 11–15: escala 1.10 (más imponente)

Transición suave con tween cuando sube o baja de nivel.

### F8.5 — Actualizar PreloadScene

Cargar spritesheet con configuración de frames:
```typescript
this.load.spritesheet('char-azure', '.../char-azure.png', {
  frameWidth: 256, frameHeight: 256
});
```

Crear animaciones en `PreloadScene` o `GameScene.create()`:
```typescript
this.anims.create({ key: 'walk-azure', frames: [1, 2], frameRate: 8, repeat: -1 });
this.anims.create({ key: 'attack-azure', frames: [3], frameRate: 1, repeat: 0 });
```

---

## F9 — Audio Dark Flag

> AudioManager ya existe con síntesis procedural Web Audio API.
> Adaptar al vocabulario del nuevo juego — eliminar lo que era de tanques.

### F9.1 — Eliminar sonidos obsoletos de AST

Remover de `AudioManager`:
- `playShoot()` — no hay disparos
- `playWallPlace()` — no hay muros
- `playCollisionTank()` — reemplazar por lógica de empuje sin sonido especial
- `playCollisionWall()` — no aplica
- `playDeath()` — reemplazar por `playStun()` y `playEliminated()`

### F9.2 — Nuevos sonidos Dark Flag (síntesis procedural)

| Método | Descripción sonora | Técnica |
|--------|-------------------|---------|
| `playMaceSwing()` | Whoosh corto | Ruido banda ancha filtrado + sweep 80→20ms |
| `playMaceImpact()` | Golpe sordo + impacto | Sine sub 100Hz + noise burst 30ms |
| `playMaceBlocked()` | Tintineo metálico | Sine 1200Hz + 800Hz, decay rápido |
| `playFlagPickup()` | Chime ascendente | 3 notas Do-Mi-Sol, 80ms c/u |
| `playFlagDropped()` | Golpe descendente | 2 notas descendentes + rumble |
| `playFlagDelivered()` | Fanfare corta | 5 notas Do-Mi-Sol-Do-Mi (500ms) + reverb |
| `playTrapTriggered()` | Clic mecánico + buzz | Sawtooth 400Hz 40ms + noise 200ms |
| `playToggleLight(on)` | Click suave on/off | Sine 800Hz (on) / 400Hz (off), 30ms |
| `playPulse()` | Whoosh radial | Sine 200→50Hz sweep, 400ms |
| `playLevelUp()` | 3 notas ascendentes | Sol-Si-Re, staccato |
| `playLevelDown()` | 2 notas descendentes | Re-La, decay lento |
| `playStun()` | Buzz eléctrico | Square wave 80Hz modulado, 500ms |
| `playStunEnd()` | Pop de recuperación | Sine 600Hz, 80ms |
| `playPowerUp()` | Sweep ascendente | Noise + sine 200→2000Hz, 300ms |
| `playGhostActivate()` | Fade etéreo | Sine muy baja amplitud, 800ms |

### F9.3 — Adaptar música ambiental

Cambio en el loop de fondo:
- Tempo más lento (más tenso, menos energético)
- Base: drone de A2 (110Hz) siempre presente (misterio, oscuridad)
- Arpeggio ocasional en lugar de continuo
- Agregar capa de "ruido de viento" muy baja (noise filtrado pasa-bajos, alpha 0.03)

### F9.4 — Audio espacial básico

Para eventos de otros jugadores (no el local):
- Calcular distancia entre posición del evento y el jugador local
- Aplicar ganancia inversa: `gain = Math.max(0.05, 1 - dist / 800)`
- Solo para: `playMaceImpact()`, `playFlagPickup()`, `playTrapTriggered()`

### F9.5 — Conectar AudioManager con GameScene

En `GameScene.handleSocketEvents()`:
```typescript
this.socketService.onMaceHit$.subscribe(({ attackerId }) => {
  const dist = ...
  this.audio.playMaceImpact(dist);
});
// etc.
```

En `PlayerTank.update()` cuando frames cambian en walk:
```typescript
if (frameChanged && isWalkFrame) this.audio.playFootstep();
```

---

## F10 — Sistema de Partículas Phaser

> Reemplazar los tweens manuales de Arc por `Phaser.GameObjects.Particles`.
> Un sistema limpio, pooleable y performante.

### F10.1 — Crear `ParticleManager` service (singleton por escena)

```typescript
class ParticleManager {
  private emitters: Map<string, Phaser.GameObjects.Particles.ParticleEmitter>;

  init(scene: Phaser.Scene): void { ... }
  burst(key: string, x: number, y: number, config?: Partial<EmitConfig>): void { ... }
  startLoop(key: string, x: number, y: number): void { ... }
  stopLoop(key: string): void { ... }
}
```

### F10.2 — Mace impact (chispas)

```typescript
{
  key: 'spark',        // usa particle-spark.png (ya existe en /effects/)
  x, y,
  speed: { min: 150, max: 350 },
  angle: { min: 0, max: 360 },
  scale: { start: 0.6, end: 0 },
  lifespan: 300,
  quantity: 12,
  tint: [0xff8800, 0xff4400, 0xffcc00],
  gravityY: 200,
}
```

### F10.3 — Stun (estrellas orbitando)

```typescript
// 5 textos '✦' en orbit circular alrededor del jugador
// Usar emitter con `rotate` en lugar de Text objects manuales
{
  key: 'stun-star',   // pequeño sprite de estrella o Text
  x: player.x, y: player.y - 30,
  speed: 0,
  rotate: { min: 0, max: 360 },
  lifespan: -1,       // loop hasta que deje de estar stunned
  quantity: 5,
  tint: 0xffd600,
}
// Orbit: actualizar x,y del emitter y moverlo en círculo cada frame
```

### F10.4 — Power-up recogido (burst de color)

```typescript
{
  key: 'glow-dot',     // particle-dot.png (ya existe)
  x, y,
  speed: { min: 100, max: 250 },
  scale: { start: 0.8, end: 0 },
  alpha: { start: 1, end: 0 },
  lifespan: 400,
  quantity: 16,
  tint: powerTypeColor,  // color según el power
}
```

### F10.5 — Flag delivery (celebración)

```typescript
// Confetti explosion centrado en el portador
{
  key: 'spark',
  x, y,
  speed: { min: 200, max: 500 },
  angle: { min: -120, max: -60 },  // hacia arriba
  gravityY: 400,
  lifespan: 800,
  quantity: 30,
  tint: [0xf59e0b, 0x10b981, 0x7c3aed, 0xef4444],
}
```

### F10.6 — Polvo de pasos (footstep dust)

```typescript
// Al cambiar frame en animación walk
{
  key: 'smoke',        // particle-smoke.png (ya existe)
  x: feet.x, y: feet.y,
  speed: { min: 10, max: 40 },
  scale: { start: 0.2, end: 0 },
  alpha: { start: 0.3, end: 0 },
  lifespan: 200,
  quantity: 2,
  tint: 0x3a3a5e,
}
```

### F10.7 — Trail de ghost

```typescript
// Cuando player tiene isGhost activo, cada 100ms:
{
  key: 'glow-dot',
  x: player.x, y: player.y,
  speed: 0,
  scale: { start: 0.4, end: 0 },
  alpha: { start: 0.4, end: 0 },
  lifespan: 400,
  quantity: 1,
  tint: 0xd1d5db,
}
```

---

## F11 — Efectos Visuales de Power-ups y Estados

> Los power-ups son invisibles ahora — el jugador no sabe qué tiene activo visualmente.

### F11.1 — Ghost (transparencia + shimmer)

- Sprite alpha → 0.35 (casi invisible para otros jugadores)
- Tween de shimmer: alpha 0.3 → 0.45 → 0.3 (pulso, 1.5s loop)
- **Nota**: la transparencia solo aplica en el render de `RemoteTank` cuando `isGhost = true`
  El jugador local siempre se ve a sí mismo con alpha normal

### F11.2 — Mace Shield (burbuja protectora)

- `Graphics` circular alrededor del jugador: radio 30px
- Color: 0x00e5ff (cyan), stroke 2px, alpha 0.6
- Pulso de scale: 1.0 → 1.15 → 1.0 (0.8s loop)
- Desaparece instantáneamente al absorber el golpe

### F11.3 — Sprint (estela de velocidad)

- 3 copias del sprite del jugador con alpha decreciente: 0.4, 0.2, 0.1
- Actualizadas con 60ms de delay cada una (history de posiciones)
- Tinte ligeramente verde (0x76ff03) para indicar el boost

### F11.4 — Super Mace (aura de poder)

- Anillo exterior naranja (0xff6d00) alrededor del sprite, radio 28px
- Alpha 0.5, glow effect (2 círculos concéntricos, el exterior más transparente)
- Parpadeo rápido de la maza al activar (flash blanco 100ms en el sprite)

### F11.5 — Revelation (jugadores delineados)

- Cuando el jugador local tiene REVELATION:
  - Todos los `RemoteTank` reciben un outline blanco/gold de 2px
  - Ignorar la invisibilidad de Ghost de otros jugadores
- Cuando REVELATION activa de otro jugador (server emite `power_collected`):
  - El jugador local sabe que alguien tiene REVELATION (advertencia en HUD)

### F11.6 — Blackout visual en el HUD

- Flash de pantalla completa al inicio (Graphics rect black, alpha 1→0, 200ms)
- Indicador en HUD: "⚫ APAGÓN" con contador de segundos
- Tinte rojo muy sutil en el borde de pantalla durante el blackout

---

## F12 — UI/UX Excellence

### F12.1 — HUD: cooldown de maza circular

Reemplazar la barra rectangular por un arco circular:
- Círculo centrado bajo el jugador o en esquina inferior
- Se llena en 12s, color cambia: rojo → naranja → verde cuando está listo
- Número de segundos en el centro del arco
- Flash verde + sonido cuando se recarga completamente

### F12.2 — Minimap básico

- 120×90px, esquina inferior izquierda, fondo negro 70% alpha
- Escala: mapa 2400×1600 → 120×80 (factor 1/20)
- Puntos: jugador local (blanco brillante, 3px), portador de bandera (ámbar, 4px, pulsante)
- Bandera en suelo: punto ámbar pequeño (2px)
- Destino: punto verde (2px, si visible)
- No mostrar posición de otros jugadores (respeta la mecánica de oscuridad)

**Archivo nuevo**: `frontend/src/app/game/ui/Minimap.ts`

### F12.3 — Death screen mejorado

Agregar al `DeathOverlayComponent`:
- Estadísticas de la sesión: nivel máximo alcanzado, capturas de bandera, mazos dados
- Mensaje de kill ("Noqueado por [nombre]" si aplica, o "Atrapado en trampa")
- Tiempo jugado en esa partida

### F12.4 — Panel de settings in-game

- Accesible desde el botón ☰ (menú de salida)
- Sliders: Música (0-100%) y SFX (0-100%)
- Selector de idioma (ya existe `LangSelector`, exponerlo aquí)
- Persistido en localStorage

**Archivo**: integrar en `game.component.ts` (nuevo componente `GameSettingsPanel`)

### F12.5 — Mobile: mejoras de controles

- Revisar que los 3 botones de acción (maza, linterna, pulso) no se superpongan con el joystick
- Añadir feedback háptico (`navigator.vibrate(50)`) en mace impact
- Botón de linterna debe ser toggleable con tap rápido (no hold)
- Orientación landscape lock: revisar que funciona en todos los dispositivos Android/iOS

---

## F13 — Optimización y Build Final

### F13.1 — Sprite atlas

Empaquetar todos los sprites del juego en 1-2 atlases:
- Atlas principal: personajes (todos los frames), power-ups, objetos del mapa
- Atlas VFX: efectos de partículas, mace-impact, trap-trigger
- Usar `this.load.atlas()` en PreloadScene

Beneficio: reduce draw calls de ~20 a ~3 por frame de Phaser.

### F13.2 — Object pooling para partículas frecuentes

Footstep dust (120 eventos/min), mace sparks: usar el pool nativo de Phaser Particles:
- `emitter.reserve(50)` para pre-alocar objetos
- `emitter.stop()` en lugar de `destroy()` para reutilizar

### F13.3 — Auditoría de 60fps

Perfilar el render loop en Chrome DevTools Performance:
- Target: `updateDarkness()` < 2ms por frame (es la función más pesada)
- Si supera, reducir `LIGHT_RAY_COUNT` de 60 a 40 en móvil
- Detectar y eliminar re-draws innecesarios en HUD (solo actualizar cuando cambia el valor)

### F13.4 — PWA actualizada

- Actualizar `ngsw-config.json` con las nuevas rutas de assets
- Actualizar `manifest.webmanifest`: nombre "Dark Flag", colores oscuros, iconos new
- Cache strategy: assets del juego = `CacheFirst`, API = `NetworkFirst`

### F13.5 — Build de producción verificado

- `npm run build` limpio (cero warnings de presupuesto)
- Service worker registrado y funcional
- Lazy loading de rutas verificado
- Lighthouse score ≥ 90 en Performance y PWA

---

## Orden de ejecución y dependencias

```
F5.5 ──────────────────────────────────────┐
  └─ sprites, VFX sheets, power-ups         │
F5.6 ──┐ (paralelo a F5.5)                 │
       └─ lobby reescrito                   │
                                            ▼
F7 ─── iluminación avanzada ────────────── requiere F5.5 (torch sprite)
F8 ─── animaciones ─────────────────────── requiere F5.5 (char-azure sheet)
F9 ─── audio ───────────────────────────── independiente (puede ir en paralelo con F8)
F10 ── partículas ──────────────────────── requiere F5.5 (particle assets existentes)
F11 ── power-up visuals ────────────────── requiere F8 (sprite system)
F12 ── UI/UX ───────────────────────────── requiere F7, F8, F11
F13 ── build final ─────────────────────── requiere TODO lo anterior

F6 ── assets completos (múltiples personajes, escenarios) — DESPUÉS de F13
```

**Estimado de fases**: F5.5+F5.6 (1 sesión generación + 1 sesión código) · F7 (1 sesión) · F8 (1 sesión) · F9 (1 sesión) · F10 (1 sesión) · F11+F12 (2 sesiones) · F13 (1 sesión)

---

## Lo que queda de F5.5 a F13 que está funcionando bien (no tocar)

- Lógica de juego server-side: completa y sólida
- Sistema de interpolación `RemoteTank`: correcto
- Anti-cheat (speedFactor, flag rate-limit): funcionando
- Auth, economy, missions, stats: completos
- Tutorial modal: funcionando
- Port isolation: resuelto
