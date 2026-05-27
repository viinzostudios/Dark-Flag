# CI/CD — GitHub Actions

---

## Workflows activos

### `azure-static-web-apps.yml` — Deploy del frontend

Trigger: push a `master` con cambios en `frontend/**`.

**Pasos en orden:**

1. Checkout del repo
2. **Inyectar `ads.txt`** — sobreescribe `frontend/public/ads.txt` con el contenido del secret `ADS_TXT_CONTENT` (si el secret está vacío, se conserva el placeholder del repo)
3. Bump de versión patch (`package.json` + `src/app/version.ts`)
4. `npm ci` + `npm run build --configuration=production`
5. Deploy a Azure Static Web Apps desde `frontend/dist/frontend/browser`
6. Commit automático del bump de versión (`[skip ci]`)

#### ads.txt

`frontend/public/ads.txt` es un placeholder en el repo (contiene solo un comentario).
Angular lo copia al output durante el build, de modo que queda en la raíz del sitio desplegado (`https://dominio.com/ads.txt`).

El contenido real se inyecta en CI desde el secret `ADS_TXT_CONTENT`:

```yaml
- name: Inject ads.txt
  env:
    ADS_TXT_CONTENT: ${{ secrets.ADS_TXT_CONTENT }}
  run: |
    if [ -n "$ADS_TXT_CONTENT" ]; then
      printf '%s\n' "$ADS_TXT_CONTENT" > public/ads.txt
    fi
```

**Para agregar una red de publicidad**: añadir su línea al valor del secret en GitHub → Settings → Secrets and variables → Actions → `ADS_TXT_CONTENT`. El archivo acepta múltiples líneas (una por red).

Ejemplo de valor del secret:
```
google.com, pub-XXXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
```

---

### `test.yml` — Tests en cada PR

Corre en pull requests a `master`. Levanta postgres y redis como services de GitHub Actions.

Jobs: `test-api`, `test-game-server`, `test-frontend` (build check).

---

## Secrets requeridos en GitHub

| Secret | Descripción |
|--------|-------------|
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | Token de deploy para Azure Static Web Apps |
| `ADS_TXT_CONTENT` | Contenido completo del archivo `ads.txt` (puede tener múltiples líneas) |
| `GITHUB_TOKEN` | Automático — usado para commit del version bump |
