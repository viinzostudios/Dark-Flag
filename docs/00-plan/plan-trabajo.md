# Plan de Trabajo — Dark Flag

> Plan completo de implementación del juego Dark Flag.
> Reemplaza el plan anterior (Arena Siege Tanks).
> Estado: [ ] pendiente | [x] completado | [~] en progreso

---

## Resumen del juego

**Dark Flag** es un juego web multijugador FFA (todos contra todos) en arena oscura.
Los jugadores exploran con linternas, encuentran una bandera oculta y la llevan a un destino desconocido.
Sistema de niveles (1–15), mazos manuales contra cualquier rival, trampas ocultas y power-ups.
Sesión infinita sin salir de la sala. Stack: Angular 19 + Phaser 4.1 + NestJS + Socket.IO + PostgreSQL + Redis.

---

## FASE 0 — Repositorio, Nombre y Documentación Base

### F0.1 Nuevo repositorio Git
- [ ] Crear repositorio `Dark-Flag` (o `viinzo-dark-flag`) en GitHub (viinzostudios)
- [ ] Cambiar remote: `git remote set-url origin https://github.com/viinzostudios/Dark-Flag.git`
- [ ] Push inicial: `git push -u origin master`
- [ ] Archivar o borrar el repo `Arena-Siege-Tanks` en GitHub si se desea

**Done cuando**: `git remote -v` muestra el nuevo repo y el push es exitoso.

---

### F0.2 Actualizar CLAUDE.md
- [ ] Cambiar nombre del proyecto de "Arena Siege Tanks" a "Dark Flag"
- [ ] Actualizar descripción del juego
- [ ] Actualizar directorio raíz (era `c:\VIINZO\Juego-AI`, corregir a `c:\VIINZO\Juego-AI-Social`)
- [ ] Mantener todas las demás reglas sin cambio (stack, permisos, convenciones)

**Archivos**: `CLAUDE.md`

---

### F0.3 Documentación core reescrita
- [x] `docs/02-game-design/GDD.md` — Dark Flag GDD completo
- [x] `docs/02-game-design/mecanicas-core.md` — Especificación técnica Dark Flag
- [x] `docs/08-assets/estilo-grafico.md` — Guía de estilo Dark Flag
- [ ] `docs/README.md` — Actualizar índice (referencias a tanques eliminadas, nuevas secciones)
- [ ] `docs/02-game-design/economia-juego.md` — Actualizar economía (mismas monedas, nuevos contextos de recompensa)
- [ ] `docs/03-backend/websocket-events.md` — Nuevos eventos Dark Flag (flag_picked, mace_hit, etc.)
- [ ] `docs/03-backend/game-loop.md` — Game loop Dark Flag (tick, linterna, mazo, trampas, power-ups)
- [ ] `docs/03-backend/schemas-bd.md` — Schemas actualizados (stats con flag_captures, maces, etc.)
- [ ] `docs/04-frontend/phaser-scenes.md` — Escenas Phaser Dark Flag
- [ ] `docs/04-frontend/controles-input.md` — Controles Dark Flag (cursor + spacebar + mazo)

**Nota**: Los docs de arquitectura (`01-arquitectura/`), infra (`05-infra/`), monetización (`06-monetizacion/`), seguridad (`07-seguridad/`) se mantienen sin cambio o con ajustes menores.

---

## FASE 1 — Rediseño Visual Completo (UI/UX)

> Todas las vistas HTML existentes se rediseñan con la nueva paleta y estética de Dark Flag.
> Prioridad: mobile-first. Verificar en móvil Y desktop.

### Sistema de diseño (nuevo)

| Token | Valor |
|-------|-------|
| `--bg-base` | `#080810` |
| `--bg-surface` | `#12132a` |
| `--bg-elevated` | `#1c1d3e` |
| `--brand-primary` | `#7c3aed` (morado) |
| `--brand-secondary` | `#06b6d4` (teal) |
| `--accent-flag` | `#f59e0b` (ámbar — color de bandera) |
| `--accent-danger` | `#ef4444` (rojo — mazo/stun) |
| `--text-primary` | `#f8fafc` |
| `--text-secondary` | `#94a3b8` |
| `--border` | `#2d2f5e` |

