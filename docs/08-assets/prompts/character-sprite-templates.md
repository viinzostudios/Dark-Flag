# Templates de Generación de Sprites — Dark Flag

> Sistema estandarizado para generar los spritesheets de personajes.
> Cada personaje = 2 llamadas API (4 poses c/u) → 1 ensamblado con Sharp.

---

## Sistema de 6 frames (definitivo)

> **Por qué 6 y no 8**: gpt-image-1 genera máximo 6 paneles confiablemente en una sola llamada.
> Usar 2 llamadas separadas causa inconsistencia de color y diseño entre imágenes.
> El movimiento a izquierda se resuelve con `sprite.setFlipX(true)` en Phaser — sin frames adicionales.

| Frame | Nombre | Descripción |
|-------|--------|-------------|
| 0 | `idle` | Reposo. Fuente de luz brillando al frente. Calmado y alerta. |
| 1 | `move_a` | Movimiento — frame 1 de 2. Cuerpo inclinado/pierna adelantada. |
| 2 | `move_b` | Movimiento — frame 2 de 2. Posición alternada de `move_a`. |
| 3 | `strike` | Ataque. Arma/elemento propio extendido. Enérgico y dinámico. |
| 4 | `stunned` | Aturdido. Cuerpo torcido ~40°, luz apagada. |
| 5 | `victory` | Victoria. Pose triunfal. Luz al máximo. |

**Movimiento a izquierda**: mismos frames 1 y 2 con `sprite.setFlipX(true)`.

---

## Formato del spritesheet

```
Archivo: char-{slug}.png
Tamaño:  1536 × 1024 px  (landscape)
Grid:    3 columnas × 2 filas
Celda:   512 × 512 px

┌──────────┬──────────┬──────────┐
│   idle   │  move_a  │  move_b  │  fila 0
├──────────┼──────────┼──────────┤
│  strike  │ stunned  │ victory  │  fila 1
└──────────┴──────────┴──────────┘
```

### Configuración Phaser

```typescript
this.load.spritesheet('char-{slug}', 'assets/characters/{slug}.png', {
  frameWidth: 512,
  frameHeight: 512,
});

// Animaciones
this.anims.create({ key: '{slug}-idle',    frames: [{ key: 'char-{slug}', frame: 0 }], frameRate: 1,  repeat: -1 });
this.anims.create({ key: '{slug}-move',    frames: this.anims.generateFrameNumbers('char-{slug}', { frames: [1, 2] }), frameRate: 8, repeat: -1 });
this.anims.create({ key: '{slug}-strike',  frames: [{ key: 'char-{slug}', frame: 3 }], frameRate: 1,  repeat: 0  });
this.anims.create({ key: '{slug}-stunned', frames: [{ key: 'char-{slug}', frame: 4 }], frameRate: 1,  repeat: -1 });
this.anims.create({ key: '{slug}-victory', frames: [{ key: 'char-{slug}', frame: 5 }], frameRate: 1,  repeat: 0  });

// Movimiento izquierda = flip del mismo sprite
sprite.setFlipX(movingLeft);
```

---

## Proceso de producción por personaje

```
1. Identificar tipo del personaje: FLOATER o WALKER
2. Copiar Template FLOATER o WALKER (ver abajo)
3. Rellenar [CHARACTER_DESCRIPTION] con el diseño del personaje
4. Generar con gpt-image-1, quality:"low", size:"1536x1024" → revisar
5. Si aprueba → regenerar con quality:"high"
6. Guardar en frontend/public/assets/characters/{slug}.png
```

> No se necesita script de ensamblado — el archivo generado es directamente el spritesheet final.

---

## TEMPLATE 1 — FLOATER (única imagen, 6 poses)

> Rellenar `[CHARACTER_DESCRIPTION]` con el diseño específico del personaje.

```
Character reference sheet showing SIX poses arranged in 3 columns and 2 rows. Upper row has 3 poses, lower row has 3 poses. Black separator lines between all panels. NO text labels. Transparent or white background.
Top-down 2.5D chibi cartoon character. Bold black outlines 5px thick. Strong cel-shaded shadows. Rich saturated colors. High-quality game sprite art.
CRITICAL: Exact same character design in ALL 6 panels — same shape, same colors, same proportions, same accessories.
CRITICAL: This is a FLOATER character — absolutely NO legs or feet in any panel. Lower body is only a flowing cloak/cape/mist/flame that drifts and billows. Movement shown through tilt and billow only.
CRITICAL: Character centered and fully visible in each panel, occupying about 65% of panel area.

UPPER ROW — 3 panels from left to right:
  Left   — IDLE: floating at rest, body upright and symmetric, cloak hanging naturally, light source glowing softly at front
  Center — MOVE A: drifting forward/right, body tilted ~20 degrees, cloak trailing behind to the opposite side, frame 1 of movement
  Right  — MOVE B: drifting with more intensity, body tilted ~28 degrees, cloak billowing dramatically behind, frame 2 of movement (alternates with Move A)

LOWER ROW — 3 panels from left to right:
  Left   — STRIKE: explosive attack pose, character lunges aggressively forward, attack element extends outward with maximum force, floating form spreads wide like dark wings, very dynamic and powerful
  Center — STUNNED: completely dazed after being hit, body tilted ~40 degrees sideways and unable to stabilize, floating form collapsed and deflated, light source dim and crooked, helpless disoriented pose
  Right  — VICTORY: triumphant celebration after scoring, form raised and spread upward in pure joy, light source blazing at full brightness, energetic jubilant pose

[CHARACTER_DESCRIPTION]
```

