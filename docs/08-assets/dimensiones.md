# Dimensiones Exactas de Assets — Arena Siege Tanks

> Fuente única de verdad para dimensiones. Prevalece sobre `inventario-assets.md` y `estilo-grafico.md` donde haya conflicto.
> **Columnas**: "Archivo PNG" = tamaño del PNG en disco. "Display Phaser" = tamaño visual en juego.
> Para spritesheets: el archivo es horizontal (frames de izquierda a derecha).

---

## Referencia rápida — todos los assets

### Tanques

| ID | Archivo PNG | Display Phaser | Notas |
|----|------------|----------------|-------|
| `tank-default-body` | 128×128 | 128×128 | setOrigin(0.5, 0.5) |
| `tank-default-cannon` | 64×64 | 64×64 | setOrigin(0.15, 0.5) — pivot en base |
| `tank-bot-body` | 128×128 | 128×128 | idéntico al default |
| `tank-bot-cannon` | 64×64 | 64×64 | idéntico al default |
| `tank-{skin}-body` (×20) | 128×128 | 128×128 | mismo tamaño siempre |
| `tank-{skin}-cannon` (×20) | 64×64 | 64×64 | mismo tamaño siempre |

### Proyectiles

| ID | Archivo PNG | Display Phaser | BlendMode |
|----|------------|----------------|-----------|
| `bullet-bounce3` | 32×32 | 32×32 | ADD |
| `bullet-bounce2` | 32×32 | 32×32 | ADD |
| `bullet-bounce1` | 32×32 | 32×32 | ADD |
| `bullet-bounce0` | 32×32 | 32×32 | ADD |
| `bullet-trail` | 64×16 | 64×16 | ADD — trail estático, no se usa si hay ParticleEmitter |

### Muros

| ID | Archivo PNG | Display Phaser | Notas |
|----|------------|----------------|-------|
| `wall-h-hp3` | 128×32 | 80×20 | setDisplaySize(80, 20) |
| `wall-h-hp2` | 128×32 | 80×20 | |
| `wall-h-hp1` | 128×32 | 80×20 | |
| `wall-v-hp{3,2,1}` | — | — | **No generar** — usar wall-h rotado: setRotation(Math.PI/2) |

> Los muros verticales NO tienen PNG propio. Se usa `wall-h-hp{n}` con `setRotation(Math.PI / 2)` y `setDisplaySize(20, 80)`. Generar solo los 3 horizontales.

### Pickups

| ID | Archivo PNG | Display Phaser |
|----|------------|----------------|
| `pickup-ammo3` | 48×48 | 48×48 |
| `pickup-ammo5` | 48×48 | 48×48 |
| `pickup-ammo10` | 64×64 | 64×64 |
| `pickup-wall2` | 48×48 | 48×48 |
| `pickup-wall5` | 64×64 | 64×64 |

### VFX — estáticos (no spritesheet)

| ID | Archivo PNG | Display Phaser | BlendMode |
|----|------------|----------------|-----------|
| `vfx-invincibility-shield` | 160×160 | 160×160 | ADD — alpha pulse por tween |
| `vfx-bounce-flash` | 48×48 | 48×48 | ADD — alpha fade 80ms por tween |
| `vfx-powerstack-aura-low` | 160×160 | 160×160 | ADD — alpha pulse por tween |
| `vfx-powerstack-aura-mid` | 160×160 | 160×160 | ADD — alpha pulse por tween |
| `vfx-powerstack-aura-max` | 160×160 | 160×160 | ADD — alpha pulse por tween |
| `vfx-leader-crown-aura` | 192×192 | 192×192 | ADD — alpha pulse por tween |

### VFX — spritesheets

| ID | Archivo PNG (total) | Frame | Frames | frameRate | Notas |
|----|---------------------|-------|--------|-----------|-------|
| `vfx-muzzle-flash` | 288×96 | 96×96 | 3 | 20 fps | `repeat: 0` → destroy |
| `vfx-impact-wall` | 288×96 | 96×96 | 3 | 20 fps | `repeat: 0` → destroy |
| `vfx-impact-border` | 192×96 | 96×96 | 2 | 20 fps | `repeat: 0` → destroy |
| `vfx-tank-explosion` | 1280×256 | 256×256 | 5 | 14 fps | `repeat: 0` → destroy |
| `vfx-wall-destroy` | 384×128 | 128×128 | 3 | 16 fps | `repeat: 0` → destroy |
| `vfx-respawn` | 576×192 | 192×192 | 3 | 10 fps | `repeat: 0` → destroy |
| `vfx-pickup-collect` | 160×80 | 80×80 | 2 | 20 fps | sprite en blanco — tintado en código |

### Partículas (para ParticleEmitter)

| ID | Archivo PNG | Notas |
|----|------------|-------|
| `particle-smoke` | 32×32 | humo de escape del tanque |
| `particle-spark` | 8×8 | chispas de impacto |
| `particle-dot` | 12×12 | trail de bala (tintado según bounce state) |

### Entorno / Arena