### F1.1 Landing page
- [ ] Fondo oscuro animado: partículas de luz flotantes + grid sutil oscuro
- [ ] Hero: imagen generada con IA (Lampers — personajes originales del juego — con linternas en oscuridad)
- [ ] Título "DARK FLAG" con gradiente morado→teal, efecto glow
- [ ] Tagline: "Explora la oscuridad. Encuentra la bandera. Escapa de todos."
- [ ] Botón "JUGAR AHORA" → `/lobby` (paleta morado, animación pulso)
- [ ] CTAs secundarios: "Iniciar sesión" / "Registrarse"
- [ ] Sección de features: 3 pills (🔦 Oscuridad total · ⚡ Mazo vs todos · 🏆 15 niveles)
- [ ] Sin scroll (hero full-screen en desktop); en móvil: scroll suave
- [ ] Remover TODAS las referencias a tanques, balas, Arena Siege Tanks

**Archivos**: `frontend/src/app/landing/landing.component.ts`
**Done cuando**: La landing carga en 375px y 1440px sin overflow, botón lleva al lobby.

---

### F1.2 Pantallas de Auth (Login + Register)
- [ ] Mismo fondo animado oscuro que la landing (blob oscuros, no verdes)
- [ ] Card glassmorphism con border morado sutil
- [ ] Inputs con focus morado (replace verde actual)
- [ ] Submit button: gradiente morado→teal
- [ ] Logo/ícono de linterna encima del formulario
- [ ] Botón "← Volver" a la landing

**Archivos**: `frontend/src/app/auth/login/login.component.ts`, `frontend/src/app/auth/register/register.component.ts`

---

### F1.3 Lobby
- [ ] Fondo oscuro con efecto de linterna ambiental (halo de luz suave)
- [ ] Card del jugador: avatar + nombre + nivel + puntos de sesión actual
- [ ] Preview de skin del personaje (figura Among Us-style con el skin equipado)
- [ ] Selector de arena (8 opciones con thumbnails oscuros)
- [ ] Botón "BUSCAR PARTIDA" prominente (morado con pulso)
- [ ] Botón "Rankings" (teal)
- [ ] Panel de niveles (qué gana en cada nivel 1-15)
- [ ] Notificación de partida encontrada con overlay de carga oscuro
- [ ] Mobile: bottom nav con los botones principales

**Archivos**: `frontend/src/app/lobby/lobby.component.ts`

---

### F1.4 Shop
- [ ] Tabs de sección: Personajes / Avatares / Escenarios / Paquetes
- [ ] Cards de personaje/skin: preview de la figura Among Us-style con el skin
- [ ] Cards de arena: thumbnail oscuro del escenario
- [ ] Cards de paquetes: mismo layout actual pero con paleta oscura
- [ ] Botón de compra: ámbar/dorado (replace verde)
- [ ] Modal de preview: fondo completamente oscuro + figura con linterna encendida

**Archivos**: `frontend/src/app/shop/shop.component.ts`

---

### F1.5 Game overlays (Angular sobre Phaser)
- [ ] **DeathOverlay**: "Fuiste noqueado" en lugar de "Moriste". Timer de respawn. Opción ver anuncio.
- [ ] **PreEntryOverlay**: "¡Listo para explorar!" con instrucciones básicas (cursor + spacebar + mazo)
- [ ] **LevelUpOverlay**: notificación toast al subir de nivel (qué ganaste en este nivel)
- [ ] **LevelDownOverlay**: notificación toast al bajar de nivel (ámbar/rojo)
- [ ] **FlagNotification**: banner top-center con los mensajes globales del sistema

**Archivos**: `frontend/src/app/game/` (overlays existentes + nuevos)

---

### F1.6 HUD (dentro de Phaser)
- [ ] Nivel: número grande centro-abajo con aura de color según nivel (blanco → ámbar → morado)
- [ ] Puntuación: arriba-izquierda con ícono de banderin
- [ ] Leaderboard: derecha, top 8 con nombre + puntos, mi fila siempre visible
- [ ] Cooldown de mazo: barra circular llena en 12s, centro-abajo
- [ ] Power-up activo: ícono + barra de progreso, abajo-derecha
- [ ] Indicador de bandera: "🏳️ Llevás la bandera" arriba-centro (solo cuando aplica)
- [ ] Mini-mapa: abajo-izquierda, mostrar: mapa + obstáculos + tu posición + portador de bandera

**Archivos**: `frontend/src/app/game/ui/HUD.ts` (reescritura completa)

---

## FASE 2 — Backend: Game Core

### F2.1 Modelos de estado del juego
- [ ] Reemplazar `ServerPlayerState` con campos Dark Flag:
  - Eliminar: `ammo`, `wallCharges`, `activePower`, `hasToxicShot`, `isInvisible`, `isLeader`, `killsAtMaxLevel`
  - Agregar: `hasFlag`, `lightOn`, `maceCooldownEnd`, `stunUntil`, `invincibleUntil`, `hasMaceShield`, `sprintActive`, `isGhost`, `superMaceCharges`, `activePowerType`