---

## TEMPLATE 2 — WALKER (única imagen, 6 poses)

```
Character reference sheet showing SIX poses arranged in 3 columns and 2 rows. Upper row has 3 poses, lower row has 3 poses. Black separator lines between all panels. NO text labels. Transparent or white background.
Top-down 2.5D chibi cartoon character. Bold black outlines 5px thick. Strong cel-shaded shadows. Rich saturated colors. High-quality game sprite art.
CRITICAL: Exact same character design in ALL 6 panels — same shape, same colors, same proportions, same accessories.
CRITICAL: This is a WALKER character — has short stubby legs and small round feet CLEARLY VISIBLE in every single panel. Movement shown through alternating leg positions and body lean. Never hide the legs.
CRITICAL: Character centered and fully visible (including feet) in each panel, occupying about 65% of panel area.

UPPER ROW — 3 panels from left to right:
  Left   — IDLE: standing still, both feet flat and side by side, body upright, light source facing forward, relaxed alert posture
  Center — WALK A: walking forward/right, left leg stepped forward, body leaning slightly, frame 1 of walk cycle
  Right  — WALK B: walking, right leg now stepped forward (alternates with Walk A), body lean continues, frame 2 of walk cycle (pair with Walk A for smooth animation)

LOWER ROW — 3 panels from left to right:
  Left   — STRIKE: powerful attack, character plants feet wide apart firmly, extends attack element forward with maximum force and body twist, explosive dynamic aggressive pose
  Center — STUNNED: completely dazed after being hit, both knees buckled, body tilted sideways at awkward angle, head drooping, light source dim, unstable helpless stance
  Right  — VICTORY: triumphant celebration, character jumps or raises arm/weapon high in the air, light source raised and blazing bright, joy and pride unmistakable

[CHARACTER_DESCRIPTION]
```

---

## Sección [CHARACTER_DESCRIPTION] — cómo rellenar

Reemplazar `[CHARACTER_DESCRIPTION]` al final del prompt con un párrafo que especifique:

```
Character design: [tipo FLOATER/WALKER]. [descripción del cuerpo/forma base]. [colores exactos con hex]. 
[descripción de la fuente de luz — farol, orbe, ojo brillante, llama]. [accesorios y detalles distintivos].
[estilo: bold cartoon cel-shaded]. ATTACK ELEMENT: [descripción del arma/elemento que aparece en STRIKE].
```

### Phantom (Floater) — descripción lista para copiar

```
Character design: small chibi FLOATER with absolutely no legs or feet — lower body is a flowing dark hooded cloak that billows and drifts. Dark navy-indigo hooded cloak as main body (#1e1b4b base, #4c1d95 purple highlights), rounded billowing hem at bottom edge. Hood covers the top of the head. Two small upward-curved horns on top of the hood, coral-red color (#f87171). Face area under the hood is a pure black void shadow with exactly TWO large round glowing white dot-eyes — no other facial features. Small cyan glowing orb lantern floating at the front of the character (#67e8f9) with soft bloom glow. Faint swirl or rune markings visible on the cloak fabric. Bold cartoon cel-shaded style. ATTACK ELEMENT: spectral dark energy tendril or ghostly shadowed claw extending from under the cloak edge.
```

### Gearhead (Walker) — descripción lista para copiar

```
Character design: small chibi WALKER robot with short stubby mechanical legs ending in small round metal feet — legs and feet must be clearly visible. Cubic/square head made of copper-brown metal with rivets and bolts on the surface (#b45309 copper main, #fbbf24 gold accents, #92400e dark shadow). A large circular lamp built into the front face of the cube head — this is the light source, glowing warm golden-white (#fef3c7 center, #fbbf24 outer glow). Small rounded body with bronze metallic panel plates. Short robotic arms, slightly raised at sides. Industrial steampunk aesthetic. Bold cartoon cel-shaded style. ATTACK ELEMENT: large mechanical fist or piston arm extending forward with a small puff of steam.
```

---

## Notas de producción

- **Fondo transparente**: gpt-image-1 genera fondos blancos en algunos casos. Para el ensamblado, Sharp compone sobre canal alpha vacío — el fondo blanco del modelo no afecta el sprite final si el personaje tiene outline negro sólido (se puede recortar después con un paso de `removeBackground` o simplemente aceptar el fondo blanco si el juego lo renderiza sobre oscuro).
- **Consistencia entre imágenes A y B**: ambas llamadas usan la misma `[CHARACTER_DESCRIPTION]` — el modelo no garantiza consistencia perfecta pero con la descripción detallada y los hex colors es lo más estable posible.
- **Borradores**: siempre generar con `quality:"low"` primero. Solo regenerar `quality:"high"` tras aprobación del usuario.
- **Rutas de borrador**: `docs/08-assets/review/char-{slug}-a-draft.png` y `char-{slug}-b-draft.png`
- **Ruta final**: `frontend/public/assets/characters/{slug}.png` (1024×2048)
