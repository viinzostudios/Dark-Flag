# Assets — Arena Siege Tanks

> Documentación de todos los assets visuales del juego.

## Archivos

| Archivo | Descripción |
|---------|-------------|
| [estilo-grafico.md](estilo-grafico.md) | Guía de estilo visual completa — paleta, materiales, efectos |
| [inventario-assets.md](inventario-assets.md) | Lista completa de todos los assets con IDs y metadatos |

## Prompts por categoría

| Carpeta | Contenido |
|---------|-----------|
| [prompts/tanks/](prompts/tanks/) | Tanques, skins, cañones, indicadores |
| [prompts/projectiles/](prompts/projectiles/) | Balas (4 estados) y trail |
| [prompts/environment/](prompts/environment/) | Muros, suelo, bordes de arena |
| [prompts/pickups/](prompts/pickups/) | Todos los pickups de balas y muros |
| [prompts/effects/](prompts/effects/) | Todos los VFX y animaciones |
| [prompts/ui/](prompts/ui/) | Íconos y elementos del HUD |

## Estrategia de perspectiva top-down (IMPORTANTE)

`gpt-image-1` interpreta "top-down view" como vista ~75° isométrica/3-quarter por defecto.
Para obtener vista cenital real (90°) **todos los prompts deben incluir**:

```
viewed strictly from directly above at 90 degrees (bird's eye / zenith view).
Only the TOP SURFACE is visible. NO front face, NO side face.
```

Y para elementos específicos:
- **Tanque body**: orugas = dos bandas rectangulares planas a los lados
- **Cañón**: visto desde arriba = rectángulo estrecho y alargado (no cilindro lateral)
- **Muros**: solo la cara superior visible, outline en los bordes

Esta decisión es **fija** — el juego ya está implementado como top-down y no cambia.

---

## Cómo usar los prompts

Cada archivo `.json` en `prompts/` contiene:
- `prompt`: el texto para pegar en la IA generadora de imágenes
- `negative_prompt`: lo que la IA debe evitar (para Stable Diffusion / Flux)
- `output`: resolución, formato y número de frames exactos
- `phaser_usage`: cómo usar el asset en Phaser 4

### IAs recomendadas
- **Midjourney v6+**: usa el `prompt` directamente. Agrega `--ar` según la resolución
- **DALL-E 3**: pega el `prompt` completo
- **Stable Diffusion / Flux**: usa tanto `prompt` como `negative_prompt`
- **Adobe Firefly**: usa el `prompt` con ajustes de contenido "photo"

### Flujo de trabajo sugerido
1. Generar el tanque default primero (body + cannon) para establecer el estilo base
2. Aprobar el look antes de generar las 20 skins
3. Generar efectos VFX después de que el tanque esté definido
4. Los pickups y UI van al final

## Prioridad de producción

```
Prioridad 1 (para prototipo visual):
  tank-default-body → tank-default-cannon → bullet-bounce3..0

Prioridad 2 (para gameplay completo):
  wall-h-hp1/2/3 → vfx-muzzle-flash → vfx-tank-explosion
  → vfx-impact-wall → pickup-ammo3 → pickup-wall2

Prioridad 3 (para pulido):
  vfx-respawn → vfx-invincibility → vfx-pickup-collect
  → bg-floor-tile → bg-grid-overlay → border-wall-h

Prioridad 4 (contenido de tienda):
  Todas las skins (common → rare → epic → legendary)

Prioridad 5 (HUD y UI):
  Todos los íconos de UI
```
