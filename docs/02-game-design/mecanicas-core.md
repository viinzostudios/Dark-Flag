# Mecánicas Core — Dark Flag — Especificación Técnica

> Descripción detallada de cómo implementar cada mecánica.
> Esta es la fuente de verdad para el servidor — no el cliente.

---

## 1. Movimiento del jugador

### Modelo de control

El jugador se mueve automáticamente hacia la posición del cursor. No existe WASD.
La velocidad es proporcional a la distancia del cursor respecto al centro de pantalla.

**Controles de acción** (PC):
- Mazo: Click izquierdo **o tecla E** (edge-trigger)
- Alternar linterna: Tecla F (edge-trigger)
- Frenar: Barra espaciadora — el jugador no se mueve, pero la linterna sigue al cursor

```typescript
interface PlayerInput {
  mouseAngle: number;       // ángulo en radianes hacia el cursor desde el centro de pantalla
  speedFactor: number;      // [0, 1] — distancia cursor al centro; 0 = dead zone
  aimAngle: number;         // ángulo de la linterna (= mouseAngle normalmente)
  mace: boolean;            // true en el frame del mazo (edge-trigger)
  toggleLight: boolean;     // true para alternar linterna encendida/apagada (edge-trigger)
  brake: boolean;           // spacebar = stop + rotar linterna
  clientTick: number;
}
```

### Cálculo del speedFactor (cliente — replicado en servidor para validación)

```typescript
const MOUSE_MIN_DIST = 40;   // px — dead zone: dentro de este radio speedFactor = 0
const MOUSE_MAX_DIST = 200;  // px — distancia a la que se alcanza velocidad máxima

function computeSpeedFactor(cursorScreenX: number, cursorScreenY: number): number {
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  const dx = cursorScreenX - centerX;
  const dy = cursorScreenY - centerY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return clamp((dist - MOUSE_MIN_DIST) / (MOUSE_MAX_DIST - MOUSE_MIN_DIST), 0, 1);
}
```

### Procesamiento en servidor

```typescript
function processMovement(player: Player, input: PlayerInput, deltaTime: number): void {
  // Barra espaciadora: freno total — cuerpo inmóvil, linterna sigue al cursor
  if (input.brake) {
    player.aimAngle = input.aimAngle; // linterna se actualiza aunque no haya movimiento
    return;
  }

  const safeSpeedFactor = clamp(input.speedFactor, 0, 1);
  const effectiveSpeed = getEffectiveSpeed(player, safeSpeedFactor * MAX_SPEED);

  player.rotation = input.mouseAngle;
  player.aimAngle = input.aimAngle;

  player.x += Math.cos(input.mouseAngle) * effectiveSpeed * deltaTime;
  player.y += Math.sin(input.mouseAngle) * effectiveSpeed * deltaTime;

  player.x = clamp(player.x, TANK_RADIUS, MAP_WIDTH - TANK_RADIUS);
  player.y = clamp(player.y, TANK_RADIUS, MAP_HEIGHT - TANK_RADIUS);
}
```

### Efectos de nivel sobre la velocidad

```typescript
function getEffectiveSpeed(player: Player, baseSpeed: number): number {
  const speedBonuses = [
    0,    // nv 1
    0,    // nv 2
    0,    // nv 3 — +10% se aplica abajo
    0.10, // nv 3
    0.10, // nv 4
    0.10, // nv 5
    0.15, // nv 6
    0.15, // nv 7
    0.15, // nv 8
    0.25, // nv 9
    0.25, // nv 10
    0.25, // nv 11
    0.30, // nv 12
    0.30, // nv 13
    0.30, // nv 14
    0.35, // nv 15
  ];

  let bonus = speedBonuses[Math.min(player.powerStack, 15)];

  // Sprint de sombra: nivel 9+ con linterna apagada
  if (!player.lightOn && player.powerStack >= 9) bonus += 0.10;

  // Power-up sprint activo
  if (player.sprintActive) bonus += 0.60;

  return baseSpeed * (1 + bonus);
}
```

El cliente aplica exactamente la misma fórmula localmente antes de recibir confirmación del servidor (predicción del lado cliente).

---

## 2. Sistema de linterna

La linterna define el cono de visibilidad del jugador. Su dirección es `aimAngle` (la misma que la del cursor). En el cliente se implementa raycasting para calcular el polígono de visibilidad.

```typescript
interface FlashlightConfig {
  coneAngle: number;   // radianes (60° = π/3 a nivel 1)
  range: number;       // px (150 a nivel 1)
  on: boolean;         // encendida o apagada
}
```

### Tabla de cono y rango por nivel

