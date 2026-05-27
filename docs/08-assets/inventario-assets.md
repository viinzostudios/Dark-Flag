# Inventario de Assets — Arena Siege Tanks

> Lista completa de todos los assets visuales que requiere el juego.
> Cada asset tiene: ID único, descripción, estado, tipo y referencia al prompt JSON.
>
> ⚠️ **Para dimensiones exactas** (tamaño PNG, tamaño display, layout de spritesheets), ver [`dimensiones.md`](dimensiones.md) — ese doc prevalece sobre las resoluciones indicadas aquí donde haya conflicto.

---

## Categorías

1. [Tanques](#1-tanques)
2. [Proyectiles](#2-proyectiles)
3. [Muros](#3-muros)
4. [Pickups](#4-pickups)
5. [Efectos VFX](#5-efectos-vfx)
6. [Entorno / Arena](#6-entorno--arena)
7. [UI / HUD](#7-ui--hud)

---

## 1. Tanques

### 1.1 Tanque base (skin: Default)

| ID | Asset | Resolución | Frames | Prompt |
|----|-------|-----------|--------|--------|
| `tank-default-body` | Cuerpo del tanque default — vista cenital | 128×128 | 1 (estático) | [prompt →](prompts/tanks/tank-default-body.json) |
| `tank-default-cannon` | Cañón del tanque default — vista cenital | 64×64 | 1 (estático) | [prompt →](prompts/tanks/tank-default-cannon.json) |
| `tank-default-tracks` | Animación de orugas (strip horizontal) | 128×32 × 8 frames | 8 | [prompt →](prompts/tanks/tank-default-tracks.json) |

### 1.2 Skins — 100 skins del catálogo

Convención de naming: `tank-{slug}-body.png` y `tank-{slug}-cannon.png`
Ubicación: `frontend/public/assets/tanks/skins/`
Catálogo completo: [`catalogo-skins.md`](../../docs/06-monetizacion/catalogo-skins.md)
Generación: script `tools/generate-100-skins.py`

| # | Slug | Nombre | Rareza |
|---|------|--------|--------|
| 1 | `base-clasico` | Base Clásico | common |
| 2 | `el-verde` | El Verde | common |
| 3 | `el-rojo` | El Rojo | common |
| 4 | `el-azul` | El Azul | common |
| 5 | `el-amarillo` | El Amarillo | common |
| 6 | `gris-tormenta` | Gris Tormenta | common |
| 7 | `morado-pasion` | Morado Pasión | common |
| 8 | `rosa-retro` | Rosa Retro | common |
| 9 | `naranja-llamarada` | Naranja Llamarada | common |
| 10 | `turquesa-marino` | Turquesa Marino | common |
| 11–25 | `lima-toxico` … `invierno-polar` | (ver catálogo) | common |
| 26–60 | `tanque-acuatico` … `el-bombero-espacial` | (ver catálogo) | rare |
| 61–85 | `tanque-espacial-omega` … `el-fantasma-de-sombra` | (ver catálogo) | epic |
| 86–100 | `tanque-galactico` … `el-mitico` | (ver catálogo) | legendary |

> **Nota de generación**: cada skin se genera como imagen combinada 1536×1024 (body izquierda, cañón derecha), luego se extrae con gap-detection → body 128×128, cannon 64×64.
> Los slugs se derivan del nombre en español sin acentos ni caracteres especiales.

### 1.6 Tanque Bot (IA)

| ID | Asset | Descripción |
|----|-------|-------------|
| `tank-bot-body` | Cuerpo bot | Versión metálica simple, gris oscuro |
| `tank-bot-cannon` | Cañón bot | Idéntico al default pero más industrial |

### 1.7 Indicadores sobre tanque

| ID | Asset | Descripción |
|----|-------|-------------|
| `indicator-crown` | Corona del Líder | Ícono de corona dorada flotante |
| `indicator-hp-bar-bg` | Barra HP — fondo | Rectángulo oscuro semitransparente |
| `indicator-hp-bar-fill` | Barra HP — relleno | Gradiente verde→amarillo→rojo |
| `indicator-name-bg` | Fondo de nombre | Píldora semitransparente |

---

## 2. Proyectiles

| ID | Asset | Resolución | Descripción |
|----|-------|-----------|-------------|
| `bullet-bounce3` | Bala — 3 rebotes | 32×32 | Esfera blanca brillante con glow |
| `bullet-bounce2` | Bala — 2 rebotes | 32×32 | Esfera amarilla con glow |
| `bullet-bounce1` | Bala — 1 rebote | 32×32 | Esfera naranja con glow |
| `bullet-bounce0` | Bala — 0 rebotes | 32×32 | Esfera roja incandescente |
| `bullet-trail` | Trail de bala | 64×16 | Cola de luz que se desvanece |

---

## 3. Muros

| ID | Asset | Resolución | Descripción |
|----|-------|-----------|-------------|
| `wall-h-hp3` | Muro horizontal — sin daño | 128×32 | Panel metálico oscuro, franja verde |
| `wall-h-hp2` | Muro horizontal — daño leve | 128×32 | Grieta leve, franja naranja |
| `wall-h-hp1` | Muro horizontal — daño severo | 128×32 | Grietas profundas + humo, franja roja |

> **Muros verticales**: NO tienen PNG separado. Se usa `wall-h-hp{n}` con `setRotation(Math.PI / 2)` y `setDisplaySize(20, 80)`.
> Display en juego: `setDisplaySize(80, 20)` para horizontal, `setDisplaySize(20, 80)` para vertical.

---

## 4. Pickups

| ID | Asset | Resolución | Descripción |
|----|-------|-----------|-------------|
| `pickup-ammo3` | Balas +3 — común | 48×48 | Ícono de bala verde, tamaño pequeño |
| `pickup-ammo5` | Balas +5 — poco común | 48×48 | Ícono de bala verde más brillante |
| `pickup-ammo10` | Balas +10 — raro | 64×64 | Ícono de bala verde neón, animación idle |
| `pickup-wall2` | Muros +2 — poco común | 48×48 | Ícono de muro azul |
| `pickup-wall5` | Muros +5 — raro | 64×64 | Ícono de muro azul neón, animación idle |
| `pickup-idle-anim` | Animación idle raro | 64×64 × 8f | Rotación + pulso de luz (sprite sheet) |

---

## 5. Efectos VFX

### 5.1 Disparo

| ID | Asset | Resolución | Frames | Descripción |
|----|-------|-----------|--------|-------------|
| `vfx-muzzle-flash` | Muzzle flash | 64×64 | 4 | Flash blanco-naranja en boca del cañón |
| `vfx-smoke-puff` | Humo de disparo | 96×96 | 6 | Nube de humo gris que se expande |

### 5.2 Impactos

| ID | Asset | Resolución | Frames | Descripción |
|----|-------|-----------|--------|-------------|
| `vfx-impact-wall` | Impacto en muro | 96×96 | 6 | Chispas metálicas + crack visual |
| `vfx-impact-border` | Impacto en borde | 96×96 | 5 | Onda de energía azul + chispas |
| `vfx-impact-tank` | Impacto en tanque | 64×64 | 4 | Flash rojo + chispas pequeñas |
| `vfx-bounce-flash` | Flash de rebote | 48×48 | 3 | Destello instantáneo en punto de rebote |

### 5.3 Destrucciones

| ID | Asset | Resolución | Frames | Descripción |
|----|-------|-----------|--------|-------------|
| `vfx-wall-destroy` | Destrucción de muro | 192×64 | 8 | Fragmentos metálicos + pequeña explosión |
| `vfx-tank-explosion` | Explosión de tanque | 256×256 | 12 | Explosión grande + humo negro + fragmentos |
| `vfx-tank-death-smoke` | Humo post-explosión | 128×128 | 8 | Columna de humo negro ascendente |

### 5.4 Respawn y estados especiales

| ID | Asset | Resolución | Frames | Descripción |
|----|-------|-----------|--------|-------------|
| `vfx-respawn` | Materialización | 192×192 | 10 | Partículas convergen al centro en círculo |
| `vfx-invincibility` | Escudo de invencibilidad | 160×160 | 8 | Pulso de escudo hexagonal translúcido |
| `vfx-pickup-collect` | Recogida de pickup | 96×96 | 6 | Burst de luz + expansión radial |

### 5.5 Power Stack y Líder

| ID | Asset | Resolución | Frames | Descripción |
|----|-------|-----------|--------|-------------|
| `vfx-powerstack-aura-low` | Aura stack 1-3 | 160×160 | 8 | Aura verde sutil girando |
| `vfx-powerstack-aura-mid` | Aura stack 4-7 | 160×160 | 8 | Aura naranja más intensa |
| `vfx-powerstack-aura-max` | Aura stack 8-10 | 160×160 | 8 | Aura roja + partículas |
| `vfx-leader-crown-aura` | Aura del Líder | 192×192 | 10 | Corona dorada + partículas ascendentes |

---

## 6. Entorno / Arena

| ID | Asset | Resolución | Descripción |
|----|-------|-----------|-------------|
| `bg-floor-tile` | Tile de suelo | 1024×1024 | Concreto charcoal oscuro con grain sutil, tileSprite seamless. Tint `0x555560` aplicado en GameScene para oscurecer a casi-negro. |
| `bg-grid-overlay` | Overlay de grid | — | **No se usa.** Reemplazado por cuadrícula programática en GameScene: líneas negras alpha 0.35, paso de 240 px. |
| `border-wall-h` | Borde horizontal | 128×48 | Pared metálica de la arena, borde superior/inferior |
| `border-wall-v` | Borde vertical | 48×128 | Pared metálica de la arena, borde izq/der |
| `border-corner-tl` | Esquina sup-izq | 64×64 | Esquina metálica de la arena |
| `border-corner-tr` | Esquina sup-der | 64×64 | Esquina metálica de la arena |
| `border-corner-bl` | Esquina inf-izq | 64×64 | Esquina metálica de la arena |
| `border-corner-br` | Esquina inf-der | 64×64 | Esquina metálica de la arena |

---

## 7. UI / HUD

| ID | Asset | Resolución | Descripción |
|----|-------|-----------|-------------|
| `ui-bullet-icon` | Ícono de bala | 24×24 | Bala blanca para contador de munición |
| `ui-wall-charge-icon` | Ícono de carga de muro | 24×24 | Muro azul pequeño para contador |
| `ui-hp-heart` | Corazón de HP | 24×24 | Ícono de vida rojo |
| `ui-hp-heart-empty` | Corazón vacío | 24×24 | Ícono de vida vacío |
| `ui-stack-badge` | Badge de Power Stack | 32×32 | Distintivo con número de stack |
| `ui-leader-badge` | Badge de Líder | 32×32 | Distintivo dorado para el top 1 |
| `ui-panel-bg` | Fondo de panel HUD | variable | Fondo oscuro semitransparente con borde |
| `ui-minimap-bg` | Fondo del minimapa | 200×150 | Versión miniatura de la arena |
| `ui-coin-icon` | Ícono de moneda | 24×24 | Moneda dorada brillante |

---

## Resumen de volumen

| Categoría | Assets estáticos | Spritesheets / Animaciones |
|-----------|-----------------|---------------------------|
| Tanques (base + skins) | ~60 | 3 |
| Proyectiles | 5 | 0 |
| Muros | 6 | 0 |
| Pickups | 5 | 1 |
| VFX | 0 | 20 |
| Entorno | 8 | 0 |
| UI/HUD | 9 | 0 |
| **Total** | **~93** | **~24** |

> **Prioridad de producción**: Tanque default → Balas → Muros → VFX de impacto → Pickups → Skins → Entorno → UI
