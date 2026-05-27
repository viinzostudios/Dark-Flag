# Despliegue Azure — Guía Real de Producción

> **Estado**: infraestructura desplegada y funcionando (mayo 2026).
> Este documento refleja lo que **realmente se hizo** — no el plan original.
> Úsalo como referencia si necesitás reconstruir desde cero o hacer cambios.

---

## Arquitectura desplegada

```
bunkertank.io          → Azure Static Web App (ya existía)
api.bunkertank.io      → Container App — api-service   (NestJS REST, port 3000)
ws.bunkertank.io       → Container App — game-server   (NestJS Socket.IO, port 3001)

DNS: Cloudflare
TLS: Azure Container Apps managed certificates (automático)
CI/CD: GitHub Actions → ACR → Container Apps
```

### Recursos en Azure

| Recurso | Nombre | Resource Group | Región |
|---|---|---|---|
| Container Registry | `bunkertankacr` | Games | westus2 |
| Container Apps Environment | `bunkertank-env` | Games | westus2 |
| Container App (API) | `api-service` | Games | westus2 |
| Container App (Game Server) | `game-server` | Games | westus2 |
| PostgreSQL Flexible Server | `bunkertank-pg` | Games | westus2 |
| Redis Cache | `bunkertank-redis` | Games | westus2 |

---

## Pre-requisitos antes de desplegar

### Socket.IO Redis Adapter (obligatorio con 2+ réplicas)

El game server necesita el Redis Adapter para sincronizar eventos entre réplicas.
Ya está implementado en `backend/game-server/src/adapters/redis-io.adapter.ts`.

Si necesitás instalarlo desde cero:

```bash
cd backend/game-server
npm install @socket.io/redis-adapter ioredis
```

### Namespace registration en Azure

La primera vez que usás una suscripción, algunos namespaces no están registrados.
Correr **una sola vez** y esperar ~4 minutos cada uno:

```powershell
$az = "C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin\az.cmd"
& $az provider register --namespace Microsoft.App
& $az provider register --namespace Microsoft.ContainerRegistry
& $az provider register --namespace Microsoft.Cache
& $az provider register --namespace Microsoft.DBforPostgreSQL
& $az provider register --namespace Microsoft.OperationalInsights

# Verificar estado
& $az provider show --namespace Microsoft.App --query registrationState -o tsv
```

---

## Fase 1 — Crear infraestructura

```powershell
$az  = "C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin\az.cmd"
$RG  = "Games"
$LOC = "westus2"
```

### 1.1 — Login

```powershell
# Usar device code — más confiable que el flujo de navegador en Windows
& $az login --use-device-code
# Abre https://login.microsoft.com/device y entrá el código que aparece
```

### 1.2 — Container Registry

```powershell
& $az acr create `
  --resource-group $RG `
  --name bunkertankacr `
  --sku Basic `
  --admin-enabled true

# Obtener credenciales (necesarias para GitHub Secrets y Container Apps)
& $az acr credential show --name bunkertankacr
# Anota: username y passwords[0].value
```

### 1.3 — Container Apps Environment

```powershell
& $az containerapp env create `
  --name bunkertank-env `
  --resource-group $RG `
  --location $LOC
```

### 1.4 — PostgreSQL Flexible Server

```powershell
# Generar un password SOLO alfanumérico (sin caracteres especiales)
# IMPORTANTE: caracteres como %, ^, !, * en el password generan problemas
# al pasarlos en DATABASE_URL — usar solo letras y números
$pgPass = node -e "
const c = require('crypto');
const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
let p = 'A3a'; // garantiza mayuscula + minuscula + numero
for (let i = 0; i < 21; i++) p += chars[c.randomInt(chars.length)];
console.log(p.split('').sort(() => 0.5 - Math.random()).join(''));
"
Write-Output "Guardá este password: $pgPass"