| Nivel | Ángulo del cono | Rango (px) |
|-------|-----------------|-----------|
| 1     | 60°             | 150       |
| 2     | 60°             | 175       |
| 3     | 60°             | 175       |
| 4     | 60°             | 175       |
| 5     | 80°             | 200       |
| 6     | 80°             | 200       |
| 7     | 80°             | 250       |
| 8     | 80°             | 250       |
| 9     | 90°             | 250       |
| 10    | 100°            | 300       |
| 11    | 100°            | 300       |
| 12    | 110°            | 350       |
| 13    | 110°            | 350       |
| 14    | 120°            | 350       |
| 15    | 130°            | 500       |

```typescript
function getLighthouseRange(level: number): number {
  const ranges = [0, 150, 175, 175, 175, 200, 200, 250, 250, 250, 300, 300, 350, 350, 350, 500];
  return ranges[Math.min(level, 15)];
}

function getLighthouseCone(level: number): number {
  // Grados convertidos a radianes
  const cones = [0, 60, 60, 60, 60, 80, 80, 80, 80, 90, 100, 100, 110, 110, 120, 130];
  return (cones[Math.min(level, 15)] * Math.PI) / 180;
}
```

### Raycasting de visibilidad (cliente — Phaser)

El mundo se renderiza completamente oscuro como base. La linterna actúa como máscara de luz:

1. Para cada obstáculo dentro del rango, calcular los vértices visibles desde la posición del jugador.
2. Lanzar rayos hacia los vértices y sus extremos angulares (±ε) dentro del arco del cono.
3. Construir el polígono de visibilidad con los puntos de intersección más cercanos.
4. Aplicar el polígono como máscara (Phaser Graphics o WebGL mask) sobre la capa de oscuridad.

```typescript
// Pseudocódigo cliente
function computeVisibilityPolygon(
  player: { x: number; y: number; aimAngle: number },
  config: FlashlightConfig,
  obstacles: Obstacle[]
): Phaser.Geom.Polygon {
  const halfCone = config.coneAngle / 2;
  const angles = getEndpoints(obstacles, player, halfCone, config.range);
  angles.push(player.aimAngle - halfCone, player.aimAngle + halfCone); // bordes del cono

  const points: { x: number; y: number }[] = [];
  for (const angle of angles.sort((a, b) => a - b)) {
    const hit = castRay(player, angle, config.range, obstacles);
    points.push(hit);
  }

  return new Phaser.Geom.Polygon(points);
}
```

### Alternancia de linterna (servidor)

```typescript
function processToggleLight(player: Player, input: PlayerInput): void {
  if (input.toggleLight) {
    player.lightOn = !player.lightOn;
    emit('light_toggled', { playerId: player.id, lightOn: player.lightOn });
  }
}
```

Efectos de linterna apagada:
- El jugador no es detectable por la linterna de otros (no aparece en su cono de visibilidad).
- Si el jugador es nivel 9+, obtiene +10% de velocidad (sprint de sombra).
- El jugador aún puede ver el mundo con la pantalla oscura — sin polígono de luz propio.

---

## 3. La bandera

La bandera es el objeto central del juego. Recogerla, transportarla y entregarla al destino otorga puntos y niveles.

```typescript
interface ServerFlagState {
  id: string;
  x: number;
  y: number;
  carriedBy: string | null;      // playerId o null si está en el suelo
  lastCarrierId: string | null;  // quien la soltó por última vez
  droppedAt: number | null;      // timestamp cuando fue soltada
  isOnGround: boolean;
  firstIlluminatedBy: string | null; // primer jugador que la iluminó con su linterna
}

interface ServerDestinationState {
  x: number;
  y: number;
  radius: number;  // 80px — radio de entrega
}
```

### Reglas de spawn

- **Bandera**: posición aleatoria alejada mínimo 200px de cualquier jugador y de la zona del faro.
- **Destino**: posición aleatoria mínimo 400px de la bandera y mínimo 200px de cualquier borde del mapa.

### Recoger la bandera

```typescript
function checkFlagPickup(state: ServerGameState): void {
  if (state.flag.carriedBy !== null) return; // ya alguien la lleva

  for (const player of state.players.values()) {
    if (player.isDead) continue;

    // Cooldown de re-pickup: quien la soltó debe esperar 5 s
    if (
      player.id === state.flag.lastCarrierId &&
      state.flag.droppedAt !== null &&
      Date.now() - state.flag.droppedAt < 5000
    ) continue;

    const dx = player.x - state.flag.x;
    const dy = player.y - state.flag.y;
    if (dx * dx + dy * dy < (TANK_RADIUS + FLAG_RADIUS) ** 2) {
      pickupFlag(player, state);
      break;
    }
  }
}

function pickupFlag(player: Player, state: ServerGameState): void {
  state.flag.carriedBy = player.id;
  state.flag.isOnGround = false;
  player.hasFlag = true;
  player.score += SCORE_FLAG_PICKUP; // +20

  emit('flag_picked', { playerId: player.id, x: state.flag.x, y: state.flag.y });
}
```

