# Arena Skins — Catálogo y Flujo Técnico

> Catálogo de los 20 fondos de escenario disponibles para compra, más el flujo
> completo para crear e implementar nuevos arena skins en el futuro.

---

## 1. Modelo de negocio

- **Moneda**: solo **gemas** (premium currency, comprada con Stripe — dinero real).
- **Precio**: 100 gemas por skin (~$1 USD).
- **Camino gratuito**: no existe. Es una ventaja estética pura de pago.
- **Visibilidad**: cada jugador ve su propio arena skin — no afecta a otros jugadores.
- **Default**: el fondo base (concreto charcoal) es gratuito para todos.

---

## 2. Catálogo de arena skins

| # | Slug | Nombre | Descripción | Precio |
|---|------|--------|-------------|--------|
| 0 | `default` | Concreto | Asfalto charcoal oscuro — fondo base (gratis) | Free |
| 1 | `lava-subterranea` | Lava Subterránea | Basalto negro con grietas de lava naranja incandescente | 100 💎 |
| 2 | `profundidades` | Profundidades | Suelo marino oscuro, azulejos mojados con bioluminiscencia tenue | 100 💎 |
| 3 | `cienaga-toxica` | Ciénaga Tóxica | Pantano verde oscuro con burbujas de ácido tóxico | 100 💎 |
| 4 | `desierto-nocturno` | Desierto Nocturno | Arena ocre compactada y reseca con grietas poligonales | 100 💎 |
| 5 | `glaciar` | Glaciar | Hielo azul-oscuro con fisuras congeladas profundas | 100 💎 |
| 6 | `ceniza-volcanica` | Ceniza Volcánica | Ceniza y basalto oscuro, grano muy sutil post-erupción | 100 💎 |
| 7 | `bosque-oscuro` | Bosque Oscuro | Tierra húmeda oscura con hojas caídas y raíces vistas desde arriba | 100 💎 |
| 8 | `cosmos` | Cosmos | Vacío espacial negro con polvo estelar y nebulosa apenas perceptible | 100 💎 |
| 9 | `metal-oxido` | Metal Oxidado | Plancha de metal corroída, marrón-rojizo oscuro con óxido | 100 💎 |
| 10 | `neon-urbano` | Neón Urbano | Asfalto mojado oscuro con reflejo sutil de neón cian y magenta | 100 💎 |
| 11 | `cristales-oscuros` | Cristales Oscuros | Suelo de cueva con facetas de cristal morado oscuro con brillo interno tenue | 100 💎 |
| 12 | `barro-trinchera` | Barro de Trinchera | Barro de campo de batalla, marrón oscuro con huellas y surcos | 100 💎 |
| 13 | `tundra-helada` | Tundra Helada | Hielo compactado gris-azulado oscuro con grietas | 100 💎 |
| 14 | `nebulosa` | Nebulosa | Vacío espacial púrpura-oscuro con velos de nebulosa magenta | 100 💎 |
| 15 | `ruinas-antiguas` | Ruinas Antiguas | Piedra ancestral gris-oscura con grabados desgastados casi invisibles | 100 💎 |
| 16 | `metal-quemado` | Metal Quemado | Acero chamuscado negro con iridiscencia de calor en azules y púrpuras | 100 💎 |
| 17 | `caverna-humeda` | Caverna Húmeda | Roca de caverna oscura y mojada con reflejo de humedad en la roca | 100 💎 |
| 18 | `sangre-dragon` | Sangre de Dragón | Negro profundo con venas rojas carmesí luminosas, patrón escama oscura | 100 💎 |
| 19 | `abismo-digital` | Abismo Digital | Negro digital con trazas de circuito PCB en verde oscuro, casi imperceptibles | 100 💎 |
| 20 | `arena-sangrienta` | Arena Sangrienta | Arena de combate marrón-rojiza oscura, impregnada de batalla | 100 💎 |

---

## 3. Estructura de archivos

