# Game Loop del Servidor — Dark Flag

> El game loop es el corazón del game server. Corre a exactamente 30 ticks/segundo.  
> El servidor es la autoridad absoluta de todo el estado de juego.  
> El cliente solo renderiza — nunca decide.

---

## 1. Tick rate y estructura

- **30 ticks por segundo** = 1 tick cada ~33.33ms
- Se usa `setInterval` con corrección de drift para mantener el intervalo exacto
- Si un tick tarda más de 33ms en procesarse, se loguea como advertencia (`TICK_OVERRUN`)
- `dt` (delta time) = `(now - lastTickTime) / 1000` en segundos

### Orden de procesamiento por tick

```
cada tick (30/s):
  1.  processInputQueue(state)
  2.  processMovement(state, dt)
  3.  processMaces(state, now)
  4.  checkTrapCollisions(state, now)
  5.  checkFlagPickup(state)
  6.  checkFlagDelivery(state)
  7.  spawnPowerUps(state, now)
  8.  checkPowerUpPickups(state)
  9.  handlePowerUpExpiry(state, now)
  10. updateBots(state, dt)
  11. updateTraps(state, now)
  12. snapshot = buildSnapshot(state)
  13. io.to(roomId).emit('game_state', snapshot)
  state.tick++
```

### Esqueleto del loop principal

```typescript
class GameLoopService {
  private rooms: Map<string, RoomState> = new Map();
  private lastTickTime = Date.now();

  start(): void {
    setInterval(() => this.tick(), TICK_DURATION_MS); // TICK_DURATION_MS = 33
  }

  private tick(): void {
    const now = Date.now();
    const dt = (now - this.lastTickTime) / 1000;
    this.lastTickTime = now;

    for (const room of this.rooms.values()) {
      if (room.status !== 'playing') continue;
      this.processRoom(room, dt, now);
    }
  }
}
```

---

## 2. Procesamiento de movimiento

### Validación de speedFactor

El cliente envía `speedFactor` (0–1). El servidor clampea antes de aplicar:

```typescript
const safeSpeed = clamp(input.speedFactor, 0, 1);
```

Valores fuera de `[0, 1]` se ignoran silenciosamente (no desconectar al cliente).

### Velocidad efectiva por nivel

La velocidad base varía según el nivel del jugador:

| Nivel | Velocidad (px/s) |
|-------|-----------------|
| 1     | 220             |
| 3     | 230             |
| 5     | 240             |
| 6     | 245             |
| 8     | 255             |
| 10    | 265             |
| 12    | 275             |
| 14    | 285             |
| 15    | 290             |

Para niveles intermedios se usa la tabla del nivel más cercano hacia abajo.

### Modificadores de velocidad

- **Sprint activo** (power-up): `× 1.4`
- **Sprint permanente leve** (nivel 12+): `× 1.1` (acumulativo con Sprint)
- **Stunned**: velocidad = 0
- **Ghost activo**: sin modificador de velocidad

### Aplicación del movimiento

```typescript
function processMovement(state: ServerGameState, dt: number): void {
  for (const player of state.players.values()) {
    if (player.isDead || player.isStunned) continue;

    const input = player.pendingInput;
    if (!input) continue;

    const baseSpeed = getSpeedForLevel(player.level);
    const speedMult = getSpeedMultiplier(player);
    const effectiveSpeed = baseSpeed * speedMult * clamp(input.speedFactor, 0, 1);

    const newX = player.x + Math.cos(input.mouseAngle) * effectiveSpeed * dt;
    const newY = player.y + Math.sin(input.mouseAngle) * effectiveSpeed * dt;

    // Clamp en límites del mapa (TANK_RADIUS = 20)
    player.x = clamp(newX, TANK_RADIUS, MAP_WIDTH  - TANK_RADIUS);
    player.y = clamp(newY, TANK_RADIUS, MAP_HEIGHT - TANK_RADIUS);

    // Colisión con obstáculos estáticos del mapa
    for (const obstacle of state.obstacles) {
      if (circleOverlapsRect(player.x, player.y, TANK_RADIUS, obstacle)) {
        // Revertir al último frame válido
        player.x = player.prevX;
        player.y = player.prevY;
        break;
      }
    }

    player.prevX = player.x;
    player.prevY = player.y;
    player.aimAngle = input.mouseAngle;
  }
}
```

