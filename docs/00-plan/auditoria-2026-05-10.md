# Auditoría de funcionalidades — 2026-05-10

> Revisión completa del estado funcional de la aplicación: cuenta de usuario, juego anónimo, tienda, compras, ads y estadísticas.

---

## Bugs corregidos en esta sesión

| # | Problema | Archivo(s) modificado(s) | Estado |
|---|----------|--------------------------|--------|
| 1 | "Jugar como invitado" en login apuntaba a `/game` saltando el lobby y la configuración de alias | `login.component.ts` | ✅ Corregido |
| 2 | `ast_last_score` y `ast_last_time` en lobby nunca se escribían — siempre mostraba `—` | `game.component.ts`, `game-state-signal.service.ts`, `GameScene.ts` | ✅ Corregido |
| 3 | `POST /economy/ad-reward` nunca se llamaba al ver un rewarded ad — coins no se acreditaban | `ads.service.ts` | ✅ Corregido |
| 4 | `POST /stats/session` no tenía auth guard — cualquiera podía manipular estadísticas | `stats.controller.ts` | ✅ Corregido |
| 5 | `POST /stats/session` no extraía `userId` del JWT — lo esperaba del cliente | `stats.controller.ts` | ✅ Corregido |

---

## Funcionalidades nuevas implementadas

| # | Feature | Archivos nuevos/modificados |
|---|---------|---------------------------|
| 1 | **Historial por sesión** — entidad `game_sessions` graba cada partida con score/kills/deaths/duración | `backend/api/src/stats/entities/game-session.entity.ts`, `stats.service.ts`, `stats.module.ts` |
| 2 | **GET /stats/sessions** — endpoint protegido que devuelve las últimas 50 sesiones | `stats.controller.ts` |
| 3 | **POST /economy/session-reward** — endpoint protegido que otorga coins al finalizar partida | `economy.controller.ts` |
| 4 | **Página /stats** — gráficas SVG inline de score y kills por partida, tabla de historial, 8 KPIs | `frontend/src/app/stats/stats.component.ts` |
| 5 | **Grabación de sesión al salir** — escribe localStorage + llama API si está logueado | `game.component.ts`, `game-state-signal.service.ts` |
| 6 | **Botón "📊 Stats" en lobby** — acceso directo para usuarios logueados | `lobby.component.ts` |
| 7 | **Daily reward UI** — banner en lobby que aparece cuando hay recompensa disponible | `lobby/daily-reward.component.ts` |
| 8 | **Flujo "Olvidé mi contraseña"** — UI frontend + endpoint backend con token en Redis | `auth/forgot-password/forgot-password.component.ts`, `auth.controller.ts`, `auth.service.ts` |
| 9 | **Ruta /auth/forgot-password** en router | `app.routes.ts` |

---

## Estado actual por área

### Autenticación
- ✅ Login / Registro / Logout / Refresh tokens
- ✅ "Olvidé mi contraseña" (UI completa, token en Redis)
- ⏳ PENDIENTE: Envío real de email (requiere integrar SendGrid/Resend/Nodemailer + configurar SMTP)
- ⏳ PENDIENTE: `/auth/reset-password` endpoint para consumir el token y cambiar contraseña
- ❌ Sin verificación de email al registrar

### Juego anónimo
- ✅ Landing → Lobby → Game sin registro
- ✅ Alias aleatorio o editado en lobby (guardado en localStorage)
- ✅ No se muestran datos de cuenta cuando es invitado

### Lobby
- ✅ Banner de ad
- ✅ Daily reward (aparece cuando está disponible)
- ✅ Botón Stats y Tienda para usuarios logueados
- ✅ Skin activa visible en panel de jugador
- ✅ "Última sesión" ahora se rellena al salir del juego

### Partida (GameScene + servidor)
- ✅ Grabación al salir: score, duración, kills estimados
- ✅ Coins por partida acreditadas si está logueado
- ✅ Historial de sesiones persistido en base de datos

### Tienda
- ✅ Catálogo 100 skins
- ✅ Compra con coins / gemas
- ✅ Desbloqueo por partidas (claim free)
- ✅ Equip / unequip
- ✅ Barra de progresión
- ✅ Paquetes de gemas (Stripe)
- ⏳ Stripe: `stripePublishableKey` es un placeholder — requiere configurar claves reales
- ⏳ Webhook de Stripe está implementado pero necesita secret real

### Ads (AdSense / H5 Games)
- ✅ Banner en lobby (muestra placeholder en dev)
- ✅ Rewarded ads al morir (ammo/walls)
- ✅ Rewarded ads en pre-entry overlay
- ✅ Interstitial al salir (cada 3 salidas, excepto si hubo compra reciente)
- ✅ Coins acreditadas al ver ad rewarded (llama POST /economy/ad-reward)
- ✅ Límite de 10 rewarded/día

### Estadísticas y progreso
- ✅ Acumulado: kills, deaths, games, score, tiempo
- ✅ Historial por sesión (`game_sessions`)
- ✅ Página /stats con gráficas SVG (score/partida, kills/partida)
- ✅ Tabla de últimas partidas
- ✅ KPIs: KD ratio, racha máxima, tiempo jugado, score promedio
- ⏳ Ranking global (`/stats/rankings/global`) existe pero sin página frontend

### Misiones / Daily rewards
- ✅ Daily reward backend completo (streak, coins progresivos, día 7 bonus)
- ✅ Daily reward UI en lobby
- ⏳ Misiones: backend completo, sin UI frontend
- ⏳ Missions: `GET /missions/me` y `POST /missions/:id/claim` sin exponer en UI

---

## Backlog priorizado

### Alta prioridad
1. **Reset de contraseña completo** — endpoint `/auth/reset-password?token=...` que valide el token Redis y actualice la contraseña hasheada en PostgreSQL
2. **Email de recuperación** — integrar proveedor de email (Resend recomendado, gratis hasta 100 emails/día) para enviar el token
3. **Ranking global frontend** — tabla en `/stats` o sección en lobby con top 100
4. **Verificación de email** — enviar email de confirmación al registrarse

### Media prioridad
5. **Misiones UI** — página o modal que muestre misiones activas con progreso y botón "Reclamar"
6. **Perfil de usuario** — página `/profile` para editar username/displayName (actualmente no editable post-registro)
7. **Stripe configuración real** — conectar claves reales y habilitar flujo de compra end-to-end
8. **Gráfica de duración promedio** — agregar al `/stats` el tiempo promedio por partida

### Baja prioridad
9. **Notificaciones in-game** — indicador visual cuando se otorgan coins o se completa una misión
10. **Avatar personalizable** — cambiar emoji de avatar en el lobby
11. **Historial de transacciones en tienda** — sección "Mis compras" con historial
12. **Dashboard admin** — panel para ver métricas del juego (usuarios activos, sesiones, revenue)

---

## Notas de arquitectura

- `POST /stats/session` ahora extrae `userId` del JWT (no del body) — esto es correcto y seguro
- `AdsService` usa `HttpClient` inyectado — el token JWT se adjunta automáticamente via el interceptor HTTP
- `GameStateSignalService.onSessionStart()` se llama desde `GameScene.setupSignals()` al crearse la escena — marca el inicio de la sesión para calcular duración correctamente
- El token de "olvidé mi contraseña" vive en Redis con TTL de 1 hora — la clave es `auth:forgot:{uuid}`
- En desarrollo, el token se imprime en los logs del backend (`[DEV] Password reset token for...`)
