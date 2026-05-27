# Game Design Document — Dark Flag

---

## Visión

Dark Flag es un juego web multijugador top-down de sigilo, exploración y confrontación en una arena de oscuridad total.

> "En la oscuridad, quien controla la luz controla el juego."

**Pilares de diseño**:
1. **Información como ventaja** — la linterna revela el mundo; apagarla te vuelve invisible
2. **Tensión espacial** — la bandera es invisible, el destino es secreto, las trampas acechan
3. **Confrontación táctica** — un solo mazo bien ejecutado decide quién puntúa

---

## Mapa

- Forma: rectángulo cerrado, oscuro casi por completo
- Vista: top-down con obstáculos en estilo 2.5D (cara superior + cara lateral visible)
- Fondo: `#080810`, superficies `#12132a`
- Sin condición de victoria ni tiempo límite — sesión continua e infinita

### El Faro

- Círculo de 300 px siempre iluminado en el centro exacto del mapa
- Único punto de referencia fijo y visible para todos sin linterna
- Sirve como orientación espacial en la oscuridad total

### Tamaño dinámico según jugadores

| Jugadores (máx) | Ancho | Alto |
|----------------|-------|------|
| ≤ 10 | 2 000 | 1 333 |
| ≤ 20 | 2 800 | 1 867 |
| ≤ 35 | 3 600 | 2 400 |
| ≤ 50 | 4 500 | 3 000 |

Relación de aspecto 3:2 constante. Se calcula una vez al inicio de sala y no cambia.

### Obstáculos estáticos

Tres tipos de obstáculos colocados al iniciar la partida. Proyectan sombras que bloquean el cono de luz.

| Tipo | Dimensiones | Descripción |
|------|-------------|-------------|
| BUNKER | 300 × 200 px | Bloque rectangular grande, refugio o punto de emboscada |
| BARRIER | 400 × 99 px | Pared larga y estrecha, separa zonas del mapa |
| ROUND | Radio 80 px | Columna circular, deflecta conos de luz |

Los obstáculos nunca se superponen entre sí ni con el Faro. Su cantidad escala con el tamaño del mapa.

---

## Personaje

- Figura original inspirada en Among Us: cuerpo ovalado, visor semiesférico, sin brazos visibles
- Vista top-down; rota libremente 360°
- Se mueve automáticamente hacia el cursor del mouse (velocidad proporcional a la distancia)
- **SPACEBAR**: el personaje se detiene en posición, pero puede rotar la linterna libremente apuntando al cursor

---

## Linterna

La linterna es la herramienta central del juego. Revela el mapa, a otros jugadores, la bandera y las trampas.

| Atributo | Descripción |
|----------|-------------|
| Dirección | Siempre apunta al cursor del mouse |
| Estado | Encendida por defecto |
| Toggle | El jugador puede apagarla manualmente (modo stealth) |
| Renderizado | Cono volumétrico con glow suave |

### Comportamiento de sombras

Los obstáculos bloquean el haz de luz. El cono no atraviesa muros ni columnas — genera sombras dinámicas proyectadas en tiempo real según el ángulo del haz.

### Modo stealth (linterna apagada)

- El jugador no emite luz visible para otros jugadores
- El jugador tampoco ve por donde va (riesgo calculado)
- Nivel 9+: velocidad adicional +10% mientras la linterna está apagada
- Nivel 13+: el toggle no produce parpadeo visible para otros

---

## La Bandera

La bandera es el único objetivo de puntuación máxima del juego.

### Ciclo de vida

1. Aparece en posición aleatoria del mapa — invisible hasta ser iluminada
2. Cualquier linterna que la ilumine la hace visible para quien la iluminó
3. El primer jugador en iluminarla recibe +1 nivel
4. Para recogerla: caminar encima de ella (pickup por colisión)
5. Al recogerla: notificación global, el portador debe llevarla al destino
6. Al entregar: puntuación, notificación y nuevo ciclo comienza

### Estado: buscando la bandera

- Notificación global al inicio de cada ciclo: `🔍 Nueva bandera en algún lugar del mapa...`
- La bandera permanece en el mapa indefinidamente hasta ser encontrada (sin timer de desaparición)

### Estado: bandera recogida

