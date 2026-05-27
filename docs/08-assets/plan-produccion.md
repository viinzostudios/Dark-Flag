# Plan de Producción de Assets — Arena Siege Tanks

> Workflow completo: desde generación hasta integración en Phaser.

---

## Estado de la API

- **Key**: guardada en `C:\Users\fredy\.claude\openai_key` (fuera del proyecto)
- **Modelos disponibles**: `gpt-image-1`, `gpt-image-1.5`, `gpt-image-2`, `dall-e-3`, `chatgpt-image-latest`
- **Estado actual**: billing limit alcanzado — revisar en https://platform.openai.com/settings/organization/limits para aumentar el límite de gasto o verificar créditos

---

## Modelo a usar: `gpt-image-1`

| Parámetro | Valor |
|-----------|-------|
| Modelo | `gpt-image-1` |
| Tamaños soportados | `1024x1024`, `1536x1024` (wide), `1024x1536` (tall) |
| Fondo | `transparent` o `opaque` (parámetro `background`) |
| Calidad borrador | `low` |
| Calidad final | `high` |
| Parámetros de API | `{ model, prompt, n, size, quality, background, output_format: "png" }` |
| Respuesta | `data[0].b64_json` siempre (independiente del output_format) |

> ⚠️ **No usar** `output_format: "b64_json"` — eso devuelve 400. El formato del body es `"png"`, la respuesta siempre viene como `b64_json`.

---

## Estrategia de agrupación por imagen (ahorro ~50% de generaciones)

`gpt-image-1` soporta 3 tamaños. La estrategia es combinar sprites compatibles en una sola generación y luego cortar por código.

| Formato | Dimensiones | Uso |
|---------|-------------|-----|
| Cuadrado | 1024×1024 | Sprites individuales, grids 2×2 de balas, partículas, UI |
| Wide | 1536×1024 | Tank body + cañón lado a lado, 3 estados de muro en fila |
| Tall | 1024×1536 | No usado actualmente |

### Tabla de agrupación

| Grupo | Sprites incluidos | Formato | Gen antes → ahora |
|-------|-------------------|---------|-------------------|
| Tank default (y cada skin) | body + cañón | 1536×1024 | 2 → 1 por tanque |
| Common skins (par) | 2 tanques body+cañón | 1536×1024 | 4 → 1 por par |
| Balas | bounce3 + bounce2 + bounce1 + bounce0 | 1024×1024 grid 2×2 | 4 → 1 |
| Muros H | hp3 + hp2 + hp1 | 1536×1024 | 3 → 1 |
| Partículas | smoke + spark + dot | 1024×1024 | 3 → 1 |
| UI icons | bullet + wall + coin | 1024×1024 | 3 → 1 |
| VFX frames | sin cambio — cada frame necesita canvas completo | — | sin cambio |

**Total estimado**: ~103 generaciones → ~50 generaciones (~52% ahorro)

### Regla de corte post-generación

Script `scripts/process-asset.js` (por crear) recibe la imagen grupal y las coordenadas de cada sprite, hace trim de transparencia + resize + guarda en `frontend/public/assets/`.

### VFX: sin agrupación

Cada frame de explosión/respawn/etc. necesita el canvas completo para resolución. No combinar.

---

## Animaciones implementadas en Phaser (sin sprites adicionales)

Estas animaciones son **tweens o particle emitters** — cero costo de tokens:

| Animación | Cómo se hace |
|-----------|-------------|
| Tanque — idle breathing | `tweens.add` scale 1.0↔1.02, 2s loop |
| Tanque — oscilación cañón | `tweens.add` rotation ±0.02rad, 3s loop |
| Tanque — humo de escape | `ParticleEmitter` con `particle-smoke.png` |
| Pickup — hover/bob | `tweens.add` y ±4px, 1.5s loop |
| Pickup raro — rotate | `tweens.add` rotation 0→2π, 4s loop |
| Bala — trail | `ParticleEmitter` con `particle-dot.png` tintado |
| Chispas de impacto | `ParticleEmitter` con `particle-spark.png` |
| HP bar — transición color | `setFillStyle` dinámico según hp/maxHp |
| Auras Power Stack | Sprite único + `tweens.add` alpha pulse |
| Aura Líder | Sprite único + particles dorados flotantes |
| Shield invencible | Sprite único + `tweens.add` alpha blink |
| Bounce flash | Sprite único + `tweens.add` alpha fade 80ms |

---

## Conteo total de imágenes a generar