- [ ] Nueva interfaz `ServerFlagState`: `{ id, x, y, carriedBy, lastCarrierId, droppedAt, isOnGround, firstIlluminatedBy }`
- [ ] Nueva interfaz `ServerDestinationState`: `{ x, y, radius }`
- [ ] Nueva interfaz `ServerTrapState`: `{ id, x, y, active, respawnAt }`
- [ ] Nueva interfaz `ServerPowerUpState`: `{ id, type, x, y }`
- [ ] Actualizar `ServerGameState`: agregar `flag`, `destination`, `traps`, `powerUps`; eliminar `projectiles`, `walls`
- [ ] `PlayerSnapshot`: actualizar con campos Dark Flag (eliminar bullet/wall snapshots)
- [ ] `GameStatePayload`: actualizar para incluir `flag`, `destination`, `powerUps` en cada tick

**Archivos**: `backend/game-server/src/game/models/game-state.model.ts`
**Done cuando**: TypeScript compila sin errores con los nuevos tipos.

---

### F2.2 Game Loop — lógica Dark Flag
- [ ] Eliminar: `moveProjectiles`, `handleBulletWallCollision`, `handleBulletTankCollision`, `resolveTankCollisions`, `handlePowerUpSpawn`, `handlePowerExpiry`, `generateObstacles` (bullet/wall logic)
- [ ] Implementar: `checkFlagPickup(state)` — colisión jugador con bandera en suelo
- [ ] Implementar: `checkFlagDelivery(state)` — portador dentro del radio del destino
- [ ] Implementar: `processMace(attacker, state, now)` — lógica completa del mazo
- [ ] Implementar: `checkTrapCollisions(state, now)` — trampas + speed check
- [ ] Implementar: `spawnPowerUps(state, now)` — Dark Flag power-ups (6 tipos nuevos)
- [ ] Implementar: `checkPowerUpPickups(state, now)` — recoger power-ups
- [ ] Implementar: `handlePowerUpExpiry(state, now)` — expirar sprint, ghost, blackout, etc.
- [ ] Implementar: `updateTraps(state, now)` — respawn de trampas
- [ ] Implementar: `spawnFlag(state)` y `spawnDestination(state)` — posiciones aleatorias válidas
- [ ] Implementar: `illuminationCheck(state)` — detectar quién iluminó la bandera primero
- [ ] Actualizar `buildSnapshot(state)` para incluir nuevos campos
- [ ] Mantener: `processMovement`, `updateLeader` (obsoleto → eliminar), `resolveTankCollisions` adaptado (sin daño, mismo empuje)
- [ ] Game loop tick (30/s): movimiento → mazo → trampas → bandera → power-ups → snapshot → emit

**Archivos**: `backend/game-server/src/game/services/game-loop.service.ts`
**Done cuando**: El servidor arranca, crea una sala, genera bandera y trampas, y el tick corre a 30fps sin errores.

---

### F2.3 WebSocket events — nuevos eventos
- [ ] Eliminar eventos: `player_shot`, `wall_placed`, `projectile_update`, `power_up_spawned` (el tipo antiguo)
- [ ] Agregar eventos servidor → cliente:
  - `flag_picked { playerId, playerName, x, y }` — alguien recogió la bandera
  - `flag_dropped { playerId, playerName, x, y, reason: 'maced'|'trapped' }` — bandera soltada
  - `flag_scored { playerId, playerName, newScore, totalCaptures }` — alguien entregó la bandera
  - `flag_reset { x, y }` — nueva bandera generada
  - `destination_reset { x, y }` — nuevo destino generado
  - `mace_hit { attackerId, targetId, targetLevel }` — mazo conectó
  - `level_up { playerId, newLevel }` — jugador subió de nivel
  - `level_down { playerId, newLevel }` — jugador bajó de nivel
  - `power_spawned { powerUp: PowerUpSnapshot }` — nuevo power-up en mapa
  - `power_collected { playerId, powerType }` — power-up recogido
  - `blackout_start { sourceId, duration }` — Apagón activado
  - `trap_triggered { playerId, trapId }` — trampa activada
  - `system_message { text, emoji }` — notificaciones globales (chat del sistema)
- [ ] Agregar eventos cliente → servidor:
  - `player_input` — actualizar con nuevos campos (`mace`, `toggleLight`, sin `shoot`, sin `placeWall`)
  - `use_pulse` — activar habilidad Pulso (nivel 6)

**Archivos**: `backend/game-server/src/game/game.gateway.ts`, `frontend/src/app/core/services/game-socket.service.ts`

---

