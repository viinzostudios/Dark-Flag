# Guía de Estilo Gráfico — Dark Flag

> Esta guía es la fuente de verdad para todo asset visual del juego.
> Todos los prompts de IA deben ser consistentes con estas reglas.
> Referencias visuales aprobadas: `char-mech-draft.png` y `char-phantom-draft.png`.

---

## 1. Filosofía visual

Dark Flag es un juego de oscuridad, misterio y tensión social. El arte debe transmitir:

- **Oscuridad táctica**: el mundo es negro, el cono de linterna es la única ventana al mundo
- **Personajes expresivos**: figuras reconocibles y adorables incluso en sombras parciales
- **Luz dramática**: los halos, glows y efectos de linterna son el protagonista visual
- **Legibilidad**: a pesar de la oscuridad, el estado del juego debe ser claro de un vistazo

**Estilo base**: cartoon/cel-shaded, outlines negros gruesos (4–6px), colores muy saturados y vibrantes que contrasten fuertemente con el fondo oscuro. Proporciones exageradas — cabeza/cuerpo desproporciones chibi. Inspirado en los personajes `char-mech` y `char-phantom`.

**NO usar**: realismo, pixel art, colores desaturados, estética militar, gore, estilos monocromáticos, personajes con cara humana realista.

---

## 2. Referencias visuales aprobadas (estilo canónico)

Estos dos diseños definen el estilo visual para TODOS los personajes del juego. Cualquier nuevo personaje debe ser legible como parte de la misma familia estética.

### Gearhead (`char-mech`) — Walker canónico ✅
> Archivo: `docs/08-assets/review/char-mech-draft.png`

**Descripción visual**:
- Cabeza cuadrada/cúbica de metal cobrizo con remaches visibles
- Farol circular dorado integrado en la parte frontal de la cabeza (ojo-lámpara con glow cálido)
- Cuerpo pequeño con paneles de bronce articulados
- Extremidades cortas: brazos y piernas mecánicas y robustas
- Proporciones: cabeza = aprox. 50–60% del tamaño total del personaje
- Vista: ligeramente desde arriba (top-down 2.5D) — se ve la parte superior de la caja-cabeza y la cara/frente
- **Tipo**: Walker — tiene piernas, se mueve caminando

**Paleta**:
- Cuerpo: `#b45309` (cobre oscuro)
- Acentos: `#fbbf24` (dorado)
- Sombras: `#92400e` (bronce oscuro)
- Farol: `#fef3c7` con glow `#fbbf24`

---

### Phantom (`char-phantom`) — Floater canónico ✅
> Archivo: `docs/08-assets/review/char-phantom-draft.png`

**Descripción visual**:
- Capa oscura morado-marino fluyendo, sin pies visibles — la figura "levita"
- Cuernos pequeños curvos sobre la capucha (2 cuernos simétricos)
- Ojos blancos brillantes bajo el capuchón oscuro
- Orbe de linterna cyan flotando al frente del personaje con bloom de luz
- La capa se expande hacia abajo como si flotara en el aire
- **Tipo**: Floater — sin piernas, se desplaza flotando/deslizándose

**Paleta**:
- Capa: `#1e1b4b` (índigo muy oscuro)
- Highlights: `#4c1d95` (morado)
- Ojos: `#ffffff` con glow
- Orbe: `#67e8f9` (cyan) con bloom `#06b6d4`

---

## 3. Paleta de colores del juego

### Paleta de interfaz (UI)

| Nombre | Hex | Uso |
|--------|-----|-----|
| Fondo base | `#080810` | Background del juego y UI |
| Superficie | `#12132a` | Cards, modales, paneles |
| Superficie elevada | `#1c1d3e` | Hover states, elementos activos |
| Primario morado | `#7c3aed` | Botones principales, bordes de acción |
| Teal / linterna | `#06b6d4` | Efectos de linterna, highlights secundarios |
| Ámbar / bandera | `#f59e0b` | Bandera, puntuación, advertencias |
| Rojo / impacto | `#ef4444` | Stun, peligro, level-down |
| Texto primario | `#f8fafc` | Texto principal |
| Texto secundario | `#94a3b8` | Labels, subtítulos |
| Borde | `#2d2f5e` | Bordes de cards y elementos |

