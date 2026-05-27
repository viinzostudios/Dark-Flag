# Documentación — Dark Flag

> Índice central de toda la documentación del proyecto.
> **Regla**: cualquier funcionalidad debe estar documentada aquí antes de implementarse.

---

## 00 — Plan de trabajo

| Archivo | Descripción |
|---------|-------------|
| [instalacion.md](00-plan/instalacion.md) | Software requerido en la PC del desarrollador |
| [plan-trabajo.md](00-plan/plan-trabajo.md) | Plan completo de implementación Dark Flag (fases 0–6) |

---

## 01 — Arquitectura

| Archivo | Descripción |
|---------|-------------|
| [arquitectura-general.md](01-arquitectura/arquitectura-general.md) | Visión general del sistema y sus componentes |
| [estructura-proyecto.md](01-arquitectura/estructura-proyecto.md) | Árbol de carpetas y archivos del código fuente |
| [flujo-datos.md](01-arquitectura/flujo-datos.md) | Flujo completo de datos entre cliente, servidor y base de datos |

---

## 02 — Game Design

| Archivo | Descripción |
|---------|-------------|
| [GDD.md](02-game-design/GDD.md) | Game Design Document completo de Dark Flag |
| [mecanicas-core.md](02-game-design/mecanicas-core.md) | Especificación técnica: linterna, mazo, bandera, trampas, niveles, power-ups |
| [economia-juego.md](02-game-design/economia-juego.md) | Balance, moneda interna y economía del juego |

---

## 03 — Backend

| Archivo | Descripción |
|---------|-------------|
| [api-rest.md](03-backend/api-rest.md) | Todos los endpoints REST: método, ruta, body, respuesta, errores |
| [websocket-events.md](03-backend/websocket-events.md) | Todos los eventos WebSocket (cliente↔servidor) |
| [game-loop.md](03-backend/game-loop.md) | Lógica del game loop del servidor (tick, procesamiento, emisión) |
| [schemas-bd.md](03-backend/schemas-bd.md) | Esquemas PostgreSQL completos con índices y constraints |
| [redis-estructura.md](03-backend/redis-estructura.md) | Estructura de claves Redis, TTLs y patrones de uso |

---

## 04 — Frontend

| Archivo | Descripción |
|---------|-------------|
| [arquitectura-angular.md](04-frontend/arquitectura-angular.md) | Módulos, componentes, servicios y rutas de Angular |
| [phaser-scenes.md](04-frontend/phaser-scenes.md) | Escenas Phaser y su responsabilidad |
| [sincronizacion.md](04-frontend/sincronizacion.md) | Client-side prediction, interpolación y server reconciliation |
| [controles-input.md](04-frontend/controles-input.md) | Sistema de input PC/móvil — Strategy Pattern, separación obligatoria, reconciliación |
| [onboarding.md](04-frontend/onboarding.md) | Spec de onboarding: modal 4 cards + hints contextuales en partida |

---

## 05 — Infraestructura

| Archivo | Descripción |
|---------|-------------|
| [docker-compose.md](05-infra/docker-compose.md) | Configuración detallada de cada servicio Docker |
| [nginx.md](05-infra/nginx.md) | Configuración de Nginx como reverse proxy |
| [ci-cd.md](05-infra/ci-cd.md) | Pipeline de GitHub Actions |
| [azure-arquitectura-costos.md](05-infra/azure-arquitectura-costos.md) | Arquitectura Azure por tiers: costos, triggers de migración y configuración |
| [azure-deploy-plan.md](05-infra/azure-deploy-plan.md) | Plan paso a paso para montar Tier 1 en Azure (Container Apps + PostgreSQL + Redis) |

---

## 06 — Monetización

| Archivo | Descripción |
|---------|-------------|
| [modelo-negocio.md](06-monetizacion/modelo-negocio.md) | Modelo F2P completo, fases de activación |
| [stripe-integracion.md](06-monetizacion/stripe-integracion.md) | Integración de Stripe para microtransacciones |
| [ads-integracion.md](06-monetizacion/ads-integracion.md) | Google AdSense: banner, rewarded, interstitial |
| [estimacion-ingresos-ads.md](06-monetizacion/estimacion-ingresos-ads.md) | Estimación de ingresos por ads vs. costo de infra por tier Azure |

---

## 07 — Seguridad

| Archivo | Descripción |
|---------|-------------|
| [seguridad.md](07-seguridad/seguridad.md) | Autenticación, autorización, validaciones y rate limiting |

---

## 08 — Assets

| Archivo | Descripción |
|---------|-------------|
| [estilo-grafico.md](08-assets/estilo-grafico.md) | Guía de estilo Dark Flag: paleta, personajes, arenas, prompts base |
| [inventario-assets.md](08-assets/inventario-assets.md) | Inventario de assets generados y pendientes |
| [prompts/](08-assets/prompts/) | Prompts JSON para generación con IA (uno por asset) |

---

### Guía de lectura por tema (Dark Flag)

| Tema / Tarea | Leer OBLIGATORIO | Contexto |
|---|---|---|
| Estado del proyecto, qué sigue | [plan-trabajo.md](00-plan/plan-trabajo.md) | — |
| Reglas del juego, mecánicas | [GDD.md](02-game-design/GDD.md) | — |
| Implementación técnica de mecánicas | [mecanicas-core.md](02-game-design/mecanicas-core.md) | [GDD.md](02-game-design/GDD.md) |
| Arquitectura general del sistema | [arquitectura-general.md](01-arquitectura/arquitectura-general.md) | [flujo-datos.md](01-arquitectura/flujo-datos.md) |
| Backend API REST | [api-rest.md](03-backend/api-rest.md) | [schemas-bd.md](03-backend/schemas-bd.md) |
| WebSockets / eventos | [websocket-events.md](03-backend/websocket-events.md) | [game-loop.md](03-backend/game-loop.md) |
| Frontend Angular | [arquitectura-angular.md](04-frontend/arquitectura-angular.md) | — |
| Phaser (escenas, render) | [phaser-scenes.md](04-frontend/phaser-scenes.md) | [sincronizacion.md](04-frontend/sincronizacion.md) |
| Controles | [controles-input.md](04-frontend/controles-input.md) | — |
| Docker / infra local | [docker-compose.md](05-infra/docker-compose.md) | [instalacion.md](00-plan/instalacion.md) |
| Monetización, tienda | [modelo-negocio.md](06-monetizacion/modelo-negocio.md) | [stripe-integracion.md](06-monetizacion/stripe-integracion.md) |
| Seguridad | [seguridad.md](07-seguridad/seguridad.md) | — |
| Generación de assets con IA | [estilo-grafico.md](08-assets/estilo-grafico.md) | [inventario-assets.md](08-assets/inventario-assets.md) |
