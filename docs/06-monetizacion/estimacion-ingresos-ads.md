# Estimación de Ingresos por Publicidad — Por Tier de Infraestructura

> Análisis de viabilidad económica basado en los 5 formatos de ads implementados:
> Side ads / Banner (según viewport), Rewarded (pre-entrada y post-muerte),
> Interstitial por muerte (cada 3 muertes o 2 min), Interstitial por salida (cada 3 salidas).
> Las microtransacciones (Stripe) **no están incluidas** — son ingreso adicional sobre estas cifras.
>
> **Actualizado**: incluye side ads skyscraper (160×600) implementados en lobby, login, register y
> death modal para PC (≥ 1420px). El interstitial de muerte reemplaza a los side ads como formato
> principal en móvil.

---

## Glosario — términos mínimos para entender el análisis

### DAU — Daily Active Users
**Usuarios activos al día.** Es el número de personas distintas que juegan al menos una partida en un día cualquiera. No es cuántas juegan al mismo tiempo (eso es "concurrent"), sino cuántas jugaron en total durante las 24h del día.

Ejemplo: si a las 3pm hay 50 personas jugando y a las 9pm hay 200, el DAU de ese día podría ser 500 (porque muchas jugaron en distintos momentos y se fueron).

**Por qué importa para los ads**: los anunciantes pagan por cada usuario que ve sus anuncios. Más DAU = más ojos = más ingresos.

---

### CPM — Cost Per Mille (costo por mil impresiones)
**Cuánto pagan los anunciantes por cada 1,000 veces que alguien ve su anuncio.** Desde tu lado como dueño del juego, es cuánto te pagan a ti por cada 1,000 visualizaciones.

Ejemplo: CPM de $3 significa que si 1,000 usuarios ven ese banner, tú cobras $3.

Los tres formatos tienen CPM muy distintos:
- **Banner** (siempre visible en lobby): CPM bajo, ~$0.50–$1.50. Es como un cartel de ruta — nadie lo mira con atención.
- **Interstitial** (pantalla completa al salir): CPM medio, ~$2–$6. Más intrusivo = más caro para el anunciante.
- **Rewarded** (el usuario elige verlo a cambio de bonus): CPM alto, ~$4–$13. El usuario lo pidió voluntariamente = altísima atención = anunciantes pagan más.

---

### eCPM — effective CPM
**El CPM real que recibes después de descuentos.** Google se queda con el 32% de lo que pagan los anunciantes. El eCPM ya descuenta eso. Cuando en este documento se habla de CPM, siempre es el valor que llega a tu bolsillo.

---

### Fill rate
**Porcentaje de los anuncios que Google logra llenar.** Cada vez que el juego intenta mostrar un anuncio, Google busca un anunciante interesado. No siempre encuentra uno. El fill rate es qué tan seguido lo logra.

Ejemplo: fill rate del 70% significa que de 100 intentos de mostrar un anuncio, 70 terminan mostrando algo (y generando ingresos) y 30 quedan vacíos.

**Por qué es más bajo en juegos web que en apps móviles**: hay menos anunciantes especializados en inventario web de gaming. Las apps tienen mejor fill rate porque el ecosistema es más maduro.

---

### ARPDAU — Average Revenue Per Daily Active User
**Cuánto dinero genera en promedio cada usuario activo por día, solo de ads.** Es el indicador clave que resume todo.

Ejemplo: ARPDAU de $0.015 significa que cada usuario que juega ese día te genera 1.5 centavos de dólar en publicidad.
Parece poco, pero multiplicado por miles de usuarios y 30 días, es significativo.

---

### Ad blocker
**Extensión del navegador que bloquea todos los anuncios.** El usuario sigue jugando y consumiendo infraestructura, pero no genera ningún ingreso. En juegos web de escritorio, aproximadamente el 25–30% de los usuarios tienen uno activo. En móvil es mucho menor (~5%). Este análisis ya descuenta ese porcentaje.

---

## Qué significa cada escenario

Antes de ver los números, es importante entender qué tan probable es cada uno. Estas no son categorías arbitrarias — están basadas en cómo crecen los juegos .io en la práctica.

### Escenario Negativo
El juego existe pero no logra distribuirse bien. Puede ser porque:
- No aparece en los directorios de juegos .io principales
- La retención es baja (usuarios prueban y no vuelven)
- No hay viralidad ni word-of-mouth
- El juego tiene bugs que ahuyentan a los nuevos usuarios