---

## 3. Lógica de la linterna

El cono de luz **se renderiza exclusivamente en el cliente**. El servidor solo mantiene el estado `lightOn` para incluirlo en el snapshot.

```typescript
// En processInputQueue:
if (input.toggleLight) {
  player.lightOn = !player.lightOn;
}
```

**Apagón (Blackout)**: cuando el poder Apagón está activo (`state.blackoutUntil > now`), el servidor fuerza `lightOn = false` en todos los jugadores dentro del snapshot, independientemente del estado real. Al expirar, se restaura el estado previo.

```typescript
// En buildSnapshot:
const lightOn = state.blackoutActive
  ? false
  : player.lightOn;
```

El servidor **no calcula** visibilidad, oclusión ni raycasting. Esa lógica vive en el cliente.

---

## 4. Lógica del mazo

### Validaciones previas

Antes de aplicar un mazo, el servidor verifica (en orden):

1. El atacante no está stunned ni muerto
2. `now >= attacker.maceCooldownEnd` (cooldown 12s)
3. El atacante **no es portador de la bandera** (`!attacker.hasFlag`)
4. Existe un objetivo en rango (distancia centro-a-centro ≤ `MACE_RANGE = 80px`)
5. El objetivo no tiene Escudo de Mazo activo (`!target.hasMaceShield`)
6. El objetivo no está en invencibilidad post-stun (`now >= target.maceInvincibilityEnd`)

### Aplicación del mazo

```typescript
function applyMace(state: ServerGameState, attacker: ServerPlayer, target: ServerPlayer, now: number): void {
  // Cooldown del atacante
  attacker.maceCooldownEnd = now + MACE_COOLDOWN_MS; // 12000ms

  // Duración del stun según nivel del objetivo
  const stunDuration = target.level >= 8
    ? MACE_STUN_LEVEL8_MS  // 3000ms
    : MACE_STUN_MS;        // 5000ms

  // Contramazo: nivel 10+ stunea al atacante 2s
  if (target.level >= 10) {
    attacker.isStunned   = true;
    attacker.stunUntil   = now + 2000;
  }

  // Stun del objetivo
  target.isStunned             = true;
  target.stunUntil             = now + stunDuration;
  target.maceInvincibilityEnd  = now + MACE_INVINCIBILITY_MS; // 3000ms post-stun

  // Bajar nivel (mínimo 1)
  target.level = Math.max(1, target.level - 1);
  applyLevelBenefits(target);

  // Soltar la bandera si el objetivo la llevaba
  if (target.hasFlag) {
    dropFlag(state, target, 'maced');
  }

  // Puntuación al atacante
  attacker.score += SCORE_MACE_HIT; // 10
  checkLevelUp(attacker);

  // Emitir eventos
  emitToRoom(state.roomId, 'mace_hit', { attackerId: attacker.id, targetId: target.id, targetLevel: target.level });
  emitToRoom(state.roomId, 'player_stunned', { playerId: target.id, duration: stunDuration });
  if (attacker.level !== attacker.prevLevel) {
    emitToRoom(state.roomId, 'level_up', { playerId: attacker.id, newLevel: attacker.level, benefit: getLevelBenefit(attacker.level) });
  }
  emitToRoom(state.roomId, 'level_down', { playerId: target.id, newLevel: target.level });
}
```

### Supermazo

Si el atacante tiene `superMaceCharges > 0`, el stun que aplica dura el doble (`× 2`) y consume una carga. Si ambas cargas están disponibles y el primer mazo conecta, la segunda carga queda disponible para el próximo input `mace: true`.

---

## 5. Trampas

