# Azure — Arquitectura y Costos

> **Precios verificados en mayo 2026** consultando la Azure Retail Prices API en tiempo real
> para la región `westus2` (donde ya está desplegado el Static Web App de bunkertank.io).
> Los valores anteriores a este documento eran estimaciones con errores — usar solo este archivo.

---

## Arquitectura base en Azure

```
Internet
    │
    ├──► Static Web App (Angular + Phaser)      bunkertank.io     [ya desplegado]
    │         │ REST  → api.bunkertank.io
    │         │ WS    → ws.bunkertank.io
    │         ▼
    └──► Container Apps Environment — Games/bunkertank-env  (westus2)
              ├── api-service       NestJS REST     :3000
              └── game-server       NestJS Socket.IO :3001
                        │
                        ├──► Azure Cache for Redis Standard C1   [Tier 1+]
                        └──► PostgreSQL Flexible Server           [todos los tiers]
```

**Notas de red:**
- Container Apps Environment actúa como red interna — los servicios se descubren por nombre.
- No se necesita Nginx: Container Apps tiene ingress HTTP/WebSocket nativo con TLS automático.
- El Static Web App apunta a los Container Apps vía CORS + subdominios en Cloudflare.

---

## Precios unitarios verificados — Azure API (westus2, mayo 2026)

> Fuente: `https://prices.azure.com/api/retail/prices` consultada en vivo el 17/05/2026.
> Todos los valores en USD. Incluyen el corte de Google/Microsoft al publisher.

### Container Apps — Consumption Plan

| Recurso | Precio unitario | Costo 24/7 por mes |
|---|---|---|
| vCPU activo | $0.000034 / segundo | **$88.13 / vCPU / réplica** |
| Memoria activa | $0.000004 / GiB-segundo | **$10.37 / GiB / réplica** |
| Free grant mensual (por suscripción) | 180,000 vCPU-seg + 360,000 GiB-seg | descuento de **~$7.56/mes** |

> El free grant aplica una sola vez por suscripción, compartido entre todos los Container Apps.

### PostgreSQL Flexible Server

| SKU | vCores | RAM | Precio/hora | Precio/mes (24/7) |
|---|---|---|---|---|
| **B1ms** | 1 | 2 GB | $0.017 | **$12** |
| **B2ms** | 2 | 8 GB | $0.136 | **$98** |
| **B2s** | 2 | 4 GB | $0.068 | **$49** |
| GP D2s (General Purpose) | 2 | 8 GB | ~$0.178 | **~$128** |
| GP D4s (General Purpose) | 4 | 16 GB | ~$0.356 | **~$256** |

Storage adicional: **$0.115 / GB / mes** (32 GB = $3.68/mes)

> B1ms a $12/mes es el tier más económico viable. Soporta ~50 conexiones concurrentes.
> B2ms era la estimación original pero cuesta $98/mes, no $50 — error corregido aquí.

### Azure Cache for Redis

| SKU | Memoria | Réplica | Precio/hora | Precio/mes (24/7) |
|---|---|---|---|---|
| Basic C0 | 250 MB | No | $0.022 | **$16** |
| **Standard C1** | 1 GB | Sí + failover | $0.069 | **$50** |
| Standard C2 | 6 GB | Sí + failover | $0.112 | **$81** |

> Standard C1 a $50/mes es el mínimo recomendado para producción (incluye réplica y failover).
> Basic C0 no tiene réplica — si cae, el pub/sub de Socket.IO se interrumpe hasta recuperación.

### Otros recursos

| Recurso | Precio |
|---|---|
| Container Registry Basic | $5/mes ($0.1666/día) |
| Static Web App Free | $0/mes |
| Backup PostgreSQL (primeros 32 GB) | $0/mes (incluido) |

---

## Tier 0 — Beta / Validación

> **Cuándo**: desarrollo, pruebas internas, primeros 50–200 usuarios antes del lanzamiento público.
> **Limitación clave**: scale-to-zero → cold start de 2–5 seg en la primera conexión WebSocket.
> Aceptable en beta. No usar en producción pública.