### F2.4 Bot AI — comportamiento Dark Flag
- [ ] Máquina de estados: `PATROL → SEEK_FLAG → CARRY_FLAG → HUNT_CARRIER → FLEE`
- [ ] PATROL: moverse aleatoriamente, girar linterna cada 2s
- [ ] SEEK_FLAG: moverse hacia la posición conocida de la bandera (si hay en campo)
- [ ] CARRY_FLAG: moverse en la dirección del destino (conocida para el bot)
- [ ] HUNT_CARRIER: moverse hacia el portador de bandera para mazear
- [ ] FLEE: si tiene la bandera y hay rivales cerca, intentar esquivar
- [ ] Recoger power-ups automáticamente si pasan cerca (radio 100px)
- [ ] Usar Pulso cada 20s para revelar área
- [ ] Sin proyectiles ni muros que gestionar

**Archivos**: `backend/game-server/src/game/services/game-loop.service.ts` (función `updateBots`)

---

### F2.5 Salas y config
- [ ] Eliminar `BOT_COUNT` de disparos y muros de la config
- [ ] Agregar a `RoomConfig`: `trapCount`, `powerUpSpawnInterval`
- [ ] El game state inicial genera bandera, destino y trampas al crear la sala
- [ ] Mantener sala max 4 jugadores por defecto, configurable

**Archivos**: `backend/game-server/src/rooms/rooms.service.ts`, `backend/game-server/src/game/game.gateway.ts`

---

### F2.6 Base de datos nueva — Dark Flag

> La base de datos de Dark Flag es completamente nueva y separada de Arena Siege Tanks.
> No modificar la BD del juego original. Crear una BD fresca desde cero.

**Aislamiento del juego original:**
- [ ] Crear nueva base de datos PostgreSQL: `dark_flag` (la de Arena Siege Tanks se llama `game_db` o `arena_siege`)
- [ ] Actualizar `backend/api/.env` y `infra/.env`: cambiar `DB_NAME=dark_flag`
- [ ] El juego original sigue intacto en su propio repo y BD — no tocar

**Desactivar synchronize en TypeORM (producción):**
- [ ] Cambiar `synchronize: true` → `false` en `TypeOrmModule.forRoot()`
- [ ] Toda la estructura se crea con migraciones explícitas (no auto-sync)

**Tablas que se mantienen igual (solo cambiar el nombre de DB):**
| Tabla | Estado |
|-------|--------|
| `users` | Sin cambio |
| `refresh_tokens` | Sin cambio |
| `daily_rewards` | Sin cambio |
| `transactions` | Sin cambio |
| `avatars` | Sin cambio (reutilizamos los 20 avatares) |
| `user_avatars` | Sin cambio |

**Tablas que cambian (renombrar / re-estructurar):**
| Tabla original | Tabla Dark Flag | Cambio |
|---------------|----------------|--------|
| `skins` | `characters` | Renombrar. Columnas: `id`, `slug`, `name`, `bodyColor`, `visitorColor`, `rarity`, `priceCoins`, `gemPrice`, `sortOrder`, `matchesUnlock`, `isDefault` |
| `user_skins` | `user_characters` | Renombrar. Columnas: `id`, `userId`, `characterId`, `equippedAt`, `unlockedAt` |
| `user_profiles` | `user_profiles` | Cambiar `activeSkinId` → `activeCharacterId`, eliminar columnas de tanque |

**Tablas nuevas Dark Flag:**
| Tabla | Descripción |
|-------|-------------|
| `arenas` | 8 escenarios: `id`, `slug`, `name`, `description`, `priceCoins`, `isDefault`, `sortOrder` |
| `user_arenas` | Arenas desbloqueadas por usuario |

**Tablas con schema re-definido:**
- `player_stats`: eliminar `kills`, `deaths`, `walls_placed`, `bullets_fired`. Agregar: `flag_captures`, `flag_pickups`, `maces_landed`, `maces_received`, `level_15_reached`, `best_score_session`, `best_level_reached`, `traps_triggered`, `play_seconds`
- `missions` / `player_missions`: seed nuevo con tipos Dark Flag (`flag_captures`, `maces_landed`, `score_total`, `powerups_collected`, `level_reached`)
- `match_history`: `id`, `userId`, `score`, `flag_captures`, `maces_landed`, `best_level`, `duration_seconds`, `played_at`

**Migraciones TypeORM a crear:**
- [ ] `CreateUsersTable` — tabla users
- [ ] `CreateUserProfilesTable` — con `activeCharacterId`
- [ ] `CreateRefreshTokensTable`
- [ ] `CreateTransactionsTable`
- [ ] `CreateDailyRewardsTable`
- [ ] `CreatePlayerStatsTable` — schema Dark Flag
- [ ] `CreateMissionsTable` + `CreatePlayerMissionsTable`
- [ ] `CreateCharactersTable` + `CreateUserCharactersTable`
- [ ] `CreateAvatarsTable` + `CreateUserAvatarsTable`
- [ ] `CreateArenasTable` + `CreateUserArenasTable`
- [ ] `CreateMatchHistoryTable`

