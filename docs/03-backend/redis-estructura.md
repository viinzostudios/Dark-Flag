# Estructura Redis — Arena Siege Tanks

> Redis 7. Todas las claves tienen prefijo por dominio.
> TTL = tiempo de vida de la clave.

---

## Convención de nombres de claves

```
{dominio}:{entidad}:{id}:{campo}
```

Ejemplos:
- `game:room:room-abc123:state`
- `auth:session:uuid-del-usuario`
- `rate:input:uuid-del-jugador`

---

## 1. Autenticación y sesiones

### Refresh tokens (validación y revocación)
```
Clave:   auth:refresh:{userId}:{tokenId}
Tipo:    String
Valor:   "valid"
TTL:     7 días
```
Al hacer logout, se borra esta clave. Al validar un refresh token, se verifica que exista.

### Rate limit de login
```
Clave:   rate:auth:{ip}
Tipo:    String (contador)
Valor:   número de intentos
TTL:     15 minutos
```
Si el contador supera 5, se rechaza el login con 429.

---

## 2. Estado del juego en tiempo real

### Estado de una sala activa
```
Clave:   game:room:{roomId}:state
Tipo:    String (JSON serializado)
Valor:   GameStateSnapshot completo
TTL:     Sin TTL mientras la partida esté activa
         Al terminar: DELETE explícito
```

> No se usa Hash para el estado del juego porque el snapshot completo se serializa y emite como una sola unidad en cada tick.

### Configuración de sala
```
Clave:   game:room:{roomId}:config
Tipo:    Hash
Campos:
  mapWidth       → "2400"
  mapHeight      → "1600"
  maxPlayers     → "20"
  tickRate       → "30"
  durationSeconds→ "300"
  createdAt      → timestamp
TTL:     Duración de la partida + 5 minutos (cleanup)
```

### Jugadores en sala (índice rápido)
```
Clave:   game:room:{roomId}:players
Tipo:    Set
Valor:   Conjunto de playerIds (userId)
TTL:     Misma que config de sala
```

### Ranking en tiempo real (dentro de partida)
```
Clave:   game:room:{roomId}:ranking
Tipo:    Sorted Set
Miembros: userId
Score:   Dominio score del jugador en la partida
TTL:     Misma que config de sala
```

Operaciones típicas:
```redis
ZADD game:room:room-abc:ranking 150 "user-uuid"      # actualizar score
ZREVRANGE game:room:room-abc:ranking 0 9 WITHSCORES  # obtener top 10
ZSCORE game:room:room-abc:ranking "user-uuid"         # score de un jugador
```

### Lista de salas disponibles
```
Clave:   game:rooms:available
Tipo:    Sorted Set
Miembros: roomId
Score:   número de jugadores actuales
TTL:     Sin TTL (se actualiza continuamente)
```

Operaciones típicas:
```redis
ZADD game:rooms:available 8 "room-abc123"          # sala con 8 jugadores
ZRANGEBYSCORE game:rooms:available 0 19            # salas con menos de 20 jugadores
ZREM game:rooms:available "room-abc123"            # al cerrar sala
```

---

## 3. Rate limiting en el juego

### Inputs de jugador
```
Clave:   rate:input:{playerId}
Tipo:    String (contador)
Valor:   número de inputs en el segundo actual
TTL:     1 segundo
```

Si supera 60, el servidor descarta el input.

---

## 4. Pub/Sub para múltiples instancias de game server

### Canal de sala
```
Canal:   pubsub:game:{roomId}
Mensajes: JSON con { type, payload }
```

Tipos de mensaje:
| type | Descripción |
|------|-------------|
| `player_input` | Input de jugador (de instancia A a instancia B) |
| `player_joined` | Nuevo jugador en sala |
| `player_left` | Jugador abandonó |
| `game_over` | Partida terminó |

### Canal del sistema
```
Canal:   pubsub:system
Mensajes: { type: 'room_created' | 'room_closed', roomId }
```

---

## 5. Caché de datos frecuentes

### Perfil de jugador en partida (para evitar queries a PostgreSQL)
```
Clave:   cache:player:{userId}:profile
Tipo:    Hash
Campos:
  username      → "TankMaster99"
  displayName   → "TankMaster"
  level         → "12"
  activeSkinId  → "uuid-o-empty"
TTL:     5 minutos
```

### Ranking global (caché del top 100)
```
Clave:   cache:ranking:daily:{date}
Tipo:    String (JSON)
Valor:   Array de top 100
TTL:     60 segundos (se regenera cada minuto)
```

---

## 6. Contadores globales

### Usuarios online
```
Clave:   stats:online_users
Tipo:    String (contador)
Valor:   número de conexiones WebSocket activas
TTL:     Sin TTL (se incrementa/decrementa en connect/disconnect)
```

### Partidas activas
```
Clave:   stats:active_rooms
Tipo:    String (contador)
TTL:     Sin TTL
```

---

## 7. Matchmaking

### Cola de matchmaking
```
Clave:   matchmaking:queue
Tipo:    List
Valor:   JSON { userId, timestamp, preferences: { mapSize } }
TTL:     Sin TTL (se procesa continuamente)
```

Operaciones:
```redis
RPUSH matchmaking:queue '{"userId":"...","timestamp":1234}'  # entra a cola
LPOP matchmaking:queue                                        # procesar siguiente
LLEN matchmaking:queue                                        # tamaño de cola
```

---

## Política de limpieza

| Clave | Cuándo se elimina |
|-------|------------------|
| `game:room:*` | Al terminar la partida (DELETE explícito en el game server) |
| `auth:refresh:*` | Por TTL natural o al hacer logout |
| `rate:*` | Por TTL natural (1s o 15min) |
| `cache:*` | Por TTL natural |
| `stats:*` | Nunca (valores siempre actualizados) |
| `matchmaking:queue` | Se vacía al procesar |

---

## Configuración de Redis

```
# redis.conf relevante para este proyecto
maxmemory 512mb
maxmemory-policy allkeys-lru   # LRU cuando se acerca al límite

# Persistencia en desarrollo: ninguna (volátil)
# Persistencia en producción: AOF (appendonly yes)
```
