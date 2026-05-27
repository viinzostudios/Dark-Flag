# Arquitectura General — Arena Siege Tanks

---

## Visión general del sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTE (Browser)                        │
│                                                                  │
│   ┌──────────────┐     ┌─────────────────────────────────────┐  │
│   │   Angular 18  │     │           Phaser 3.80               │  │
│   │  (UI / Lobby) │     │      (Render del juego)             │  │
│   └──────┬───────┘     └──────────────┬────────────────────── ┘  │
│          │ HTTP REST                  │ WebSocket (Socket.IO)    │
└──────────┼────────────────────────────┼──────────────────────────┘
           │                            │
           ▼                            ▼
┌──────────────────┐        ┌──────────────────────┐
│   Nginx           │        │   Nginx               │
│  (reverse proxy)  │        │  (reverse proxy)      │
└────────┬─────────┘        └──────────┬────────────┘
         │                             │
         ▼                             ▼
┌──────────────────┐        ┌──────────────────────┐
│   NestJS API     │        │   NestJS Game Server  │
│   (REST)         │        │   (Socket.IO)         │
│   Puerto: 3000   │        │   Puerto: 3001        │
└────────┬─────────┘        └──────────┬────────────┘
         │                             │
         └──────────────┬──────────────┘
                        │
               ┌────────┴────────┐
               │                 │
               ▼                 ▼
    ┌───────────────┐   ┌──────────────────┐
    │  PostgreSQL 16 │   │     Redis 7      │
    │  (persistencia)│   │  (estado, cache) │
    └───────────────┘   └──────────────────┘
```

---

## Componentes y responsabilidades

### 1. Cliente — Angular 18
**Responsabilidad**: UI fuera del juego (lobby, tienda, perfil, auth).

- Rutas: `/login`, `/register`, `/lobby`, `/shop`, `/profile`, `/game`
- Comunica con la **API REST** via HTTP para auth y datos de usuario
- Inicia y embebe la instancia de Phaser cuando el usuario entra a una partida
- Guarda el JWT en memoria o localStorage

### 2. Cliente — Phaser 3.80
**Responsabilidad**: Renderizar el juego y enviar inputs del usuario.

- Corre dentro de un componente Angular (canvas embebido)
- Comunica con el **Game Server** via WebSocket (Socket.IO)
- **No tiene lógica de juego autoritativa** — solo renderiza y predice localmente
- Recibe `game_state` del servidor y aplica interpolación + reconciliación

### 3. Nginx
**Responsabilidad**: Punto de entrada único al sistema.

- Sirve los archivos estáticos del frontend (Angular build)
- Proxy inverso hacia la API (`/api/*` → `localhost:3000`)
- Proxy inverso hacia el Game Server (`/ws/*` → `localhost:3001`)
- SSL termination en producción
- Load balancing entre instancias del game server (Fase 7)

### 4. NestJS API REST (Puerto 3000)
**Responsabilidad**: Lógica de negocio fuera del juego en tiempo real.

Módulos:
- `AuthModule` — registro, login, JWT, refresh tokens
- `UsersModule` — perfiles, estadísticas, ranking
- `EconomyModule` — moneda interna, transacciones
- `ShopModule` — catálogo de skins, compras
- `MissionsModule` — misiones diarias y semanales
- `DailyRewardModule` — recompensas diarias

### 5. NestJS Game Server (Puerto 3001)
**Responsabilidad**: Autoridad total del estado del juego en tiempo real.

Módulos:
- `RoomsModule` — crear, listar, gestionar salas de juego
- `GameModule` — game loop, estado de partida, procesamiento de inputs
- `PlayersModule` — estado de jugadores en partida
- `ProjectilesModule` — estado de proyectiles y rebotes
- `WallsModule` — estado de muros
- `RankingModule` — dominio score en tiempo real durante la partida

### 6. PostgreSQL 16
**Responsabilidad**: Persistencia de datos a largo plazo.

Tablas principales:
- `users`, `user_profiles` — cuentas de usuario
- `player_stats` — estadísticas históricas
- `game_sessions`, `game_session_players` — historial de partidas
- `skins`, `user_skins` — catálogo y posesión de skins
- `transactions` — log de todas las transacciones económicas
- `missions`, `user_missions` — sistema de misiones
- `daily_rankings`, `daily_reward_claims` — rankings y recompensas

### 7. Redis 7
**Responsabilidad**: Estado en tiempo real, caché y comunicación entre servicios.

Usos principales:
- Estado de salas de juego activas
- Ranking en tiempo real dentro de cada partida
- Buffer de inputs de jugadores
- Sesiones y tokens JWT (invalidación rápida)
- Rate limiting
- Pub/Sub entre instancias del game server

---

## Principios de diseño

### El servidor es la autoridad
Toda la lógica del juego (posiciones, colisiones, scoring) vive en el game server.
El cliente predice localmente para reducir la latencia percibida, pero el servidor siempre tiene la última palabra.

### Separación de responsabilidades
- La API REST maneja datos que NO son tiempo real (cuentas, skins, estadísticas)
- El Game Server maneja SOLO el estado de la partida en curso
- Al terminar una partida, el Game Server notifica a la API para persistir resultados

### Minimizar payload WebSocket
Solo se envían los deltas del estado (lo que cambió), no el estado completo, en partidas con muchos jugadores.

### Escalabilidad horizontal
El Game Server puede tener múltiples instancias. Redis pub/sub sincroniza el estado entre ellas.
