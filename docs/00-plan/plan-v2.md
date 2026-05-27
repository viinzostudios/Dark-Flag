# Plan V2 — Arena Siege Tanks: Segundo Nivel

> Hoja de ruta completa para la versión 2 del juego.
> **Prerequisito**: V1 estabilizada y con jugadores activos reales.
> **Filosofía**: V1 es el juego. V2 es la plataforma.

---

## Visión general de V2

El objetivo es pasar de un juego multijugador funcional a un **ecosistema con retención, comunidad y monetización sostenible**. Los tres pilares:

1. **Retención** — razones para volver cada día y cada semana (Ranked, Battle Pass, misiones)
2. **Comunidad** — razones para jugar con otros (amigos, clanes, torneos)
3. **Monetización** — nuevas fuentes de ingreso sin afectar el balance del juego

---

## BLOQUE A — INFRAESTRUCTURA Y OBSERVABILIDAD

### A1. Observabilidad y analytics

**Por qué primero**: sin datos, no se puede mejorar. Todo lo demás del plan depende de poder medir el resultado.

**Tareas**:
- A1.1: Integrar **Prometheus + Grafana** para métricas del game-server
  - Métricas: jugadores activos por sala, ticks/s reales vs target (30), latencia de tick, cola de sala, salas activas
  - Alertas: si ticks/s < 25 durante 30s → alerta
- A1.2: Integrar **PostHog** (self-hosted) para analytics de producto
  - Eventos: `game_started`, `game_ended`, `death`, `skin_viewed`, `purchase_started`, `purchase_completed`, `ad_watched`, `ad_skipped`, `tutorial_completed`, `tutorial_skipped`
  - Funnels: registro → primera partida → primera compra
  - Retención D1, D7, D30 por cohorte
- A1.3: Dashboard de economía
  - Coins ganadas vs gastadas por día
  - Tasa de conversión a premium
  - Revenue por fuente (Stripe vs ads vs paquetes)
- A1.4: Reemplazar `console.log` con **Winston** en ambos backends (JSON estructurado, nivel configurable por ENV)
- A1.5: Error tracking con **Sentry** en frontend Angular + backend NestJS — captura stack traces automáticamente en producción
- A1.6: Correlation ID en cada request HTTP y cada evento WebSocket (trazar errores end-to-end)

---

### A2. Escalabilidad

**Cuándo activar**: cuando los jugadores concurrentes superen consistentemente 200.

**Tareas**:
- A2.1: Auto-scaling de game-servers con Azure Container Apps o AWS ECS — si la cola de sala supera N jugadores, levantar nueva instancia automáticamente
- A2.2: CDN para assets estáticos (skins, avatares, UI) — Cloudflare o Azure CDN
- A2.3: Separar game-server y API en clusters independientes (el game-server necesita más CPU; la API más memoria)
- A2.4: Selección de servidor por región — el cliente hace ping antes de conectar y elige el más cercano (NA / EU / LATAM)
- A2.5: Health checks y circuit breakers en todos los servicios
- A2.6: Stress test documentado: cómo ejecutar 200 bots concurrentes para verificar que el servidor aguanta carga

---

### A3. Anti-cheat básico del servidor

**Tareas**:
- A3.1: Validación de `speedFactor` — rechazar si el movimiento implica velocidad > `MAX_SPEED * 1.1`
- A3.2: Validación de cadencia de disparo — ignorar `shoot=true` con < `SHOOT_COOLDOWN - 20ms` desde el último disparo
- A3.3: Teleportation check — si `|new_pos - old_pos| > MAX_SPEED * TICK_MS * 3` → ignorar el input y marcar
- A3.4: Conteo de anomalías por sesión → ban temporal automático (5 violaciones en 1 min = 10 min ban)
- A3.5: Logging de anomalías en Redis (TTL 24h) para revisión manual posterior

---

### A4. Panel de Admin

**Tareas**:
- A4.1: Ruta `/admin` en el frontend protegida por rol `ADMIN`
- A4.2: Funcionalidades: banear usuarios, ver partidas activas, acreditar moneda a usuarios, ver logs de anomalías
- A4.3: Dashboard de métricas en tiempo real (jugadores online, salas activas, revenue del día)
- A4.4: Herramienta de moderación: ver reportes, historial de partidas de un usuario

---

## BLOQUE B — MODOS DE JUEGO

