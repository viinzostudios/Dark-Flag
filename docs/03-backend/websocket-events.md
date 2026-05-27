# Eventos WebSocket — Dark Flag

> Protocolo: Socket.IO 4.7  
> URL Game Server: `ws://localhost:3001` (dev) / `wss://game.darkflag.io` (prod)  
> Autenticación: JWT en el payload de `join_game` (no en el handshake)  
> Tick rate: 30/s (1 tick cada ~33ms)

---

## Conexión

```typescript
// Cliente — conexión anónima, el JWT viaja en join_game
const socket = io('ws://localhost:3001');
```

Si el token enviado en `join_game` es inválido, el servidor responde con `error` y cierra la sesión.

---

## Eventos: Cliente → Servidor

### `join_game`
Solicita unirse a una partida. El servidor asigna sala automáticamente (matchmaking: primera sala con cupo, o nueva sala si no hay).

```typescript
socket.emit('join_game', {
  token:          'eyJ...',       // JWT del usuario autenticado
  username:       'PlayerOne',    // nombre visible en partida
  characterSlug:  'red-striker',  // slug del personaje equipado
  arenaSlug:      'dark-cave',    // slug del arena preferido (puede ignorarse si no hay sala)
});
```

**Respuesta del servidor**:
- `room_joined` si se asignó sala correctamente
- `error` con código `UNAUTHORIZED`, `ROOM_FULL` o `SERVER_FULL`

---

### `player_input`
Estado de input del jugador. Se emite cada frame (~30/s).  
El servidor ignora más de 60 inputs/segundo por jugador.

```typescript
socket.emit('player_input', {
  mouseAngle:   1.5708,   // ángulo hacia el cursor en radianes (0 = derecha)
  speedFactor:  0.85,     // 0.0 = quieto, 1.0 = velocidad máxima; clamp servidor-side
  mace:         false,    // true = intento de mazo este frame (edge-trigger)
  toggleLight:  false,    // true = toggle linterna este frame (edge-trigger)
  pulse:        false,    // true = activar pulso (nivel 6+, edge-trigger)
  clientTick:   1523,     // tick del cliente para reconciliación
});
```

**Notas**:
- `mace`, `toggleLight` y `pulse` son edge-trigger: el servidor hace OR-merge si el tick anterior aún no se procesó.
- `speedFactor` se clampea a `[0, 1]` en el servidor; valores fuera de rango se rechazan silenciosamente.
- El portador de la bandera (`hasFlag = true`) no puede activar `mace`.

---

### `use_pulse`
Activa el pulso de revelación (habilidad especial de nivel 6+). Sin payload.  
Cooldown en servidor: 30 segundos. El cliente no debe enviar este evento si el jugador es nivel < 6.

```typescript
socket.emit('use_pulse');
```

---

### `respawn_request`
Solicita reaparición tras muerte. Sin payload.  
El servidor ignora este evento si el jugador no está muerto.

```typescript
socket.emit('respawn_request');
```

---

### `leave_game`
El jugador abandona la partida voluntariamente. Sin payload.

```typescript
socket.emit('leave_game');
```

---

## Eventos: Servidor → Cliente

### `room_joined`
Confirmación de sala asignada. Contiene el estado inicial completo.

```typescript
socket.on('room_joined', (data: {
  roomId:   string;
  playerId: string;           // ID del jugador en esta sesión
  gameState: GameStatePayload;
  config: {
    mapWidth:  number;        // 2800
    mapHeight: number;        // 1867
    maxPlayers: number;       // 8
    tickRate:  number;        // 30
  };
}) => { ... });
```

---

### `game_state`
Snapshot completo del estado de la partida. Emitido a todos los clientes de la sala cada tick (30/s).

```typescript
socket.on('game_state', (snapshot: GameStatePayload) => { ... });
```