### Iluminación de la bandera (puntos de exploración)

El servidor verifica en cada tick si algún jugador ilumina la bandera por primera vez en ese ciclo de spawn:

```typescript
function checkFlagIllumination(state: ServerGameState, now: number): void {
  if (state.flag.firstIlluminatedBy !== null) return; // ya fue iluminada
  if (state.flag.carriedBy !== null) return;           // está siendo cargada

  for (const player of state.players.values()) {
    if (player.isDead || !player.lightOn) continue;
    if (isPointInCone(state.flag, player)) {
      state.flag.firstIlluminatedBy = player.id;
      player.score += SCORE_ILLUMINATE_FIRST; // +10
      player.powerStack = Math.min(player.powerStack + LEVEL_GAIN_ILLUMINATE, STACK_MAX); // +1 nivel
      emit('flag_illuminated', { playerId: player.id });
      break;
    }
  }
}
```

### Entrega de la bandera

```typescript
function checkFlagDelivery(state: ServerGameState): void {
  if (!state.flag.carriedBy) return;

  const carrier = state.players.get(state.flag.carriedBy);
  if (!carrier) return;

  const dx = carrier.x - state.destination.x;
  const dy = carrier.y - state.destination.y;
  if (dx * dx + dy * dy < state.destination.radius ** 2) {
    scoreFlag(carrier, state);
  }
}

function scoreFlag(player: Player, state: ServerGameState): void {
  player.score += SCORE_FLAG_DELIVERY; // +100
  player.powerStack = Math.min(player.powerStack + LEVEL_GAIN_DELIVERY, STACK_MAX); // +2 niveles
  player.hasFlag = false;

  // Spawns nuevos
  state.flag = spawnFlag(state);
  state.destination = spawnDestination(state);

  emit('flag_scored', { playerId: player.id, newScore: player.score });
}
```

### Soltar la bandera (muerte o mazo)

```typescript
function dropFlag(carrier: Player, state: ServerGameState, now: number): void {
  state.flag.x = carrier.x;
  state.flag.y = carrier.y;
  state.flag.carriedBy = null;
  state.flag.lastCarrierId = carrier.id;
  state.flag.droppedAt = now;
  state.flag.isOnGround = true;
  state.flag.firstIlluminatedBy = null; // se resetea para el siguiente portador
  carrier.hasFlag = false;

  emit('flag_dropped', { playerId: carrier.id, x: state.flag.x, y: state.flag.y });
}
```

---

## 4. El mazo

El mazo es la única arma ofensiva. Aturde al objetivo, le quita un nivel y lo hace soltar la bandera si la lleva. El atacante gana un nivel y puntos.

```typescript
const MACE_RANGE_BY_LEVEL = [
  0,    // nv 0 (no usado)
  80,   // nv 1
  80,   // nv 2
  80,   // nv 3
  80,   // nv 4
  80,   // nv 5
  80,   // nv 6
  100,  // nv 7
  100,  // nv 8
  100,  // nv 9
  100,  // nv 10
  120,  // nv 11
  120,  // nv 12
  120,  // nv 13
  120,  // nv 14
  120,  // nv 15
];

const MACE_COOLDOWN_MS      = 12000;
const MACE_STUN_DEFAULT_MS  = 5000;
const MACE_STUN_LEVEL8_MS   = 3000;  // si la víctima es nivel 8+
const MACE_STUN_SUPERMACE_MS = 10000;
const MACE_INVINCIBILITY_MS = 3000;  // inmunidad tras recibir el mazo
```

### Procesamiento del mazo