### B1. Modo Clasificatorio (Ranked) ⭐ Prioridad máxima

**Por qué**: la razón más poderosa para volver al juego día tras día.

**Sistema de rangos**:

| Tier | MMR | Nombre |
|------|-----|--------|
| 1 | 0–999 | Hierro |
| 2 | 1000–1499 | Bronce |
| 3 | 1500–1999 | Plata |
| 4 | 2000–2499 | Oro |
| 5 | 2500–2999 | Platino |
| 6 | 3000+ | Diamante |
| — | Top 100 global | Campeón |

- Rating inicial: 1000 MMR
- Cambio por partida: basado en posición final + MMR relativo del lobby (fórmula Elo estándar)
- 10 partidas de placement antes de mostrar rango
- Season: 3 meses. Al final: soft reset (comprimir hacia la media) + recompensas exclusivas
- Decaimiento: si no juegas ranked en 14 días, pierdes 25 MMR/día (solo en Oro+)

**Tareas backend**:
- B1.1: Tabla `ranked_stats`: `userId`, `mmr`, `rank_tier`, `wins`, `losses`, `season_id`, `peak_mmr`
- B1.2: Tabla `seasons`: `id`, `name`, `start_date`, `end_date`, `status`
- B1.3: `GET /ranked/me` y `GET /ranked/leaderboard?season=current`
- B1.4: `POST /ranked/session` — game-server llama al finalizar partida ranked con array de resultados ordenados por posición
- B1.5: Cola de matchmaking ranked en Redis: sorted set por MMR, buscar jugadores dentro de ±200 MMR, expandir ±50 cada 30s de espera
- B1.6: Tipo de sala `'ranked'` con configuración específica (sin bots, 10-20 jugadores)

**Tareas frontend**:
- B1.7: UI de perfil de rango: badge del tier + MMR + historial de últimas 10 partidas ranked
- B1.8: Animación de subida/bajada de rango (pantalla de transición al salir de partida)
- B1.9: Cola de matchmaking ranked: botón separado en lobby, indicador de espera con MMR promedio de la cola

**Recompensas de season**:
- Border exclusivo por tier alcanzado al cierre de season
- Avatar exclusivo para Diamante y Campeón

---

### B2. Modo Duelo 1v1

**Diseño**:
- Mapa: 1000×667 (el más pequeño)
- Sin bots, sin Power Stack por kills, solo supervivencia da stacks
- 5 kills para ganar, o más kills al final de 3 minutos
- Matchmaking ELO dedicado (tabla separada)

**Tareas**:
- B2.1: Room type `'duel'` en `RoomsService` (maxPlayers=2, mapSize fijo)
- B2.2: Condición de victoria: 5 kills → emite `game_over` con ganador/perdedor
- B2.3: `POST /matchmaking/duel` — cola + respuesta cuando hay match
- B2.4: UI de "enfrentamiento": pantalla de carga mostrando ambos jugadores (avatar + username + rank)
- B2.5: Post-duelo: pantalla de resultado con cambio de MMR animado

---

### B3. Modo Equipos 2v2 y 4v4

**Diseño**:
- Equipos: Rojo vs Azul
- Las balas del mismo equipo NO dañan a compañeros
- Team Meter compartido que sube con kills y da bonus al equipo
- Objetivo: 50 kills de equipo (2v2) / 75 kills (4v4)

**Tareas**:
- B3.1: Campo `teamId: 'red' | 'blue' | null` en `ServerPlayerState`
- B3.2: En `checkCollisions`: skip si bala y víctima son del mismo equipo
- B3.3: Leaderboard por equipo en `game_state`
- B3.4: UI: borde del HUD con color del equipo, compañeros resaltados en verde en el leaderboard
- B3.5: Lobby de equipo: invitar amigo por username → partido privado de equipo

---

### B4. Modo Battle Royale (zona que se cierra)

**Diseño**:
- 30-50 jugadores, 1 solo ganador
- La zona segura se reduce 15% cada 90 segundos (círculo)
- Jugadores fuera de zona: 0.5 HP/seg de daño continuo
- Sin respawn — al morir: pantalla de resultado + modo espectador
- Loot phase: primeros 60s con spawn rate de pickups ×4

