# Azure Deployment — Arena Siege Tanks

> Arquitectura de despliegue en Azure Cloud, dimensionamiento por CCU y proyección de costos.
> Región objetivo: **East US (Virginia)**.
> Última actualización: 2026-05-14

---

## 1. Resumen ejecutivo

| Concepto | Valor |
|---|---|
| **Tier de arranque** | 0–50 CCU — **~$76 USD/mes** (con Cloudflare Free) |
| **Tier lanzamiento orgánico** | 50–300 CCU — **~$240 USD/mes** |
| **Región** | East US (Virginia) |
| **Estrategia** | Container Apps (backend) + Static Web Apps (frontend) + PaaS administrados |
| **Filosofía** | Empezar barato, escalar bajo demanda, evitar overengineering |

---

## 2. Arquitectura objetivo

```
                       Internet
                          │
                  ┌───────┴───────┐
                  │  Cloudflare   │  ← SSL, DDoS L7, CDN, gratis
                  │  (Free tier)  │
                  └───────┬───────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
   app.dominio       api.dominio        ws.dominio
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Static Web   │  │ Container    │  │ Container    │
│ App (Free)   │  │ App — API    │  │ App — Game   │
│ Angular+     │  │ NestJS :3000 │  │ Server       │
│ Phaser SPA   │  │ Stateless    │  │ NestJS :3001 │
└──────────────┘  └──────┬───────┘  │ WebSocket    │
                         │           │ Stateful*    │
                         │           └──────┬───────┘
                         │                  │
                         └─────────┬────────┘
                                   │
                  ┌────────────────┴────────────────┐
                  │                                 │
         ┌────────▼─────────┐             ┌─────────▼────────┐
         │ Azure Database   │             │ Azure Cache for  │
         │ for PostgreSQL   │             │ Redis            │
         │ Flexible Server  │             │ Basic C0/C1      │
         └──────────────────┘             └──────────────────┘

* "Stateful" en memoria (salas activas). Sincronizado entre instancias
  via @socket.io/redis-adapter (ya implementado en redis-io.adapter.ts).
```

---

## 3. Servicios Azure por componente

### 3.1 Frontend — Azure Static Web Apps

**Justificación**: SPA pura (Angular standalone + Phaser). No necesita servidor de aplicaciones. CDN global incluido.

| Característica | Valor |
|---|---|
| SKU | **Free tier** |
| Bandwidth | 100 GB/mes incluidos |
| SSL | Gratis (managed certificates) |
| Custom domain | Sí |
| Staging environments | Por Pull Request |
| Deploy | GitHub Actions auto-generado |
| Costo | **$0/mes** |

**Cambios requeridos en el código**:
- `frontend/src/environments/environment.prod.ts`: usar URLs absolutas a subdominios separados (`api.dominio` y `ws.dominio`) en lugar de rutas relativas (`/api`, `/socket.io/`).
- CORS en NestJS API y Game Server debe aceptar el origin del frontend.

**Cuándo migrar a App Service**: si en el futuro se necesita SSR (Angular Universal) o lógica server-side. **No es el caso actual**.

### 3.2 API REST — Azure Container Apps

**Justificación**: Servicio stateless contenedorizado. Container Apps soporta scale-to-zero, autoescalado por HTTP requests, integración nativa con Container Registry.

| Característica | Tier mínimo (0–50 CCU) | Tier lanzamiento (50–300 CCU) |
|---|---|---|
| Plan | Consumption | Consumption |
| Réplicas mínimas | 0 (scale-to-zero) | 1 |
| Réplicas máximas | 2 | 4 |
| vCPU por réplica | 0.25 | 0.5 |
| RAM por réplica | 0.5 GB | 1 GB |
| Reglas de autoscale | HTTP concurrency 50 req | HTTP concurrency 50 req |
| Costo estimado | **$8/mes** | **$25/mes** |

**Trade-off de scale-to-zero**: cold start de 5–15s en el primer request tras inactividad. Aceptable para API REST (login, perfil, tienda). Los usuarios toleran 1 request lento al inicio.

### 3.3 Game Server — Azure Container Apps

