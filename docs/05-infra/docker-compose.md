# Docker Compose — Arena Siege Tanks

> Archivo base: `infra/docker-compose.yml`
> Override de producción: `infra/docker-compose.prod.yml`

---

## docker-compose.yml (desarrollo)

```yaml
version: '3.9'

services:

  # ────────────────────────────────
  # Base de datos
  # ────────────────────────────────
  postgres:
    image: postgres:16-alpine
    container_name: ast-postgres
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ────────────────────────────────
  # Cache y Pub/Sub
  # ────────────────────────────────
  redis:
    image: redis:7-alpine
    container_name: ast-redis
    command: redis-server --maxmemory 512mb --maxmemory-policy allkeys-lru
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ────────────────────────────────
  # API REST
  # ────────────────────────────────
  api:
    build:
      context: ../backend/api
      dockerfile: Dockerfile
    container_name: ast-api
    environment:
      NODE_ENV: development
      PORT: 3000
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY}
      STRIPE_WEBHOOK_SECRET: ${STRIPE_WEBHOOK_SECRET}
      INTERNAL_SECRET: ${INTERNAL_SECRET}
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ../backend/api:/app
      - /app/node_modules
    command: npm run start:dev

  # ────────────────────────────────
  # Game Server (WebSocket)
  # ────────────────────────────────
  game-server:
    build:
      context: ../backend/game-server
      dockerfile: Dockerfile
    container_name: ast-game-server
    environment:
      NODE_ENV: development
      PORT: 3001
      REDIS_URL: redis://redis:6379
      API_URL: http://api:3000
      INTERNAL_SECRET: ${INTERNAL_SECRET}
    ports:
      - "3001:3001"
    depends_on:
      redis:
        condition: service_healthy
    volumes:
      - ../backend/game-server:/app
      - /app/node_modules
    command: npm run start:dev

  # ────────────────────────────────
  # Reverse proxy
  # ────────────────────────────────
  nginx:
    image: nginx:1.25-alpine
    container_name: ast-nginx
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ../frontend/dist:/usr/share/nginx/html:ro
    depends_on:
      - api
      - game-server

volumes:
  postgres_data:
  redis_data:
```

---

## .env.example

```bash
# PostgreSQL
POSTGRES_DB=arena_siege_tanks
POSTGRES_USER=ast_user
POSTGRES_PASSWORD=cambiar_en_produccion

# JWT
JWT_SECRET=cambiar_por_string_largo_aleatorio_64_chars
JWT_REFRESH_SECRET=otro_string_largo_diferente_64_chars

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Comunicación interna entre servicios
INTERNAL_SECRET=secreto_entre_game_server_y_api_32_chars
```

---

## Dockerfiles

### backend/api/Dockerfile
```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
EXPOSE 3000
CMD ["node", "dist/main"]
```

### backend/game-server/Dockerfile
```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
EXPOSE 3001
CMD ["node", "dist/main"]
```

---

## Comandos frecuentes

```powershell
# Levantar todos los servicios (desarrollo)
docker compose -f infra/docker-compose.yml up -d

# Ver logs de un servicio
docker compose logs -f api
docker compose logs -f game-server

# Reiniciar un servicio
docker compose restart api

# Detener todo (conserva datos)
docker compose down

# Detener y BORRAR volúmenes (perder datos) — requiere confirmación
docker compose down -v

# Acceder a la base de datos
docker exec -it ast-postgres psql -U ast_user -d arena_siege_tanks

# Acceder a Redis
docker exec -it ast-redis redis-cli

# Rebuild de imagen tras cambiar Dockerfile o package.json
docker compose build api
docker compose up -d api
```