```typescript
function processMace(attacker: Player, state: ServerGameState, now: number): void {
  // El portador de la bandera no puede mazear
  if (attacker.hasFlag) return;

  // Verificar cooldown
  if (now < attacker.maceCooldownEnd) return;

  const maceRange = MACE_RANGE_BY_LEVEL[Math.min(attacker.powerStack, 15)];

  for (const target of state.players.values()) {
    if (target.id === attacker.id) continue;
    if (target.isDead || now < target.invincibleUntil) continue;

    const dx = target.x - attacker.x;
    const dy = target.y - attacker.y;
    if (dx * dx + dy * dy > maceRange ** 2) continue;

    applyMace(attacker, target, state, now);
    break; // solo un objetivo por golpe de mazo
  }
}

function applyMace(attacker: Player, target: Player, state: ServerGameState, now: number): void {
  let stunDuration: number;
  let levelLoss: number = 1;

  if (attacker.superMaceCharges > 0) {
    // Supermazo activo
    attacker.superMaceCharges--;
    stunDuration = MACE_STUN_SUPERMACE_MS;
    levelLoss = 2;
  } else {
    // Mazo normal — la duración depende del nivel de la víctima
    stunDuration = target.powerStack >= 8 ? MACE_STUN_LEVEL8_MS : MACE_STUN_DEFAULT_MS;
  }

  target.stunUntil = now + stunDuration;
  target.invincibleUntil = target.stunUntil + MACE_INVINCIBILITY_MS;
  target.powerStack = Math.max(LEVEL_MIN, target.powerStack - levelLoss);

  if (target.hasFlag) {
    dropFlag(target, state, now);
  }

  // Nivel 14 — contramazo: la víctima devuelve un aturdimiento al atacante
  if (target.powerStack >= 14) {
    attacker.stunUntil = Math.max(attacker.stunUntil, now + COUNTER_MACE_STUN_MS);
  }

  attacker.maceCooldownEnd = now + MACE_COOLDOWN_MS;
  attacker.powerStack = Math.min(STACK_MAX, attacker.powerStack + LEVEL_GAIN_MACE);
  attacker.score += SCORE_MACE_HIT; // +10

  emit('mace_hit', { attackerId: attacker.id, targetId: target.id, stunDuration });
}
```

---

## 5. Trampas

Las trampas son objetos ocultos en el suelo del mapa. Solo se activan si el jugador las pisa mientras va a más del 70% de velocidad máxima. **Eliminan al jugador** (respawn con modal de muerte) y le hacen soltar la bandera.

```typescript
interface Trap {
  id: string;
  x: number;
  y: number;
  active: boolean;
  respawnAt: number | null;
}

const TRAP_RADIUS                  = 72;          // px (server-side; visual frontend: 54px)
const TRAP_VISIBLE_DISTANCE_BASE   = 40;          // px — visible solo si estás muy cerca
const TRAP_VISIBLE_DISTANCE_LEVEL4 = 65;          // px — nivel 4+ detecta trampas más lejos
const TRAP_SPEED_THRESHOLD         = 0.70;        // 70% de velocidad máxima para activarse
const TRAP_RESPAWN_MS              = 45000;
const TRAP_COUNT_MIN               = 15;
const TRAP_COUNT_MAX               = 20;
```

### Detección de trampas

```typescript
function checkTrapCollisions(state: ServerGameState, now: number): void {
  for (const player of state.players.values()) {
    if (player.isDead || now < player.invincibleUntil) continue;
    if (now < player.stunUntil) continue;

    // La trampa solo se activa si el jugador va rápido
    if (player.speedFactor <= TRAP_SPEED_THRESHOLD) continue;

    for (const trap of state.traps) {
      if (!trap.active) continue;

      const dx = player.x - trap.x;
      const dy = player.y - trap.y;
      if (dx * dx + dy * dy < (TANK_RADIUS + TRAP_RADIUS) ** 2) {
        applyTrap(player, trap, state, now);
        break;
      }
    }
  }
}

function applyTrap(player: Player, trap: Trap, state: ServerGameState, now: number): void {
  // La trampa mata al jugador — dispara modal de eliminación en cliente
  if (player.hasFlag) {
    dropFlag(player, state, now);
  }

  player.isDead = true;
  player.respawnAt = now + RESPAWN_MS;
  player.activePowerType = null;
  player.isGhost = false;
  // (reset de todos los campos de power-up activo)

  trap.active = false;
  trap.respawnAt = now + TRAP_RESPAWN_MS;

  emit('player_died', { playerId: player.id, killerName: null, reason: 'trap' });
}
```

### Visibilidad de trampas (cliente)

- **Umbral base**: la trampa es visible en el cliente solo si el jugador está a menos de 40px.
- **Nivel 4+**: el umbral sube a 65px.
- Las trampas de otros jugadores no son detectadas por la linterna — son invisibles hasta el umbral de distancia.
- Visual al activarse: animación de cerrojo / diente de sierra que aparece brevemente.

### Respawn de trampas