& $az postgres flexible-server create `
  --resource-group $RG `
  --name bunkertank-pg `
  --location $LOC `
  --sku-name Standard_B1ms `
  --tier Burstable `
  --storage-size 32 `
  --version 16 `
  --admin-user bunkertankadmin `
  --admin-password $pgPass `
  --yes

# Crear la base de datos
& $az postgres flexible-server db create `
  --resource-group $RG `
  --server-name bunkertank-pg `
  --database-name bunkertank

# Permitir conexiones desde Azure Container Apps
& $az postgres flexible-server firewall-rule create `
  --resource-group $RG `
  --name bunkertank-pg `
  --rule-name allow-azure-services `
  --start-ip-address 0.0.0.0 `
  --end-ip-address 0.0.0.0
```

> **Por qué password alfanumérico**: la `DATABASE_URL` en Container Apps
> pasa el valor a través de varios capas (PowerShell → az.cmd → Azure API).
> Los caracteres `%`, `^`, `!`, `*` se corrompen en ese proceso.
> Con letras y números el password pasa sin alteraciones.

### 1.5 — Azure Cache for Redis

```powershell
& $az redis create `
  --resource-group $RG `
  --name bunkertank-redis `
  --sku Standard `
  --vm-size c1 `
  --location $LOC
# Tarda 15–20 minutos. Continuar con otros pasos mientras espera.

# Cuando termine, obtener la key:
& $az redis list-keys --name bunkertank-redis --resource-group $RG --query primaryKey -o tsv
```

### 1.6 — Container Apps (con imagen placeholder inicial)

```powershell
# API REST — 0.25 vCPU / 0.5 GB, mínimo 1 réplica
& $az containerapp create `
  --name api-service `
  --resource-group $RG `
  --environment bunkertank-env `
  --image mcr.microsoft.com/azuredocs/containerapps-helloworld:latest `
  --target-port 3000 `
  --ingress external `
  --min-replicas 1 `
  --max-replicas 5 `
  --cpu 0.25 `
  --memory 0.5Gi

# Game Server — 0.5 vCPU / 1 GB, mínimo 2 réplicas (WebSocket estable)
& $az containerapp create `
  --name game-server `
  --resource-group $RG `
  --environment bunkertank-env `
  --image mcr.microsoft.com/azuredocs/containerapps-helloworld:latest `
  --target-port 3001 `
  --ingress external `
  --min-replicas 2 `
  --max-replicas 8 `
  --cpu 0.5 `
  --memory 1.0Gi

# Obtener los FQDNs (necesarios para Cloudflare y TLS)
& $az containerapp show --name api-service --resource-group $RG `
  --query properties.configuration.ingress.fqdn -o tsv
& $az containerapp show --name game-server --resource-group $RG `
  --query properties.configuration.ingress.fqdn -o tsv
```

### 1.7 — Configurar credentials del ACR en los Container Apps

```powershell
$acrPass = "<password del ACR del paso 1.2>"

& $az containerapp registry set `
  --name api-service `
  --resource-group $RG `
  --server bunkertankacr.azurecr.io `
  --username bunkertankacr `
  --password $acrPass

& $az containerapp registry set `
  --name game-server `
  --resource-group $RG `
  --server bunkertankacr.azurecr.io `
  --username bunkertankacr `
  --password $acrPass
```

> **Esto es obligatorio.** Sin este paso, el Container App no puede pullear
> la imagen del ACR y el deploy del pipeline falla con UNAUTHORIZED.

### 1.8 — Setear variables de entorno en los Container Apps