**DAU típico**: 10–30% del potencial del tier. **¿Es raro?** No — es lo que le pasa a la mayoría de juegos que no invierten en distribución.

### Escenario Normal
El juego está listado en los portales de .io games (iogames.space, io-games.net, arkadium, etc.) que tienen millones de visitas mensuales. Tiene mecánicas sólidas, carga rápido, funciona en móvil. Los jugadores vuelven porque el loop es divertido.

**DAU típico**: 40–60% del potencial del tier. **¿Es alcanzable sin ser viral?** Sí. Listarse en los directorios correctos es una gestión de distribución, no requiere suerte.

### Escenario Exitoso
El juego consigue cobertura orgánica: alguien lo postea en Reddit, TikTok, YouTube. O consigue ser featured en uno de los portales grandes. No necesariamente se hace viral de forma masiva — basta con que algunos streamers pequeños o creadores de contenido lo mencionen.

**DAU típico**: 80–100% del potencial del tier o más. **¿Es poco realista?** Para este escenario no hace falta un fenómeno masivo — un par de posts virales pequeños lo logran.

---

## Supuestos del modelo (para quien quiera verificar los cálculos)

| Variable | Valor | Fuente |
|---|---|---|
| Duración promedio de sesión | 25 min | Benchmarks juegos .io 2025 |
| Sesiones por DAU por día | 2 | Benchmark F2P retention |
| Muertes por sesión | 4–5 | Mecánica del juego (1 muerte / 5 min) |
| % usuarios que ven rewarded | 25–35% | Opt-in rate H5 web games |
| % usuarios en PC (viewport ≥ 1420px) | 55% | Mix estimado juegos .io 2025 |
| Ad blocker penetración (PC) | 27% | Promedio gaming desktop 2025 |
| Ad blocker penetración (móvil) | 5% | Promedio gaming mobile 2025 |
| CPM Banner / Side ad (PC, 160×600) | $1.00 / $2.50 / $5.00 | MonetizeMore skyscraper 2025 |
| CPM Banner horizontal (móvil fallback) | $0.30 / $0.70 / $1.50 | AdPushup / MonetizeMore 2025 |
| CPM Interstitial por muerte (PC+móvil) | $2.00 / $4.00 / $7.00 | Tenjin Benchmark 2025 — muerte = mayor atención |
| CPM Interstitial por salida (PC+móvil) | $1.50 / $3.00 / $6.00 | Tenjin Benchmark Report 2025 |
| CPM Rewarded (web H5) | $4.00 / $7.50 / $13.00 | AdPushup / MonetizeMore 2025 |
| Fill rate promedio | 65% | Benchmark web gaming H5 |
| Interstitial de muerte mostrado cada | 3 muertes o 2 min | Lógica implementada |

**Nota sobre side ads**: el skyscraper (160×600 / 300×600) tiene CPM 3–4× mayor que el banner horizontal porque tiene más superficie visual y permanece visible mientras el usuario navega el lobby. Solo se muestra en PC (viewport ≥ 1420px), lo que excluye el tráfico móvil de este formato.

**Nota sobre el interstitial de muerte**: al dispararse cuando el jugador acaba de morir (momento de alta atención emocional y sin alternativa de interacción), tiende a recibir mejor atención que el interstitial de salida — de ahí el CPM ligeramente mayor.

**Nota sobre CPM geográfico**: valores para audiencia global mixta. USA / UK / Canadá / Australia → CPM 2–4× mayor. LATAM / Asia del Sur → CPM 50–70% menor. El mix geográfico es el factor individual más importante.

---

## Estimación por tier — tres escenarios

> Los ingresos se calculan sumando 5 fuentes: side ads PC, banner móvil, rewarded, interstitial por muerte, interstitial por salida. Los side ads aportan un incremento de ~35% sobre el modelo anterior (solo banner + rewarded + 1 interstitial).

### Tier 0 — Beta (~$35/mes de infraestructura)

> Acceso restringido, primeros 100–500 testers. El objetivo aquí no es ganar dinero sino validar el juego.

| Escenario | DAU | Ingreso ads/mes | Costo infra | Resultado neto |
|---|---|---|---|---|
| **Negativo** | 50 | $14 | $35 | **–$21** |
| **Normal** | 200 | $120 | $35 | **+$85** |
| **Exitoso** | 500 | $305 | $35 | **+$270** |

