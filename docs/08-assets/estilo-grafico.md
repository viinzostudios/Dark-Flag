# Guía de Estilo Gráfico — Dark Flag

> Esta guía es la fuente de verdad para todo asset visual del juego.
> Todos los prompts de IA deben ser consistentes con estas reglas.

---

## 1. Filosofía visual

Dark Flag es un juego de oscuridad, misterio y tensión social. El arte debe transmitir:

- **Oscuridad táctica**: el mundo es negro, el cono de linterna es la única ventana al mundo
- **Personajes expresivos**: figuras reconocibles y adorables incluso en sombras parciales
- **Luz dramática**: los halos, glows y efectos de linterna son el protagonista visual
- **Legibilidad**: a pesar de la oscuridad, el estado del juego debe ser claro de un vistazo

**Estilo base**: cartoon/cel-shaded, outlines negros gruesos (4–6px), colores muy saturados y vibrantes que contrasten fuertemente con el fondo oscuro. Proporciones exageradas y expresivas.

**NO usar**: realismo, pixel art, colores desaturados, estética militar, gore, estilos monocromáticos.

---

## 2. Paleta de colores del juego

### Paleta de interfaz (UI)

| Nombre | Hex | Uso |
|--------|-----|-----|
| Fondo base | `#080810` | Background del juego y UI |
| Superficie | `#12132a` | Cards, modales, paneles |
| Superficie elevada | `#1c1d3e` | Hover states, elementos activos |
| Primario morado | `#7c3aed` | Botones principales, bordes de acción |
| Teal / linterna | `#06b6d4` | Efectos de linterna, highlights secundarios |
| Ámbar / bandera | `#f59e0b` | Bandera, puntuación, advertencias |
| Rojo / mazo | `#ef4444` | Stun, peligro, level-down |
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

## 3. Los personajes — Dark Flag Characters

### Concepto general

Los personajes de Dark Flag son figuras **chibi originales** vistas en perspectiva top-down 2.5D.
Cada skin tiene una fuente de luz integrada (farol, linterna, orbe) que representa su capacidad de iluminar la arena oscura.

**Reglas visuales universales**:
- Vista top-down con leve ángulo frontal — se ve la parte superior del personaje y la cara/frente
- Proporciones chibi: cabeza/cuerpo grande, pies pequeños o ausentes
- Fuente de luz claramente visible en el frente del personaje (farol, orbe, ojo brillante)
- Sin armas visibles (el mazo es una acción, no un objeto en mano permanente)
- Outlines negros sólidos, 4–6px
- Cel-shading con sombras marcadas

**Estilo gráfico**: cartoon/cel-shaded, colores saturados y vibrantes que contrastan fuertemente con el fondo oscuro del juego. Proporciones exageradas, expresivas y adorables.

---

### Referencias visuales aprobadas

Estos dos skins fueron generados y aprobados como referencia de estilo para Dark Flag:

#### Gearhead (`char-mech`) — Referencia: robot steampunk chibi
> Archivo: `docs/08-assets/review/char-mech-draft.png`

- Cabeza cuadrada metálica cobre/dorado con remaches
- Farol circular dorado integrado en la frente (glow cálido)
- Cuerpo pequeño con paneles de bronce
- Paleta: `#b45309` cuerpo / `#fbbf24` acentos dorados / `#92400e` sombras
- Rareza: Épica

#### Phantom (`char-phantom`) — Referencia: figura encapuchada oscura
> Archivo: `docs/08-assets/review/char-phantom-draft.png`

- Capa oscura morado-marino fluyendo, vista desde arriba
- Cuernos curvos sobre la capucha
- Ojos blancos brillantes visibles bajo el capuchón
- Orbe de linterna cyan flotando al frente (`#67e8f9` con bloom)
- Paleta: `#1e1b4b` capa / `#4c1d95` highlights / `#67e8f9` orbe
- Rareza: Legendaria

---

### Skins — catálogo (100 total)

100 skins organizadas por rareza. Cada skin es un personaje con diseño, colores y accesorios únicos.
La fuente de luz (farol/orbe) varía en forma y color por skin pero siempre está presente.

| Rareza | Cantidad | Características | Precio aprox |
|--------|----------|-----------------|-------------|
| Común | 40 | Figura base con color sólido, sin accesorios | Gratis / desbloqueables por tiempo |
| Rara | 30 | Color + patrón (rayas, puntos, gradiente) o accesorio menor | 500–2000 coins |
| Épica | 20 | Diseño temático con accesorios especiales (robot, mago, ninja...) | 3000–6000 coins |
| Legendaria | 10 | Concepto único + efecto de aura o partículas (fantasma, dragón...) | 10000+ coins o gems |

**Naming de archivos**: `char-{slug}.png` (ej: `char-azure.png`, `char-mech.png`, `char-phantom.png`)