```typescript
function processTrapRespawns(state: ServerGameState, now: number): void {
  for (const trap of state.traps) {
    if (!trap.active && trap.respawnAt !== null && now >= trap.respawnAt) {
      trap.active = true;
      trap.respawnAt = null;
      emit('trap_respawned', { trapId: trap.id });
    }
  }
}
```

---

## 6. Power-ups

Los power-ups aparecen en el mapa como objetos recogibles. Máximo 4 activos simultáneamente. Se generan cada 20 segundos. Un jugador solo puede tener **1 power-up activo** a la vez; recoger uno mientras se tiene otro lo reemplaza.

```typescript
type PowerUpType = 'MACE_SHIELD' | 'REVELATION' | 'SPRINT' | 'BLACKOUT' | 'SUPER_MACE' | 'GHOST' | 'SEE_OTHERS';

interface PowerUp {
  id: string;
  type: PowerUpType;
  x: number;
  y: number;
}

const MAX_POWERUPS_ON_MAP      = 4;
const POWERUP_SPAWN_INTERVAL_MS = 20000;
const POWERUP_RADIUS           = 18;

const POWERUP_DURATIONS: Record<PowerUpType, number> = {
  MACE_SHIELD: 0,        // hasta que absorbe 1 golpe
  REVELATION:  10000,
  SPRINT:      8000,
  BLACKOUT:    5000,
  SUPER_MACE:  0,        // hasta que usa los 2 mazos
  GHOST:       8000,
  SEE_OTHERS:  20000,
};

const POWERUP_WEIGHTS: Record<PowerUpType, number> = {
  MACE_SHIELD: 20,
  REVELATION:  15,
  SPRINT:      20,
  BLACKOUT:    15,
  SUPER_MACE:  15,
  GHOST:       15,
  SEE_OTHERS:  10,
};
```

### Tipos de power-up

| Power-up | Descripción |
|----------|------------|
| `MACE_SHIELD` | Bloquea el próximo golpe de mazo (absorbe 1 golpe). No caduca por tiempo. |
| `REVELATION` | Elimina la oscuridad completamente durante 10 s (el jugador ve todo el escenario). |
| `SPRINT` | +60% de velocidad durante 8 s, independiente del nivel. |
| `BLACKOUT` | Apaga la linterna de todos los rivales durante 5 s (no afecta al portador). |
| `SUPER_MACE` | Los próximos 2 mazos duran 10 s de aturdimiento y quitan 2 niveles. |
| `GHOST` | El jugador atraviesa trampas y obstáculos estáticos; invisible en el minimapa durante 8 s. Efecto visual: opacidad parpadeante (0.55↔0.20 cada 250 ms). |
| `SEE_OTHERS` | Ver los conos de linterna de todos los demás jugadores durante 20 s. |

### Aplicar power-up

```typescript
function applyPowerUp(player: Player, powerUp: PowerUp, state: ServerGameState, now: number): void {
  // Reemplazar poder anterior si lo hay
  expirePowerUp(player, now);

  player.score += SCORE_POWERUP_PICKUP; // +10
  player.activePower = powerUp.type;
  player.powerExpiresAt = powerUp.type !== 'MACE_SHIELD' && powerUp.type !== 'SUPER_MACE'
    ? now + POWERUP_DURATIONS[powerUp.type]
    : null; // sin expiración por tiempo

  switch (powerUp.type) {
    case 'MACE_SHIELD':
      player.hasMaceShield = true;
      break;
    case 'REVEAL':
      // Se gestiona en la sincronización del minimapa
      break;
    case 'SPRINT':
      player.sprintActive = true;
      break;
    case 'BLACKOUT':
      for (const target of state.players.values()) {
        if (target.id === player.id) continue;
        target.lightOn = false;
        target.blackoutUntil = now + POWERUP_DURATIONS.BLACKOUT;
      }
      emit('blackout', { sourceId: player.id, duration: POWERUP_DURATIONS.BLACKOUT });
      break;
    case 'SUPER_MACE':
      player.superMaceCharges = 2;
      break;
    case 'GHOST':
      player.isGhost = true;
      break;
  }

  emit('powerup_collected', { playerId: player.id, type: powerUp.type, x: powerUp.x, y: powerUp.y });
}
```

### Escudo y mazo

```typescript
function checkMaceShield(attacker: Player, target: Player): boolean {
  if (target.hasMaceShield) {
    target.hasMaceShield = false;
    target.activePower = null;
    emit('shield_blocked', { targetId: target.id, attackerId: attacker.id });
    return true; // el mazo fue bloqueado
  }
  return false;
}

// En applyMace, llamar antes de aplicar el efecto:
// if (checkMaceShield(attacker, target)) return;
```

### Spawn de power-ups