### Paleta de linternas por nivel

| Nivel | Color del cono | Hex |
|-------|---------------|-----|
| 1–4 | Blanco frío | `#e0f2ff` |
| 5–9 | Azul-blanco | `#bfdbfe` |
| 10–14 | Ámbar dorado | `#fcd34d` |
| 15 | Morado brillante | `#c084fc` |

---

## 4. Tipos de personaje

Todos los personajes de Dark Flag son figuras chibi 2.5D, pero se dividen en dos tipos de movimiento. Esto afecta las animaciones del spritesheet.

### Walker (caminante)
- Tiene piernas cortas y robustas visibles
- En la animación de movimiento se alternan posiciones de pies
- En el frame `idle` puede tener un leve balanceo vertical (bob tween — lo hace Phaser, no el sprite)
- Ejemplos del catálogo: Gearhead, personajes robóticos, humanos fantasy, criaturas con patas
- **Reference**: `char-mech-draft.png`

### Floater (flotante)
- Sin piernas visibles — la parte inferior es una capa, sombra, llama, nube, etc.
- En la animación de movimiento la forma inferior se inclina o deforma ligeramente
- Transmite sensación de levitación o deslizamiento sobrenatural
- Ejemplos del catálogo: Phantom, fantasmas, sombras vivientes, espíritus
- **Reference**: `char-phantom-draft.png`

El tipo (walker/floater) debe especificarse en el prompt de cada personaje y definirse en el catálogo.

---

## 5. Sistema de spritesheet — 8 estados por personaje

Cada personaje tiene **8 frames** divididos en **2 imágenes generadas** (4 frames c/u) que se ensamblan en la spritesheet final.

> Detalle completo de templates y proceso de producción: [`docs/08-assets/prompts/character-sprite-templates.md`](prompts/character-sprite-templates.md)

### Layout del spritesheet final

**Archivo**: `char-{slug}.png`
**Formato**: `1536×1024` px (landscape)
**Grid**: 3 columnas × 2 filas — **celda: 512×512 px**
**Una sola llamada API** → máxima consistencia de diseño

```
┌──────────┬──────────┬──────────┐
│  0·idle  │ 1·move_a │ 2·move_b │  fila 0
├──────────┼──────────┼──────────┤
│ 3·strike │4·stunned │5·victory │  fila 1
└──────────┴──────────┴──────────┘
```

**Índices de frame**:

| Frame | Nombre | Descripción |
|-------|--------|-------------|
| 0 | `idle` | Reposo, fuente de luz visible |
| 1 | `move_a` | Movimiento — frame 1 de 2 |
| 2 | `move_b` | Movimiento — frame 2 de 2 (alterna con move_a) |
| 3 | `strike` | Ataque — arma/elemento propio extendido |
| 4 | `stunned` | Aturdido — cuerpo torcido, luz apagada |
| 5 | `victory` | Victoria — pose triunfal, luz al máximo |

**Movimiento a izquierda**: `sprite.setFlipX(true)` + frames `move_a`/`move_b` — sin poses separadas.
**Bandera**: Phaser dibuja el ícono encima del frame activo como overlay. Sin frame `carry` en el sprite.

**Configuración Phaser**:
```typescript
this.load.spritesheet('char-{slug}', 'assets/characters/{slug}.png', {
  frameWidth: 512,
  frameHeight: 512,
});
```

---

## 6. Sistema de arma/elemento propio

Cada personaje tiene un **arma o elemento de ataque** que encaja con su temática y diseño.
Este elemento **solo es visible en el frame `strike`** (frame 3 del spritesheet).

**Reglas**:
- No es un objeto que el personaje lleva permanentemente — aparece en la acción
- Puede ser una extensión de su cuerpo, un poder, una herramienta o un accesorio temático
- Debe verse claramente en el frame strike — tamaño generoso, bien definido
- **No existe barra de cooldown visual en HUD** — la limitación de uso es mecánica de servidor, invisible para el jugador

### Ejemplos de armas por tipo de personaje