**Tareas**:
- B4.1: Room type `'battle_royale'`
- B4.2: `zone: { cx, cy, radius, nextShrinkAt, targetRadius }` en `ServerGameState`
- B4.3: Daño por estar fuera de zona: procesado cada tick
- B4.4: Timer de shrink en el game loop
- B4.5: Cliente: renderizar círculo de zona (línea verde + overlay oscuro exterior)
- B4.6: HUD: contador de jugadores vivos, timer hasta próximo shrink
- B4.7: Modo espectador al morir (ver B5)

---

### B5. Modo Captura de Bandera

**Diseño**:
- 4v4 o 5v5
- Banderas en esquinas opuestas de las bases enemigas
- 3 capturas = victoria (o más en 7 minutos)
- El portador de bandera es visible para todos

**Tareas**:
- B5.1: `ServerFlagState`: `{ id, teamColor, x, y, carriedBy: string | null, isAtBase: boolean }`
- B5.2: Lógica: pisar bandera enemiga → convertirse en portador; morir → dropear bandera
- B5.3: Llegar a la base con bandera enemiga → punto + reset de bandera
- B5.4: UI: minimapa con posición de banderas, contador de puntos por equipo

---

### B6. Modo de Juego Rotativo (semanal)

**Modos rotativos** (1 semana cada uno):
- "Balas infinitas": munición ilimitada
- "Muros de cristal": muros con HP=1
- "Gigantes vs Enanos": 2 gigantes (alto HP, lento) vs 18 pequeños (rápidos, 1HP)
- "Solo supervivencia": 50 bots en dificultad alta, el jugador intenta sobrevivir el mayor tiempo
- "Sin muros": juego sin la mecánica de muros

**Tareas**:
- B6.1: Campo `gameMode: string` en config de sala
- B6.2: Tabla `weekly_modes`: `start_date`, `end_date`, `mode_config_json`
- B6.3: Game-loop lee `gameMode` y ajusta constants al crear la sala
- B6.4: UI: banner en el lobby indicando el "Modo de la semana"

---

## BLOQUE C — PROGRESIÓN Y CONTENIDO

### C1. Battle Pass (Pase de Temporada) ⭐ Prioridad alta

**Diseño**:
- 100 niveles, duración = 1 season (3 meses)
- Gratis: recompensas básicas en niveles clave (coins, stickers, 1 skin común en nivel 50)
- Premium ($4.99 o equivalente en coins): recompensas premium en cada nivel (skins exclusivas, avatares, border, trails)
- XP: 100 XP/partida, misiones de battle pass dan ×2-×5 XP

**Tareas**:
- C1.1: Tabla `battle_pass_seasons`: `id`, `name`, `start_date`, `end_date`, `price_cents`
- C1.2: Tabla `battle_pass_tiers`: `season_id`, `tier`, `free_reward_type`, `free_reward_ref`, `premium_reward_type`, `premium_reward_ref`
- C1.3: Tabla `user_battle_pass`: `userId`, `season_id`, `xp`, `current_tier`, `is_premium`, `purchased_at`
- C1.4: `GET /battle-pass/current` — nivel actual, XP, recompensas claimables
- C1.5: `POST /battle-pass/claim/:tier` — reclamar recompensa de nivel
- C1.6: `POST /battle-pass/purchase` — activar pase premium (Stripe o coins)
- C1.7: UI: barra de progreso horizontal con 100 nodos, rewards arriba (premium) y abajo (gratis), animación de level-up
- C1.8: Las misiones diarias/semanales otorgan XP de battle pass además de coins

---

### C2. Sistema de Logros permanentes

**Tipos**:

| Categoría | Ejemplos | Recompensa |
|-----------|----------|------------|
| Combate | "Mata a 100 jugadores", "Mata al líder 10 veces" | Badge de perfil |
| Supervivencia | "Sobrevive 15 min en una vida", "Alcanza nivel 15 en una vida" | Badge + coins |
| Progresión | "Juega 100 partidas", "Desbloquea 20 skins" | Coins + avatar |
| Social | "Juega 10 partidas con amigos" | Coins |
| Especiales | "Mata a alguien con la última bala (0 en cargador)" | Badge exclusivo |

**Tareas**:
- C2.1: Tabla `achievement_definitions`: `id`, `type`, `target`, `reward_type`, `reward_amount`
- C2.2: Tabla `user_achievements`: `userId`, `achievement_id`, `progress`, `completed_at`
- C2.3: `GET /achievements/me` — todos los logros con progreso actual
- C2.4: Trigger en `POST /stats/session` para revisar logros automáticamente
- C2.5: UI: galería con badges, barra de progreso, sección "próximos logros"
- C2.6: Notificación in-game (toast animado) al completar un logro