| Elemento | Descripción |
|----------|-------------|
| Notificación global | `🏳️ [Nombre] encontró la bandera` |
| Pulsación de destino | El portador ve una pulsación tenue en la dirección del destino (solo él la ve) |
| Intensidad | La pulsación se intensifica al acercarse al destino |
| Zona de entrega | A 150 px del destino: zona pulsante visible para TODOS los jugadores |
| Mini-mapa | El portador aparece como punto pulsante en el mini-mapa de todos |

### Pérdida de la bandera

La bandera cae al suelo y queda libre para ser recogida por cualquiera en los siguientes casos:
- El portador recibe un mazo exitoso: `💥 [Nombre] fue golpeado — ¡bandera libre!`
- El portador cae en una trampa: `⚠️ [Nombre] cayó en una trampa — ¡bandera libre!`

Tras soltarla, el portador no puede volver a agarrarla durante 5 s.

### Entrega exitosa

- Notificación global: `🎉 [Nombre] anotó • nueva búsqueda comienza`
- El entregador recibe +2 niveles y +100 puntos
- Nuevo ciclo comienza inmediatamente

---

## El Mazo

El único mecanismo de confrontación directa entre jugadores.

### Reglas de uso

| Atributo | Valor |
|----------|-------|
| Activación | Manual — presionar botón cuando un rival está en rango |
| Rango base | 80 px (escala con niveles) |
| Objetivo | Cualquier jugador en rango (no solo el portador de bandera) |
| Restricción | El portador de la bandera NO puede usar el mazo |
| Cooldown | 12 s tras un golpe exitoso |

### Efectos sobre el objetivo golpeado

| Efecto | Valor |
|--------|-------|
| Stun | 5 s (reducible con niveles) |
| Pérdida de nivel | -1 nivel (mínimo nivel 1) |
| Bandera | Si la llevaba: la suelta inmediatamente |
| Invencibilidad post-stun | 3 s (bloquea mazos siguientes) |
| Espera para recoger bandera | 5 s después de soltarla |

### Efectos sobre el atacante

| Efecto | Valor |
|--------|-------|
| Puntos | +10 pts |
| Nivel | +1 nivel |
| Cooldown | 12 s |

### Regla anti-pile-on

El primer mazo que conecta sobre un jugador en stun activa 3 s de invencibilidad. Los mazos siguientes durante ese período no tienen efecto.

---

## Trampas

Obstáculos ocultos distribuidos en el mapa.

| Atributo | Valor |
|----------|-------|
| Cantidad | 15–20 por partida |
| Posición | Aleatoria al inicio, nunca sobre obstáculos ni sobre el Faro |
| Visibilidad | Invisibles hasta que una linterna está a ≤ 40 px |
| Condición de activación | Solo se activan si el jugador va a más del 70% de su velocidad máxima |
| Efecto | Bandera cae + stun 2 s (sin pérdida de nivel) |
| Respawn | La trampa desaparece al activarse → reaparece en posición aleatoria nueva a los 45 s |

Las trampas penalizan el movimiento descuidado pero no el estratégico — correr en la oscuridad tiene consecuencias.

---

## Power-ups

Ítems que aparecen en el mapa y otorgan ventajas temporales.

| Atributo | Valor |
|----------|-------|
| Máximo simultáneo en mapa | 4 |
| Respawn | Cada 20 s |
| Puntos al recoger | +10 pts (cualquier tipo) |
| Regla de acumulación | Solo 1 activo por jugador; el nuevo reemplaza al anterior |

### Tipos

| # | Nombre | Descripción |
|---|--------|-------------|
| 1 | **Escudo de Mazo** | Absorbe el siguiente mazo recibido: sin stun, sin pérdida de nivel, sin caída de bandera. 1 carga. |
| 2 | **Revelación** | Muestra la posición exacta de la bandera y el destino durante 6 s. Solo visible para el portador del power-up. |
| 3 | **Sprint** | +60% velocidad durante 8 s. |
| 4 | **Apagón** | La linterna de todos los demás jugadores se apaga completamente durante 5 s. La tuya no se ve afectada. El portador de bandera desaparece del mini-mapa esos 5 s. |
| 5 | **Supermazo** | Los próximos 2 mazos del jugador infligen: stun 10 s + -2 niveles al objetivo (en lugar de los valores base). |
| 6 | **Fantasma** | El jugador queda al 30% de opacidad + su haz de luz se vuelve invisible para los demás + desaparece del mini-mapa durante 8 s. |

