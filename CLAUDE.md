# CLAUDE.md — Dark Flag

> Este archivo define las reglas de colaboración entre el desarrollador y Claude para este proyecto.
> Se aplica a todas las conversaciones, sin excepción.

---

## 1. CONTEXTO DEL PROYECTO

**Nombre**: Dark Flag
**Tipo**: Juego web multijugador FFA en arena oscura — buscar y entregar bandera con linternas
**Objetivo**: Producto comercial F2P con monetización por skins, ads y microtransacciones
**Directorio raíz**: `c:\VIINZO\Juego-AI-Social`

### Stack tecnológico (FIJO — no cambiar sin documentar la decisión)
| Capa | Tecnología |
|------|------------|
| Frontend | Angular 19 + Phaser 4.1 + TypeScript 5.5 |
| Backend API | NestJS 11 + Node.js 22 LTS |
| Game Server | NestJS 11 + Socket.IO 4.7 |
| Base de datos | PostgreSQL 16 |
| Cache / PubSub | Redis 7 |
| Infraestructura | Docker + Docker Compose + Nginx |
| CI/CD | GitHub Actions |

### Estructura de carpetas del proyecto
```
c:\VIINZO\Juego-AI-Social\
├── CLAUDE.md                  ← este archivo
├── docs/                      ← toda la documentación
├── frontend/                  ← Angular + Phaser
├── backend/
│   ├── api/                   ← NestJS API REST
│   └── game-server/           ← NestJS Game Server WebSocket
└── infra/
    └── docker-compose.yml
```

---

## 1b. INTEGRACIÓN OPENAI (GENERACIÓN DE ASSETS)

### API Key
- **Ubicación**: `C:\Users\fredy\.claude\openai_key` — fuera del proyecto, nunca commitear
- **Leer en PowerShell**: `(Get-Content "C:\Users\fredy\.claude\openai_key" -Raw).Trim()`
- **Variable en sesión**: `$apiKey = (Get-Content "C:\Users\fredy\.claude\openai_key" -Raw).Trim()`

### Modelos disponibles
| Modelo | Uso |
|--------|-----|
| `gpt-image-1` | **Preferido** — soporta fondo transparente nativo, mejor calidad |
| `dall-e-3` | Fallback si gpt-image-1 falla |

### Parámetros de generación
| Parámetro | Borrador | Final aprobado |
|-----------|----------|----------------|
| `quality` | `"low"` | `"high"` |
| `background` | `"transparent"` | `"transparent"` |
| `output_format` | `"png"` | `"png"` |

> **Nota**: `response_format` NO existe en `gpt-image-1` — la respuesta siempre devuelve `b64_json` en `data[0].b64_json`.

**Tamaños válidos ÚNICAMENTE**: `1024x1024`, `1536x1024`, `1024x1536`

### Workflow de generación
1. Claude lee el prompt del archivo `.json` en `docs/08-assets/prompts/`
2. Genera con `quality: "low"` (borrador barato)
3. Guarda en `docs/08-assets/review/{id}-draft.png`
4. Usuario revisa → aprueba o pide ajuste
5. Si aprueba: Claude regenera con `quality: "high"` → guarda en `frontend/public/assets/{category}/`
6. Si rechaza: Claude ajusta el prompt `.json` y vuelve al paso 2

### Estrategia de ahorro de tokens
- **Agrupar sprites** en una sola imagen siempre que sea posible:
  - Bullets (bounce3, 2, 1, 0) → grid 2×2 en una imagen 1024×1024
  - Tank body + cannon → imagen 1536×1024 (body izquierda, cannon derecha)
  - Pickups × 4 → grid 2×2 en 1024×1024
  - UI icons × 3 → grid en 1024×1024
  - Muros × 3 HP states → imagen 1024×1024 (stacked)
  - **Avatares** → grid 2×5 (10 avatares) en 1024×1024; cada celda ~512×204 px; crop+resize a 128×128 con Sharp
- **Efectos VFX**: 1 frame por imagen — el modelo no respeta "N frames side by side" con fidelidad suficiente
- Script `scripts/process-asset.js` (Node.js + Sharp) ensambla los sprite sheets

### Workflow de avatares (específico)
1. Generar en grids 2×5 (10 avatares por llamada, 1024×1024)
2. Draft se guarda en `docs/08-assets/review/avatars/{batch}-draft.png`
3. Script `scripts/generate-avatars-batch1.js` (o similar) hace crop automático:
   - Calcula `cellW = imgW / 2`, `cellH = imgH / 5`
   - Extrae cada celda con Sharp `.extract()` → `.resize(128, 128, { fit: 'contain', background: transparent })` → `.png()`