**Tamaño de archivo**: 128×128px con fondo transparente

**Generación**: grids 2×5 (10 personajes por imagen 1024×1024), crop con Sharp → 10 batches = 100 skins

---

### Skins comunes — paleta de colores base

Las 40 skins comunes son variantes del mismo arquetipo base (figura chibi simple con farol) en diferentes colores:

| Slug | Color cuerpo | Farol | Ejemplo |
|------|-------------|-------|---------|
| azure | `#3b82f6` | blanco-azul | Azul vibrante |
| crimson | `#ef4444` | blanco-rojo | Rojo intenso |
| emerald | `#10b981` | blanco-verde | Verde esmeralda |
| amber | `#f59e0b` | dorado | Ámbar/dorado |
| violet | `#8b5cf6` | morado | Morado |
| slate | `#64748b` | blanco frío | Gris azulado |
| rose | `#f43f5e` | rosa | Rosa fuerte |
| teal | `#14b8a6` | cyan | Teal/aguamarina |
| *(+32 más)* | variaciones | variaciones | tonos pasteles, neones, etc. |

---

## 4. Los obstáculos (perspectiva 2.5D)

Los obstáculos tienen una perspectiva ligera que les da sensación de altura:
- **Cara superior**: el techo del obstáculo visto desde arriba
- **Cara frontal lateral**: una franja visible en el borde inferior que simula la pared
- La cara lateral tiene un tono más oscuro que la superior (simulando iluminación)

**Tres tipos con sus dimensiones de hitbox**:

| Tipo | Descripción | Hitbox |
|------|-------------|--------|
| BUNKER | Ruina de edificio, vista isométrica | 300×200px |
| BARRIER | Muro largo de concreto/piedra | 400×99px |
| ROUND | Obstáculo circular (roca, barril) | radio 80px |

Cada arena tiene sus propios sprites temáticos para estos tres tipos.

---

## 5. Los efectos de luz (linterna)

El cono de linterna es el elemento visual más importante del juego. Debe transmitir:

- **Volumen**: el haz parece tener profundidad (gradiente de transparencia)
- **Suavidad**: los bordes del cono no son cortantes — se difuminan levemente
- **Color**: según el nivel del jugador (tabla de la sección 2)
- **Glow**: el origen del haz (posición del personaje) emite un halo suave del mismo color

**No renderizar** el cono como un triángulo plano — aplicar un gradiente radial de transparencia desde el origen hasta el extremo del rango.

---

## 6. La bandera y el destino

### Bandera
- Objeto ámbar/dorado con destello
- Debe ser reconocible a primera vista cuando la linterna la ilumina
- Efecto: pulsación suave de brillo (sin animación de spritesheet — un loop de opacity)
- Cuando la lleva alguien: ícono flotante sobre el personaje, con pequeña sombra
- Tamaño en juego: ~32×32px visual

### Destino
- Zona circular teal pulsante en el suelo
- Solo visible para el portador (y para todos cuando está a 150px)
- Debe verse como un portal o zona de energía en el suelo
- Efecto de pulsación: 4 frames de animación (spritesheet) o generado con Phaser Graphics

---

## 7. Power-ups (iconos)

Cada power-up tiene un ícono 64×64px con fondo transparente. El ícono debe ser:
- Legible en una fracción de segundo
- Con el color dominante de esa acción
- Contorno negro grueso (mismo estilo que personajes)

| Power-up | Color dominante | Símbolo |
|----------|----------------|---------|
| Escudo de Mazo | Azul cielo `#38bdf8` | Escudo con estrella |
| Revelación | Amarillo `#facc15` | Ojo brillante |
| Sprint | Verde lima `#84cc16` | Rayo / relámpago |
| Apagón | Negro con borde rojo `#1e293b` | Bombilla tachada |
| Supermazo | Rojo intenso `#dc2626` | Martillo con llamas |
| Fantasma | Blanco translúcido `#e2e8f0` | Fantasma sonriente |

---

## 8. Arenas — guía por escenario

Cada arena tiene:
1. **Fondo** (background tileable o gradiente)
2. **Sprites de obstáculos** (bunker + barrier + round temáticos)
3. **Efectos ambientales** (partículas Phaser, opcionales)
4. **Paleta de iluminación** del faro central (color del halo)

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

## 9. UI — estética Dark Flag

### Componentes principales

**Botones primarios**: gradiente morado→teal (`#7c3aed` → `#06b6d4`), border-radius 12px, glow exterior morado al hover

**Cards**: background `#12132a`, border `#2d2f5e` con glow morado al hover/active, border-radius 16px

**Inputs**: background `#1c1d3e`, border `#2d2f5e`, focus border `#7c3aed` con glow sutil

**Leaderboard**: fondo semitransparente `rgba(18,19,42,0.9)`, texto blanco, tu fila con borde ámbar