```
frontend/public/assets/environment/
├── bg-floor-tile.png                   ← default (gratis)
└── arenas/
    ├── lava-subterranea.png
    ├── profundidades.png
    ├── cienaga-toxica.png
    ├── desierto-nocturno.png
    ├── glaciar.png
    ├── ceniza-volcanica.png
    ├── bosque-oscuro.png
    ├── cosmos.png
    ├── metal-oxido.png
    ├── neon-urbano.png
    ├── cristales-oscuros.png
    ├── barro-trinchera.png
    ├── tundra-helada.png
    ├── nebulosa.png
    ├── ruinas-antiguas.png
    ├── metal-quemado.png
    ├── caverna-humeda.png
    ├── sangre-dragon.png
    ├── abismo-digital.png
    └── arena-sangrienta.png

docs/08-assets/review/arenas/
    └── {slug}-draft.png                ← borradores quality low

backend/api/src/arena-skins/
    ├── arena-skins.module.ts
    ├── arena-skins.controller.ts
    ├── arena-skins.service.ts
    ├── dto/equip-arena-skin.dto.ts
    └── migrations/
        └── XXXX-add-arena-skins.ts

frontend/src/app/core/services/
    └── arena-skin.service.ts
```

---

## 4. Arquitectura del sistema

### Flujo de datos — equipar (con compra)

```
[Lobby: "Cambiar escenario"] → /shop?section=arenas (se abre directamente en pestaña Escenarios)
  → usuario compra y equipa →
    ArenaSkinService.equip(slug) →
      PUT /api/arena-skins/equip  (valida ownership en servidor)
      localStorage.setItem('ast_arena_skin', slug)

[Buscar partida] →
  PreloadScene lee localStorage 'ast_arena_skin' →
  carga textura correcta →

[GameScene.createArena()] →
  usa clave 'bg-floor-active' (apunta al slug equipado)
```

### Flujo de datos — previsualizar (sin compra)

```
[Shop → botón "👁 Previsualizar" en arena no comprada] →
  ArenaSkinService.equipLocal(slug) →
    localStorage.setItem('ast_arena_skin', slug)  // sin llamada API
  → activa el slug localmente en la sesión del navegador

[Buscar partida] → PreloadScene carga ese slug → se ve en juego
```

El botón **no verifica ownership** en el servidor. El jugador puede previsualizar cualquier arena antes de comprarla. Si no la compra, el servidor nunca registra el equip. Si el jugador recarga el lobby, el slug en localStorage persiste hasta que equipe otro o limpie storage.

### Por qué localStorage y no solo API
El PreloadScene carga antes de que haya conexión Socket. Guardar el slug en localStorage
permite cargar la textura correcta inmediatamente sin esperar una llamada HTTP.
La API es la fuente de verdad; localStorage es solo caché local.

---

## 5. Esquema de base de datos

### Tabla `arena_skins` (seed fijo, no crece dinámicamente)

```sql
CREATE TABLE arena_skins (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        VARCHAR(64) UNIQUE NOT NULL,
  name        VARCHAR(128) NOT NULL,
  description TEXT,
  price_gems  INTEGER NOT NULL DEFAULT 100,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMP DEFAULT NOW()
);
```

### Columna en `users`

```sql
ALTER TABLE users
  ADD COLUMN equipped_arena_skin VARCHAR(64) NOT NULL DEFAULT 'default';
```

### Tabla `user_arena_skins` (posesión)

```sql
CREATE TABLE user_arena_skins (
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  arena_skin_slug VARCHAR(64) NOT NULL,
  purchased_at    TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, arena_skin_slug)
);
```

El slug `'default'` **no** requiere registro en `user_arena_skins` — se asume gratis para todos.

---