```powershell
# Primero armá las URLs con los valores reales
$pgPass  = "<password del paso 1.4>"
$redisKey = "<key del paso 1.5>"

$dbUrl    = "postgresql://bunkertankadmin:${pgPass}@bunkertank-pg.postgres.database.azure.com:5432/bunkertank?sslmode=require"
$redisUrl = "rediss://:${redisKey}@bunkertank-redis.redis.cache.windows.net:6380"

# Generar JWT secrets
$jwtSecret = node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
$jwtRefresh = node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# API
& $az containerapp update `
  --name api-service `
  --resource-group $RG `
  --set-env-vars `
    "NODE_ENV=production" `
    "PORT=3000" `
    "DATABASE_URL=$dbUrl" `
    "REDIS_URL=$redisUrl" `
    "JWT_SECRET=$jwtSecret" `
    "JWT_REFRESH_SECRET=$jwtRefresh" `
    "FRONTEND_URL=https://bunkertank.io"

# Game Server
& $az containerapp update `
  --name game-server `
  --resource-group $RG `
  --set-env-vars `
    "NODE_ENV=production" `
    "PORT=3001" `
    "DATABASE_URL=$dbUrl" `
    "REDIS_URL=$redisUrl" `
    "JWT_SECRET=$jwtSecret" `
    "API_URL=https://api.bunkertank.io" `
    "CORS_ORIGIN=https://bunkertank.io"
```

---

## Fase 2 — GitHub Actions CI/CD

### 2.1 — Service Principal con OIDC (sin secrets en JSON)

```powershell
$SUB_ID = (& $az account show --query id -o tsv)

# Crear service principal
& $az ad sp create-for-rbac `
  --name "bunkertank-github-actions" `
  --role contributor `
  --scopes "/subscriptions/$SUB_ID/resourceGroups/$RG"
# Anota: appId (= clientId) y tenant

# Crear federated credential para OIDC desde GitHub Actions
$appId = "<appId del comando anterior>"
$json = '{"name":"github-actions-master","issuer":"https://token.actions.githubusercontent.com","subject":"repo:viinzostudios/Arena-Siege-Tanks:ref:refs/heads/master","description":"GitHub Actions deploy from master","audiences":["api://AzureADTokenExchange"]}'
[System.IO.File]::WriteAllText("$env:TEMP\fedcred.json", $json, [System.Text.Encoding]::UTF8)

& $az ad app federated-credential create `
  --id $appId `
  --parameters "$env:TEMP\fedcred.json"
```

> **Por qué OIDC en vez del JSON de `creds`**: `azure/login@v2` en las
> versiones recientes trata el JSON de `creds` diferente según la versión
> del action. Los parámetros individuales + OIDC son el método recomendado
> actualmente y evitan problemas de parsing de JSON en Windows/PowerShell.

### 2.2 — GitHub Secrets a configurar

```powershell
$REPO = "viinzostudios/Arena-Siege-Tanks"

gh secret set ACR_LOGIN_SERVER    --body "bunkertankacr.azurecr.io" --repo $REPO
gh secret set ACR_USERNAME        --body "bunkertankacr"            --repo $REPO
gh secret set ACR_PASSWORD        --body "<password del ACR>"       --repo $REPO
gh secret set AZURE_CLIENT_ID     --body "<appId del SP>"           --repo $REPO
gh secret set AZURE_TENANT_ID     --body "<tenantId>"               --repo $REPO
gh secret set AZURE_SUBSCRIPTION_ID --body "<subscriptionId>"       --repo $REPO
```

### 2.3 — Workflow de deploy

Ver archivo actual: `.github/workflows/deploy.yml`

Puntos clave del workflow:
- Cada job necesita `permissions: id-token: write` para OIDC
- Login con `client-id`, `tenant-id`, `subscription-id` (sin `client-secret`)
- El deploy es `az containerapp update --image ...` — solo actualiza la imagen
- Los env vars se setean directamente en el Container App (paso 1.8), no en el workflow

---

## Fase 3 — DNS y TLS en Cloudflare

### 3.1 — Registros DNS

| Tipo | Nombre | Contenido | Proxy Cloudflare |
|---|---|---|---|
| CNAME | `api` | FQDN del api-service en Azure | **Naranja (proxy ON)** |
| CNAME | `ws` | FQDN del game-server en Azure | **Gris (DNS-only)** |
| TXT | `asuid.api` | Token de verificación de Azure | (no importa) |
| TXT | `asuid.ws` | Token de verificación de Azure | (no importa) |

> **Por qué `ws` va en gris**: Cloudflare como proxy agrega latencia en
> conexiones WebSocket de larga duración. Para el game server en tiempo
> real, ir directo a Azure elimina ese overhead.

### 3.2 — TLS binding

```powershell
# IMPORTANTE: antes de correr el bind del api, poner el CNAME de api en
# DNS-only (gris) temporalmente. Cloudflare proxy bloquea la validación CNAME.
# Después de que Azure emite el certificado, volvé a poner naranja.