| Recurso | Configuración | $/mes real |
|---|---|---|
| Static Web App | Free | $0 |
| Container Apps — Game Server | **min 0 réplicas**, 0.5 vCPU / 1 GB, max 3 | ~$5–15 |
| Container Apps — API | **min 0 réplicas**, 0.25 vCPU / 0.5 GB, max 2 | ~$2–8 |
| PostgreSQL B1ms | 1 vCore, 2 GB RAM, 32 GB storage | **$16** |
| Container Registry Basic | — | **$5** |
| **TOTAL** | | **~$28–44/mes** |

> Redis no existe en Tier 0 — el game server corre réplica única. Cuando sube a Tier 1 se agrega Redis y se habilita el multi-réplica con el adapter ya implementado en el código.

---

## Tier 1 — Lanzamiento público

### Opción A — Recursos amplios (mayor capacidad inmediata)

| Recurso | Configuración | $/mes real |
|---|---|---|
| Static Web App | Free | $0 |
| Container Apps — Game Server | **min 2 réplicas**, 1 vCPU / 2 GB c/u | **$218** |
| Container Apps — API | **min 1 réplica**, 0.5 vCPU / 1 GB | **$54** |
| PostgreSQL B2ms | 2 vCores, 8 GB RAM, 32 GB storage | **$102** |
| Azure Cache for Redis Standard C1 | 1 GB, réplica + failover | **$50** |
| Container Registry Basic | — | **$5** |
| Free grant descuento | — | **–$8** |
| **TOTAL** | | **~$421/mes** |

> Soporta hasta ~500 concurrent cómodamente. Upgrade de PostgreSQL a GP D2s cuando supere 150 conexiones activas simultáneas.

---

### Opción B — Recursos ajustados ✅ SELECCIONADA

> **Por qué**: suficiente para 0–300 concurrent players. PostgreSQL B1ms cubre los primeros meses. Upgrade incremental a medida que el juego crece — ningún cambio de arquitectura, solo resize de recursos.

| Recurso | Configuración | $/mes real |
|---|---|---|
| Static Web App | Free | $0 |
| Container Apps — Game Server | **min 2 réplicas**, 0.5 vCPU / 1 GB c/u | **$109** |
| Container Apps — API | **min 1 réplica**, 0.25 vCPU / 0.5 GB | **$27** |
| PostgreSQL B1ms | 1 vCore, 2 GB RAM, 32 GB storage | **$16** |
| Azure Cache for Redis Standard C1 | 1 GB, réplica + failover | **$50** |
| Container Registry Basic | — | **$5** |
| Free grant descuento | — | **–$8** |
| **TOTAL** | | **~$199/mes** |

**Break-even de ads con Opción B**: ~443 DAU (escenario realista $0.015 ARPDAU).

---

## Tier 2 — Crecimiento (upgrade desde Opción B)

> Se llega aquí cuando el game server supera el 70% de CPU en horas pico, o hay más de 40 conexiones activas simultáneas en PostgreSQL.
> El escalamiento de Container Apps es automático — solo se ajustan los límites y el tamaño de réplica.

| Recurso | Configuración | $/mes (base → pico) |
|---|---|---|
| Static Web App | Free | $0 |
| Container Apps — Game Server | **1 vCPU / 2 GB**, min 2 → auto hasta 6 réplicas | $218 → $527 |
| Container Apps — API | **0.5 vCPU / 1 GB**, min 1 → auto hasta 4 réplicas | $54 → $218 |
| PostgreSQL B2ms | 2 vCores, 8 GB (upgrade desde B1ms) | **$102** |
| Azure Cache for Redis Standard C1 | 1 GB | **$50** |
| Container Registry Basic | — | **$5** |
| Free grant descuento | — | **–$8** |
| **TOTAL** | | **~$421 → $894/mes** |

**Trigger de upgrade B1ms → B2ms:**
- CPU PostgreSQL sostenido >70% en hora pico
- Latencia de queries P95 >100 ms
- Conexiones activas >40 simultáneas

---

## Tier 3 — Escala .io