---

## Sistema de niveles

Rango de nivel: **1 a 15**. El nivel nunca baja de 1.

### Cómo ganar y perder niveles

| Acción | Cambio |
|--------|--------|
| Entregar bandera al destino | +2 niveles |
| Ser el primero en iluminar la bandera | +1 nivel |
| Mazear a un rival | +1 nivel |
| Recibir un mazo | -1 nivel |

### Tabla de progresión

| Nv | Cono | Rango linterna | Velocidad | Beneficio especial |
|----|------|----------------|-----------|-------------------|
| 1 | 60° | 150 px | 100% | Rango mazo 80 px |
| 2 | 60° | 175 px | 100% | — |
| 3 | 60° | 175 px | 110% | — |
| 4 | 60° | 175 px | 110% | Ve trampas desde 65 px |
| 5 | 80° | 200 px | 110% | Color de linterna cambia (hito visual) |
| 6 | 80° | 200 px | 115% | Habilidad activa: **Pulso** — destella 360° durante 0.5 s (CD 20 s) |
| 7 | 80° | 250 px | 115% | Rango mazo 100 px |
| 8 | 80° | 250 px | 115% | Stun recibido reducido a 3 s (base: 5 s) |
| 9 | 90° | 250 px | 125% | Linterna apagada: +10% velocidad extra |
| 10 | 100° | 300 px | 125% | Ve todas las trampas en radio 200 px. Aura tenue visible |
| 11 | 100° | 300 px | 125% | Mazo: stun 7 s. Rango mazo 120 px |
| 12 | 110° | 350 px | 130% | — |
| 13 | 110° | 350 px | 130% | Toggle de linterna sin parpadeo visible para otros |
| 14 | 120° | 350 px | 130% | **Contramazo**: quien te maza recibe 2 s de stun también |
| 15 | 130° | 500 px | 135% | Al puntuar, ves el siguiente destino durante 3 s. Aura dramática |

---

## Puntuación (FFA, sesión infinita)

| Acción | Puntos |
|--------|--------|
| Agarrar la bandera | +20 pts |
| Mazear a cualquier rival | +10 pts |
| Recoger un power-up | +10 pts |
| Entregar la bandera al destino | +100 pts |

- Leaderboard en vivo por puntos (no por kills ni entregas)
- Sin condición de victoria, sin tiempo límite, sin salir de la sala
- Los jugadores pueden entrar y salir libremente; la partida continúa

---

## HUD

| Elemento | Posición | Descripción |
|----------|----------|-------------|
| Nivel del jugador | Centro-abajo (número grande) | Nivel actual, prominente |
| Puntuación propia | Arriba-izquierda | Puntaje acumulado en la sesión |
| Leaderboard top 8 | Derecha | Siempre incluye al jugador local aunque no esté en top 8 |
| Cooldown del mazo | Centro-abajo | Barra circular alrededor del botón de mazo |
| Power-up activo | Abajo-derecha | Ícono + timer de duración restante |
| Indicador de bandera | Arriba-centro | Solo cuando el jugador lleva la bandera: "🏳️ Llevás la bandera" |
| Mini-mapa | Abajo-izquierda | Ver sección Mini-mapa |

---

## Mini-mapa

| Elemento visible | Descripción |
|-----------------|-------------|
| Estructura del mapa | Bordes y forma general del arena |
| Obstáculos | Siluetas de BUNKER, BARRIER y ROUND |
| Faro central | Círculo iluminado en el centro |
| Posición propia | Punto fijo del jugador local |
| Portador de bandera | Punto pulsante (desaparece con Apagón o Fantasma) |

El mini-mapa **no muestra** la posición de otros jugadores que no lleven la bandera.

---

## Notificaciones globales

Todas las notificaciones aparecen en el chat del sistema, visibles para todos los jugadores de la sala.