**Justificación**: Mismo runtime que la API pero con perfil distinto: NUNCA scale-to-zero, sticky sessions habilitadas, dimensionamiento por CPU.

| Característica | Tier mínimo (0–50 CCU) | Tier lanzamiento (50–300 CCU) |
|---|---|---|
| Plan | Consumption / Dedicated | Dedicated |
| Réplicas mínimas | **1** (NUNCA 0) | 2 |
| Réplicas máximas | 2 | 4 |
| vCPU por réplica | 0.5 | 1.0 |
| RAM por réplica | 1 GB | 2 GB |
| Reglas de autoscale | CPU > 70% | CPU > 70% |
| Session affinity | **Habilitado** (sticky sessions) | **Habilitado** |
| Costo estimado | **$20/mes** | **$60/mes** |

**Crítico**: Socket.IO + Redis adapter requiere sticky sessions activas para que reconexiones del mismo cliente vuelvan al mismo pod. Sin esto hay overhead extra en pub/sub.

### 3.4 PostgreSQL — Azure Database for PostgreSQL Flexible Server

**Justificación**: PaaS administrado con backups automáticos, HA opcional, escalado vertical sin downtime.

| Característica | Tier mínimo | Tier lanzamiento |
|---|---|---|
| SKU | B1ms Burstable | B2s Burstable |
| vCPU | 1 | 2 |
| RAM | 2 GB | 4 GB |
| Storage | 32 GB | 32 GB |
| Backup retention | 7 días (incluido) | 7 días (incluido) |
| HA | No | No (opcional) |
| Costo estimado | **$18/mes** | **$45/mes** |

**Cuándo upgradear**: monitorear CPU credits del tier Burstable. Si se agotan sostenidamente → migrar a General Purpose D2s_v3 (CPU dedicada, ~$140/mes).

### 3.5 Redis — Azure Cache for Redis

**Justificación**: Estado de salas activas + Socket.IO pub/sub + refresh tokens + rate limiting. Tier Basic ya tiene persistencia.

| Característica | Tier mínimo | Tier lanzamiento |
|---|---|---|
| SKU | C0 Basic | C1 Basic |
| Memoria | 250 MB | 1 GB |
| Connections | 256 | 1000 |
| SLA | No | No |
| Costo estimado | **$17/mes** | **$40/mes** |

**Cuándo upgradear a Standard/Premium**: necesidad de SLA, replicación o cluster (>50 instancias de game-server).

### 3.6 Container Registry — Azure Container Registry

| Característica | Valor |
|---|---|
| SKU | Basic |
| Storage incluido | 10 GB |
| Costo | **$5/mes** |

### 3.7 Observability — Log Analytics + Application Insights

| Característica | Valor |
|---|---|
| Plan | Pay-as-you-go |
| Ingesta estimada | 5 GB/mes |
| Retention | 30 días |
| Costo | **$12/mes** |

**Crítico desde el día 1**: sin métricas reales de CCU y latencia, escalás a ciegas.

### 3.8 Edge / CDN — Cloudflare Free (NO Azure Front Door)

**Justificación**: Azure Front Door Standard cuesta $35/mes. Cloudflare Free hace el 90% de lo mismo gratis: SSL, DDoS L7, CDN, custom domain, rules.

**Migrar a Azure Front Door cuándo**:
- Se necesita WAF avanzado (compliance)
- Se necesita routing por path único en lugar de subdominios
- Tráfico justifica los $35/mes

---

## 4. Proyección de recursos por CCU

### 4.1 Supuestos del modelo

- Cada sala: 4 jugadores humanos + 4 bots = 8 entidades activas
- Game loop: 30 ticks/seg → 30 broadcasts/seg por sala
- Promedio: 2–3 jugadores reales por sala
- Payload `game_state` promedio: ~2 KB/tick/jugador

### 4.2 Tabla de dimensionamiento