---

### C3. Nivel de Cuenta (Prestige)

**Diseño**:
- Nivel 1–100 (independiente del Power Stack en partida)
- XP de cuenta: ganada por partidas, kills, logros, misiones
- Cada nivel desbloquea: border, título, coins, o item especial
- Visible en el lobby junto al avatar

**Tareas**:
- C3.1: Columnas `account_level` y `account_xp` en `user_profiles`
- C3.2: Tabla `account_level_rewards`: `level`, `reward_type`, `reward_ref`
- C3.3: `addAccountXp(userId, amount)` con detección de level-up y entrega de recompensas
- C3.4: Llamar desde `stats/session` al registrar partida
- C3.5: UI: barra de XP pequeña en lobby bajo el avatar, número de nivel visible

---

### C4. Stickers / Spray (coleccionables)

**Diseño**:
- Los stickers se "lanzan" al mapa con la tecla **F** o botón en móvil
- Duración: 10 segundos en el suelo como decals 2D
- 200+ stickers: emojis, memes del juego, stickers de temporada
- Precio: 50–500 coins, algunos solo con gems

**Tareas**:
- C4.1: Tabla `stickers`: `id`, `slug`, `name`, `price_coins`, `price_gems`, `category`, `rarity`
- C4.2: Tabla `user_stickers` + campo `activeSticker` en UserProfile
- C4.3: Input tecla F → emite `use_sticker { stickerId, x, y }` al servidor
- C4.4: Game-server: valida posesión + emite `sticker_placed` a todos
- C4.5: Frontend: render sticker como sprite 2D en el suelo, fade out en 10s
- C4.6: Sección "Stickers" en la tienda con preview

---

### C5. Efectos de Trail (Estela del tanque)

**Diseño**:
- Cada tanque deja una estela mientras se mueve
- Tipos: llamas, humo, destellos, arcoíris, estrellas, tóxico
- Default: sin estela. Se desbloquea comprando
- Cada partícula de la estela dura 0.5s

**Tareas**:
- C5.1: Campo `activeTrailSlug: string | null` en `ServerPlayerState` y `PlayerSnapshot`
- C5.2: Cliente: últimas 5 posiciones por jugador → renderizar partículas según el trail
- C5.3: Tabla `trails` + `user_trails` en backend
- C5.4: Sección "Trails" en tienda con preview animado

---

### C6. Skins de Proyectil

**Diseño**:
- Por defecto: visual actual (blanco/naranja/rojo según rebotes)
- Skins de bala: llamas azules, esferas neón, corazones, estrellas, diamantes, calaveras
- Opcional: seguir el tema de la skin del tanque, o comprar separado

**Tareas**:
- C6.1: Tabla `projectile_skins` + `user_projectile_skins`
- C6.2: Campo `projectileSlug` en el player state
- C6.3: Cliente: render personalizado del proyectil según el slug

---

### C7. Efectos de Muerte personalizados

**Diseño**:
- Por defecto: explosión naranja simple (actual)
- Desbloqueables: confeti, implosión en negro, explosión de monedas, bomba de humo

**Tareas**:
- C7.1: Tabla `death_effects` + `user_death_effects`
- C7.2: Campo `deathEffectSlug` en player state
- C7.3: Cliente: al detectar muerte de un jugador → lanzar el efecto correspondiente

---

### C8. Escenarios temáticos completos

**Diseño**:
- 10 arenas nuevas con identidad visual fuerte
- Temas: Espacio, Volcán, Ártico, Cyberpunk, Subterráneo, Selva, Desierto, etc.
- Cada arena: fondo único (imagen tileable o gradient + partículas ambientales) + obstáculos temáticos + música propia
- Los sprites de obstáculos cambian según la arena activa

**Tareas**:
- C8.1: Diseño y generación de assets para 10 arenas nuevas
- C8.2: Sistema de obstáculos temáticos: cargar sprites de obstáculo según `arena_slug`
- C8.3: Efectos ambientales por arena (nieve, chispas, estrellas, etc.) como partículas Phaser
- C8.4: Música de fondo diferente por arena (loops de 30s en Web Audio API)

---

