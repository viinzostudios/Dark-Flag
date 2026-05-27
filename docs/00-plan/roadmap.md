# Roadmap — Arena Siege Tanks

> Las fases son secuenciales. No se avanza a la siguiente hasta que la anterior tiene criterios de aceptación cumplidos.

---

## Fase 0 — Entorno y Documentación ✅ (actual)

**Objetivo**: Proyecto configurado, documentado y listo para empezar a codificar.

**Entregables**:
- [x] CLAUDE.md con reglas del proyecto
- [x] Jerarquía de documentación en `docs/`
- [x] Plan de trabajo completo
- [x] Esquemas de base de datos definidos
- [x] APIs y eventos WebSocket definidos
- [ ] Repositorio Git inicializado
- [ ] Verificación de entorno en la PC

**Criterio de aceptación**: Todo el equipo (o el dev) puede leer los docs y entender qué se va a construir sin hacer preguntas.

---

## Fase 1 — Prototipo Single Player

**Objetivo**: Juego jugable en el browser, sin servidor, sin base de datos.

**Entregables**:
- [ ] Proyecto Angular + Phaser configurado
- [ ] Escena de juego: arena rectangular
- [ ] Tanque controlable (teclado + mouse)
- [ ] Sistema de disparo (bala que avanza)
- [ ] Rebote de balas en bordes y muros
- [ ] Sistema de muros (colocar, expirar)
- [ ] Colisión bala → tanque (vida y muerte)
- [ ] Respawn del jugador
- [ ] HUD básico (vida, munición, score)
- [ ] Bots simples (movimiento aleatorio) para probar

**Criterio de aceptación**: Un jugador puede abrir el navegador y jugar una partida completa contra bots locales.

**Duración estimada**: 2–3 semanas

---

## Fase 2 — Backend base + WebSockets básico

**Objetivo**: Estructura de servidores levantada, comunicación WebSocket funcionando.

**Entregables**:
- [ ] Docker Compose con todos los servicios
- [ ] NestJS API REST con autenticación (JWT)
- [ ] NestJS Game Server con Socket.IO
- [ ] PostgreSQL con esquema inicial (users, stats)
- [ ] Registro e inicio de sesión
- [ ] Sala de juego básica (crear / unirse)
- [ ] Sincronización de estado básico (posición del jugador)
- [ ] El cliente Angular se conecta al game server

**Criterio de aceptación**: 2 pestañas del mismo navegador pueden verse mutuamente en la arena.

**Duración estimada**: 2–3 semanas

---

## Fase 3 — Multiplayer real

**Objetivo**: Juego multijugador completo y funcional con toda la lógica en el servidor.

**Entregables**:
- [ ] Toda la lógica del juego en el game server (autoridad)
- [ ] Client-side prediction
- [ ] Interpolación de posiciones
- [ ] Server reconciliation
- [ ] Sistema de ranking "Dominio" en tiempo real
- [ ] Top 10 jugadores con valor especial
- [ ] Power Stack (acumulación de poder por kills)
- [ ] Mecánica de líder (#1 con HP extra + marcador)
- [ ] Leaderboard en pantalla
- [ ] Sala con hasta 30 jugadores simultáneos

**Criterio de aceptación**: 10+ jugadores en la misma arena, sin bugs críticos de sincronización, latencia percibida < 150ms.

**Duración estimada**: 3–4 semanas

---

## Fase 4 — Persistencia y cuenta de usuario

**Objetivo**: Registro, autenticación, estadísticas persistentes y progresión.

**Entregables**:
- [ ] Pantalla de registro / login
- [ ] Perfil de jugador
- [ ] Estadísticas persistentes (kills, muertes, partidas, tiempo)
- [ ] Ranking global diario y semanal
- [ ] Sistema de misiones (diarias y semanales)
- [ ] Daily rewards (recompensa por login diario)
- [ ] Sistema de moneda interna (coins)
- [ ] Nivel de jugador + XP

**Criterio de aceptación**: Un jugador puede registrarse, jugar, ver sus estadísticas y que persistan al cerrar el navegador.

**Duración estimada**: 2–3 semanas

---

## Fase 5 — Skins y economía

**Objetivo**: Sistema de skins funcional, tienda, y moneda ganada jugando.

**Entregables**:
- [ ] Catálogo de skins (common / rare / epic / legendary)
- [ ] Tienda en el frontend
- [ ] Skins aplicadas en partida (tanque, trail, muerte)
- [ ] Moneda ganada al terminar partidas
- [ ] Compra de skins con moneda interna

**Criterio de aceptación**: Un jugador puede ganar monedas, entrar a la tienda y equipar una skin que se ve en partida.

**Duración estimada**: 2 semanas

---

## Fase 6 — Monetización real

**Objetivo**: Ingresos reales funcionando.

**Entregables**:
- [ ] Integración con Stripe (packs de monedas premium)
- [ ] Skins premium (de pago)
- [ ] Google AdSense: banner ads
- [ ] Rewarded ads (ver ad → ganar monedas)
- [ ] Interstitial ads (cada 3–5 partidas)

**Criterio de aceptación**: Un usuario puede comprar un pack de monedas con tarjeta, ver ads y recibir recompensas.

**Duración estimada**: 1–2 semanas

---

## Fase 7 — Escalabilidad y producción

**Objetivo**: El juego puede ser desplegado en producción y soportar carga real.

**Entregables**:
- [ ] Redis para sincronización entre instancias de game server
- [ ] Nginx como balanceador de carga
- [ ] GitHub Actions CI/CD funcionando
- [ ] Logs con Winston
- [ ] Despliegue en VPS (AWS/GCP/DigitalOcean)
- [ ] Dominio y HTTPS configurados
- [ ] Smoke tests en producción

**Criterio de aceptación**: El juego está en internet, accesible por URL pública, y soporta al menos 100 jugadores simultáneos.

**Duración estimada**: 1–2 semanas

---

## Resumen de tiempos

| Fase | Descripción | Estimado |
|------|-------------|----------|
| 0 | Entorno y documentación | 1–2 días |
| 1 | Prototipo single player | 2–3 semanas |
| 2 | Backend + WebSockets | 2–3 semanas |
| 3 | Multiplayer real | 3–4 semanas |
| 4 | Persistencia y cuentas | 2–3 semanas |
| 5 | Skins y economía | 2 semanas |
| 6 | Monetización real | 1–2 semanas |
| 7 | Escalabilidad y prod | 1–2 semanas |
| **Total** | | **14–20 semanas** |