**Toasts de nivel**: fondo `#12132a`, ícono de linterna animado, color del número = paleta de nivel

### Tipografía

- **Título principal** (Dark Flag): fuente display en mayúsculas, bold, con efecto de texto en gradiente
- **Números de nivel en HUD**: fuente monospace o condensed, tamaño grande (60–80px), peso bold
- **Texto de notificaciones**: fuente sin serif, peso normal, tamaño 14–16px

---

## 10. Prompts base para generación de IA

### Estilo universal (incluir en todos los prompts de personajes)

```
top-down 2.5D view, original chibi cartoon character, bold black outlines 5px thick,
cel-shaded coloring with strong shadows, vibrant saturated colors,
transparent background, single character centered in frame,
video game sprite asset style, completely original design
```

### Negative prompt universal (personajes)

```
among us, crewmate, human face, realistic, pixel art, weapons in hand,
text, logo, watermark, multiple characters, background, military, gore, copyright characters
```

### Prompt base — skin común (color sólido)

```json
{
  "prompt": "a single cute original chibi cartoon character for a top-down video game, viewed from slightly above 2.5D angle, small round chubby body, bright azure blue color (#3b82f6), a small round lantern or light source glowing at the front of the character emitting white-blue light, no visible arms, tiny feet barely visible, bold black outline 5px thick, cel-shaded cartoon coloring, vibrant saturated colors, transparent background, single character perfectly centered, video game sprite asset style, completely original design",
  "negative_prompt": "among us, crewmate, human face, realistic, pixel art, text, logo, watermark, multiple characters, background, weapons, military, copyright",
  "output": "docs/08-assets/review/char-azure-draft.png",
  "size": "1024x1024",
  "quality": "low"
}
```

### Prompt base — skin épico (Gearhead — APROBADO ✅)
> Referencia visual: `docs/08-assets/review/char-mech-draft.png`

```json
{
  "prompt": "a single cute cartoon robot character for a top-down video game, viewed from slightly above 2.5D angle, small chibi proportions, SQUARE boxy metallic head with copper and gold tones, bright round lantern built into the front of the head with warm glow bloom, mechanical rivets and bolts, small rounded body with bronze metallic panel plates, warm copper-brown and golden-yellow color scheme, bold black outline 5px thick, cel-shaded cartoon coloring, transparent background, single character centered, video game sprite asset style, steampunk aesthetic",
  "negative_prompt": "among us, crewmate, human face, realistic, pixel art, text, logo, watermark, multiple characters, background, military, modern robot",
  "output": "docs/08-assets/review/char-mech-draft.png",
  "size": "1024x1024",
  "quality": "low"
}
```

### Prompt base — skin legendario (Phantom — APROBADO ✅)
> Referencia visual: `docs/08-assets/review/char-phantom-draft.png`

```json
{
  "prompt": "a single cute mysterious ghost character for a top-down video game, viewed from slightly above 2.5D angle, small chibi proportions, flowing dark hooded cloak dark purple-navy, TWO small bright glowing eyes under the dark hood, small curved horns on top of the hood, floating ethereal cyan lantern orb in front emitting ghostly pale cyan light with glow bloom, bold black outline 5px thick, cel-shaded cartoon coloring, transparent background, single character centered, video game sprite asset style, dark fantasy aesthetic",
  "negative_prompt": "among us, crewmate, human body, realistic, pixel art, text, logo, watermark, multiple characters, background, military, halloween ghost, skeleton",
  "output": "docs/08-assets/review/char-phantom-draft.png",
  "size": "1024x1024",
  "quality": "low"
}
```

### Prompt base — obstáculo BUNKER (espacio)

```json
{
  "prompt": "top-down 2.5D view of a destroyed space station bunker obstacle for a top-down game, dark grey metal panels, blue neon light strips on edges, top face visible + small side face visible for depth illusion, bold black outlines 5px, cartoon cel-shaded style, space station aesthetic, transparent background, video game prop",
  "negative_prompt": "isometric, realistic, photo, logo, text",
  "output": "docs/08-assets/review/bunker-space-draft.png",
  "size": "1024x1024",
  "quality": "low"
}
```

### Prompt base — hero landing page

```json
{
  "prompt": "top-down view dark arena scene, multiple original crewmate-inspired cartoon characters holding flashlights in complete darkness, dramatic flashlight beams (white cones of light), one character holds an amber glowing flag, mysterious atmosphere, dark blue-black background, vibrant character colors contrasting with darkness, cinematic composition, no text, game promotional art style",
  "negative_prompt": "among us trademark, copyright, realistic, military, text, logo, watermark",
  "output": "docs/08-assets/review/landing-hero-draft.png",
  "size": "1536x1024",
  "quality": "low"
}
```