## BLOQUE D — SOCIAL Y COMUNIDAD

### D1. Sistema de Amigos ⭐ Prioridad alta

**Por qué**: el mayor driver de retención a largo plazo.

**Tareas**:
- D1.1: Tabla `friendships`: `userId_a`, `userId_b`, `status: 'pending' | 'accepted'`, `created_at`
- D1.2: `POST /friends/request`, `POST /friends/accept/:id`, `DELETE /friends/:id`, `GET /friends`
- D1.3: Notificación in-app de solicitud (badge en el ícono de amigos en el lobby)
- D1.4: UI: lista de amigos con estado (en línea / en partida / desconectado), avatar, username
- D1.5: Botón "Invitar a partida" → genera link de sala privada (`/game?room=ROOM_ID`)
- D1.6: Ver perfil de amigo con stats básicas
- D1.7: Si amigo está en partida → opción "Unirse a su partida" (si la sala tiene cupo)

---

### D2. Perfil Público de Jugador

**Tareas**:
- D2.1: `GET /profile/:username` — stats públicas, skins equipadas, clan, rank
- D2.2: UI: avatar grande + skin equipada (mini render) + stats clave (K/D, partidas, tiempo, peak rank)
- D2.3: Botón "Desafiar a duelo" desde el perfil de otro jugador
- D2.4: `GET /profile/:username/match-history` — últimas 20 partidas (modo, resultado, kills, posición)
- D2.5: Tabla `match_history`: `userId`, `mode`, `kills`, `deaths`, `final_rank`, `duration_sec`, `played_at`

---

### D3. Sistema de Clanes

**Diseño**:
- Clan: nombre + tag (3-5 chars) + bandera (ícono de lista)
- Capacidad: 30 miembros. Roles: Líder, Co-líder, Miembro
- El tag aparece antes del username en partida: `[AST] Jugador123`
- Misiones de clan semanales (progreso compartido)
- Clasificación: suma de MMR de los 10 mejores miembros

**Tareas**:
- D3.1: Tablas `clans` y `clan_members`
- D3.2: CRUD de clan + gestión de miembros
- D3.3: `clan_weekly_missions` con progreso acumulado por todos los miembros
- D3.4: UI de clan: página dedicada con stats, miembros, misiones, chat de clan
- D3.5: Ranking de clanes en Rankings Modal (nueva columna)

---

### D4. Chat básico

**Tareas**:
- D4.1: Canal de chat global en el lobby (WebSocket, max 100 chars por mensaje)
- D4.2: Chat de clan (canal separado, solo miembros)
- D4.3: Chat en partida: mensajes rápidos predefinidos ("GG", "¡Cuidado!", "Bien jugado") + texto libre con throttle 1msg/2s
- D4.4: Filtro de palabras prohibidas, rate limit de 1 mensaje/2s
- D4.5: Mute de jugador específico (localStorage, no persiste entre sesiones)

---

## BLOQUE E — EXPERIENCIA DE JUEGO AVANZADA

### E1. Modo Espectador

**Tareas**:
- E1.1: Canal `spectator` en game-server: recibir `game_state` sin emitir inputs
- E1.2: Máximo 10 espectadores por sala
- E1.3: UI: cámara libre o seguir a un jugador (click en el leaderboard)
- E1.4: Disponible desde el perfil público de un amigo en partida

---

### E2. Sistema de Replay

**Diseño**:
- El servidor graba todos los game_states (comprimidos con MessagePack)
- TTL en Redis: 24h. Luego se mueve a almacenamiento (TTL 7 días)
- El jugador puede ver el replay desde su historial de partidas

**Tareas**:
- E2.1: Grabar en Redis cada tick del `game_state` por partida (comprimido)
- E2.2: Al finalizar partida: mover de Redis a almacenamiento persistente
- E2.3: `GET /matches/:id/replay` — devuelve el replay comprimido
- E2.4: Cliente: modo replay (reproduce los estados al mismo tick rate, sin conexión al servidor)
- E2.5: Controles: play/pause, velocidad ×0.5/×1/×2, timeline scrubber

---

### E3. Sistema de Torneos

**Diseño**:
- Torneos semanales: 32-128 participantes, bracket eliminación directa
- Torneos diarios: free-for-all, top 10 reciben premios