| CCU | Salas activas | Game-server | API | PostgreSQL | Redis | Bandwidth/mes |
|---|---|---|---|---|---|---|
| 50 | ~20 | 1× 0.5vCPU 1GB | 1× 0.25vCPU 0.5GB | B1ms | C0 250MB | ~50 GB |
| 300 | ~120 | 2× 1vCPU 2GB autoscale | 2× 0.5vCPU 1GB | B2s | C1 1GB | ~300 GB |
| 1000 | ~400 | 4× 2vCPU 4GB autoscale | 3× 1vCPU 2GB | D2s_v3 GP | C1 Standard | ~1 TB |
| 3000 | ~1200 | 8× 2vCPU 4GB autoscale | 4× 1vCPU 2GB | D4s_v3 + 1 replica | C2 Standard | ~3 TB |
| 10000 | ~4000 | 20× 2vCPU 4GB + AKS | 6× 2vCPU 4GB | D8s_v3 + 2 replicas | C3 Premium cluster | ~10 TB |

### 4.3 Cuello de botella esperado por capa (orden)

1. **Game Server CPU** (game loop 30Hz × N salas) — primero en saturar
2. **WebSocket bandwidth** (~3 KB/s × jugador × 30 ticks)
3. **Redis** (solo a >50 instancias de game-server)
4. **PostgreSQL** (no es hot path durante la partida)

---

## 5. Costos detallados (East US, pay-as-you-go USD/mes)

### 5.1 Tier ARRANQUE — 0–50 CCU (beta cerrada)

| Recurso | SKU | Costo |
|---|---|---|
| Static Web Apps (frontend) | Free | **$0** |
| Container Apps — Game Server | 1× 0.5vCPU 1GB, mín 1 réplica | $20 |
| Container Apps — API | 1× 0.25vCPU 0.5GB, scale-to-zero | $8 |
| PostgreSQL Flexible | B1ms + 32GB storage | $18 |
| Azure Cache for Redis | C0 Basic 250MB | $17 |
| Container Registry | Basic | $5 |
| Log Analytics + App Insights | 5 GB/mes | $12 |
| Bandwidth egress (Azure) | ~50 GB | $5 |
| Cloudflare | Free | $0 |
| **TOTAL** | | **~$85/mes** |

### 5.2 Tier LANZAMIENTO — 50–300 CCU

| Recurso | SKU | Costo |
|---|---|---|
| Static Web Apps (frontend) | Free | **$0** |
| Container Apps — Game Server | 2× 1vCPU 2GB Dedicated | $60 |
| Container Apps — API | 2× 0.5vCPU 1GB Consumption | $25 |
| PostgreSQL Flexible | B2s + 32GB | $45 |
| Azure Cache for Redis | C1 Basic 1GB | $40 |
| Container Registry | Basic | $5 |
| Log Analytics + App Insights | ~10 GB/mes | $20 |
| Bandwidth egress (Azure) | ~300 GB | $25 |
| Cloudflare | Free | $0 |
| **TOTAL** | | **~$220/mes** |

### 5.3 Proyección por crecimiento

| CCU | USD/mes | USD/CCU |
|---|---|---|
| 50 | $85 | $1.70 |
| 300 | $220 | $0.73 |
| 1000 | $620 | $0.62 |
| 3000 | $1,750 | $0.58 |
| 10000 | $5,400 | $0.54 |

Costo por CCU **baja con la escala** (costos fijos se diluyen).

---

## 6. Trade-offs y riesgos conocidos

### 6.1 Sticky sessions en Container Apps
Socket.IO necesita que reconexiones del mismo cliente vuelvan al mismo pod. **Session affinity DEBE estar habilitado** en el Container App del game-server. Sin esto, el Redis adapter compensa pero hay overhead pub/sub extra.

### 6.2 Cold start del API
Scale-to-zero implica 5–15s en el primer request post-inactividad. Aceptable para login/perfil. **Game Server NUNCA scale-to-zero**.

### 6.3 PostgreSQL Burstable y CPU credits
El tier B1ms/B2s usa créditos de CPU. Si la API se vuelve hot sostenidamente → throttling. Migrar a General Purpose cuando se observe agotamiento de credits en Application Insights.

