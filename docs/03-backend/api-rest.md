# API REST — Arena Siege Tanks

> Base URL en desarrollo: `http://localhost:3000`
> Base URL en producción: `https://api.arenasiege.com`
> Todos los endpoints protegidos requieren: `Authorization: Bearer <accessToken>`

---

## Auth

### POST /auth/register
Crea una cuenta nueva.

**Body**:
```json
{
  "email": "jugador@example.com",
  "username": "TankMaster99",
  "password": "Min8chars1!"
}
```
*Reglas*: email válido, username 3–20 chars alfanumérico/guiones, password mín 8 chars con 1 número.

**Respuesta 201**:
```json
{
  "user": {
    "id": "uuid",
    "email": "jugador@example.com",
    "username": "TankMaster99"
  },
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

**Errores**:
- `400` — Validación fallida (campo inválido)
- `409` — Email o username ya en uso

---

### POST /auth/login
Inicia sesión.

**Body**:
```json
{
  "email": "jugador@example.com",
  "password": "Min8chars1!"
}
```

**Respuesta 200**:
```json
{
  "accessToken": "eyJ...",    // expira en 15 minutos
  "refreshToken": "eyJ...",   // expira en 7 días
  "user": { "id": "...", "username": "..." }
}
```

**Errores**:
- `401` — Credenciales incorrectas
- `429` — Demasiados intentos (rate limit: 5 intentos / 15 min)

---

### POST /auth/refresh
Renueva el access token usando el refresh token.

**Body**:
```json
{ "refreshToken": "eyJ..." }
```

**Respuesta 200**:
```json
{ "accessToken": "eyJ..." }
```

**Errores**:
- `401` — Refresh token inválido o expirado

---

### POST /auth/logout
Invalida el refresh token en Redis.

**Headers**: `Authorization: Bearer <accessToken>`

**Respuesta 204**: (sin body)

---

## Usuarios

### GET /users/me
Perfil completo del usuario autenticado.

**Respuesta 200**:
```json
{
  "id": "uuid",
  "email": "...",
  "username": "TankMaster99",
  "profile": {
    "displayName": "TankMaster",
    "level": 12,
    "xp": 450,
    "coins": 1200,
    "premiumCoins": 50,
    "activeSkinId": "uuid-o-null"
  }
}
```

---

### PUT /users/me
Actualiza el perfil del usuario autenticado.

**Body** (todos opcionales):
```json
{
  "displayName": "NuevoNombre",
  "activeSkinId": "uuid-de-skin"
}
```

**Respuesta 200**: Perfil actualizado.

**Errores**:
- `400` — displayName > 30 chars o activeSkinId no pertenece al usuario

---

### GET /users/:id/stats
Estadísticas públicas de un jugador.

**Respuesta 200**:
```json
{
  "userId": "uuid",
  "username": "TankMaster99",
  "totalKills": 1520,
  "totalDeaths": 342,
  "totalGames": 280,
  "bestKillStreak": 12,
  "maxDominioScore": 890,
  "totalPlaytimeSeconds": 84600
}
```

---

## Rankings

### GET /rankings/global/daily
Top 100 jugadores del día actual.

**Query params**: `?date=2026-05-01` (opcional, default hoy)

**Respuesta 200**:
```json
{
  "date": "2026-05-01",
  "rankings": [
    { "rank": 1, "userId": "uuid", "username": "...", "score": 1200, "kills": 45 },
    ...
  ]
}
```

---

### GET /rankings/global/weekly
Top 100 jugadores de la semana.

**Respuesta 200**: Igual que daily.

---

### GET /rankings/global/alltime
Top 100 jugadores de todos los tiempos (por max_dominio_score).

**Respuesta 200**: Igual estructura.

---

## Economía

### GET /economy/wallet
Saldo actual del usuario autenticado.

**Respuesta 200**:
```json
{
  "coins": 1200,
  "premiumCoins": 50
}
```

---

### POST /economy/session-reward
Acredita monedas al terminar una sesión de juego. Llamado por el cliente al salir del juego.

**Body**:
```json
{
  "kills": 7,
  "durationSeconds": 180
}
```

**Respuesta 200**:
```json
{ "coinsEarned": 55 }
```

---

### POST /economy/survival-reward
Acredita **10 gemas** al jugador que sobrevivió 15 minutos consecutivos sin morir en una partida. El game server emite el evento `survival_reward` por socket; el cliente llama este endpoint para hacer efectivo el premio.

**Rate limit**: un reclamo por usuario cada 15 minutos (validado en servidor con Map en memoria). Si el cliente intenta reclamar antes del cooldown:

**Respuesta 429**:
```json
{ "message": "Survival reward already claimed recently", "statusCode": 429 }
```

**Respuesta 200**:
```json
{ "newBalance": 60 }
```

*Solo disponible para usuarios autenticados (JWT requerido).*

---

### POST /economy/ad-reward
Acredita 50 coins al ver un anuncio rewarded.

**Respuesta 200**:
```json
{ "newBalance": 1250 }
```

---

## Skins

### GET /skins
Lista del catálogo de skins disponibles.

**Query params**:
- `?rarity=epic` — filtrar por rareza (common/rare/epic/legendary)
- `?type=tank` — filtrar por tipo (tank/trail/death_effect)
- `?available=true` — solo skins actualmente disponibles

**Respuesta 200**:
```json
{
  "skins": [
    {
      "id": "uuid",
      "name": "Golden Fury",
      "description": "...",
      "type": "tank",
      "rarity": "epic",
      "priceCoins": 1200,
      "pricePremiumCoins": 100,
      "priceReal": null,
      "imageUrl": "...",
      "isLimited": false,
      "availableUntil": null
    }
  ]
}
```

---

### GET /skins/:id
Detalle de una skin.

**Respuesta 200**: Objeto skin completo.
**Errores**: `404` — skin no existe

---

### POST /skins/:id/purchase
Comprar una skin con moneda interna.

**Body**:
```json
{ "currency": "coins" }   // "coins" o "premium_coins"
```

**Respuesta 200**:
```json
{
  "skin": { "id": "...", "name": "..." },
  "wallet": { "coins": 700, "premiumCoins": 50 }
}
```

**Errores**:
- `400` — Moneda insuficiente
- `409` — El usuario ya tiene esta skin
- `404` — Skin no existe o no disponible

---

### GET /users/me/skins
Todas las skins que posee el usuario autenticado.

**Respuesta 200**:
```json
{
  "skins": [
    { "id": "uuid", "name": "...", "rarity": "...", "type": "...", "acquiredAt": "..." }
  ]
}
```

---

## Tienda (Microtransacciones)

### GET /shop/packs
Lista de packs de monedas premium disponibles para compra real.

**Respuesta 200**:
```json
{
  "packs": [
    { "id": "starter", "name": "Starter Pack", "premiumCoins": 100, "priceUsd": 0.99, "extraPercent": 0 },
    { "id": "popular", "name": "Popular Pack", "premiumCoins": 300, "priceUsd": 2.49, "extraPercent": 20 }
  ]
}
```

---

### POST /shop/purchase/intent
Crea un Stripe PaymentIntent para iniciar el pago.

**Body**:
```json
{ "packId": "popular" }
```

**Respuesta 200**:
```json
{ "clientSecret": "pi_xxx_secret_yyy" }
```

---

### POST /stripe/webhook
Endpoint que recibe eventos de Stripe. Solo accesible por Stripe (validado con firma).

**Headers**: `stripe-signature: ...`

**Eventos manejados**:
- `payment_intent.succeeded` → acreditar premium_coins al usuario

**Respuesta 200**: `{ "received": true }`

---

## Misiones

### GET /missions/me
Misiones activas asignadas al usuario con su progreso.

**Respuesta 200**:
```json
{
  "daily": [
    {
      "id": "uuid",
      "name": "Hunter",
      "description": "Elimina 3 jugadores",
      "progress": 1,
      "goal": 3,
      "rewardCoins": 40,
      "rewardXp": 15,
      "completed": false,
      "claimed": false,
      "expiresAt": "2026-05-02T00:00:00Z"
    }
  ],
  "weekly": [ ... ]
}
```

---

### POST /missions/:id/claim
Reclamar la recompensa de una misión completada.

**Respuesta 200**:
```json
{
  "reward": { "coins": 40, "xp": 15 },
  "wallet": { "coins": 1240 },
  "profile": { "level": 12, "xp": 465 }
}
```

**Errores**:
- `400` — Misión no completada o ya reclamada

---

## Daily Reward

### GET /daily-reward/status
Estado del daily reward del usuario.

**Respuesta 200**:
```json
{
  "claimed": false,
  "streakDay": 3,
  "nextReward": { "coins": 50, "xp": 10 }
}
```

---

### POST /daily-reward/claim
Reclamar el daily reward del día.

**Respuesta 200**:
```json
{
  "reward": { "coins": 50, "xp": 10 },
  "streakDay": 3,
  "wallet": { "coins": 1250 }
}
```

**Errores**:
- `409` — Ya reclamado hoy

---

## Salas de juego (informacional)

### GET /game/rooms
Lista de salas disponibles para unirse.

**Respuesta 200**:
```json
{
  "rooms": [
    {
      "id": "room-abc123",
      "playerCount": 8,
      "maxPlayers": 20,
      "mapSize": "M",
      "status": "waiting"
    }
  ]
}
```

---

## Endpoint interno (Game Server → API)

### POST /internal/game-results
Solo accesible desde el game server (autenticado por secret key, no JWT de usuario).

**Headers**: `x-internal-secret: <INTERNAL_SECRET>`

**Body**:
```json
{
  "sessionId": "uuid",
  "roomId": "room-abc123",
  "durationSeconds": 300,
  "players": [
    {
      "userId": "uuid",
      "kills": 5,
      "deaths": 2,
      "finalScore": 150,
      "finalRank": 1,
      "durationSeconds": 295
    }
  ]
}
```

**Respuesta 200**: `{ "ok": true }`