## 6. Endpoints de la API

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/arena-skins` | No | Lista todas las skins con flag `owned` y `equipped` por usuario |
| `POST` | `/arena-skins/:slug/purchase` | JWT | Compra con gemas (descuenta wallet) |
| `PUT` | `/arena-skins/equip` | JWT | Equipa una skin ya poseída |
| `GET` | `/arena-skins/my` | JWT | Lista de slugs que posee el usuario |

### Respuesta GET /arena-skins (autenticado)
```json
[
  {
    "slug": "default",
    "name": "Concreto",
    "priceGems": 0,
    "owned": true,
    "equipped": false
  },
  {
    "slug": "lava-subterranea",
    "name": "Lava Subterránea",
    "priceGems": 100,
    "owned": false,
    "equipped": false
  }
]
```

---

## 7. Frontend — ArenaSkinService

```typescript
// Responsabilidades:
// - Obtener lista de arena skins del servidor
// - Comprar una skin (POST /purchase)
// - Equipar una skin (PUT /equip) + actualizar localStorage
// - Previsualizar sin compra (solo localStorage, sin llamada API)
// - Proveer el slug activo a PreloadScene

getActiveSlug(): string {
  return localStorage.getItem('ast_arena_skin') ?? 'default';
}

equip(slug: string): Observable<void> {
  return this.http.put('/api/arena-skins/equip', { slug }).pipe(
    tap(() => localStorage.setItem('ast_arena_skin', slug))
  );
}

// Preview local sin verificar ownership en servidor
equipLocal(slug: string): void {
  localStorage.setItem('ast_arena_skin', slug);
}
```

### Navegación desde Lobby
El botón **"Cambiar escenario"** en el lobby navega a `/shop?section=arenas`.  
El ShopComponent detecta `?section=arenas` en `ngOnInit` y activa automáticamente la pestaña de Escenarios.

El botón **"Cambiar skin"** navega a `/shop` sin parámetros (abre pestaña de tanques por defecto).

### Grid de escenarios en la tienda
Las tarjetas usan `grid-template-columns: repeat(auto-fill, minmax(170px, 1fr))` sin `max-width`, permitiendo 4–6 columnas según el ancho de ventana.

---

## 8. PreloadScene — carga dinámica

```typescript
preload(): void {
  const arenaSlug = localStorage.getItem('ast_arena_skin') ?? 'default';
  const tileUrl = arenaSlug === 'default'
    ? 'assets/environment/bg-floor-tile.png'
    : `assets/environment/arenas/${arenaSlug}.png`;

  this.load.image('bg-floor-active', tileUrl);
  // ... resto de assets
}
```

En `GameScene.createArena()` usar `'bg-floor-active'` en lugar de `'bg-floor-tile'`.

---

## 9. Flujo para agregar un nuevo arena skin

1. **Diseñar el tema**: nombre, slug (kebab-case, max 32 chars), descripción, prompt para IA.
2. **Generar imagen**:
   ```powershell
   # Borrador (quality low)
   # Guardar en docs/08-assets/review/arenas/{slug}-draft.png
   # Revisar visualmente
   # Si OK → quality high → frontend/public/assets/environment/arenas/{slug}.png
   ```
3. **Requisitos del asset**:
   - Formato: PNG opaco, 1024×1024
   - Tono: oscuro a medio (no claro — debe contrastar con tanques brillantes)
   - Patrón: sutil, sin elementos que distraigan del gameplay
   - Tileabilidad: seamlessly tileable
4. **Agregar seed al backend**: insertar fila en `arena_skins` con el nuevo slug.
5. **Actualizar este doc**: añadir fila al catálogo (sección 2).

---

## 10. Consideraciones de calidad

- Las imágenes actuales son **quality "low"** (borradores). Regenerar con `quality: "high"` las más vendidas una vez validadas con usuarios.
- Dos skins salieron muy oscuras (`cosmos`, `neon-urbano`) — candidatas a ser regeneradas con más contraste si hay feedback.
- El tint `0x555560` que se aplica en GameScene al default **no se aplica** a los arena skins de pago — sus tonos están calibrados de origen.