### 6.4 Bandwidth de assets estáticos
Los 200 sprites de skins se sirven desde Static Web Apps + Cloudflare CDN (cache automática). **No saturan el backend**. Si en algún momento se cambia a servir desde Container Apps, vigilar bandwidth egress de Azure (es el costo "oculto" que más sorprende).

### 6.5 CORS multi-dominio
Frontend en `app.dominio`, API en `api.dominio`, WebSocket en `ws.dominio`. Requiere:
- `app.enableCors({ origin: 'https://app.dominio', credentials: true })` en NestJS API
- `cors: { origin: 'https://app.dominio' }` en Socket.IO Gateway del game-server
- Cookies con `SameSite=None; Secure` si se usan

### 6.6 Stripe webhook
El webhook de Stripe debe apuntar a `https://api.dominio/stripe/webhook`. La verificación de firma requiere raw body (ya está habilitado en NestJS según `plan-trabajo.md` Fase 6.1).

---

## 7. Plan de migración desde el CI/CD actual

El proyecto tiene hoy `.github/workflows/deploy.yml` apuntando a despliegue por SSH a VPS. Cambios necesarios:

1. **Frontend**: nuevo workflow generado por Static Web Apps al conectar el repo.
2. **API y Game Server**:
   - Build de Docker image → push a Azure Container Registry
   - `az containerapp update --image ...` para actualizar la revisión
   - Eliminar pasos de SSH y `docker compose up` remoto
3. **Secrets en GitHub**:
   - `AZURE_CREDENTIALS` (service principal con permisos al Resource Group)
   - `ACR_NAME`, `ACR_USERNAME`, `ACR_PASSWORD`
   - Eliminar `VPS_HOST`, `VPS_USER`, `VPS_KEY`

---

## 8. Setup inicial — checklist de orden de creación

Orden recomendado de provisioning (algunos pasos dependen de otros):

1. [ ] Comprar dominio (Namecheap/Cloudflare Registrar, ~$10/año)
2. [ ] Configurar Cloudflare DNS para el dominio
3. [ ] Crear cuenta Azure (con crédito gratuito $200 USD)
4. [ ] Crear Resource Group `arena-siege-tanks-prod` en East US
5. [ ] Crear Azure Container Registry
6. [ ] Crear PostgreSQL Flexible Server B1ms + database `arena_siege`
7. [ ] Crear Azure Cache for Redis C0 Basic
8. [ ] Crear Log Analytics Workspace + Application Insights
9. [ ] Crear Container Apps Environment (conectado a Log Analytics)
10. [ ] Build + push de imágenes Docker (API y Game Server) al ACR
11. [ ] Crear Container App API con variables de entorno (conn strings)
12. [ ] Crear Container App Game Server con session affinity habilitado
13. [ ] Crear Static Web App conectado al repo de GitHub
14. [ ] Configurar custom domains en Cloudflare → Container Apps y Static Web App
15. [ ] Aplicar CORS y URLs absolutas en el frontend
16. [ ] Smoke test end-to-end (login, partida, compra de skin, webhook Stripe)

---

## 9. Cuándo replantear esta arquitectura

| Trigger | Acción |
|---|---|
| >2000 CCU sostenidos | Evaluar migración a AKS para control fino de pods |
| >5000 CCU sostenidos | Multi-región (replicar stack completo en otra región Azure) |
| Latencia >200ms para LATAM crítica | Agregar región Brazil South o usar Azure Front Door con backends en ambas regiones |
| Compliance (PCI, GDPR estricto) | Premium Redis con encriptación en tránsito + Front Door con WAF |
| Bandwidth >5 TB/mes | Migrar assets estáticos a Azure Blob + Azure CDN tier dedicado |

---

## 10. Referencias

- Arquitectura general del sistema: [`arquitectura-general.md`](../01-arquitectura/arquitectura-general.md)
- Docker Compose actual (desarrollo): [`docker-compose.md`](docker-compose.md)
- Nginx actual (producción VPS — a reemplazar): [`nginx.md`](nginx.md)
- CI/CD actual (a migrar): [`ci-cd.md`](ci-cd.md)
- Plan de trabajo: [`plan-trabajo.md`](../00-plan/plan-trabajo.md)