| Tipo de personaje | Arma/elemento sugerido |
|------------------|----------------------|
| Robot/mecánico | Puño mecánico extendido, llave inglesa, pistón hidráulico |
| Fantasma/espectral | Tentáculo de energía oscura, garra etérea, onda de sombra |
| Mago/místico | Vara mágica, esfera de energía lanzada, rayo de hechizo |
| Naturaleza | Enredadera, raíz disparada, espina grande |
| Elemental fuego | Puño de llama, bola de fuego concentrada |
| Elemental hielo | Cristal de hielo proyectado, estalactita |
| Ninja/sombra | Kunai de energía, onda de corte, sombra afilada |
| Fantasma/capa | Proyección de oscuridad, pulso de aura |
| Criatura | Zarpazo, cola de impacto, embestida de cabeza |

El prompt de cada personaje debe especificar su arma. El catálogo de personajes (catálogo-master.md) define la arma de cada uno.

---

## 7. Fuente de luz integrada

Cada personaje tiene una fuente de luz propia que representa su capacidad de iluminar la arena oscura.
Esta fuente de luz debe ser **claramente visible en todos los frames**, especialmente en `idle`.

- Puede ser: farol, orbe flotante, ojo brillante, lámpara, cristal luminoso, llama, etc.
- Debe coincidir estéticamente con el personaje
- Color de la luz: varía con el nivel del jugador (ver tabla de linternas en sección 3)
- En los sprites: siempre mostrar en su color base/neutral (el tinte de nivel lo aplica Phaser programáticamente)

---

## 8. Reglas universales de prompt

Incluir siempre en los prompts de personajes:

**Estilo base**:
```
top-down 2.5D view, original chibi cartoon character, bold black outlines 5px thick,
cel-shaded coloring with strong shadows, vibrant saturated colors,
transparent background, completely original design, video game sprite asset style,
same aesthetic as Gearhead robot chibi and Phantom hooded ghost chibi characters
```

**Negative prompt universal**:
```
among us, crewmate, human realistic face, realistic, pixel art, text, logo, watermark,
military, gore, copyright characters, background color, solid background, gradient background,
weapons always visible (weapon only in attack pose), inconsistent style between panels
```

### Prompt de spritesheet completo (plantilla)

```
Six-panel sprite sheet on transparent background, 2 columns x 3 rows, each panel 512x512px.
Top-down 2.5D original chibi cartoon character. Bold black outlines 5px. Cel-shaded.
Same character design consistently across all 6 panels.

Panel layout (L→R, top→bottom):
[ROW 0, COL 0] IDLE: character at rest, light source glowing at front
[ROW 0, COL 1] MOVE_A: movement pose A — [walker: left leg forward / floater: leaning forward]
[ROW 1, COL 0] MOVE_B: movement pose B — [walker: right leg forward / floater: slight tilt other side]
[ROW 1, COL 1] STRIKE: attack pose — [specific weapon/element] extended aggressively forward
[ROW 2, COL 0] STUNNED: dazed pose — body tilted, head slumped, light source dim
[ROW 2, COL 1] CARRY: one arm/limb raised as if holding something important

Character: [specific character description — color, accessories, light source type, personality]
Type: [Walker/Floater]
Attack element: [specific weapon/element description]
```

---

## 9. Los obstáculos (perspectiva 2.5D)

Los obstáculos tienen perspectiva ligera que les da sensación de altura:
- **Cara superior**: el techo del obstáculo visto desde arriba
- **Cara frontal lateral**: franja en el borde inferior que simula la pared (tono más oscuro)

**Tres tipos con sus dimensiones de hitbox**:

| Tipo | Descripción | Hitbox |
|------|-------------|--------|
| BUNKER | Ruina de edificio, vista isométrica | 300×200px |
| BARRIER | Muro largo de concreto/piedra | 400×99px |
| ROUND | Obstáculo circular (roca, barril) | radio 80px |

---

## 10. Los efectos de luz (linterna)

El cono de linterna es el elemento visual más importante del juego:
- **Volumen**: gradiente de transparencia desde el origen hasta el borde del rango
- **Suavidad**: 3 passes de erase con alpha decreciente — sin bordes abruptos
- **Color**: según nivel del jugador (tabla sección 3)
- **Glow**: halo suave en el origen del haz del mismo color que el cono

---

## 11. La bandera y el destino