4. Output individual: `frontend/public/assets/avatars/avatar-XX.png` (128×128 px, fondo transparente)
5. Para lote final (quality: "high"): misma secuencia

### Rutas de output
```
Borradores:     docs/08-assets/review/{id}-draft.png
Assets finales: frontend/public/assets/
  ├── tanks/
  ├── projectiles/
  ├── walls/
  ├── pickups/
  ├── effects/
  ├── environment/
  └── ui/
```

### Reglas de uso de la key
- **Úsala solo para generar imágenes de assets del juego**
- **Prohibido** usar tokens para investigar cambios de arquitectura, explorar el plan de trabajo, o cualquier consulta que no sea generación de imágenes
- Si el billing se agota, se agota — no cambiar el plan de trabajo por eso
- Verificar el billing en: platform.openai.com/settings/organization/limits

### Estilo gráfico obligatorio
Ver `docs/08-assets/estilo-grafico.md` para el estilo completo.
**Resumen**: cartoon/cel-shaded, outlines negros gruesos (4px), colores saturados y brillantes, proporciones chunky, efectos exagerados cartoon. **NO** militar realista, **NO** pixel art, **NO** colores desaturados.

### Prompts en:
`docs/08-assets/prompts/` — un `.json` por asset con `prompt`, `negative_prompt`, `output` y `phaser_config`.

---

## 2. REGLA FUNDAMENTAL: DOCUMENTAR ANTES DE CODIFICAR

**Toda funcionalidad, módulo, endpoint, evento o componente debe estar documentado ANTES de escribir código.**

Orden obligatorio para cualquier implementación:
1. Definir en `docs/` el contrato (qué hace, inputs, outputs, reglas)
2. Revisar que no contradice documentación existente
3. Implementar el código
4. Si durante la implementación algo cambia respecto al doc → actualizar el doc

**No existe código sin documentación previa. Sin excepción.**

---

## 3. IDIOMA

- **Comunicación con el usuario**: Español siempre
- **Código fuente**: Inglés (nombres de variables, funciones, clases, archivos)
- **Comentarios en código**: Solo cuando el WHY no es obvio, en inglés
- **Documentación en `/docs`**: Español

---

## 3b. COMUNICACIÓN EFICIENTE (ahorro de tokens)

**Regla principal**: Responder solo lo estrictamente necesario. Cero relleno.

- **Sin introducciones ni cierres**: No "voy a hacer X", no "listo, hice X". Ir directo al resultado.
- **Sin resúmenes de lo que ya se ve**: El diff ya muestra qué cambió; no repetirlo en texto.
- **Sin confirmaciones de acciones obvias**: Si el build pasó, mostrar solo el output relevante.
- **Código**: Mostrar solo el fragmento modificado con contexto mínimo (`// ... resto igual`), nunca archivos completos a menos que sean nuevos.
- **Errores**: Reportar causa raíz + fix, no el stack trace completo a menos que sea ambiguo.
- **Preguntas**: Si falta información crítica, preguntar en una línea. No listar todas las opciones posibles.
- **Tareas largas**: Avanzar en silencio y reportar al terminar. No narrar cada paso.
- **Decisiones de arquitectura**: Dar una recomendación directa con el trade-off principal en 2 líneas. No listar todas las alternativas.

---

## 4. PERMISOS CONCEDIDOS AL INICIO DE SESIÓN

Claude tiene permiso automático para ejecutar los siguientes comandos sin pedir confirmación:

### Lectura y escritura de archivos
- Leer cualquier archivo del proyecto
- Crear y modificar archivos dentro de `c:\VIINZO\Juego-AI\`

### Comandos de terminal (PowerShell / Bash)
```
# Node / npm
node --version
npm --version
npm install [paquete]
npm run [script]
npx [comando]

# Angular CLI
ng version
ng new [nombre]
ng generate [tipo] [nombre]
ng build
ng serve
ng test

# NestJS CLI
nest new [nombre]
nest generate [tipo] [nombre]
nest build
nest start
nest start --watch

# Docker
docker --version
docker compose version
docker compose up
docker compose up -d
docker compose down
docker compose logs [servicio]
docker compose build
docker ps
docker images