| Categoría | Sprites únicos | Frames VFX | Total imágenes |
|-----------|---------------|-----------|---------------|
| Tanque default (body + cannon) | 2 | — | 2 |
| Bot tank (body + cannon) | 2 | — | 2 |
| Skins × 20 (body + cannon) | 40 | — | 40 |
| Balas (4 estados) + trail | 5 | — | 5 |
| Muros (H+V, 3 HP cada uno) | 6 | — | 6 |
| Pickups (5 tipos) | 5 | — | 5 |
| Entorno (floor, grid, bordes) | 8 | — | 8 |
| UI icons (7 íconos) | 7 | — | 7 |
| **VFX muzzle flash** | — | 3 frames | 3 |
| **VFX impact wall** | — | 3 frames | 3 |
| **VFX impact border** | — | 2 frames | 2 |
| **VFX tank explosion** | — | 5 frames | 5 |
| **VFX wall destroy** | — | 3 frames | 3 |
| **VFX respawn** | — | 3 frames | 3 |
| VFX invincibility shield | 1 | — | 1 |
| VFX aura low/mid/max | 3 | — | 3 |
| VFX leader aura | 1 | — | 1 |
| VFX bounce flash | 1 | — | 1 |
| VFX pickup collect | — | 2 frames | 2 |
| Partículas (smoke, spark, dot) | 3 | — | 3 |
| Corona del líder | 1 | — | 1 |
| **TOTAL** | — | — | **~116 imágenes** |

---

## Prioridades de generación

### Prioridad 1 — Establece el estilo (5 imágenes)
Aprobar estas antes de continuar — definen el look visual de todo.

| Asset | Archivo prompt |
|-------|---------------|
| `tank-default-body` | `prompts/tanks/tank-default-body.json` |
| `tank-default-cannon` | `prompts/tanks/tank-default-cannon.json` |
| `bullet-bounce3` | `prompts/projectiles/bullet-bounce3.json` |
| `wall-h-hp3` | `prompts/environment/wall-h-hp3.json` |
| `bg-floor-tile` | `prompts/environment/bg-floor-tile.json` |

### Prioridad 2 — Gameplay completo (~40 imágenes)
Con esto el juego se ve "real" aunque no pulido.

Balas 2/1/0, muros restantes, 3 VFX principales (muzzle+impact+explosion), pickups base, 3 partículas.

### Prioridad 3 — Pulido visual (~25 imágenes)
Respawn, invencibilidad, auras, entorno completo, UI, corona.

### Prioridad 4 — Skins (40 imágenes)
Solo cuando el visual base esté aprobado y el billing permita.

---

## Workflow por asset

```
1. Claude lee el prompt del archivo .json
2. Genera con calidad "low" (borrador)
3. Guarda en docs/08-assets/review/{id}-draft.png
4. Usuario revisa → aprueba o pide ajuste
5. Si aprueba: regenera con "high" → guarda en frontend/public/assets/{category}/
6. Si rechaza: Claude ajusta el prompt del .json y vuelve al paso 2
```

---

## Estructura de output final

```
frontend/public/assets/
├── tanks/
│   ├── tank-default-body.png        (128×128)
│   ├── tank-default-cannon.png      (64×64)
│   ├── tank-bot-body.png
│   └── skins/
│       ├── tank-inferno-body.png
│       └── ...
├── projectiles/
│   ├── bullet-bounce3.png           (32×32)
│   ├── bullet-bounce2.png
│   ├── bullet-bounce1.png
│   ├── bullet-bounce0.png
│   └── bullet-trail.png             (64×16)
├── walls/
│   ├── wall-h-hp3.png               (128×32)
│   ├── wall-h-hp2.png
│   ├── wall-h-hp1.png
│   └── (v variants)
├── pickups/
├── effects/
│   ├── vfx-muzzle-flash.png         (288×96  — spritesheet 3f)
│   ├── vfx-impact-wall.png          (288×96  — spritesheet 3f)
│   ├── vfx-impact-border.png        (192×96  — spritesheet 2f)
│   ├── vfx-tank-explosion.png       (1280×256 — spritesheet 5f)
│   ├── vfx-wall-destroy.png         (384×128 — spritesheet 3f)
│   ├── vfx-respawn.png              (576×192 — spritesheet 3f)
│   ├── vfx-pickup-collect.png       (160×80  — spritesheet 2f)
│   ├── vfx-invincibility-shield.png (160×160)
│   ├── vfx-powerstack-aura-low.png  (160×160)
│   ├── vfx-powerstack-aura-max.png  (160×160)
│   ├── vfx-leader-crown-aura.png    (192×192)
│   ├── vfx-bounce-flash.png         (48×48)
│   ├── particle-smoke.png           (32×32)
│   ├── particle-spark.png           (8×8)
│   └── particle-dot.png             (12×12)
├── environment/
└── ui/
```