> Equivalente estimado a Wormax.io en su estado actual (~2,000–5,000 concurrent players peak).

| Recurso | Configuración | $/mes (base → pico) |
|---|---|---|
| Static Web App | Free | $0 |
| Container Apps — Game Server | **1 vCPU / 2 GB**, min 3 → auto hasta 10 réplicas | $326 → $873 |
| Container Apps — API | **0.5 vCPU / 1 GB**, min 2 → auto hasta 6 réplicas | $169 → $528 |
| PostgreSQL GP D2s | 2 vCores, 8 GB General Purpose | **$128** |
| Azure Cache for Redis Standard C2 | 6 GB, réplica + failover | **$81** |
| Container Registry Basic | — | **$5** |
| Free grant descuento | — | **–$8** |
| **TOTAL** | | **~$701 → $1,607/mes** |

---

## Tabla comparativa de tiers

| | Tier 0 Beta | Tier 1B ✅ | Tier 1A | Tier 2 | Tier 3 |
|---|---|---|---|---|---|
| **Costo base/mes** | ~$35 | **~$199** | ~$421 | ~$421 | ~$701 |
| **Costo pico/mes** | ~$44 | **~$199** | ~$421 | ~$894 | ~$1,607 |
| **Concurrent soportados** | 0–50 | 0–300 | 0–500 | 300–2,000 | 2,000–5,000+ |
| **Game server réplicas min** | 0 | 2 × 0.5vCPU | 2 × 1vCPU | 2 × 1vCPU | 3 × 1vCPU |
| **PostgreSQL** | B1ms ($16) | B1ms ($16) | B2ms ($102) | B2ms ($102) | GP D2s ($128) |
| **Redis** | — | Standard C1 ($50) | Standard C1 ($50) | Standard C1 ($50) | Standard C2 ($81) |
| **Cold start posible** | Sí | No | No | No | No |
| **Break-even ads (ARPDAU $0.015)** | 78 DAU | **443 DAU** | 937 DAU | — | — |

---

## Camino de upgrades desde Opción B

```
Tier 0 ($35/mes)
  → lanzamiento público
Tier 1B ($199/mes)  ← AQUÍ ARRANCAMOS
  → game server CPU >70% en pico  →  subir réplicas a 1 vCPU/2 GB → +$109/mes
  → PostgreSQL >40 conexiones      →  upgrade B1ms → B2ms          → +$86/mes
  ↓
Tier 2 ($421–894/mes)
  → game server necesita >4 réplicas frecuentemente
  → PostgreSQL >150 conexiones activas → upgrade B2ms → GP D2s     → +$26/mes
  ↓
Tier 3 ($701–1,607/mes)
```

Cada step de upgrade es un comando de Azure CLI de 2 minutos. Sin cambio de arquitectura.

---

## Correcciones vs. estimaciones anteriores

| Recurso | Estimación original | **Precio real verificado** | Error |
|---|---|---|---|
| Container Apps vCPU | $0.000024/seg | **$0.000034/seg** | +42% |
| PostgreSQL B2ms | $50/mes | **$98/mes** | +96% |
| PostgreSQL B1ms | $12–15/mes | **$16/mes** (con storage) | ≈ correcto |
| Redis Standard C1 | $50/mes | **$50/mes** | ✓ exacto |
| Container Registry Basic | $5/mes | **$5/mes** | ✓ exacto |
| **Tier 1 total (Opción A)** | $294/mes | **$421/mes** | +43% |
| **Tier 1 total (Opción B)** | no existía | **$199/mes** | — |

---

## Datos de despliegue actual

| Dato | Valor |
|---|---|
| Resource group | `Games` |
| Región | `westus2` |
| Static Web App | `bunkertank` |
| Container Registry | `bunkertankacr` (por crear) |
| Container Apps Environment | `bunkertank-env` (por crear) |
| PostgreSQL server | `bunkertank-pg` (por crear) |
| Redis | `bunkertank-redis` (por crear) |
| Dominio | `bunkertank.io` |
| API endpoint | `api.bunkertank.io` |
| WS endpoint | `ws.bunkertank.io` |
