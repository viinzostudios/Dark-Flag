# Nginx — Arena Siege Tanks

> Nginx actúa como reverse proxy unificado.
> Un único punto de entrada para el frontend, la API y el Game Server.

---

## infra/nginx/conf.d/game.conf

```nginx
upstream api_backend {
    server api:3000;
}

upstream game_server_backend {
    server game-server:3001;
    # En producción con múltiples instancias:
    # server game-server-1:3001;
    # server game-server-2:3001;
    # ip_hash;  # sticky sessions para WebSocket
}

server {
    listen 80;
    server_name localhost;

    # ──────────────────────────────
    # Frontend Angular (archivos estáticos)
    # ──────────────────────────────
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;  # SPA routing
    }

    # ──────────────────────────────
    # API REST
    # ──────────────────────────────
    location /api/ {
        proxy_pass http://api_backend/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeout para requests largos (Stripe webhooks pueden tardar)
        proxy_read_timeout 60s;
    }

    # ──────────────────────────────
    # Game Server (WebSocket / Socket.IO)
    # ──────────────────────────────
    location /ws/ {
        proxy_pass http://game_server_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # WebSocket requiere timeouts largos
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }

    # ──────────────────────────────
    # Socket.IO polling fallback
    # ──────────────────────────────
    location /socket.io/ {
        proxy_pass http://game_server_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 3600s;
    }

    # ──────────────────────────────
    # Assets estáticos (caché agresivo)
    # ──────────────────────────────
    location ~* \.(js|css|png|jpg|svg|woff2|ico)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # ──────────────────────────────
    # Seguridad básica
    # ──────────────────────────────
    add_header X-Frame-Options "DENY";
    add_header X-Content-Type-Options "nosniff";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
}
```

---

## Configuración para producción (HTTPS)

En producción, agregar un segundo server block con SSL:

```nginx
server {
    listen 443 ssl;
    server_name arenasiege.com www.arenasiege.com;

    ssl_certificate     /etc/letsencrypt/live/arenasiege.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/arenasiege.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    # ... mismas locations que arriba ...
}

# Redirigir HTTP → HTTPS
server {
    listen 80;
    server_name arenasiege.com www.arenasiege.com;
    return 301 https://$host$request_uri;
}
```