```typescript
function trySpawnPowerUp(state: ServerGameState): void {
  if (state.powerUps.length >= MAX_POWERUPS_ON_MAP) return;

  const type = weightedRandom(POWERUP_WEIGHTS);
  state.powerUps.push({
    id: uuid(),
    type,
    x: randomSafeX(state),
    y: randomSafeY(state),
  });
}
// Se llama cada POWERUP_SPAWN_INTERVAL_MS desde el game loop
```

---

## 7. Sistema de niveles (Power Stack)

`STACK_MAX = 15`. El nivel mínimo activo es 1 (nunca baja de 1 por mazo). El nivel máximo es 15.

### Formas de ganar niveles

| Acción | Niveles ganados |
|--------|----------------|
| Entregar la bandera al destino | +2 |
| Iluminar la bandera con linterna por primera vez (en ese ciclo) | +1 |
| Golpear a un rival con el mazo | +1 |

### Formas de perder niveles

| Acción | Niveles perdidos |
|--------|-----------------|
| Recibir un mazo normal | −1 (mínimo nivel 1) |
| Recibir un supermazo | −2 (mínimo nivel 1) |

### Tabla de efectos por nivel

| Nivel | Efecto servidor | Efecto visual (cliente) |
|-------|-----------------|------------------------|
| 1 | Linterna: 60°, 150 px | — |
| 2 | Linterna: 60°, 175 px | — |
| 3 | Linterna: 60°, 175 px · +10% velocidad | — |
| 4 | Linterna: 60°, 175 px · detecta trampas a 65px | — |
| 5 | Linterna: 80°, 200 px | — |
| 6 | Linterna: 80°, 200 px · +15% velocidad · **Pulso de oscuridad** (1 uso/20 s): apaga linternas rivales en 300px por 3 s | — |
| 7 | Linterna: 80°, 250 px | — |
| 8 | Linterna: 80°, 250 px · duración de aturdimiento recibido reducida a 3 s | — |
| 9 | Linterna: 90°, 250 px · +25% velocidad · Sprint de sombra (+10% extra con linterna apagada) | — |
| 10 | Linterna: 100°, 300 px · ve a través de 1 pared (niebla de guerra reducida por obstáculos) | Aura azul eléctrica |
| 11 | Linterna: 100°, 300 px · rango de mazo 120px | Aura azul eléctrica |
| 12 | Linterna: 110°, 350 px · +30% velocidad | Aura azul eléctrica |
| 13 | Linterna: 110°, 350 px · puede ver trampas siempre (sin límite de distancia) | Aura azul brillante |
| 14 | Linterna: 120°, 350 px · **Contramazo**: si recibe un mazo y no está aturdido más de 1 s, el atacante recibe 2 s de aturdimiento | Aura azul brillante |
| 15 | Linterna: 130°, 500 px · +35% velocidad · **Previsión**: ve el próximo destino de entrega 3 s antes del spawn | Aura blanca pulsante |

### Implementación servidor (fragmento)

```typescript
function getMaceRange(level: number): number {
  if (level >= 11) return 120;
  if (level >= 7)  return 100;
  return 80;
}

function getMaceStunDuration(attackerLevel: number, victimLevel: number): number {
  if (victimLevel >= 8) return MACE_STUN_LEVEL8_MS;
  return MACE_STUN_DEFAULT_MS;
}

function canSeeTrap(player: Player, trap: Trap): boolean {
  if (player.powerStack >= 13) return true; // siempre visible
  const dx = player.x - trap.x;
  const dy = player.y - trap.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const threshold = player.powerStack >= 4
    ? TRAP_VISIBLE_DISTANCE_LEVEL4
    : TRAP_VISIBLE_DISTANCE_BASE;
  return dist <= threshold;
}

// Pulso de oscuridad (nivel 6) — activado por input especial
function processDarkPulse(player: Player, state: ServerGameState, now: number): void {
  if (player.powerStack < 6) return;
  if (now < player.pulseCooldownEnd) return;

  player.pulseCooldownEnd = now + PULSE_ABILITY_CD_MS;

  for (const target of state.players.values()) {
    if (target.id === player.id) continue;
    const dx = target.x - player.x;
    const dy = target.y - player.y;
    if (dx * dx + dy * dy < 300 ** 2) {
      target.lightOn = false;
      target.blackoutUntil = now + 3000;
    }
  }

  emit('dark_pulse', { sourceId: player.id });
}

// Previsión (nivel 15) — se emite 3 s antes del nuevo spawn de destino
function notifyNextDestination(player: Player, nextDestination: ServerDestinationState, now: number): void {
  if (player.powerStack >= 15) {
    emit('next_destination_preview', {
      playerId: player.id,
      x: nextDestination.x,
      y: nextDestination.y,
    });
  }
}
```