**Lectura**: en beta es normal perder plata. Con ~180 testers activos el juego ya cubre su propio costo de infraestructura.

---

### Tier 1 — Lanzamiento (~$294/mes de infraestructura)

> Juego en producción pública. Listado en portales .io. Primer mes real.

| Escenario | DAU | Ingreso ads/mes | Costo infra | Resultado neto |
|---|---|---|---|---|
| **Negativo** | 300 | $182 | $294 | **–$112** |
| **Normal** | 1,500 | $910 | $294 | **+$616** |
| **Exitoso** | 3,500 | $2,125 | $294 | **+$1,831** |

**Lectura**: el escenario negativo sigue siendo pérdida pero más contenida que antes (~$112 vs. $159 anterior por la mejora en interstitials). Con ~484 DAU ya se cubre el costo de infra.

---

### Tier 2 — Crecimiento (~$500/mes de infraestructura)

> El juego creció, necesitó más recursos. 500–2,000 concurrent players.

| Escenario | DAU | Ingreso ads/mes | Costo infra | Resultado neto |
|---|---|---|---|---|
| **Negativo** | 1,500 | $910 | $500 | **+$410** |
| **Normal** | 6,000 | $3,640 | $500 | **+$3,140** |
| **Exitoso** | 15,000 | $9,100 | $500 | **+$8,600** |

**Lectura**: incluso en el escenario negativo el juego es rentable en Tier 2. Los side ads marcan la diferencia aquí — los usuarios de PC con pantalla grande son los más valiosos para el inventario de skyscraper.

---

### Tier 3 — Escala .io (~$1,150/mes de infraestructura)

> Nivel Wormax.io estimado. 2,000–5,000+ concurrent players.

| Escenario | DAU | Ingreso ads/mes | Costo infra | Resultado neto |
|---|---|---|---|---|
| **Negativo** | 5,000 | $3,030 | $1,150 | **+$1,880** |
| **Normal** | 20,000 | $12,120 | $1,150 | **+$10,970** |
| **Exitoso** | 50,000 | $30,300 | $1,150 | **+$29,150** |

**Lectura**: a esta escala el peor escenario sigue siendo muy rentable. Los side ads y el death interstitial aportan un ~35% adicional sobre el modelo anterior. El ingreso de Stripe en este tier puede duplicar o triplicar estos números.

---

## Conclusión directa

```
¿Necesito mucho éxito para que el juego sea rentable solo con ads?

  Tier 0 (beta):   No. Con ~180 testers ya se paga solo.
  Tier 1 (launch): No. Con 484 DAU cubre infra. Eso NO requiere ser viral.
                   Un juego bien listado en portales .io logra 1,000–2,000 DAU
                   sin ninguna cobertura de prensa ni influencer.
  Tier 2+:         El modelo es sólido en cualquier escenario — incluso el negativo.
```

**El modelo de negocio es viable con un lanzamiento normal**, no exitoso. Los side ads y el death interstitial mejoran el ingreso por usuario en ~35% respecto al modelo original sin cambiar la experiencia de los usuarios móviles.

**El mayor riesgo no es técnico ni de infraestructura. Es la distribución**: que el juego esté listado en los lugares correctos y que la retención (que el jugador vuelva al día siguiente) sea suficiente para mantener el DAU estable.

---

## Punto de equilibrio (break-even) por tier

| Tier | Infra/mes | DAU necesario | Modelo anterior |
|---|---|---|---|
| 0 Beta | $35 | ~58 DAU | ~78 DAU |
| 1 Lanzamiento | $294 | ~484 DAU | ~654 DAU |
| 2 Crecimiento | $500 | ~824 DAU | ~1,111 DAU |
| 3 Escala | $1,150 | ~1,895 DAU | ~2,556 DAU |

> Los side ads (PC) y el death interstitial reducen el DAU necesario para break-even en ~25% en todos los tiers.

---

## Lo que este análisis NO incluye (ingreso adicional)

- **Stripe — packs de gemas y skins premium**: con 2% de conversión de compradores y ticket promedio de $5, 1,000 DAU generan ~$100/mes adicionales. 10,000 DAU generan ~$1,000/mes adicionales.
- **Mejoras de red de ads**: migrar a Google Ad Manager + Open Bidding puede aumentar los ingresos de ads entre 30–50% sin cambiar nada en el juego.
- **Geotargeting de usuarios**: si el juego atrae audiencia de USA/UK, los CPM reales pueden ser 2–4× los usados en este análisis.