**Seeders (OnModuleInit):**
- [ ] 100 personajes/skins base (40 comunes, 30 raras, 20 épicas, 10 legendarias)
- [ ] 8 arenas (`space-station`, `sewers`, `mansion`, `cyberpunk`, `arctic`, `volcanic`, `forest`, `temple`)
- [ ] Misiones Dark Flag (10 misiones iniciales)
- [ ] 200 avatares (reutilizados de Arena Siege Tanks — mismos slugs)

**Comando de setup inicial (desarrollo):**
```bash
# Crear la DB
docker exec -it infra-postgres-1 psql -U postgres -c "CREATE DATABASE dark_flag;"
# Correr migraciones
npm run migration:run --prefix backend/api
# Correr seeders (arrancar la API en modo dev)
npm run start:dev --prefix backend/api
```

**Archivos**: `backend/api/src/migrations/`, `infra/.env`, `backend/api/src/app.module.ts`
**Done cuando**: `npm run migration:run` crea todas las tablas sin errores y los seeders populan personajes, arenas y misiones.

---

## FASE 3 — Frontend: Phaser Dark Flag

### F3.1 Dark rendering pipeline
- [ ] `GameScene.create()`: fondo completamente negro (`#000000`)
- [ ] Implementar sistema de visibilidad: cada frame, renderizar solo las zonas iluminadas
- [ ] **Faro central**: círculo de 300px siempre iluminado (alpha overlay con agujero)
- [ ] Técnica: renderizar overlay negro sobre todo el mapa, luego "perforar" con los conos de linterna de cada jugador (Phaser RenderTexture o WebGL mask)

**Archivos**: `frontend/src/app/game/scenes/GameScene.ts`
**Done cuando**: El mapa es oscuro, el faro es visible, el personaje del jugador ilumina con su cono.

---

### F3.2 Flashlight cones con sombras (raycasting)
- [ ] Implementar raycasting 2D para calcular el polígono de visibilidad desde la posición del jugador
- [ ] Para cada obstáculo: calcular los 2 vértices extremos desde el punto de vista del jugador
- [ ] Construir el polígono de visibilidad con los segmentos de borde + los vértices de obstáculos visibles
- [ ] Renderizar el polígono como máscara de luz (Phaser Graphics, modo ADD o SCREEN blend)
- [ ] El cono tiene ángulo y rango determinados por el nivel del jugador
- [ ] Linterna apagada: no renderizar el cono del jugador (solo ves el faro y nada más)
- [ ] Otros jugadores: sus conos también se renderizan (ves lo que ellos iluminan)

**Archivos**: `frontend/src/app/game/utils/RayCaster.ts` (nuevo), `frontend/src/app/game/scenes/GameScene.ts`
**Nota técnica**: El raycasting se hace en el cliente para cada jugador local + los demás cuya posición se conoce. Complejidad O(N×M) donde N = jugadores y M = obstáculos.

---

### F3.3 Personaje Dark Flag (DarkFlagPlayer)
- [ ] Clase `DarkFlagPlayer` — reemplaza `BaseTank` y `PlayerTank`
- [ ] Sprite: figura estilo Among Us (placeholder: Phaser Graphics ovalado con visor hasta que haya assets)
- [ ] Sin cañón visible — el cono de linterna es la dirección
- [ ] Animación de mazo: brief flash/shake en el objetivo cuando conecta
- [ ] Animación de stun: efecto "mareado" (estrellas o rotación) sobre la cabeza
- [ ] Aura por nivel: sin aura (1-9), aura ámbar suave (10-14), aura morada intensa (15)
- [ ] Si hasFlag: ícono de bandera flotando sobre el personaje
- [ ] Si isGhost: alpha 0.3 (para el local), invisible para RemotePlayer

**Archivos**: `frontend/src/app/game/objects/DarkFlagPlayer.ts` (nuevo), renombrar/eliminar `BaseTank.ts`, `PlayerTank.ts`

---

### F3.4 RemoteDarkFlagPlayer
- [ ] Clase `RemoteDarkFlagPlayer` — reemplaza `RemoteTank`
- [ ] Misma figura que el player local pero con nombre encima
- [ ] Si `isGhost`: no se renderiza el haz de linterna; figura al 30% opacidad
- [ ] Interpolación de posición (buffer de 3 estados, igual que antes)