| ID | Archivo PNG | Display Phaser | Notas |
|----|------------|----------------|-------|
| `bg-floor-tile` | 512×512 | cubre MAP_WIDTH×MAP_HEIGHT | TileSprite seamless, fondo opaco |
| `bg-grid-overlay` | 512×512 | cubre MAP_WIDTH×MAP_HEIGHT | TileSprite seamless, alpha 0.15, BlendMode ADD |
| `border-wall-h` | 128×48 | 128×48 | TileSprite top/bottom de la arena |
| `border-wall-v` | 48×128 | 48×128 | TileSprite left/right de la arena |
| `border-corner-tl` | 64×64 | 64×64 | esquina superior izquierda |
| `border-corner-tr` | 64×64 | 64×64 | esquina superior derecha |
| `border-corner-bl` | 64×64 | 64×64 | esquina inferior izquierda |
| `border-corner-br` | 64×64 | 64×64 | esquina inferior derecha |

### UI / HUD

| ID | Archivo PNG | Display Phaser | Notas |
|----|------------|----------------|-------|
| `ui-bullet-icon` | 24×24 | 24×24 | contador de munición |
| `ui-wall-charge-icon` | 24×24 | 24×24 | contador de muros |
| `ui-coin-icon` | 24×24 | 24×24 | moneda dorada |
| `ui-hp-heart` | 24×24 | 24×24 | vida disponible |
| `ui-hp-heart-empty` | 24×24 | 24×24 | vida agotada |
| `ui-stack-badge` | 32×32 | 32×32 | Power Stack (número sobre él en texto) |
| `ui-leader-badge` | 32×32 | 32×32 | indicador top 1 |
| `indicator-crown` | 32×32 | 32×32 | corona flotante, tween bob arriba del tanque |

> `indicator-hp-bar-bg`, `indicator-hp-bar-fill`, `indicator-name-bg` son dibujados programáticamente con Graphics/Text de Phaser — no requieren PNG.

---

## Cómo se genera cada grupo (tamaño de generación IA)

| Grupo | Sprites por imagen | Tamaño generación | Recorte posterior |
|-------|-------------------|-------------------|-------------------|
| Tank body + cannon (1 skin) | 2 (body izq, cannon der) | 1536×1024 | gap-detect → body resize 128×128; cannon resize 64×64 |
| Common skins (par de 2 tanques) | 4 | 1536×1024 | 4 recortes |
| Balas (4 estados) | grid 2×2 | 1024×1024 | 4 cuadrantes → resize a 32×32 c/u |
| Muros H — cada estado por separado | 1 por imagen | 1024×1024 | tight bbox → resize a 128×32 |
| Partículas (smoke+spark+dot) | 3 apiladas vertical | 1024×1024 | gap-detect filas → resize individual |
| UI icons — cada ícono por separado | 1 por imagen | 1024×1024 | tight bbox → resize a 24×24 |
| Pickups — cada pickup por separado | 1 por imagen | 1024×1024 | tight bbox → resize al tamaño objetivo |
| VFX frames | 1 frame por imagen | 1024×1024 | resize al tamaño del frame |
| bg-floor-tile / bg-grid-overlay | 1 | 1024×1024 | resize a 512×512 |
| border-wall-h / border-wall-v | 1 | 1024×1024 | resize a 128×48 / 48×128 |
| border-corner-* | 4 en grid 2×2 | 1024×1024 | 4 cuadrantes → resize a 64×64 c/u |
| VFX estáticos (shields, auras) | 1 | 1024×1024 | resize al tamaño final |

---

## Correcciones respecto a docs anteriores

Las siguientes entradas en `inventario-assets.md` son **incorrectas** y este doc prevalece:

| Campo | Inventario decía | Correcto |
|-------|-----------------|---------|
| `wall-v-hp{1,2,3}` | 32×128 (PNG separado) | No generar — rotación en código |
| `vfx-muzzle-flash` | 64×64 × 4 frames | spritesheet 288×96, frame 96×96, 3 frames |
| `vfx-impact-wall` | 96×96 × 6 frames | spritesheet 288×96, frame 96×96, 3 frames |
| `vfx-tank-explosion` | 256×256 × 12 frames | spritesheet 1280×256, frame 256×256, 5 frames |
| `vfx-respawn` | 192×192 × 10 frames | spritesheet 576×192, frame 192×192, 3 frames |
| `vfx-wall-destroy` | 192×64 × 8 frames | spritesheet 384×128, frame 128×128, 3 frames |
| `vfx-pickup-collect` | 96×96 × 6 frames | spritesheet 160×80, frame 80×80, 2 frames |
| `vfx-powerstack-aura-*` | spritesheet × 8 frames | PNG estático, alpha pulse por tween |
| `vfx-leader-crown-aura` | 192×192 × 10 frames | PNG estático 192×192, alpha pulse por tween |
| `border-wall-h` | 64×32 | 128×48 |
| `border-wall-v` | 32×64 | 48×128 |
| `ui-bullet/wall/coin-icon` | 24×24 ✓ | (correcto) |