Las trampas son obstáculos invisibles en el suelo que se activan cuando un jugador pasa sobre ellas a alta velocidad.

### Detección de activación

```typescript
function checkTrapCollisions(state: ServerGameState, now: number): void {
  for (const trap of state.traps.values()) {
    if (!trap.active) continue;

    for (const player of state.players.values()) {
      if (player.isDead || player.isStunned) continue;

      const dist = distance(player.x, player.y, trap.x, trap.y);
      if (dist > TANK_RADIUS + TRAP_RADIUS) continue;

      // Solo se activa si el jugador va rápido (speedFactor > 0.7)
      const input = player.pendingInput;
      if (!input || input.speedFactor <= TRAP_SPEED_THRESHOLD) continue; // 0.70

      // Aplicar trampa
      player.isStunned  = true;
      player.stunUntil  = now + TRAP_STUN_MS; // 2000ms

      if (player.hasFlag) dropFlag(state, player, 'trapped');

      trap.active      = false;
      trap.respawnAt   = now + TRAP_RESPAWN_MS; // 45000ms

      emitToRoom(state.roomId, 'trap_triggered', { playerId: player.id, trapId: trap.id });
      emitToRoom(state.roomId, 'player_stunned', { playerId: player.id, duration: TRAP_STUN_MS });
    }
  }
}
```

### Respawn de trampas

```typescript
function updateTraps(state: ServerGameState, now: number): void {
  for (const trap of state.traps.values()) {
    if (!trap.active && trap.respawnAt && now >= trap.respawnAt) {
      trap.active    = true;
      trap.respawnAt = null;
    }
  }
}
```

---

## 6. Bandera

### Pickup

Colisión circular: si la distancia entre el jugador y la bandera es ≤ `FLAG_RADIUS + TANK_RADIUS` (40px total):

```typescript
function checkFlagPickup(state: ServerGameState): void {
  if (state.flag.carriedBy !== null) return; // ya tiene portador

  for (const player of state.players.values()) {
    if (player.isDead || player.isStunned || player.isGhost) continue;

    const dist = distance(player.x, player.y, state.flag.x, state.flag.y);
    if (dist <= FLAG_RADIUS + TANK_RADIUS) {
      state.flag.carriedBy   = player.id;
      state.flag.isOnGround  = false;
      player.hasFlag         = true;
      player.score          += SCORE_FLAG_PICKUP; // 20
      checkLevelUp(player);

      emitToRoom(state.roomId, 'flag_picked', { playerId: player.id, playerName: player.username, x: state.flag.x, y: state.flag.y });
      emitToRoom(state.roomId, 'system_message', { text: `${player.username} recogió la bandera`, emoji: '🚩', type: 'flag' });
      break;
    }
  }
}
```

### Entrega

El portador entrega cuando está dentro del radio del destino (`DESTINATION_RADIUS = 80px`):

```typescript
function checkFlagDelivery(state: ServerGameState): void {
  if (!state.destination || state.flag.carriedBy === null) return;

  const carrier = state.players.get(state.flag.carriedBy);
  if (!carrier || carrier.isDead || carrier.isStunned) return;

  const dist = distance(carrier.x, carrier.y, state.destination.x, state.destination.y);
  if (dist > DESTINATION_RADIUS) return;

  // Sumar puntuación
  carrier.score += SCORE_FLAG_DELIVERY; // 100
  carrier.flagCaptures++;
  checkLevelUp(carrier);

  // Beneficio nivel 15: destino visible 3s al puntuar
  if (carrier.level === 15) {
    state.destination.visibleToAll     = true;
    state.destination.visibleUntil    = Date.now() + 3000;
  }

  emitToRoom(state.roomId, 'flag_scored', {
    playerId:      carrier.id,
    playerName:    carrier.username,
    newScore:      carrier.score,
    totalCaptures: carrier.flagCaptures,
  });

  // Resetear bandera y destino
  resetFlag(state);
  resetDestination(state);

  emitToRoom(state.roomId, 'flag_reset',       { x: state.flag.x, y: state.flag.y });
  emitToRoom(state.roomId, 'destination_reset', { x: state.destination.x, y: state.destination.y });
}
```