**Archivos**: `frontend/src/app/game/objects/RemoteDarkFlagPlayer.ts` (nuevo)

---

### F3.5 Objetos del juego
- [ ] `FlagObject` — bandera en el suelo: círculo ámbar pulsante, solo visible bajo linterna
- [ ] `DestinationZone` — zona destino: círculo teal pulsante, visible solo al portador o cuando está a 150px de él
- [ ] `TrapObject` — trampa: marca sutil en el suelo, invisible hasta 40px de linterna
- [ ] `PowerUpObject` — 6 variantes con colores e íconos distintos (usando Phaser Graphics hasta tener assets)
- [ ] `FaroLight` — círculo central siempre iluminado (no es un objeto pickeable, solo visual)

**Archivos**: `frontend/src/app/game/objects/` (nuevos archivos por objeto)

---

### F3.6 Mazo mechanic (cliente)
- [ ] Click izquierdo / tecla Q → emitir input con `mace: true` si en rango de algún rival
- [ ] Visual de rango del mazo: círculo semitransparente alrededor del jugador que pulsa cuando hay target en rango
- [ ] Feedback al mazear: flash blanco + sfx + shake de cámara suave
- [ ] En móvil: botón de mazo en pantalla (abajo-derecha)
- [ ] El portador de bandera no ve el botón de mazo activo

**Archivos**: `frontend/src/app/game/scenes/GameScene.ts`, `frontend/src/app/game/objects/DarkFlagPlayer.ts`

---

### F3.7 Sistema de niveles visual
- [ ] Al subir de nivel: toast animado "Nivel X — [beneficio ganado]"
- [ ] Al bajar de nivel: toast ámbar "Nivel X — ¡Cuidado!"
- [ ] El número de nivel en HUD se anima (scale bounce) al cambiar
- [ ] Auras: ninguna (1-9), ámbar `#f59e0b` (10-14), morada intensa `#7c3aed` (15)
- [ ] Color de la linterna cambia sutilmente por nivel: blanco (1-4), azul-blanco (5-9), ámbar (10-14), morado-blanco (15)

---

### F3.8 Mini-mapa
- [ ] Renderizado en una RenderTexture de Phaser (80×80px) en esquina inferior-izquierda
- [ ] Muestra: contorno del mapa, obstáculos (puntos gris oscuro), faro central (punto blanco)
- [ ] Tu posición: punto morado
- [ ] Portador de bandera: punto ámbar pulsante (desaparece con Apagón o Fantasma)
- [ ] Actualización: cada 3 ticks (no cada frame)

**Archivos**: `frontend/src/app/game/ui/MiniMap.ts` (nuevo)

---

### F3.9 Audio — nuevo tema Dark Flag
- [ ] `AudioManager.ts` — reemplazar todos los SFX:
  - `playMaceHit()` — golpe sordo + eco oscuro
  - `playMaceReceived()` — impacto + tinnitus corto
  - `playFlagPickup()` — chime misterioso ascendente
  - `playFlagDelivery()` — fanfarria breve
  - `playFlagDrop()` — golpe sordo
  - `playPowerUpPickup()` — sweep electrónico
  - `playLevelUp()` — tono ascendente
  - `playLevelDown()` — tono descendente oscuro
  - `playTrapTrigger()` — click metálico + stun
  - `playBlackout()` — apagón eléctrico
- [ ] Música ambient: loop oscuro y misterioso (sintetizador grave, notas lentas)
- [ ] Sin referencias a disparos, balas ni explosiones

**Archivos**: `frontend/src/app/game/audio/AudioManager.ts` (reescritura)

---

### F3.10 Notificaciones de sistema in-game
- [ ] Banner deslizante arriba-centro para mensajes globales (flag_picked, flag_scored, etc.)
- [ ] Fade in 0.3s → visible 3s → fade out 0.5s
- [ ] Máximo 2 mensajes apilados antes de descartar el más viejo
- [ ] Emojis correspondientes por tipo de mensaje

**Archivos**: `frontend/src/app/game/ui/SystemMessages.ts` (nuevo)

---

## FASE 4 — Persistencia y Ajustes API

### F4.1 Schemas de base de datos actualizados
- [ ] Entidad `PlayerStats`: reemplazar columnas de tanques por Dark Flag
  - Eliminar: `kills`, `deaths`, `walls_placed`, `bullets_fired`
  - Agregar: `flag_captures`, `flag_pickups`, `maces_landed`, `maces_received`, `level_15_reached`, `best_score`, `best_level`, `traps_triggered`
