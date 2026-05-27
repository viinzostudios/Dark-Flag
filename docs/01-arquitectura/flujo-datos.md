# Flujo de Datos — Arena Siege Tanks

---

## 1. Flujo de autenticación

```
Cliente (Angular)          API REST (NestJS)         PostgreSQL        Redis
     │                           │                       │               │
     │─── POST /auth/register ──>│                       │               │
     │       { email, pass }     │                       │               │
     │                           │── INSERT users ──────>│               │
     │                           │── INSERT profiles ───>│               │
     │<── 201 { user } ──────────│                       │               │
     │                           │                       │               │
     │─── POST /auth/login ─────>│                       │               │
     │       { email, pass }     │                       │               │
     │                           │── SELECT user ───────>│               │
     │                           │<── user ──────────────│               │
     │                           │── SET session:token ─────────────────>│
     │<── 200 { accessToken,     │       (TTL 7d)        │               │
     │         refreshToken } ───│                       │               │
     │                           │                       │               │
     │ [guarda tokens en memoria]│                       │               │
```

---

## 2. Flujo de entrada a partida

```
Cliente (Angular)     API REST     Game Server (Socket.IO)     Redis
     │                   │                │                      │
     │── GET /game/rooms>│                │                      │
     │<── [ lista ] ─────│                │                      │
     │                   │                │                      │
     │ [selecciona sala] │                │                      │
     │                   │                │                      │
     │─────────────── connect(ws://) ────>│                      │
     │                   │                │                      │
     │── emit join_game ─────────────────>│                      │
     │   { roomId, token }                │                      │
     │                   │                │── verify JWT ────────│
     │                   │                │   (GET session:token)│
     │                   │                │<── userId ───────────│
     │                   │                │                      │
     │                   │                │── HSET room:players ─│
     │                   │                │                      │
     │<── game_state ────────────────────│                      │
     │   (estado inicial de la sala)      │                      │
```

---

## 3. Flujo del game loop (tick a tick)

```
                    ┌────────────────────────────────────────────────┐
                    │           Game Server — cada 33ms              │
                    │                                                 │
 Cliente A          │  1. Leer inputs buffereados de Redis           │
  │                 │     GET room:{id}:inputs                        │
  │── player_input ─│─>                                              │
  │  { dir, act }  │  2. Procesar movimiento de todos los jugadores  │
                    │     pos += dir * vel * deltaTime                │
 Cliente B          │                                                 │
  │── player_input ─│─>  3. Detectar colisiones                      │
  │                 │     bala ↔ tanque, bala ↔ muro, bala ↔ borde   │
                    │                                                 │
 Cliente C          │  4. Aplicar resultados (daño, muertes, rebotes)│
  │── player_input ─│─>                                              │
  │                 │  5. Actualizar ranking en Redis                 │
                    │     ZADD room:{id}:ranking score playerId       │
                    │                                                 │
                    │  6. Construir snapshot del estado               │
                    │     { tick, players[], projectiles[], walls[] } │
                    │                                                 │
                    │  7. Emitir a todos los clientes de la sala      │
                    │     io.to(roomId).emit('game_state', snapshot)  │
                    └────────────────────────────────────────────────┘
          │                      │                      │
          ▼                      ▼                      ▼
     Cliente A               Cliente B              Cliente C
  [recibe snapshot]      [recibe snapshot]      [recibe snapshot]
  [reconcilia pos]       [interpola otros]      [interpola otros]
  [renderiza]            [renderiza]            [renderiza]
```

---

## 4. Flujo al terminar una partida

```
Game Server                 API REST              PostgreSQL
     │                          │                     │
     │ [partida termina o       │                     │
     │  tiempo agotado]         │                     │
     │                          │                     │
     │─── POST /internal/       │                     │
     │    game-results ────────>│                     │
     │    { sessionId,          │                     │
     │      players: [          │                     │
     │        { userId, kills,  │                     │
     │          deaths, score } │                     │
     │      ]}                  │                     │
     │                          │── UPDATE stats ────>│
     │                          │── INSERT session ──>│
     │                          │── UPDATE rankings ─>│
     │                          │── Award coins ─────>│
     │                          │── Check missions ──>│
     │                          │                     │
     │<── 200 OK ───────────────│                     │
     │                          │                     │
     │─── emit game_over ──────>│ (a todos los clientes)
     │    { rankings, rewards } │
```

---

## 5. Flujo de compra de skin (moneda interna)

```
Cliente (Angular)          API REST                PostgreSQL
     │                        │                        │
     │── POST /skins/:id/     │                        │
     │   purchase ───────────>│                        │
     │   Authorization: JWT   │                        │
     │                        │── SELECT wallet ──────>│
     │                        │<── { coins: 1200 } ────│
     │                        │                        │
     │                        │ [verificar precio      │
     │                        │  500 coins ≤ 1200]     │
     │                        │                        │
     │                        │── BEGIN TRANSACTION ──>│
     │                        │── UPDATE profile       │
     │                        │   coins -= 500 ───────>│
     │                        │── INSERT user_skins ──>│
     │                        │── INSERT transaction ─>│
     │                        │── COMMIT ─────────────>│
     │                        │                        │
     │<── 200 { skin, wallet }│                        │
```

---

## 6. Flujo de compra real (Stripe)

```
Cliente            API REST           Stripe            PostgreSQL
   │                  │                  │                  │
   │── POST /shop/    │                  │                  │
   │   purchase/intent│                  │                  │
   │   { packId } ───>│                  │                  │
   │                  │── create         │                  │
   │                  │   PaymentIntent ─│──────────────>   │
   │                  │<── { clientSecret│ }                │
   │<── { clientSecret│ } ──────────────│                  │
   │                  │                  │                  │
   │ [Stripe.js       │                  │                  │
   │  muestra form    │                  │                  │
   │  de tarjeta]     │                  │                  │
   │                  │                  │                  │
   │── [pago] ────────────────────────> Stripe             │
   │                  │                  │                  │
   │                  │<── webhook       │                  │
   │                  │   payment_intent │                  │
   │                  │   .succeeded     │                  │
   │                  │                  │                  │
   │                  │── acreditar ────────────────────── >│
   │                  │   premium_coins  │                  │
   │                  │                  │                  │
   │<── redirect      │                  │                  │
   │    /shop?success │                  │                  │
```