**Tareas**:
- E3.1: Tablas `tournaments`, `tournament_registrations`, `tournament_brackets`, `tournament_results`
- E3.2: Lógica de bracket (eliminación directa)
- E3.3: Cron job que avanza el torneo cuando todos los matches del round están completos
- E3.4: UI: lista de torneos activos, bracket visual, resultados en tiempo real
- E3.5: Recompensas: coins, gems, skin exclusiva para el ganador

---

### E4. Mejoras de IA de Bots

**Comportamientos nuevos**:
- **Evasión**: detectar balas entrantes y esquivar perpendicularmente (ray-casting simple)
- **Targeting inteligente**: atacar al jugador con menos HP, no solo el más cercano
- **Uso de power-ups**: recoger power-ups activamente
- **Posicionamiento**: preferir cobertura detrás de obstáculos, usar muros tácticamente

**Dificultades**:
- Fácil: puntería con ±30° de error, velocidad 70%
- Normal: puntería con ±15° de error, velocidad 100% (actual)
- Difícil: puntería con ±5° de error, velocidad 120%, evasión activa

**Tareas**:
- E4.1: Refactorizar `updateBots` como máquina de estados: `PATROL → SEEK_PICKUP → ENGAGE → EVADE`
- E4.2: Ray-casting simple para detectar balas convergentes
- E4.3: Variable `botDifficulty` en la sala, aplicar error artificial al aim según dificultad
- E4.4: Bots de nivel difícil usan muros tácticamente

---

## BLOQUE F — MONETIZACIÓN AVANZADA

### F1. Pack de Inicio (Starter Pack)

**Diseño**:
- Solo disponible durante las primeras 72h después del registro
- Contenido: 5000 coins + 100 gems + 1 skin epic exclusiva + 1 avatar exclusivo
- Precio: $1.99

**Tareas**:
- F1.1: Campo `starter_pack_purchased: boolean` en users
- F1.2: `GET /shop/starter-pack` — devuelve pack si elegible (<72h desde registro)
- F1.3: `POST /shop/starter-pack/purchase` — valida elegibilidad, procesa via Stripe
- F1.4: UI: banner en lobby con countdown ("Tu oferta expira en X horas")

---

### F2. Ofertas de Tiempo Limitado

**Tareas**:
- F2.1: Tabla `limited_offers`: `id`, `name`, `content_json`, `price_cents`, `start_at`, `end_at`
- F2.2: `GET /shop/offers` — devuelve ofertas activas
- F2.3: UI: sección "Ofertas" en la tienda con countdown visible
- F2.4: Al entrar al lobby con oferta activa → banner destacado

---

### F3. Gifting (Regalar a amigos)

**Tareas**:
- F3.1: `POST /shop/gift` — comprar item y enviarlo a otro usuario
- F3.2: Tabla `gifts`: `from_userId`, `to_userId`, `item_type`, `item_ref`, `message`, `claimed`, `created_at`
- F3.3: Notificación in-app de regalo recibido
- F3.4: UI: bandeja de regalos + botón "Regalar" en la ficha de cada item de la tienda

---

### F4. Suscripción mensual (VIP)

**Diseño**:
- VIP Basic ($1.99/mes): 500 coins/día + badge VIP
- VIP Premium ($4.99/mes): 1500 coins/día + 100 gems/día + border VIP + battle pass incluido

**Tareas**:
- F4.1: Stripe Subscriptions (webhooks de renovación)
- F4.2: Tabla `user_subscriptions`: `userId`, `plan_id`, `stripe_sub_id`, `current_period_end`, `status`
- F4.3: Cron job diario: acreditar coins/gems a suscripciones activas
- F4.4: Badge VIP visible en partida (sobre el username del jugador)

---

### F5. Rewarded Ads expandido

**Nuevas posiciones**:
- Al completar misión diaria: "¿Ver un anuncio para doblar la recompensa?"
- En la tienda: "¿Ver un anuncio para recibir 20 coins?" (1 vez por día)
- Boost de XP: "Ver anuncio para XP ×2 por 30 minutos"

**Tareas**:
- F5.1: Tabla `ad_rewards_log`: `userId`, `context`, `watched_at` (límites por contexto por día)
- F5.2: Ampliar `POST /economy/ad-reward` con campo `context`
- F5.3: Boost de XP: campo `xpBoostUntil: Date | null` en users, multiplicar XP de partida si activo

---

## BLOQUE G — MOBILE Y CROSS-PLATFORM

