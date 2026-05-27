# Estructura del Proyecto — Arena Siege Tanks

> Árbol de carpetas y archivos esperados al final del desarrollo.
> Se va construyendo por fases — no todo existe desde el inicio.

---

## Raíz del proyecto

```
c:\VIINZO\Juego-AI\
├── CLAUDE.md
├── .gitignore
├── docs/
├── frontend/
├── backend/
│   ├── api/
│   └── game-server/
└── infra/
```

---

## frontend/

```
frontend/
├── package.json
├── angular.json
├── tsconfig.json
├── tsconfig.app.json
├── .eslintrc.json
├── src/
│   ├── main.ts
│   ├── index.html
│   ├── styles.scss
│   └── app/
│       ├── app.component.ts
│       ├── app.routes.ts
│       │
│       ├── core/                          # Servicios singleton globales
│       │   ├── services/
│       │   │   ├── auth.service.ts        # JWT, login, register
│       │   │   ├── game-socket.service.ts # Socket.IO al game server
│       │   │   └── api.service.ts         # HTTP base a la API REST
│       │   ├── guards/
│       │   │   └── auth.guard.ts          # Redirige a /login si no autenticado
│       │   ├── interceptors/
│       │   │   └── auth.interceptor.ts    # Añade JWT a cada HTTP request
│       │   └── models/                    # Interfaces TypeScript compartidas
│       │       ├── user.model.ts
│       │       ├── game-state.model.ts
│       │       ├── skin.model.ts
│       │       └── economy.model.ts
│       │
│       ├── auth/                          # Módulo de autenticación
│       │   ├── login/
│       │   │   └── login.component.ts
│       │   └── register/
│       │       └── register.component.ts
│       │
│       ├── lobby/                         # Sala de espera y menú principal
│       │   └── lobby.component.ts
│       │
│       ├── game/                          # Contenedor del juego Phaser
│       │   ├── game.component.ts          # Componente Angular que hostea Phaser
│       │   ├── game.config.ts             # Configuración de Phaser
│       │   │
│       │   ├── scenes/                    # Escenas de Phaser
│       │   │   ├── BootScene.ts           # Precarga de assets
│       │   │   ├── MenuScene.ts           # Menú in-game (pausa)
│       │   │   └── GameScene.ts           # Escena principal de juego
│       │   │
│       │   ├── objects/                   # GameObjects del juego
│       │   │   ├── PlayerTank.ts          # Tanque del jugador local
│       │   │   ├── RemoteTank.ts          # Tanques de otros jugadores (interpolados)
│       │   │   ├── BotTank.ts             # Bots (solo Fase 1)
│       │   │   ├── Projectile.ts          # Bala
│       │   │   └── Wall.ts                # Muro táctico
│       │   │
│       │   ├── systems/                   # Sistemas de juego (cliente)
│       │   │   ├── InputSystem.ts         # Captura de teclado y mouse
│       │   │   ├── PhysicsSystem.ts       # Rebotes y colisiones locales (solo predicción)
│       │   │   ├── InterpolationSystem.ts # Interpola posición de jugadores remotos
│       │   │   └── ReconciliationSystem.ts# Reconcilia predicción con estado del servidor
│       │   │
│       │   └── ui/                        # UI dentro de Phaser
│       │       ├── HUD.ts                 # Vida, munición, muros
│       │       ├── Leaderboard.ts         # Top 10 en partida
│       │       └── DeathScreen.ts         # Pantalla de muerte + respawn
│       │
│       ├── shop/                          # Tienda de skins
│       │   ├── shop.component.ts
│       │   ├── skin-card.component.ts
│       │   └── skin-preview.component.ts  # Mini-renderer Phaser para preview
│       │
│       └── profile/                       # Perfil y estadísticas
│           └── profile.component.ts
```

---

## backend/api/