### Drop de bandera

Cuando el portador es maceado, cae en trampa o se desconecta:

```typescript
function dropFlag(state: ServerGameState, player: ServerPlayer, reason: DropReason): void {
  state.flag.x          = player.x;
  state.flag.y          = player.y;
  state.flag.carriedBy  = null;
  state.flag.isOnGround = true;
  player.hasFlag        = false;

  emitToRoom(state.roomId, 'flag_dropped', {
    playerId:   player.id,
    playerName: player.username,
    x:          state.flag.x,
    y:          state.flag.y,
    reason,
  });
}
```

---

## 7. Power-ups

### Spawn

```typescript
function spawnPowerUps(state: ServerGameState, now: number): void {
  if (state.powerUps.size >= MAX_POWERUPS_ON_MAP) return;          // max 4
  if (now - state.lastPowerUpSpawnAt < POWERUP_SPAWN_INTERVAL_MS) return; // 20s

  const type = pickRandomPowerUpType();
  const pos  = findValidSpawnPosition(state);
  const id   = generateId();

  state.powerUps.set(id, { id, type, x: pos.x, y: pos.y, spawnedAt: now });
  state.lastPowerUpSpawnAt = now;

  emitToRoom(state.roomId, 'power_spawned', { id, type, x: pos.x, y: pos.y });
}
```

### Pickup y efectos

```typescript
function checkPowerUpPickups(state: ServerGameState): void {
  for (const [powerId, power] of state.powerUps) {
    for (const player of state.players.values()) {
      if (player.isDead || player.isStunned) continue;

      const dist = distance(player.x, player.y, power.x, power.y);
      if (dist > TANK_RADIUS + POWERUP_RADIUS) continue;

      applyPowerUp(state, player, power);
      state.powerUps.delete(powerId);
      player.score += SCORE_POWERUP_PICKUP; // 10
      checkLevelUp(player);

      emitToRoom(state.roomId, 'power_collected', { playerId: player.id, powerType: power.type });
      break;
    }
  }
}

function applyPowerUp(state: ServerGameState, player: ServerPlayer, power: PowerUp): void {
  const now = Date.now();

  switch (power.type) {
    case 'mace_shield':
      player.hasMaceShield       = true;
      player.maceShieldExpiresAt = now + 15000; // 15s
      break;

    case 'revelation':
      // Revela posición del portador y destino a este jugador durante 10s
      player.revelationActiveUntil = now + 10000;
      break;

    case 'sprint':
      player.sprintActive        = true;
      player.sprintExpiresAt     = now + 5000;  // 5s
      break;

    case 'blackout':
      state.blackoutActive       = true;
      state.blackoutUntil        = now + 5000;  // 5s
      state.blackoutSourceId     = player.id;
      emitToRoom(state.roomId, 'blackout_start', { sourceId: player.id, duration: 5000 });
      break;

    case 'super_mace':
      player.superMaceCharges    = 2;
      break;

    case 'ghost':
      player.isGhost             = true;
      player.ghostExpiresAt      = now + 8000;  // 8s
      // Fantasma no puede recoger la bandera mientras está activo
      break;
  }
}
```

### Expiración

```typescript
function handlePowerUpExpiry(state: ServerGameState, now: number): void {
  for (const player of state.players.values()) {
    if (player.hasMaceShield    && now >= player.maceShieldExpiresAt)    player.hasMaceShield = false;
    if (player.sprintActive     && now >= player.sprintExpiresAt)         player.sprintActive  = false;
    if (player.isGhost          && now >= player.ghostExpiresAt)          player.isGhost       = false;
    if (player.isStunned        && now >= player.stunUntil)               player.isStunned     = false;
  }

  if (state.blackoutActive && now >= state.blackoutUntil) {
    state.blackoutActive = false;
    emitToRoom(state.roomId, 'blackout_end');
  }
}
```