---

## 8. Bots

Los bots tienen un cono de linterna ficticio calculado en el servidor (no render real). Nivel base 1, con la misma progresión que jugadores humanos.

### Estado del bot

```typescript
interface BotState extends Player {
  reactionDelayMs: number;   // 500ms por defecto
  patrolTarget: { x: number; y: number } | null;
  lastDecisionAt: number;
}
```

### Árbol de decisión

```typescript
function updateBot(bot: BotState, state: ServerGameState, now: number): void {
  if (now - bot.lastDecisionAt < bot.reactionDelayMs) return;
  bot.lastDecisionAt = now;

  const flag   = state.flag;
  const dest   = state.destination;
  const hasFlag = bot.hasFlag;

  if (hasFlag) {
    // Moverse hacia el destino
    moveToward(bot, dest.x, dest.y);
    return;
  }

  // Mazear a portador en rango
  const carrier = getCarrierInRange(bot, state);
  if (carrier) {
    moveToward(bot, carrier.x, carrier.y);
    if (isInMaceRange(bot, carrier)) {
      bot.input.mace = true;
    }
    return;
  }

  // Ir a recoger la bandera si no la lleva nadie
  if (!flag.carriedBy) {
    moveToward(bot, flag.x, flag.y);
    return;
  }

  // Patrol aleatorio
  if (!bot.patrolTarget || isNear(bot, bot.patrolTarget, 50)) {
    bot.patrolTarget = randomPatrolPoint(state);
  }
  moveToward(bot, bot.patrolTarget.x, bot.patrolTarget.y);
}
```

### Razonamiento de linterna del bot

El servidor calcula si la bandera está dentro del cono ficticio del bot para decidir si "la ve". Los bots tienen **memoria de linterna**: si iluminan la bandera, recuerdan su posición durante 5 s (`botFlagKnownUntil`). Pasado ese tiempo, vuelven a patrullar hasta re-iluminarla.

```typescript
function isInBotFlashlight(bot: ServerPlayerState, px: number, py: number): boolean {
  const range     = getBotConeRange(bot.level);
  const halfAngle = getBotConeHalfAngle(bot.level);
  const dx = px - bot.x;
  const dy = py - bot.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > range) return false;
  const angleToPoint = Math.atan2(dy, dx);
  let diff = angleToPoint - bot.aimAngle;
  while (diff >  Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  return Math.abs(diff) <= halfAngle;
}

// En updateBots — actualizar memoria de bandera
if (isInBotFlashlight(bot, flag.x, flag.y)) {
  bot.botFlagKnownUntil = now + 5000; // recuerda por 5 s
}
const knowsFlag = now < bot.botFlagKnownUntil || bot.hasFlag;
```

---

## 9. Colisión jugador ↔ jugador

Separación simple sin impulso adicional. Los jugadores no rebotan — solo se empujan para eliminar solapamiento.

```typescript
function resolveTankCollisions(players: Map<string, ServerPlayerState>): void {
  const arr = [...players.values()].filter(p => !p.isDead && !p.isGhost);
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      const a = arr[i];
      const b = arr[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
      const minDist = TANK_RADIUS * 2; // 40 px

      if (dist >= minDist) continue;

      const nx = dx / dist;
      const ny = dy / dist;
      const overlap = (minDist - dist) / 2;

      a.x -= nx * overlap;
      a.y -= ny * overlap;
      b.x += nx * overlap;
      b.y += ny * overlap;
    }
  }
}
```

Nota: los jugadores con Ghost activo no participan en la colisión con otros jugadores (atraviesan). Los jugadores Ghost también **atraviesan obstáculos estáticos** (el servidor omite `resolveAllStaticCollisions` para ellos). Solo los bordes del mapa los detienen.

---

## 10. Obstáculos estáticos del escenario

Elementos permanentes generados al crear la sala. **Indestructibles**. Los jugadores no pueden atravesarlos. Los rayos de linterna no los atraviesan (bloquean el polígono de visibilidad).

### Tipos

| Tipo | Descripción | Dimensiones |
|------|------------|-------------|
| `BUILDING` | Ruinas de edificio / fachada derrumbada, vista cenital | 280×180 px |
| `BARRIER` | Muro largo de valla o muro de ladrillo | 360×90 px |
| `ROUND` | Obstáculo circular (pozo / columna derruida) | radio 70 px |
| `FARO` | El faro central — circular, no se puede colocar en su zona | radio 300 px (zona), hitbox 80 px |

