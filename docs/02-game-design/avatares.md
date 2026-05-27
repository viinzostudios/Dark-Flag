# Sistema de Avatares (Stickers) — Arena Siege Tanks

## Visión

Cada usuario está representado por un **sticker/avatar** ilustrado. Es la identidad visual del jugador en el lobby, rankings y tienda.

---

## Catálogo

- **Total**: 200 avatares
- **Gratuitos**: 20 (auto-asignados o reclamables sin costo)
- **De pago**: 180, distribuidos en 4 niveles de precio con coins

### Precios (coins)

| Tier | Precio | Cantidad aprox. |
|------|--------|----------------|
| Free | 0 | 20 |
| Básico | 200 | ~45 |
| Medio | 500 | ~60 |
| Premium | 1 000 | ~50 |
| Exclusivo | 2 000 | ~25 |

### Categorías

| Categoría | Slug | Cantidad |
|-----------|------|---------|
| Animales | `animals` | 50 |
| Comida y objetos | `food` | 40 |
| Personajes | `characters` | 40 |
| Fantasía / Sci-fi | `fantasy` | 40 |
| Símbolos y objetos | `symbols` | 30 |

---

## Avatar por defecto

- El avatar #1 (`avatar-01`) se asigna automáticamente a todos los usuarios nuevos.
- Los usuarios anónimos (invitados) ven el avatar por defecto sin posibilidad de cambiarlo.

---

## Reglas de compra

- Solo usuarios con cuenta pueden comprar o equipar avatares.
- La compra es permanente (no expira).
- Un usuario puede tener N avatares; solo uno activo.
- El saldo de coins nunca puede quedar negativo.

---

## Base de datos

### Tabla `avatars`

```sql
CREATE TABLE avatars (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        VARCHAR(50)  UNIQUE NOT NULL,    -- e.g. "avatar-01"
  name        VARCHAR(100) NOT NULL,
  category    VARCHAR(50)  NOT NULL,           -- animals | food | characters | fantasy | symbols
  price_coins INT          NOT NULL DEFAULT 0,
  sort_order  INT          NOT NULL DEFAULT 0,
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE
);
```

### Tabla `user_avatars`

```sql
CREATE TABLE user_avatars (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  avatar_id   UUID        NOT NULL REFERENCES avatars(id) ON DELETE CASCADE,
  acquired_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, avatar_id)
);
```

### Campo en `user_profiles`

```sql
ALTER TABLE user_profiles ADD COLUMN active_avatar_slug VARCHAR(50) DEFAULT 'avatar-01';
```

---

## API REST

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/avatars` | No | Lista todos con flags `owned` y `equipped` |
| POST | `/avatars/:slug/purchase` | Sí | Compra con coins |
| PUT | `/avatars/equip` | Sí | Equipar avatar `{ slug }` |

### Query params en GET /avatars

- `?category=animals` — filtrar por categoría
- `?owned=true` — solo los que posee el usuario

---

## Assets

- **Ruta**: `frontend/public/assets/avatars/{slug}.png`
- **Tamaño final**: 128×128 px, fondo transparente
- **Generación**: GPT Image con grids de 10 avatares por imagen (2×5) en 1024×1024
  - Borrador: `quality: "low"` → `docs/08-assets/review/avatars/{slug}-draft.png`
  - Final: `quality: "high"` → `frontend/public/assets/avatars/{slug}.png`
- **Post-proceso**: Script Node.js + Sharp para cortar grid y redimensionar a 128×128

### Proceso de extracción del grid

Grid 2 columnas × 5 filas en 1024×1024:
- Celda: 512×205 px
- Extracción: `sharp.extract({ left, top, width: 512, height: 205 }).resize(128, 128)`

---

## Estilo gráfico

Igual al estilo global del juego:
- Cartoon/cel-shaded, outlines negros 4px
- Colores saturados y brillantes
- Proporciones chunky y expresivas
- Sin fondo (transparente)
- Carácter reconocible a 128×128 px

---

## Display en UI

| Lugar | Tamaño |
|-------|--------|
| Lobby player card | 60×60 px (circular) |
| Rankings | 32×32 px |
| Tienda | 80×80 px en tarjeta |
| HUD leaderboard | 24×24 px |