- [ ] Misiones: crear seed nuevo con misiones Dark Flag
  - Ejemplo: "Entrega 5 banderas" / "Maza 20 rivales" / "Llega al nivel 10" / "Recoge 10 power-ups" / "Entrega la bandera 3 veces en una sesión"
- [ ] Actualizar `POST /stats/session` para recibir stats de Dark Flag

**Archivos**: `backend/api/src/stats/entities/player-stats.entity.ts`, `backend/api/src/missions/missions.service.ts`

---

### F4.2 Endpoints actualizados
- [ ] `GET /stats/rankings/flag-captures` — top por banderas entregadas (reemplaza kills)
- [ ] `GET /stats/rankings/best-score` — top por mejor puntuación en una sesión
- [ ] `GET /stats/rankings/maces` — top por mazos
- [ ] `GET /stats/rankings/kd` → si tiene sentido en este juego; si no, eliminar

**Archivos**: `backend/api/src/stats/stats.controller.ts`, `backend/api/src/stats/stats.service.ts`

---

### F4.3 Shop — ajustes de skins
- [ ] Renombrar "Skins de tanque" → "Personajes" en el seeder y en la UI
- [ ] El campo `skinSlug` pasa a ser el slug del personaje (crewmate variant)
- [ ] `nameToSlug` debe usar el nuevo naming convention de los assets de personajes
- [ ] Mantener mismo sistema de precios, rareza y desbloqueo por tiempo jugado

**Archivos**: `backend/api/src/skins/skins.service.ts`, `frontend/src/app/shop/shop.component.ts`

---

## FASE 5 — Pulido y Testing

### F5.1 Anti-cheat Dark Flag
- [ ] Validar `speedFactor` (mismo check que antes, `> MAX_SPEED * 1.1`)
- [ ] Validar `mace` input: rechazar si `now < maceCooldownEnd` del servidor
- [ ] Validar que el portador no emita `mace: true`
- [ ] Validar posición del mazo: target debe estar dentro del rango permitido por nivel
- [ ] Rate limit de eventos: máximo 1 `flag_pickup` por jugador cada 5s

**Archivos**: `backend/game-server/src/game/game.gateway.ts`, `backend/game-server/src/game/services/game-loop.service.ts`

---

### F5.2 Optimización de sombras (cliente)
- [ ] Benchmark del raycasting con 20 jugadores + 12 obstáculos
- [ ] Si FPS < 30: reducir cantidad de rayos por jugador (de 360 a 180)
- [ ] En móvil: desactivar sombras de jugadores remotos (solo tu propio cono hace raycasting)
- [ ] Opción "Modo rendimiento" (off por defecto): sin sombras, cono simple

**Archivos**: `frontend/src/app/game/utils/RayCaster.ts`, `frontend/src/app/game/scenes/GameScene.ts`

---

### F5.3 Tutorial / Onboarding Dark Flag
- [ ] Reescribir `TutorialModalComponent`: 4 cards específicas de Dark Flag
  - Card 1: "Mueve el cursor para moverte. Spacebar para girar la linterna sin moverte."
  - Card 2: "Encuentra la bandera iluminándola. Písala para agarrarla."
  - Card 3: "Sigue la pulsación de luz hacia el destino. ¡Entrégala para puntuar!"
  - Card 4: "Maza a tus rivales para robar su nivel. ¡Pero vigila las trampas!"
- [ ] Hints in-game: "Primera vez con la bandera → muestra dirección del destino"

**Archivos**: `frontend/src/app/shared/components/tutorial-modal.component.ts`

---

### F5.4 Testing end-to-end
- [ ] Partida completa con 2 jugadores humanos: encontrar bandera → entregar → niveles suben
- [ ] Mazo: stun funciona, nivel baja, bandera cae
- [ ] Trampa: se activa a velocidad alta, bandera cae, reaparece a los 45s
- [ ] Power-ups: los 6 funcionan correctamente
- [ ] Nivel 14 (contramazo): el atacante recibe stun de 2s
- [ ] Nivel 15: al puntuar, el destino siguiente es visible 3s
- [ ] Fantasma: otros no ven el haz, desaparece del mini-mapa
- [ ] Apagón: linternas de todos se apagan, la propia permanece

---

## FASE 6 — Generación de Assets con IA

> Esta fase va al final. Se genera UN asset primero para validar el estilo antes de producir todo.
> Usar `gpt-image-1`, quality `"low"` para borradores, `"high"` para finales.
> Key en `C:\Users\fredy\.claude\openai_key`

### F6.0 Personaje base (GENERAR PRIMERO — PRUEBA)
- [ ] Crear prompt JSON en `docs/08-assets/prompts/character-base.json`
- [ ] Generar 1 skin de prueba con quality `"low"`
- [ ] Revisar estilo → ajustar prompt si es necesario
- [ ] **Aprobar antes de continuar con el resto de la fase**