```
backend/api/
├── package.json
├── tsconfig.json
├── nest-cli.json
├── .env                                   # Variables de entorno (NO en git)
├── .env.example                           # Template con nombres de variables
└── src/
    ├── main.ts                            # Bootstrap de la app
    ├── app.module.ts
    │
    ├── config/                            # Configuración centralizada
    │   ├── database.config.ts
    │   ├── jwt.config.ts
    │   └── app.config.ts
    │
    ├── auth/
    │   ├── auth.module.ts
    │   ├── auth.controller.ts             # /auth/register, /auth/login, etc.
    │   ├── auth.service.ts
    │   ├── strategies/
    │   │   ├── jwt.strategy.ts
    │   │   └── refresh.strategy.ts
    │   ├── guards/
    │   │   └── jwt-auth.guard.ts
    │   └── dto/
    │       ├── register.dto.ts
    │       └── login.dto.ts
    │
    ├── users/
    │   ├── users.module.ts
    │   ├── users.controller.ts            # /users/me, /users/:id/stats
    │   ├── users.service.ts
    │   ├── entities/
    │   │   ├── user.entity.ts
    │   │   └── user-profile.entity.ts
    │   └── dto/
    │       └── update-profile.dto.ts
    │
    ├── stats/
    │   ├── stats.module.ts
    │   ├── stats.controller.ts            # /stats, /rankings
    │   ├── stats.service.ts
    │   └── entities/
    │       ├── player-stats.entity.ts
    │       └── daily-ranking.entity.ts
    │
    ├── economy/
    │   ├── economy.module.ts
    │   ├── economy.controller.ts          # /economy/wallet
    │   ├── economy.service.ts
    │   └── entities/
    │       └── transaction.entity.ts
    │
    ├── skins/
    │   ├── skins.module.ts
    │   ├── skins.controller.ts            # /skins, /skins/:id/purchase
    │   ├── skins.service.ts
    │   └── entities/
    │       ├── skin.entity.ts
    │       └── user-skin.entity.ts
    │
    ├── shop/
    │   ├── shop.module.ts
    │   ├── shop.controller.ts             # /shop/packs, /shop/purchase
    │   └── shop.service.ts
    │
    ├── missions/
    │   ├── missions.module.ts
    │   ├── missions.controller.ts         # /missions, /missions/:id/claim
    │   ├── missions.service.ts
    │   └── entities/
    │       ├── mission.entity.ts
    │       └── user-mission.entity.ts
    │
    ├── daily-reward/
    │   ├── daily-reward.module.ts
    │   ├── daily-reward.controller.ts     # /daily-reward/status, /claim
    │   ├── daily-reward.service.ts
    │   └── entities/
    │       └── daily-reward-claim.entity.ts
    │
    ├── stripe/
    │   ├── stripe.module.ts
    │   └── stripe.controller.ts           # /stripe/webhook
    │
    └── database/
        └── migrations/                    # Migraciones TypeORM
```

---

## backend/game-server/

```
backend/game-server/
├── package.json
├── tsconfig.json
├── nest-cli.json
├── .env
└── src/
    ├── main.ts
    ├── app.module.ts
    │
    ├── rooms/
    │   ├── rooms.module.ts
    │   ├── rooms.service.ts               # Crear, listar, cerrar salas
    │   └── room.model.ts                  # Interfaz de sala
    │
    ├── game/
    │   ├── game.module.ts
    │   ├── game.gateway.ts                # Socket.IO — manejo de eventos WS
    │   ├── game-loop.service.ts           # Loop a 30 ticks/s
    │   ├── game-state.service.ts          # Estado completo de la partida
    │   └── models/
    │       ├── game-state.model.ts        # Interfaz del estado completo
    │       ├── player.model.ts
    │       ├── projectile.model.ts
    │       └── wall.model.ts
    │
    ├── physics/
    │   ├── physics.module.ts
    │   ├── collision.service.ts           # Detección de colisiones
    │   └── bounce.service.ts              # Cálculo de rebotes
    │
    ├── ranking/
    │   ├── ranking.module.ts
    │   └── ranking.service.ts             # Dominio score en Redis
    │
    └── events/
        ├── client-events.ts               # Tipos de eventos cliente→servidor
        └── server-events.ts               # Tipos de eventos servidor→cliente
```

---

## infra/

```
infra/
├── docker-compose.yml                     # Todos los servicios
├── docker-compose.prod.yml                # Override para producción
├── .env.example                           # Template de variables de entorno
└── nginx/
    ├── nginx.conf                         # Configuración principal
    └── conf.d/
        └── game.conf                      # Virtual host del juego
```