& $az containerapp hostname bind `
  --name api-service `
  --resource-group $RG `
  --hostname api.bunkertank.io `
  --environment bunkertank-env `      # <- obligatorio, sin esto falla
  --validation-method CNAME

& $az containerapp hostname bind `
  --name game-server `
  --resource-group $RG `
  --hostname ws.bunkertank.io `
  --environment bunkertank-env `
  --validation-method CNAME

# El certificado puede tardar hasta 20 minutos en emitirse.
# Verificar: buscar "bindingType: SniEnabled" en el output.
```

---

## Fase 4 — Actualizar el frontend

En `frontend/src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.bunkertank.io',
  socketUrl: 'wss://ws.bunkertank.io',
  stripePublishableKey: 'pk_live_...',
};
```

Commitear y pushear — el Static Web App se redespliega automáticamente.

---

## Rotación de secrets

Cuando necesites rotar un secret:

**PostgreSQL password:**
```powershell
$newPass = node -e "
const c = require('crypto');
const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
let p = 'A3a';
for (let i = 0; i < 21; i++) p += chars[c.randomInt(chars.length)];
console.log(p.split('').sort(() => 0.5 - Math.random()).join(''));
"
& $az postgres flexible-server update `
  --name bunkertank-pg --resource-group $RG --admin-password $newPass
# Luego actualizar DATABASE_URL en ambos Container Apps (paso 1.8)
```

**JWT Secrets:**
```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
# Actualizar en Container Apps con az containerapp update --set-env-vars
```

**ACR Password:**
```powershell
& $az acr credential renew --name bunkertankacr --password-name password
& $az acr credential show --name bunkertankacr
# Actualizar GitHub Secret ACR_PASSWORD y az containerapp registry set en ambos apps
```

---

## Gotchas documentados

1. **Namespaces no registrados**: en suscripciones nuevas, `az redis create`,
   `az containerapp` y otros fallan con `MissingSubscriptionRegistration`.
   Registrar los namespaces y esperar ~4 min cada uno.

2. **az login en Windows**: el flujo de navegador a veces se cierra sin
   completar. Usar siempre `--use-device-code`.

3. **Cloudflare proxy bloquea validación TLS de Azure**: para el hostname
   bind, el CNAME debe estar en DNS-only durante la validación.
   Después puede volver a proxy.

4. **`--environment` obligatorio en hostname bind**: sin ese parámetro
   el comando falla con error genérico.

5. **Password PostgreSQL solo alfanumérico**: caracteres especiales (`%`,
   `^`, `!`, `*`) en el password se corrompen al pasar por PowerShell →
   az.cmd → Container Apps API. Usar solo letras y números.

6. **Container App necesita credenciales ACR explícitas**: aunque el ACR
   esté en la misma suscripción, hay que hacer `az containerapp registry set`
   para que el Container App pueda pullear imágenes.

7. **OIDC con `azure/login@v2`**: usar parámetros individuales
   (`client-id`, `tenant-id`, `subscription-id`) + `permissions: id-token: write`
   en el job. El parámetro `client-secret` NO existe en este action —
   la autenticación sin secret funciona via federated credentials.

8. **Logs en streaming**: `az containerapp logs show` es un comando de
   streaming que no termina solo. Para diagnóstico rápido, usar
   `--tail N` con timeout o background task.