---

## 8. Bots

Los bots usan una máquina de estados de 5 estados. Se actualizan cada tick.

```
PATROL ──────────────> SEEK_FLAG
   ^                       │
   │                       v
   │              CARRY_FLAG <──────── HUNT_CARRIER
   │                  │                      ^
   │                  v                      │
   └─────────── FLEE (HP bajo) ─────────────┘
```

### Estados y transiciones

| Estado | Condición de entrada | Comportamiento |
|--------|----------------------|----------------|
| `PATROL` | Estado inicial / sin bandera disponible | Navega a puntos de waypoint aleatorios |
| `SEEK_FLAG` | Bandera en el suelo y no hay portador | Se mueve hacia la bandera |
| `CARRY_FLAG` | El bot recogió la bandera | Se mueve hacia el destino evitando enemigos |
| `HUNT_CARRIER` | Otro jugador lleva la bandera y el bot está libre | Persigue al portador para macearlo |
| `FLEE` | El bot está siendo perseguido de cerca (nivel bajo) | Huye del enemigo más cercano |

```typescript
function updateBots(state: ServerGameState, dt: number): void {
  for (const player of state.players.values()) {
    if (!player.isBot || player.isDead || player.isStunned) continue;

    const nextState = evaluateBotState(state, player);
    if (nextState !== player.botState) {
      player.botState = nextState;
    }

    executeBotState(state, player, dt);
  }
}

function evaluateBotState(state: ServerGameState, bot: ServerPlayer): BotState {
  if (bot.hasFlag) return 'CARRY_FLAG';

  const nearbyEnemy = getClosestEnemy(state, bot, 200);
  if (nearbyEnemy && bot.level <= 3) return 'FLEE';

  if (state.flag.carriedBy && state.flag.carriedBy !== bot.id) {
    const carrier = state.players.get(state.flag.carriedBy);
    if (carrier && !carrier.isBot) return 'HUNT_CARRIER';
  }

  if (!state.flag.carriedBy) return 'SEEK_FLAG';

  return 'PATROL';
}
```

### Comportamiento por estado (simplificado)

- **PATROL**: se mueve hacia el siguiente waypoint; cambia waypoint al llegar o cada 5s
- **SEEK_FLAG**: `mouseAngle = atan2(flag.y - bot.y, flag.x - bot.x)`, `speedFactor = 0.8`
- **CARRY_FLAG**: `mouseAngle` hacia el destino, `speedFactor = 1.0`, esquiva a rivales si están a <150px
- **HUNT_CARRIER**: `mouseAngle` hacia el portador, activa `mace: true` si está a <80px y el cooldown permite
- **FLEE**: `mouseAngle = atan2(bot.y - enemy.y, bot.x - enemy.x) + pequeño jitter`, `speedFactor = 1.0`

El input sintético del bot se procesa por la misma función `processInputQueue` que el input humano, garantizando que todas las validaciones (cooldown, colisiones, etc.) apliquen igual.

---

## 9. Sistema de niveles

### checkLevelUp

Se llama después de sumar puntuación por cualquier evento (pickup, mazo, power-up, entrega).

```typescript
function checkLevelUp(player: ServerPlayer): void {
  const newLevel = computeLevelFromScore(player.score);
  if (newLevel > player.level && newLevel <= STACK_MAX) {
    player.level = newLevel;
    applyLevelBenefits(player);

    emitToRoom(player.roomId, 'level_up', {
      playerId: player.id,
      newLevel:  player.level,
      benefit:   getLevelBenefit(player.level),
    });
    emitToRoom(player.roomId, 'system_message', {
      text:  `${player.username} alcanzó nivel ${player.level}`,
      emoji: '⬆️',
      type:  'level',
    });
  }
}
```

### computeLevelFromScore (umbral lineal)

El nivel se calcula directamente del score acumulado en la sesión:

| Score mínimo | Nivel |
|-------------|-------|
| 0           | 1     |
| 30          | 2     |
| 60          | 3     |
| 100         | 4     |
| 150         | 5     |
| 210         | 6     |
| 280         | 7     |
| 360         | 8     |
| 450         | 9     |
| 550         | 10    |
| 660         | 11    |
| 780         | 12    |
| 910         | 13    |
| 1050        | 14    |
| 1200        | 15    |

> Nota: Recibir un mazo baja 1 nivel directo, independientemente del score actual.

### applyLevelBenefits

Ajusta los parámetros operativos del jugador al cambiar de nivel:

```typescript
function applyLevelBenefits(player: ServerPlayer): void {
  const config = LEVEL_CONFIG[player.level];
  player.lightRange     = config.lightRange;
  player.lightAngle     = config.lightAngle;
  player.baseSpeed      = config.speed;
  player.hasPulse       = player.level >= 6;
  player.counterMaceActive = player.level >= 10;
  player.permanentSprint   = player.level >= 12;
}
```

---

## 10. Snapshot y emisión

### buildSnapshot

```typescript
function buildSnapshot(state: ServerGameState): GameStatePayload {
  const now = Date.now();
  const blackoutActive = state.blackoutActive && now < state.blackoutUntil;

  return {
    tick: state.tick,
    players: [...state.players.values()].map(p => ({
      id:               p.id,
      username:         p.username,
      x:                p.x,
      y:                p.y,
      aimAngle:         p.aimAngle,
      lightOn:          blackoutActive ? false : p.lightOn,
      hasFlag:          p.hasFlag,
      score:            p.score,
      level:            p.level,
      isStunned:        p.isStunned,
      stunUntil:        p.stunUntil,
      isGhost:          p.isGhost,
      hasMaceShield:    p.hasMaceShield,
      sprintActive:     p.sprintActive || p.permanentSprint,
      superMaceCharges: p.superMaceCharges,
      activePowerType:  getActivePowerType(p),
      powerExpiresAt:   getActivePowerExpiry(p),
      isBot:            p.isBot,
      isDead:           p.isDead,
      maceCooldownEnd:  p.maceCooldownEnd,
    })),
    flag: {
      id:         state.flag.id,
      x:          state.flag.x,
      y:          state.flag.y,
      carriedBy:  state.flag.carriedBy,
      isOnGround: state.flag.isOnGround,
    },
    destination: state.destination
      ? {
          x:            state.destination.x,
          y:            state.destination.y,
          radius:       DESTINATION_RADIUS,
          visibleToAll: isDestinationVisibleToAll(state, now),
        }
      : null,
    powerUps: [...state.powerUps.values()].map(p => ({
      id: p.id, type: p.type, x: p.x, y: p.y,
    })),
    traps: [...state.traps.values()].map(t => ({
      id: t.id, x: t.x, y: t.y, active: t.active,
    })),
  };
}
```

### Visibilidad del destino

El destino se marca como `visibleToAll = true` si:
- Algún jugador está a ≤ `DESTINATION_GLOBAL_VISIBLE_DIST` (150px) del destino, o
- Un jugador con nivel 15 acaba de puntuar (durante 3s)

```typescript
function isDestinationVisibleToAll(state: ServerGameState, now: number): boolean {
  if (state.destination.visibleUntil && now < state.destination.visibleUntil) return true;

  for (const player of state.players.values()) {
    if (player.isDead) continue;
    const dist = distance(player.x, player.y, state.destination.x, state.destination.y);
    if (dist <= DESTINATION_GLOBAL_VISIBLE_DIST) return true;
  }
  return false;
}
```

### Emisión

```typescript
function emitGameState(state: ServerGameState, io: Server): void {
  const snapshot = buildSnapshot(state);
  io.to(state.roomId).emit('game_state', snapshot);
}
```

> No se aplica filtrado por proximidad — el mapa (2800×1867) y el máximo de 8 jugadores hacen que el payload sea manejable sin optimización adicional.