### G1. Optimización móvil completa

**Tareas**:
- G1.1: Rediseño del joystick virtual (posición bottom-left fija, tamaño adaptable, feedback háptico)
- G1.2: Botones de acción más grandes con cooldown visual circular (tipo MOBA)
- G1.3: HUD mobile: versión compacta, leaderboard colapsable
- G1.4: Optimización de render: en móvil, `antialias: false` en Phaser, partículas al 50%
- G1.5: Detección de bajo FPS: si FPS < 20 durante 3s → ofrecer modo rendimiento
- G1.6: PWA completa: `manifest.json`, service worker, botón "Añadir a pantalla de inicio"
- G1.7: Guardar preferencia de posición del joystick

---

### G2. App nativa con Capacitor

**Objetivo**: presencia en App Store y Google Play.

**Tareas**:
- G2.1: Migrar frontend Angular a Capacitor (wrapper nativo sobre WebView)
- G2.2: Pagos in-app nativos: Apple IAP + Google Play Billing via plugin Capacitor
- G2.3: Push notifications: "¡Tu amigo te invita!", "Tu reward de season está listo", "Oferta de tiempo limitado"
- G2.4: Deeplinks: `arenasiegetanks://match/ROOM_ID` → abrir directo en partida
- G2.5: Publicar en App Store Connect y Google Play Console

---

## BLOQUE H — EVENTOS Y CONTENIDO TEMPORAL

### H1. Calendario de Eventos de Temporada

| Evento | Mes | Duración | Contenido |
|--------|-----|----------|-----------|
| Navidad | Dic | 4 semanas | Arena nevada, skins navideñas, misiones de evento |
| Halloween | Oct | 3 semanas | Arena oscura, skins de terror, modo "Tanques Fantasma" |
| Verano | Jul | 4 semanas | Arena playa, skins de agua, torneo especial |
| Aniversario | Mes de lanzamiento | 2 semanas | Rewards para todos, double XP |

**Tareas (sistema genérico)**:
- H1.1: Tabla `events`: `id`, `name`, `start_date`, `end_date`, `config_json`
- H1.2: `GET /events/active` — eventos vigentes
- H1.3: El cliente verifica al iniciar → aplica tema visual en arena y lobby
- H1.4: 10 misiones temáticas por evento (tabla `event_missions`)
- H1.5: Tienda de evento: items exclusivos con countdown

---

## Prioridades de implementación V2

```
FASE 2A (primer trimestre post-launch)
└── Foco: retención y data
    ├── A1. Observabilidad (PostHog + Prometheus) — saber qué pasa
    ├── D1. Sistema de amigos — mayor driver de retención
    ├── B1. Modo Ranked — razón para volver cada día
    └── F1. Starter Pack — conversión temprana

FASE 2B (segundo trimestre)
└── Foco: economía y contenido
    ├── C1. Battle Pass — ingresos recurrentes
    ├── B2. Modo Duelo 1v1 — variedad competitiva
    ├── D2. Perfil público — identidad del jugador
    ├── C2. Logros permanentes — retención largo plazo
    └── F4. Suscripción VIP — revenue mensual predecible

FASE 2C (tercer trimestre)
└── Foco: comunidad
    ├── B3. Modos de equipo — juego cooperativo
    ├── D3. Clanes — comunidades organizadas
    ├── D4. Chat básico
    ├── C3. Nivel de cuenta (Prestige)
    └── G1. Optimización móvil completa

FASE 2D (cuarto trimestre)
└── Foco: plataforma madura
    ├── B4. Battle Royale
    ├── E2. Sistema de Replay
    ├── E3. Torneos
    ├── H1. Eventos de temporada (primer evento)
    ├── A2. Escalabilidad multi-región
    └── G2. App nativa Capacitor
```

---

## Notas de arquitectura para V2

1. **Battle Pass y Ranked son interdependientes con las Seasons** — el sistema de Seasons debe diseñarse antes que ambos
2. **El sistema de Amigos es prerequisito para Clanes, Gifting y Modos de equipo**
3. **Observabilidad (A1) debe ir primero** — sin datos, no se puede priorizar correctamente el resto
4. **Chat y sistema de reportes** requieren moderación desde el día 1 (reglas + filtros)
5. **Capacitor (G2) solo tiene sentido después de que la versión web móvil esté pulida (G1)**