```typescript
interface GameStatePayload {
  tick:        number;
  players:     PlayerSnapshot[];
  flag:        FlagSnapshot;
  destination: DestinationSnapshot | null;
  powerUps:    PowerUpSnapshot[];
  traps:       TrapSnapshot[];
}

interface PlayerSnapshot {
  id:                string;
  username:          string;
  x:                 number;
  y:                 number;
  aimAngle:          number;
  lightOn:           boolean;
  hasFlag:           boolean;
  score:             number;
  level:             number;      // 1–15
  isStunned:         boolean;
  stunUntil:         number;      // timestamp ms
  isGhost:           boolean;     // power-up Fantasma activo
  hasMaceShield:     boolean;     // power-up Escudo de Mazo activo
  sprintActive:      boolean;     // power-up Sprint activo
  superMaceCharges:  number;      // 0–2 (power-up Supermazo)
  activePowerType:   string | null;
  powerExpiresAt:    number;      // timestamp ms; 0 si no hay poder activo
  isBot:             boolean;
  isDead:            boolean;
  maceCooldownEnd:   number;      // timestamp ms
}

interface FlagSnapshot {
  id:          string;
  x:           number;
  y:           number;
  carriedBy:   string | null;   // playerId o null
  isOnGround:  boolean;
}

interface DestinationSnapshot {
  x:           number;
  y:           number;
  radius:      number;          // DESTINATION_RADIUS = 80
  visibleToAll: boolean;        // true si algún jugador está a ≤150px
}

interface PowerUpSnapshot {
  id:   string;
  type: PowerUpType;            // ver enum abajo
  x:    number;
  y:    number;
}

interface TrapSnapshot {
  id:     string;
  x:      number;
  y:      number;
  active: boolean;              // false = activada, respawneando
}

type PowerUpType =
  | 'mace_shield'     // Escudo de Mazo
  | 'revelation'      // Revelación — revela portador y destino
  | 'sprint'          // Sprint — velocidad aumentada 5s
  | 'blackout'        // Apagón — apaga linternas de todos 5s
  | 'super_mace'      // Supermazo — 2 mazos potenciados
  | 'ghost';          // Fantasma — invisible 8s
```

---

### `flag_picked`
La bandera fue recogida por un jugador.

```typescript
socket.on('flag_picked', (data: {
  playerId:    string;
  playerName:  string;
  x:           number;
  y:           number;
}) => { ... });
```

---

### `flag_dropped`
La bandera fue soltada (por mazo, trampa o desconexión).

```typescript
socket.on('flag_dropped', (data: {
  playerId:   string;
  playerName: string;
  x:          number;
  y:          number;
  reason:     'maced' | 'trapped' | 'disconnect';
}) => { ... });
```

---

### `flag_scored`
El portador entregó la bandera en el destino. +100 puntos.

```typescript
socket.on('flag_scored', (data: {
  playerId:      string;
  playerName:    string;
  newScore:      number;   // score actualizado del jugador
  totalCaptures: number;   // total de entregas del jugador en esta partida
}) => { ... });
```

---

### `flag_reset`
Nueva bandera generada en el mapa tras una entrega.

```typescript
socket.on('flag_reset', (data: {
  x: number;
  y: number;
}) => { ... });
```

---

### `destination_reset`
Nuevo destino generado tras una entrega.

```typescript
socket.on('destination_reset', (data: {
  x: number;
  y: number;
}) => { ... });
```

---

### `mace_hit`
Un mazo conectó. El servidor ya aplicó stun y bajada de nivel.

```typescript
socket.on('mace_hit', (data: {
  attackerId:  string;
  targetId:    string;
  targetLevel: number;   // nivel del objetivo DESPUÉS del golpe
}) => { ... });
```

---

### `level_up`
Un jugador subió de nivel (por puntuar o recoger power-up).

```typescript
socket.on('level_up', (data: {
  playerId: string;
  newLevel: number;
  benefit:  string;   // descripción del beneficio desbloqueado, ej. "Linterna 240px, 90°"
}) => { ... });
```

---

### `level_down`
Un jugador bajó de nivel (por recibir mazo).

```typescript
socket.on('level_down', (data: {
  playerId: string;
  newLevel: number;
}) => { ... });
```

---

### `power_spawned`
Un power-up apareció en el mapa.

```typescript
socket.on('power_spawned', (data: {
  id:   string;
  type: PowerUpType;
  x:    number;
  y:    number;
}) => { ... });
```

---

### `power_collected`
Un jugador recogió un power-up.

