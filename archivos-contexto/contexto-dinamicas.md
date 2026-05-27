# 🎮 Arena Siege Tanks — Documento de Diseño del Juego (GDD)

## 📌 Visión

Arena Siege Tanks es un juego multijugador en tiempo real donde decenas de jugadores compiten en una arena simple, combinando precisión, estrategia y control del espacio.

El juego está diseñado para ser:
- Fácil de entender en segundos
- Difícil de dominar
- Altamente rejugable
- Generador de momentos emergentes

---

## 🧠 Filosofía de diseño

> “No gana el que más dispara, gana el que mejor encierra y elige el momento correcto.”

Principios:
- Pocas mecánicas, alta profundidad
- Decisiones con consecuencias
- Información clara para todos
- Riesgo = recompensa

---

# 🎯 OBJETIVO DEL JUEGO

Convertirse en el jugador dominante de la arena acumulando puntos (Dominio), eliminando oponentes y sobreviviendo el mayor tiempo posible.

---

# 🧩 CORE GAMEPLAY

El juego se basa en 3 pilares:

## 1. Control del espacio
Uso de muros para manipular movimiento enemigo

## 2. Precisión táctica
Munición limitada → cada disparo importa

## 3. Caza de valor
Los jugadores con mayor ranking otorgan mejores recompensas

---

# 🎮 DINÁMICA GENERAL

Cada jugador entra a una arena donde:

- Controla un tanque
- Tiene vida limitada
- Dispara proyectiles con rebote
- Puede colocar muros
- Compite en un ranking en tiempo real

---

# 🗺️ MAPA

## Estilo
- Minimalista
- Fondo sólido o grid
- Vista top-down

## Límites
- Mapa cerrado rectangular
- Jugadores no pueden salir
- Balas rebotan en bordes

## Propósito del mapa
- No distraer visualmente
- Enfocar en gameplay emergente

---

# 👤 JUGADORES

## Estado base
- 2 puntos de vida
- Movimiento libre (360°)
- Eliminación tras recibir 2 impactos

## Respawn
- Reaparecen tras un corto tiempo
- Posición aleatoria segura

---

# 🔫 COMBATE

## Disparo
- Manual
- Munición limitada
- No hay disparo automático

## Filosofía
- Cada disparo es una decisión crítica
- Fallar tiene costo real

---

# ⚡ MECÁNICA WOW — REBOTES

Las balas:
- Rebotan en muros y bordes
- Tienen rebotes limitados
- Pierden energía progresivamente

## Impacto en gameplay
- Permite atacar sin línea directa
- Genera jugadas avanzadas
- Aumenta el skill ceiling

---

# 🧱 SISTEMA DE MUROS

## Función
Herramienta táctica ofensiva, no defensiva

## Características
- Cantidad limitada por jugador
- Duración temporal
- Destructibles
- Requieren cooldown

## Uso
- Encerrar enemigos
- Cortar rutas
- Forzar errores
- Crear rebotes estratégicos

---

# 🏆 SISTEMA DE RANKING — “DOMINIO”

## Definición
Sistema de puntuación en tiempo real visible para todos los jugadores

## Cómo se gana
- Eliminando jugadores
- Especialmente a jugadores de alto ranking

---

## 🎯 SISTEMA TOP 10 (CLAVE)

Los 10 mejores jugadores tienen valor especial:

| Posición | Valor |
|--------|------|
| #1 | Máximo |
| #2–#3 | Alto |
| #4–#6 | Medio |
| #7–#9 | Bajo |
| #10 | Mínimo |

## Impacto
- Incentiva cazar líderes
- Genera decisiones estratégicas
- Mantiene el juego dinámico

---

# 🔥 SISTEMA DE PROGRESIÓN — “POWER STACK”

## Definición
Acumulación de poder dentro de la partida al eliminar enemigos

## Beneficios (leves y acumulativos)
- Mejor control del tanque
- Ligera mejora en movilidad
- Ligera resistencia adicional

## Reglas
- Se acumula con cada kill
- Se pierde al morir
- Nunca vuelve invencible al jugador

---

# 👑 MECÁNICA DE LÍDER (TOP 1)

El jugador #1 es un “objetivo global”

## Beneficios
- Requiere un impacto adicional para morir
- Tiene mayor recompensa al ser eliminado

## Desventajas
- Es visible para todos
- Se convierte en foco de ataque

## Resultado
- Efecto “boss emergente”
- Todos pueden intentar destronarlo

---

# 📦 RECURSOS

## Tipos iniciales
- Munición

## Función
- Mantener flujo de combate
- Incentivar movimiento constante

---

# 🎯 LOOP DE JUEGO

1. Aparecer en la arena
2. Buscar recursos
3. Posicionarse estratégicamente
4. Usar muros para controlar espacio
5. Disparar con precisión
6. Eliminar jugadores (priorizando Top 10)
7. Escalar en ranking
8. Convertirse en objetivo
9. Defender o caer

---

# ⚖️ BALANCE DEL JUEGO

## Principios
- Nadie es invencible
- El poder atrae riesgo
- El líder siempre puede ser derrotado

---

# 🧠 PROFUNDIDAD EMERGENTE

El juego genera complejidad a partir de:

- Interacción entre muros + rebotes
- Decisiones de objetivo (ranking)
- Recursos limitados

---

# ⚙️ CONFIGURACIÓN DE PARTIDAS

El juego permite ajustar:

- Número de jugadores por sala
- Tamaño del mapa
- Duración de la partida
- Frecuencia de recursos
- Velocidad general del juego

---

# 👥 ESCALA MULTIJUGADOR

- Diseñado para decenas de jugadores simultáneos
- Partidas caóticas pero controladas
- Alta interacción constante

---

# 🎮 EXPERIENCIA DEL JUGADOR

## Entrada rápida
Un jugador nuevo entiende en segundos:
- Moverse
- Disparar
- Colocar muros

## Dominio profundo
Jugadores avanzados:
- Calculan rebotes
- Controlan zonas
- Manipulan enemigos

---

# 🚀 IDENTIDAD DEL JUEGO

Arena Siege Tanks no es:
- Un shooter tradicional
- Un juego de tanques clásico

Es:
> Un juego de decisiones tácticas en tiempo real donde el espacio y el valor del objetivo importan más que la velocidad de disparo

---

# 📌 CONCLUSIÓN

El juego se sostiene en:

- Simplicidad de entrada
- Profundidad emergente
- Interacción constante entre jugadores
- Incentivos dinámicos (Top 10)

Esto lo hace:
- Difícil de copiar correctamente
- Altamente adictivo
- Escalable como producto

---