### Bandera
- Ícono ámbar/dorado con destello, reconocible de un vistazo
- En suelo: pulso suave de brillo (tween Phaser)
- Cuando alguien la porta: ícono flotante dibujado encima del personaje (encima del frame `carry`)
- Tamaño en juego: ~32×32px visual

### Destino
- Zona circular teal pulsante en el suelo
- Solo visible para el portador (y para todos cuando el portador está a ≤150px)
- Efecto de pulsación: generado con Phaser Graphics (sin spritesheet)

---

## 12. Power-ups (iconos)

Cada power-up tiene un ícono con fondo transparente. Legible en una fracción de segundo, con el color dominante de esa acción y contorno negro grueso.

| Power-up | Color dominante | Símbolo |
|----------|----------------|---------|
| Escudo de Mazo | Azul cielo `#38bdf8` | Escudo con estrella |
| Revelación | Amarillo `#facc15` | Ojo brillante |
| Sprint | Verde lima `#84cc16` | Rayo / relámpago |
| Apagón | Negro con borde rojo `#1e293b` | Bombilla tachada |
| Supermazo | Rojo intenso `#dc2626` | Martillo con llamas |
| Fantasma | Blanco translúcido `#e2e8f0` | Fantasma sonriente |

---

## 13. Arenas — guía por escenario

Cada arena tiene:
1. **Fondo** (background tileable o gradiente)
2. **Sprites de obstáculos** (bunker + barrier + round temáticos)
3. **Efectos ambientales** (partículas Phaser, opcionales)
4. **Paleta de iluminación** del farol central (color del halo)

| Arena | Concepto | Faro color | Efectos ambient |
|-------|---------|-----------|-----------------|
| Estación Espacial | Metal oscuro, neones azules | `#38bdf8` | Partículas de polvo |
| Alcantarillas | Cemento mojado, charcos verdes | `#4ade80` | Gotitas de agua |
| Mansión Encantada | Madera oscura, candelabros | `#fbbf24` | Polvo flotante |
| Cyberpunk City | Asfalto + neones multicolor | `#f0abfc` | Lluvia neon |
| Cueva Ártica | Hielo azul, estalactitas | `#93c5fd` | Copos de nieve |
| Cueva Volcánica | Roca oscura, grietas de lava | `#f97316` | Chispas de lava |
| Bosque de Noche | Tierra oscura, raíces | `#86efac` | Luciérnagas |
| Templo Antiguo | Piedra tallada, antorchas | `#fcd34d` | Humo de antorcha |

---

## 14. UI — estética Dark Flag

**Botones primarios**: gradiente morado→teal (`#7c3aed` → `#06b6d4`), border-radius 12px, glow exterior morado al hover

**Cards**: background `#12132a`, border `#2d2f5e` con glow morado al hover/active, border-radius 16px

**HUD del juego**:
- Sin barra de cooldown del arma — la mecánica de uso es invisible al jugador
- Indicadores de estado de power-ups: íconos pequeños con countdown circular (opcional)
- Minimap: esquina inferior izquierda, 120×90px, fondo negro 70% alpha

**Tipografía**:
- Título: display en mayúsculas, bold, gradiente de texto morado→teal
- Números de nivel en HUD: monospace/condensed, bold, grande
- Texto de notificaciones: sans-serif, 14–16px

---

## 15. Decisiones de diseño documentadas

| Decisión | Detalle | Razón |
|----------|---------|-------|
| No cooldown bar del arma | El tiempo de reutilización del golpe es mecánico (server), sin indicador visual en HUD | El usuario prefiere que no haya barra de carga visible — la tensión debe sentirse en el gameplay, no en la UI |
| Arma propia por personaje | Cada personaje tiene su elemento de ataque temático, no un "mazo" genérico | Mayor identidad y coherencia visual; el mazo es solo el nombre de la mecánica, no el arte |
| Bandera como overlay Phaser | El frame `carry` del sprite no incluye la bandera — Phaser la dibuja encima | Reutilizable para cualquier personaje sin regenerar sprites |
| 6 estados en 1 spritesheet | idle / move_a / move_b / strike / stunned / carry en imagen 1024×1536 | Balance entre calidad IA, consistencia visual y ahorro de tokens |
| Estrellas de stun vía Phaser | El frame `stunned` no incluye estrellas orbitantes | Los efectos de partículas son responsabilidad de Phaser, no del sprite |