```typescript
socket.on('power_collected', (data: {
  playerId:  string;
  powerType: PowerUpType;
}) => { ... });
```

---

### `blackout_start`
El power-up Apagón fue activado. Todas las linternas se apagan durante `duration` ms.

```typescript
socket.on('blackout_start', (data: {
  sourceId: string;   // playerId que activó el apagón
  duration: number;   // 5000ms
}) => { ... });
```

---

### `blackout_end`
El apagón terminó. Las linternas vuelven a su estado anterior. Sin payload.

```typescript
socket.on('blackout_end', () => { ... });
```

---

### `trap_triggered`
Una trampa de suelo se activó bajo un jugador.

```typescript
socket.on('trap_triggered', (data: {
  playerId: string;
  trapId:   string;
}) => { ... });
```

---

### `pulse_activated`
Un jugador activó el pulso de revelación (nivel 6+). Revela área circular de 500px.

```typescript
socket.on('pulse_activated', (data: {
  playerId: string;
  x:        number;
  y:        number;
  radius:   number;   // 500
}) => { ... });
```

---

### `system_message`
Mensaje de sistema para el feed de eventos en pantalla.

```typescript
socket.on('system_message', (data: {
  text:  string;
  emoji: string;
  type:  'flag' | 'mace' | 'level' | 'power' | 'death';
}) => { ... });
```

**Ejemplos**:
| type | emoji | text |
|------|-------|------|
| `flag`  | 🚩 | `PlayerOne recogió la bandera` |
| `flag`  | 🏁 | `PlayerOne entregó la bandera (+100)` |
| `mace`  | 🔨 | `PlayerTwo mazó a PlayerThree` |
| `level` | ⬆️ | `PlayerOne alcanzó nivel 8` |
| `power` | ⚡ | `PlayerTwo activó Apagón` |

---

### `player_stunned`
Un jugador quedó stunned (mazo o trampa).

```typescript
socket.on('player_stunned', (data: {
  playerId: string;
  duration: number;   // ms de stun: 5000, 3000 (nivel >=8) o 2000 (trampa)
}) => { ... });
```

---

### `player_respawned`
Un jugador reapareció tras ser stunned o muerto.

```typescript
socket.on('player_respawned', (data: {
  playerId: string;
  x:        number;
  y:        number;
}) => { ... });
```

---

### `error`
Error del servidor en respuesta a una acción del cliente.

```typescript
socket.on('error', (data: {
  code:    string;
  message: string;
}) => { ... });
```

| Código | Descripción |
|--------|-------------|
| `UNAUTHORIZED`   | Token inválido o expirado |
| `ROOM_FULL`      | La sala está llena (8 jugadores) |
| `SERVER_FULL`    | No hay salas disponibles |
| `ALREADY_IN_ROOM`| El jugador ya está en una sala activa |
| `RATE_LIMITED`   | Más de 60 inputs/segundo |
| `PULSE_COOLDOWN` | Pulso en cooldown |
| `MACE_COOLDOWN`  | Mazo en cooldown |

---

## Flujo completo de una partida

```
Cliente                             Servidor
  │                                    │
  │── connect() ──────────────────────>│
  │<── connection OK ──────────────────│
  │                                    │
  │── join_game { token, ... } ───────>│ valida JWT, asigna sala
  │<── room_joined { roomId, state } ──│
  │                                    │
  │  [loop de juego]                   │
  │── player_input (×30/s) ───────────>│
  │<── game_state (×30/s) ─────────────│
  │                                    │
  │  [alguien recoge la bandera]       │
  │<── flag_picked ────────────────────│
  │<── system_message ─────────────────│
  │                                    │
  │  [portador entrega bandera]        │
  │<── flag_scored ────────────────────│
  │<── level_up (si sube nivel) ───────│
  │<── flag_reset ─────────────────────│
  │<── destination_reset ──────────────│
  │                                    │
  │  [jugador recibe mazo]             │
  │<── mace_hit ───────────────────────│
  │<── player_stunned ─────────────────│
  │<── level_down ─────────────────────│
  │<── flag_dropped (si tenía bandera)─│
  │                                    │
  │── leave_game ─────────────────────>│
  │── disconnect ─────────────────────>│
```