| Evento | Mensaje |
|--------|---------|
| Nueva búsqueda | `🔍 Nueva bandera en algún lugar del mapa...` |
| Bandera encontrada | `🏳️ [Nombre] encontró la bandera` |
| Entrega exitosa | `🎉 [Nombre] anotó • nueva búsqueda comienza` |
| Bandera caída por mazo | `💥 [Nombre] fue golpeado — ¡bandera libre!` |
| Bandera caída por trampa | `⚠️ [Nombre] cayó en una trampa — ¡bandera libre!` |

---

## Bots

- Cantidad configurable por sala (default: 4, máximo: 50)
- Comportamiento: explorar el mapa con linterna activa, buscar la bandera, mazear rivales en rango, recoger power-ups
- Los bots respetan todas las reglas del juego (cooldowns, invencibilidad, restricción del portador)
- Los bots tienen nombres propios asignados al azar

---

## Arenas (8)

Cada arena ofrece un set visual diferente: fondo, sprites de obstáculos, efectos ambientales y paleta de acentos. Las reglas de juego son idénticas en todas.

| # | Nombre | Ambientación |
|---|--------|-------------|
| 1 | Estación Espacial Abandonada | Módulos metálicos, estrellas de fondo, luces de emergencia rojas |
| 2 | Alcantarillas Subterráneas | Húmedo, muros de ladrillo, charcos reflectantes, ratas de fondo |
| 3 | Mansión Encantada | Madera oscura, velas parpadeantes, telarañas, bruma baja |
| 4 | Ciudad Cyberpunk Nocturna | Neón azul-morado, contenedores, anuncios holográficos |
| 5 | Cueva Ártica | Hielo translúcido, cristales de escarcha, niebla blanca |
| 6 | Cueva Volcánica | Roca negra, grietas de lava naranja, humo ascendente |
| 7 | Bosque de Noche | Árboles como obstáculos, luciérnagas, luna al fondo |
| 8 | Templo Antiguo | Piedra tallada, antorchas, relieves, polvo de partículas doradas |

---

## Visual y arte

### Paleta base

| Elemento | Color | Hex |
|----------|-------|-----|
| Fondo de arena | Negro azulado | `#080810` |
| Superficies y obstáculos | Azul oscuro | `#12132a` |
| Acento principal | Morado | `#7c3aed` |
| Acento secundario | Teal | `#06b6d4` |
| Acento terciario | Ámbar | `#f59e0b` |

### Estilo gráfico

- **Cartoon / cel-shaded**: outlines negros gruesos de 4–6 px
- Colores vibrantes y saturados sobre fondos oscuros
- Proporciones exageradas (chunky, expresivo)
- Obstáculos en perspectiva 2.5D: cara superior + cara lateral visible
- Linterna: cono volumétrico con glow suave y bordes difusos
- **No** realismo militar, **no** pixel art, **no** colores desaturados

### Personajes

- Inspirados en Among Us (original): cuerpo ovalado, visor semiesférico, sin brazos visibles
- Vista top-down
- El nivel se refleja visualmente: aura, color de linterna y tamaño del cono crecen con la progresión
- Nivel 10: aura tenue visible sobre el personaje
- Nivel 15: aura dramática con partículas de luz

### Skins (20 base)

| Rareza | Cantidad | Descripción |
|--------|----------|-------------|
| Común | 8 | Variantes de color del personaje base |
| Rara | 6 | Accesorios en el visor, traje con detalles |
| Épica | 4 | Diseño alternativo del cuerpo, efectos de linterna únicos |
| Legendaria | 2 | Animaciones especiales, aura de linterna personalizada |

---

## Stack técnico

| Capa | Tecnología |
|------|------------|
| Frontend | Angular 19 + Phaser 4.1 + TypeScript 5.5 |
| Backend API | NestJS 11 + Node.js 22 LTS |
| Game Server | NestJS 11 + Socket.IO 4.7 |
| Base de datos | PostgreSQL 16 |
| Cache / PubSub | Redis 7 |
| Infraestructura | Docker + Docker Compose + Nginx |
| CI/CD | GitHub Actions |

La arquitectura cliente-servidor es autoritativa: toda la lógica de juego (posiciones, colisiones, mazos, niveles, bandera) se resuelve en el servidor. El cliente solo renderiza y envía inputs.