### Generación

```typescript
const obstacleCount = Math.min(14, Math.max(8, Math.floor(MAP_WIDTH * MAP_HEIGHT / 500000)));

// Margen mínimo desde el borde: 180 px
// Separación mínima entre obstáculos: 160 px
// Zona central (300 px alrededor del faro) libre de obstáculos
// Ángulos de BARRIER: 0, π/4, π/2, 3π/4 (aleatorio por obstáculo)
```

### Colisión (OBB)

Usa el mismo sistema OBB que los muros del juego original para BUILDING y BARRIER. Para ROUND se usa hitbox circular. El servidor aplica colisiones de obstáculos en `processInputs`, `updateBots` y `moveProjectiles` si hubiera proyectiles (no aplica en Dark Flag — solo el mazo como arma).

---

## Constantes del juego

```typescript
export const DARK_FLAG_CONSTANTS = {
  // Mapa — tamaño dinámico según jugadores; valores para 20 jugadores (default)
  MAP_WIDTH:  2800,
  MAP_HEIGHT: 1867,

  // Jugador
  TANK_RADIUS:    20,
  MAX_SPEED:      220,   // px/s
  MOUSE_MIN_DIST: 40,    // px — dead zone
  MOUSE_MAX_DIST: 200,   // px — distancia de velocidad máxima

  // Niveles
  STACK_MAX:  15,
  LEVEL_MIN:  1,
  LEVEL_MAX:  15,

  // Mazo
  MACE_COOLDOWN_MS:       12000,
  MACE_STUN_MS:           5000,
  MACE_STUN_LEVEL8_MS:    3000,
  MACE_STUN_SUPERMACE_MS: 10000,
  MACE_INVINCIBILITY_MS:  3000,

  // Bandera y destino
  FLAG_RADIUS:                      20,
  DESTINATION_RADIUS:               80,
  FLAG_REARM_DELAY_MS:              5000,  // cooldown de re-pickup del ex-portador
  FLAG_MIN_DIST_FROM_PLAYERS:       200,
  DESTINATION_MIN_DIST_FROM_FLAG:   400,
  DESTINATION_MIN_DIST_FROM_BORDER: 200,

  // Faro
  FARO_RADIUS_ZONE:    300,
  FARO_HITBOX_RADIUS:  80,

  // Trampas
  TRAP_RADIUS:                   72,   // server-side; visual frontend: 54px
  TRAP_VISIBLE_DISTANCE_BASE:    40,
  TRAP_VISIBLE_DISTANCE_LEVEL4:  65,
  TRAP_SPEED_THRESHOLD:          0.70,
  TRAP_RESPAWN_MS:               45000,
  TRAP_COUNT_MIN:                15,
  TRAP_COUNT_MAX:                20,

  // Power-ups (7 tipos: MACE_SHIELD, REVELATION, SPRINT, BLACKOUT, SUPER_MACE, GHOST, SEE_OTHERS)
  POWERUP_RADIUS:            18,
  MAX_POWERUPS_ON_MAP:       4,
  POWERUP_SPAWN_INTERVAL_MS: 20000,

  // Puntuación
  SCORE_FLAG_PICKUP:       20,
  SCORE_FLAG_DELIVERY:     100,
  SCORE_MACE_HIT:          10,
  SCORE_POWERUP_PICKUP:    10,
  SCORE_ILLUMINATE_FIRST:  10,

  // Ganancia/pérdida de niveles
  LEVEL_GAIN_DELIVERY:   2,
  LEVEL_GAIN_ILLUMINATE: 1,
  LEVEL_GAIN_MACE:       1,
  LEVEL_LOSS_MACED:      1,
  LEVEL_LOSS_SUPERMACED: 2,

  // Habilidades por nivel
  PULSE_ABILITY_CD_MS:             20000, // nivel 6 — Pulso de oscuridad
  DARK_PULSE_RADIUS:               300,   // px
  DARK_PULSE_DURATION_MS:          3000,
  COUNTER_MACE_STUN_MS:            2000,  // nivel 14 — Contramazo
  NEXT_DESTINATION_PREVIEW_MS:     3000,  // nivel 15 — Previsión

  // Minimapa
  MINIMAP_CARRIER_VISIBLE:          true,
  DESTINATION_GLOBAL_VISIBLE_DIST:  150,  // px — el destino se muestra a todos al acercarse

  // Game loop
  TICK_RATE:       30,
  TICK_DURATION_MS: 1000 / 30,

  // Bots
  BOT_REACTION_DELAY_MS: 500,
};
```