# Git
git status
git log
git diff
git add [archivo]
git commit -m "[mensaje]"
git branch
git checkout [rama]
git pull
git push

# PostgreSQL client
psql [opciones]

# Utilidades
ls / dir
pwd
mkdir
cat / type
```

### Lo que SIEMPRE requiere confirmación explícita
- `git push --force`
- `docker compose down -v` (elimina volúmenes = datos)
- `rm -rf` / `Remove-Item -Recurse -Force` en directorios grandes
- Cualquier comando que afecte producción o datos reales
- Publicar a npm, desplegar a servidor remoto, enviar emails

---

## 5. CONVENCIONES DE GIT

```
feat: descripción corta          # nueva funcionalidad
fix: descripción corta           # corrección de bug
docs: descripción corta          # solo documentación
refactor: descripción corta      # refactor sin cambio funcional
test: descripción corta          # tests
chore: descripción corta         # build, deps, config
```

Ramas:
- `main` → producción estable
- `develop` → integración
- `feat/nombre-feature` → features
- `fix/nombre-bug` → bugs

---

## 6. CONVENCIONES DE CÓDIGO

### TypeScript
- Strict mode activado siempre
- Interfaces para contratos de datos, types para uniones/aliases
- No `any` — usar `unknown` si el tipo es desconocido
- Funciones puras donde sea posible

### Angular
- Standalone components (no NgModules salvo app.module)
- Signals para estado local
- Services para lógica de negocio
- Lazy loading en todas las rutas

### NestJS
- Un módulo por dominio (auth, users, game, economy, shop...)
- DTOs con class-validator para validación
- Guards para autenticación/autorización
- Interceptors para transformación de respuestas

### Phaser
- Una clase por escena
- GameObjects tipados
- No lógica de negocio en escenas (solo render + input)

---

## 7. TESTING

- Cada endpoint de API tiene al menos 1 test de integración
- Lógica crítica del juego (colisiones, rebotes, ranking) tiene unit tests
- No mockear la base de datos en tests de integración

---

## 8. SEGURIDAD (OBLIGATORIO)

- Nunca confiar en datos del cliente para lógica del juego
- El servidor es la autoridad de todo estado de juego
- Validar todos los inputs con class-validator en NestJS
- Rate limiting en todos los endpoints públicos
- Sanitizar datos antes de persistir
- JWT con expiración corta + refresh tokens

---

## 9. DOCUMENTAR AL COMPLETAR CADA FASE

Al terminar una fase del plan-trabajo.md:
1. Actualizar los docs afectados en `docs/` para que reflejen lo que **realmente se construyó** (no el plan original)
2. Marcar los ítems como `[x]` en `plan-trabajo.md`
3. Si algo cambió respecto al doc previo, sobreescribir — no mantener el doc desactualizado

Esto aplica especialmente a docs que describen arquitectura planificada: deben evolucionar con el código real.

---

## 10. FLUJO DE TRABAJO POR SESIÓN

Al iniciar una sesión de trabajo:
1. Claude lee este archivo
2. Claude busca en memoria (`mem_search`) contexto de sesiones anteriores
3. Se revisa el estado actual de `docs/00-plan/plan-trabajo.md`
4. Se define qué se va a hacer en esa sesión

Al cerrar una sesión:
1. Claude actualiza los docs afectados
2. Claude guarda en memoria (`mem_save`) las decisiones tomadas
3. Se actualiza el checklist en `docs/00-plan/plan-trabajo.md`

---

## 11. DOCUMENTACIÓN DISPONIBLE

Ver índice completo en [`docs/README.md`](docs/README.md).

---

### Guía de lectura por tema

**REGLA**: Antes de opinar, diseñar o modificar cualquier cosa, leer los docs marcados como obligatorios para ese tema. Los marcados como "contexto" son opcionales pero recomendados si hay ambigüedad.

| Tema / Tarea | Leer OBLIGATORIO | Leer como contexto |
|---|---|---|
| Estado actual del proyecto, qué falta | [`plan-trabajo.md`](docs/00-plan/plan-trabajo.md) | [`roadmap.md`](docs/00-plan/roadmap.md) |
| Arquitectura general, visión del sistema | [`arquitectura-general.md`](docs/01-arquitectura/arquitectura-general.md) | [`flujo-datos.md`](docs/01-arquitectura/flujo-datos.md), [`estructura-proyecto.md`](docs/01-arquitectura/estructura-proyecto.md) |
| Mecánicas de juego, reglas, gameplay | [`mecanicas-core.md`](docs/02-game-design/mecanicas-core.md) | [`GDD.md`](docs/02-game-design/GDD.md) |
| Frontend Angular (rutas, componentes, servicios) | [`arquitectura-angular.md`](docs/04-frontend/arquitectura-angular.md) | [`sincronizacion.md`](docs/04-frontend/sincronizacion.md) |
| Phaser (escenas, render, game objects) | [`phaser-scenes.md`](docs/04-frontend/phaser-scenes.md) | [`mecanicas-core.md`](docs/02-game-design/mecanicas-core.md), [`sincronizacion.md`](docs/04-frontend/sincronizacion.md) |
| Input / controles PC y móvil | [`controles-input.md`](docs/04-frontend/controles-input.md) | [`sincronizacion.md`](docs/04-frontend/sincronizacion.md) |
| Sincronización cliente-servidor | [`sincronizacion.md`](docs/04-frontend/sincronizacion.md) | [`websocket-events.md`](docs/03-backend/websocket-events.md), [`game-loop.md`](docs/03-backend/game-loop.md) |
| Backend API REST (endpoints, DTOs) | [`api-rest.md`](docs/03-backend/api-rest.md) | [`schemas-bd.md`](docs/03-backend/schemas-bd.md) |
| WebSockets / eventos en tiempo real | [`websocket-events.md`](docs/03-backend/websocket-events.md) | [`game-loop.md`](docs/03-backend/game-loop.md), [`redis-estructura.md`](docs/03-backend/redis-estructura.md) |
| Game loop del servidor, lógica de partida | [`game-loop.md`](docs/03-backend/game-loop.md) | [`websocket-events.md`](docs/03-backend/websocket-events.md), [`mecanicas-core.md`](docs/02-game-design/mecanicas-core.md) |
| Base de datos (modelos, tablas, relaciones) | [`schemas-bd.md`](docs/03-backend/schemas-bd.md) | [`api-rest.md`](docs/03-backend/api-rest.md) |
| Redis (cache, pub/sub, sesiones) | [`redis-estructura.md`](docs/03-backend/redis-estructura.md) | [`game-loop.md`](docs/03-backend/game-loop.md) |
| Autenticación / autorización / JWT | [`api-rest.md`](docs/03-backend/api-rest.md) (sección auth) | [`seguridad.md`](docs/07-seguridad/seguridad.md) |
| Seguridad, validaciones, protección | [`seguridad.md`](docs/07-seguridad/seguridad.md) | [`api-rest.md`](docs/03-backend/api-rest.md) |
| Monetización, tienda, skins, pagos | [`modelo-negocio.md`](docs/06-monetizacion/modelo-negocio.md) | [`stripe-integracion.md`](docs/06-monetizacion/stripe-integracion.md), [`ads-integracion.md`](docs/06-monetizacion/ads-integracion.md) |
| Economía del juego (coins, XP, rewards) | [`economia-juego.md`](docs/02-game-design/economia-juego.md) | [`modelo-negocio.md`](docs/06-monetizacion/modelo-negocio.md) |
| Assets visuales (sprites, textures) | [`inventario-assets.md`](docs/08-assets/inventario-assets.md), [`catalogo-master.md`](docs/08-assets/catalogo-master.md) | [`estilo-grafico.md`](docs/08-assets/estilo-grafico.md) |
| Generación / producción de assets con IA | [`estilo-grafico.md`](docs/08-assets/estilo-grafico.md), [`plan-produccion.md`](docs/08-assets/plan-produccion.md) | [`inventario-assets.md`](docs/08-assets/inventario-assets.md) |
| Docker, servicios, entorno local | [`docker-compose.md`](docs/05-infra/docker-compose.md) | [`instalacion.md`](docs/00-plan/instalacion.md) |
| Nginx, reverse proxy, rutas de red | [`nginx.md`](docs/05-infra/nginx.md) | [`docker-compose.md`](docs/05-infra/docker-compose.md) |
| CI/CD, GitHub Actions, deploys | [`ci-cd.md`](docs/05-infra/ci-cd.md) | [`docker-compose.md`](docs/05-infra/docker-compose.md) |
| Setup inicial / instalación de herramientas | [`instalacion.md`](docs/00-plan/instalacion.md) | [`docker-compose.md`](docs/05-infra/docker-compose.md) |