**Ruta borrador**: `docs/08-assets/review/character-base-draft.png`
**Ruta final**: `frontend/public/assets/characters/char-base.png`

---

### F6.1 Skins de personaje (100 total)
- [ ] Grid 2×5 (10 personajes por llamada) en 1024×1024
- [ ] 10 llamadas = 100 personajes (batches del 1 al 10)
- [ ] Script de crop: `scripts/process-character-skins.js` (Sharp, crop + resize a 128×128)
- [ ] Categorías: 40 comunes (colores sólidos), 30 raras (patrones/gradientes), 20 épicas (accesorios especiales), 10 legendarias (efectos únicos)
- [ ] Naming: `char-{slug}.png` (ej: `char-azure.png`, `char-mech.png`, `char-phantom.png`)
- [ ] Output: `frontend/public/assets/characters/`

**Prompts**: `docs/08-assets/prompts/characters-batch1.json` … `characters-batch10.json`
**Dependencia**: F6.0 aprobado (estilo base definido)

---

### F6.2 Iconos de power-ups (6)
- [ ] Grid 2×3 en 1024×1024 (los 6 en una llamada)
- [ ] Estilo: iconos cartoon luminosos sobre fondo transparente
- [ ] Escudo de Mazo / Revelación / Sprint / Apagón / Supermazo / Fantasma
- [ ] Resize a 64×64px cada uno
- [ ] Output: `frontend/public/assets/powerups/`

**Prompt**: `docs/08-assets/prompts/powerups-icons.json`

---

### F6.3 Imagen hero landing page
- [ ] 1 imagen 1536×1024 (horizontal)
- [ ] Concepto: personajes Dark Flag originales con linternas en arena completamente oscura, haces de luz dramáticos, uno lleva una bandera ámbar brillante
- [ ] Sin texto
- [ ] Output: `frontend/public/assets/ui/landing-hero.png`

**Prompt**: `docs/08-assets/prompts/landing-hero.json`

---

### F6.4 Bandera y destino (assets)
- [ ] Bandera: objeto flotante ámbar/dorado con brillo suave, 128×128px
- [ ] Destino: círculo teal pulsante (spritesheet de 4 frames), 256×256px
- [ ] Trampa: marca sutil en el suelo (oscura, apenas visible), 64×64px
- [ ] Output: `frontend/public/assets/ui/`

**Prompt**: `docs/08-assets/prompts/game-objects.json`

---

### F6.5 Arenas / Escenarios (8)
- [ ] Cada arena: 1 imagen de fondo tileable (o gradient) + set de sprites de obstáculos
- [ ] Procesar una arena por llamada (obstáculos del mismo bioma en grid)
- [ ] Arenas: Estación Espacial, Alcantarillas, Mansión, Cyberpunk, Ártico, Volcánico, Bosque, Templo
- [ ] Backgrounds: 2048×2048px (tile) o 1024×1024px según viabilidad
- [ ] Obstáculos: grid 2×2 (bunker + barrera + round + extra decorativo) por arena
- [ ] Output: `frontend/public/assets/arenas/{arena-slug}/`

**Prompts**: `docs/08-assets/prompts/arena-{slug}.json` (uno por arena)

---

### F6.6 Avatares y stickers
- [ ] Los 20 avatares existentes (grids 2×5 ya generados) son reutilizables sin cambio
- [ ] Si el presupuesto lo permite: generar 20 avatares adicionales con tema Dark Flag (personajes con linternas, máscaras de noche, etc.)

**Dependencia**: presupuesto de API disponible

---

## Resumen de dependencias críticas

```
F0.1 (repo) → F0.2 (CLAUDE.md) → F0.3 (docs)
F0.3 → F1.x (UI redesign)
F0.3 → F2.1 (modelos) → F2.2 (game loop) → F2.3 (events) → F3.x (Phaser)
F3.1 (dark render) → F3.2 (sombras) → F3.3 (personaje)
F3.3 + F3.4 + F3.5 → F3.6 (mazo) + F3.7 (niveles)
F2.x + F3.x → F4.x (persistencia) → F5.x (pulido)
F6.0 (prueba) → aprobación → F6.1 (skins) → F6.2-F6.5 (resto de assets)
```

---

## Estado al iniciar este plan

- [x] Diseño del juego definido y documentado
- [x] GDD.md reescrito para Dark Flag
- [x] mecanicas-core.md reescrito para Dark Flag
- [x] estilo-grafico.md actualizado para Dark Flag
- [ ] Todo lo demás: pendiente
