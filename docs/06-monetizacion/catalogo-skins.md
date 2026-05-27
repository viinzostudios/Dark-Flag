# Catálogo de Skins — Arena Siege Tanks

> 100 skins distribuidas en 4 rarezas. Cada skin tiene dos caminos de adquisición: compra con moneda interna o desbloqueo gratuito por partidas jugadas.
>
> **Assets visuales**: ✅ 100/100 generados — 2026-05-11 con `tools/generate-100-skins.py`
> Ubicación: `frontend/public/assets/tanks/skins/tank-{slug}-body.png` y `tank-{slug}-cannon.png`
> Slugs: nombre en español sin acentos, espacios→guiones (ej. "El Señor del Vacío" → `el-senor-del-vacio`)

---

## Filosofía del sistema

Las skins en Arena Siege Tanks son **cosméticas con bonos opcionales**. Esto significa:

- Las skins de rareza **Common** son puramente cosméticas (sin bonos o bonos mínimos de economía).
- Las skins de rareza **Rare / Epic / Legendary** pueden incluir **bonos de stats** que se **suman** a los bonos de nivel del jugador.
- El sistema es **"juega para ganar"**: cualquier skin puede obtenerse gratis jugando suficientes partidas.
- El sistema **no es pay-to-win** porque las skins de alto nivel requieren miles de partidas — están pensadas como recompensa a la dedicación.
- Los bonos están **balanceados**: el jugador de nivel 12 (techo de niveles) sigue siendo competitivo contra cualquier skin.

---

## Bonos disponibles por skin

| Campo | Unidad | Máximo | Descripción |
|-------|--------|--------|-------------|
| `speedBonus` | % | +20% | Velocidad de movimiento extra desde el inicio |
| `hpBonus` | corazones | +3 | HP extra (se suma al HP base de nivel) |
| `ammoBonus` | balas | +3 | Balas simultáneas extra |
| `wallBonus` | cargas | +3 | Cargas de muro extra |
| `bulletSpeedBonus` | % | +20% | Velocidad de proyectil extra |
| `xpMultiplier` | % | +25% | XP ganada por partida aumentada |
| `coinMultiplier` | % | +25% | Coins ganadas por partida aumentadas |

---

## Precios y desbloqueo

| Rareza | Precio coins | Precio gemas | Partidas para desbloqueo gratuito |
|--------|-------------|--------------|-----------------------------------|
| Common | 0 – 200 | — | 0 – 100 |
| Rare | 300 – 700 | — | 120 – 350 |
| Epic | 800 – 1 500 | — | 400 – 900 |
| Legendary | — | 150 – 500 | 2 000 – 10 000 |

> Las skins **Legendary** no se pueden comprar con coins. Solo con gemas o por logro de partidas.
> Las skins con `matchesUnlock = 0` son la skin inicial o skins de evento especial.

---

## Catálogo completo de 100 skins

### COMMON (25 skins)

| # | Nombre | Descripción | Color cuerpo | Color cañón | speedBonus | hpBonus | ammoBonus | wallBonus | bulletSpeedBonus | xpMultiplier | coinMultiplier | Precio coins | matchesUnlock |
|---|--------|-------------|--------------|-------------|:---------:|:-------:|:---------:|:---------:|:---------------:|:------------:|:--------------:|:------------:|:-------------:|
| 1 | **Base Clásico** | Skin inicial del juego | #4a90d9 | #2c5f8a | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 2 | **El Verde** | Verde prado tropical | #27ae60 | #1a7a45 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 50 | 10 |
| 3 | **El Rojo** | Rojo carmín clásico | #e74c3c | #922b21 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 50 | 10 |
| 4 | **El Azul** | Azul marino de combate | #2980b9 | #1a5276 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 50 | 10 |
| 5 | **El Amarillo** | Amarillo canario brillante | #f1c40f | #d4ac0d | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 50 | 15 |
| 6 | **Gris Tormenta** | Gris pizarra oscuro | #7f8c8d | #596566 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 80 | 20 |
| 7 | **Morado Pasión** | Morado brillante intenso | #8e44ad | #6c3483 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 80 | 20 |
| 8 | **Rosa Retro** | Rosa chicle de los 80s | #ff69b4 | #c0508a | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 80 | 25 |
| 9 | **Naranja Llamarada** | Naranja brillante ardiente | #e67e22 | #935116 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 80 | 25 |
| 10 | **Turquesa Marino** | Turquesa agua caribeña | #1abc9c | #148a70 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 100 | 30 |
| 11 | **Lima Tóxico** | Verde lima peligroso | #b8e900 | #8aae00 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 100 | 30 |
| 12 | **Marrón Terroso** | Marrón tierra natural | #8d6e63 | #5d4037 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 100 | 35 |
| 13 | **Negro Carbón** | Negro carbón casi absoluto | #2d2d2d | #1a1a1a | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 100 | 35 |
| 14 | **Blanco Nieve** | Blanco polar inmaculado | #ecf0f1 | #bdc3c7 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 120 | 40 |
| 15 | **El Barrilito** | Marrón barril de madera (inspiración: barriles de pueblo) | #7b3f1c | #5a2d10 | 0 | 0 | 0 | 0 | 0 | 0 | 5 | 150 | 50 |
| 16 | **Helado de Vainilla** | Crema suave con detalles cálidos | #f5e6c8 | #d4a95a | 0 | 0 | 0 | 0 | 0 | 0 | 5 | 150 | 50 |
| 17 | **Helado de Fresa** | Rosa suave como una bola de helado | #ff9eb5 | #e07090 | 0 | 0 | 0 | 0 | 0 | 0 | 5 | 150 | 55 |
| 18 | **Helado de Chocolate** | Marrón oscuro cremoso | #5d2e0c | #3b1a06 | 0 | 0 | 0 | 0 | 0 | 0 | 5 | 150 | 60 |
| 19 | **El Vecindario** | Colores alegres de barrio latinoamericano | #ff6f00 | #c43e00 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 180 | 65 |
| 20 | **Camuflaje Tropical** | Verde brillante de selva tropical | #4caf50 | #2e7d32 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 180 | 70 |
| 21 | **El Paletero** | Blanco con franja azul (vendedor de paletas) | #e3f2fd | #1565c0 | 0 | 0 | 0 | 0 | 0 | 0 | 5 | 200 | 75 |
| 22 | **Tanque Solar** | Dorado brillante radiante | #ffd600 | #f9a825 | 0 | 0 | 0 | 0 | 0 | 5 | 0 | 200 | 80 |
| 23 | **El Marino** | Azul navy con detalles blancos | #1a237e | #0d1257 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 200 | 85 |
| 24 | **El Vaquero** | Marrón camel de las praderas | #c4882a | #8d6020 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 200 | 90 |
| 25 | **Invierno Polar** | Celeste pálido glacial | #b3e5fc | #0288d1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 200 | 100 |

---

### RARE (35 skins)

| # | Nombre | Descripción | Color cuerpo | Color cañón | speedBonus | hpBonus | ammoBonus | wallBonus | bulletSpeedBonus | xpMultiplier | coinMultiplier | Precio coins | matchesUnlock |
|---|--------|-------------|--------------|-------------|:---------:|:-------:|:---------:|:---------:|:---------------:|:------------:|:--------------:|:------------:|:-------------:|
| 26 | **Tanque Acuático** | Azul agua brillante con destellos | #039be5 | #01579b | 10 | 0 | 0 | 0 | 0 | 0 | 0 | 300 | 120 |
| 27 | **El Ninja** | Negro total con detalles rojos | #1c1c1c | #b71c1c | 5 | 0 | 0 | 0 | 0 | 0 | 0 | 300 | 130 |
| 28 | **El Pirata** | Negro con detalles amarillos corsarios | #212121 | #f9a825 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 300 | 130 |
| 29 | **El Bombero** | Rojo vivo con franjas amarillas | #d32f2f | #f9a825 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 300 | 140 |
| 30 | **El Astronauta** | Plateado con visor azul espacial | #b0bec5 | #1565c0 | 5 | 0 | 0 | 0 | 0 | 0 | 0 | 350 | 140 |
| 31 | **El Científico** | Blanco con detalles verdes laboratorio | #f5f5f5 | #1b5e20 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 350 | 150 |
| 32 | **El Robot** | Plateado metálico industrial | #78909c | #455a64 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 400 | 160 |
| 33 | **Desierto Élite** | Arena con detalles naranja oscuro | #d7a96b | #c1722a | 5 | 0 | 0 | 0 | 0 | 0 | 0 | 400 | 165 |
| 34 | **Jungla Oscura** | Verde oscuro con negro amenazante | #2e7d32 | #1b5e20 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 400 | 170 |
| 35 | **El Vikingo** | Gris acero con detalles dorados | #90a4ae | #d4ac0d | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 400 | 175 |
| 36 | **Tanque Futurista** | Azul eléctrico con detalles negros | #1de9b6 | #00695c | 0 | 0 | 0 | 0 | 10 | 0 | 0 | 450 | 180 |
| 37 | **El Samurái** | Negro con detalles rojo carmín | #212121 | #c62828 | 0 | 0 | 0 | 0 | 10 | 0 | 0 | 450 | 185 |
| 38 | **El Fantoche** | Colores pastel vivos tipo marioneta | #f48fb1 | #7b1fa2 | 0 | 0 | 0 | 0 | 0 | 0 | 10 | 450 | 185 |
| 39 | **El Vampiro** | Negro bordo con detalles rojos sangre | #4a148c | #880e4f | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 500 | 200 |
| 40 | **El Esqueleto** | Gris claro hueso casi blanco | #e0e0e0 | #9e9e9e | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 500 | 205 |
| 41 | **El Gnomo del Bosque** | Verde con detalles rojos de hongo | #388e3c | #c62828 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 500 | 210 |
| 42 | **El Cocinero** | Blanco con detalles naranja de cocina | #fafafa | #e64a19 | 0 | 0 | 0 | 0 | 0 | 0 | 15 | 500 | 215 |
| 43 | **Navideño** | Rojo navidad con detalles verde y dorado | #c62828 | #2e7d32 | 0 | 0 | 0 | 0 | 0 | 0 | 15 | 500 | 220 |
| 44 | **El Surfista** | Azul cielo con amarillo surf | #29b6f6 | #f9a825 | 10 | 0 | 0 | 0 | 0 | 0 | 0 | 550 | 220 |
| 45 | **El Alpinista** | Verde oliva con marrón montañero | #558b2f | #5d4037 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 550 | 230 |
| 46 | **El Domador** | Rojo circo con detalles dorados | #c62828 | #d4ac0d | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 550 | 235 |
| 47 | **El Tamalero** | Verde hoja con rojo achiote (latinoam.) | #43a047 | #c62828 | 0 | 0 | 0 | 0 | 0 | 0 | 15 | 550 | 240 |
| 48 | **El Gladiador** | Dorado arena con detalles rojo | #d4ac0d | #c62828 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 600 | 250 |
| 49 | **Tanque Retro** | Verde pixelado 8-bit | #33691e | #1b5e20 | 0 | 0 | 0 | 0 | 0 | 0 | 10 | 600 | 255 |
| 50 | **El Barquero** | Celeste veneciano con detalles dorados | #4fc3f7 | #d4ac0d | 10 | 0 | 0 | 0 | 0 | 0 | 0 | 650 | 265 |
| 51 | **Tanque Eléctrico** | Amarillo brillante con negro voltaje | #ffd600 | #212121 | 0 | 0 | 0 | 0 | 10 | 0 | 0 | 650 | 270 |
| 52 | **El Panadero** | Crema cálida con detalles dorados | #f5e6c8 | #f9a825 | 0 | 0 | 0 | 0 | 0 | 0 | 20 | 650 | 275 |
| 53 | **Tanque de Hielo** | Azul pálido con detalles blancos criogénicos | #80deea | #00838f | 0 | 0 | 0 | 0 | 10 | 0 | 0 | 700 | 280 |
| 54 | **El Campeón** | Dorado brillante con azul olímpico | #ffd600 | #1565c0 | 0 | 0 | 0 | 0 | 0 | 20 | 0 | 700 | 300 |
| 55 | **Tanque Tornado** | Gris tormentoso con detalles naranja | #607d8b | #e64a19 | 10 | 0 | 0 | 0 | 0 | 0 | 0 | 700 | 310 |
| 56 | **El Médico de Campo** | Blanco clínico con cruz roja | #f5f5f5 | #d32f2f | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 700 | 320 |
| 57 | **El Carpintero** | Marrón madera con detalles beige | #795548 | #d7a96b | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 700 | 320 |
| 58 | **El Mago Aprendiz** | Morado con detalles amarillo estrella | #7b1fa2 | #f9a825 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 700 | 330 |
| 59 | **Tanque Fantasma** | Gris translúcido con detalles blancos | #cfd8dc | #78909c | 5 | 0 | 0 | 0 | 5 | 0 | 0 | 700 | 340 |
| 60 | **El Bombero Espacial** | Rojo brillante con plateado estelar | #f44336 | #bdbdbd | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 700 | 350 |

---

### EPIC (25 skins)

| # | Nombre | Descripción | Color cuerpo | Color cañón | speedBonus | hpBonus | ammoBonus | wallBonus | bulletSpeedBonus | xpMultiplier | coinMultiplier | Precio coins | matchesUnlock |
|---|--------|-------------|--------------|-------------|:---------:|:-------:|:---------:|:---------:|:---------------:|:------------:|:--------------:|:------------:|:-------------:|
| 61 | **Tanque Espacial Omega** | Negro profundo con detalles cian neón | #0d0d2b | #00e5ff | 15 | 0 | 0 | 0 | 0 | 0 | 0 | 800 | 400 |
| 62 | **El Dragón Carmesí** | Rojo oscuro con detalles dorado dragón | #7f0000 | #d4ac0d | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 900 | 450 |
| 63 | **Tanque Nuclear** | Verde lima radiactivo con naranja | #76ff03 | #ff6d00 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | 900 | 450 |
| 64 | **El Titán Glaciar** | Azul intenso con plateado ártico | #0d47a1 | #b0bec5 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 900 | 460 |
| 65 | **Tanque de Cristal** | Azul transparente con destellos | #40c4ff | #0091ea | 0 | 0 | 0 | 0 | 15 | 0 | 0 | 1000 | 480 |
| 66 | **El Fantasma Mayor** | Blanco translúcido con negros | #fafafa | #212121 | 15 | 0 | 0 | 0 | 0 | 0 | 0 | 1000 | 500 |
| 67 | **Tanque Steampunk** | Cobre envejecido con engranajes | #bf7a28 | #6d4c41 | 0 | 1 | 0 | 2 | 0 | 0 | 0 | 1000 | 510 |
| 68 | **El Samurái Oscuro** | Negro con detalles rojo sangre | #0d0d0d | #b71c1c | 0 | 0 | 0 | 0 | 15 | 0 | 0 | 1000 | 520 |
| 69 | **Tanque Lava Supremo** | Naranja ardiente con rojo volcánico | #ff6d00 | #d50000 | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 1100 | 550 |
| 70 | **El Maestro del Caos** | Negro con detalles violeta y caos | #1a0533 | #9c27b0 | 0 | 0 | 2 | 2 | 0 | 0 | 0 | 1100 | 550 |
| 71 | **El Guerrero Trueno** | Azul eléctrico con amarillo relámpago | #1a237e | #ffd600 | 15 | 0 | 0 | 0 | 5 | 0 | 0 | 1100 | 560 |
| 72 | **El Explorador Estelar** | Negro con plateado galáctico | #0a0a1f | #90a4ae | 10 | 0 | 0 | 0 | 0 | 10 | 0 | 1100 | 570 |
| 73 | **El Berserker Vikingo** | Gris oscuro con detalles rojo sangre | #424242 | #c62828 | 10 | 2 | 0 | 0 | 0 | 0 | 0 | 1200 | 600 |
| 74 | **El Mago Supremo** | Morado intenso con detalles dorados | #4a148c | #d4ac0d | 0 | 0 | 2 | 0 | 5 | 0 | 0 | 1200 | 600 |
| 75 | **El Guardián Eterno** | Dorado real con detalles negros | #d4ac0d | #212121 | 0 | 0 | 0 | 3 | 0 | 0 | 0 | 1200 | 620 |
| 76 | **El Capitán Estelar** | Azul marino con detalles dorados | #0d47a1 | #d4ac0d | 0 | 1 | 0 | 0 | 0 | 20 | 0 | 1200 | 630 |
| 77 | **Tanque Cuántico** | Cian brillante con detalles negros | #00e5ff | #0d0d0d | 0 | 0 | 1 | 0 | 15 | 0 | 0 | 1300 | 650 |
| 78 | **Tanque Volcánico** | Naranja lava con negro cráter | #ff3d00 | #212121 | 5 | 2 | 0 | 0 | 0 | 0 | 0 | 1300 | 660 |
| 79 | **El Rey del Carnaval** | Colores vivos de carnaval + dorado | #e040fb | #d4ac0d | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 1300 | 680 |
| 80 | **El Rey del Hielo** | Azul cristalino con escarcha blanca | #b3e5fc | #f5f5f5 | 0 | 1 | 0 | 0 | 15 | 0 | 0 | 1400 | 700 |
| 81 | **El Último Guerrero** | Negro total con detalles dorado supremo | #0d0d0d | #d4ac0d | 0 | 1 | 3 | 0 | 0 | 0 | 0 | 1400 | 720 |
| 82 | **Nebulosa** | Morado + azul profundo del cosmos | #1a0533 | #283593 | 0 | 0 | 0 | 0 | 0 | 20 | 10 | 1400 | 740 |
| 83 | **Tormenta Suprema** | Gris tempestuoso con relámpagos | #37474f | #f9a825 | 15 | 0 | 0 | 0 | 10 | 0 | 0 | 1500 | 800 |
| 84 | **El Invocador** | Negro con detalles verdes rúnicos | #1b2e1b | #76ff03 | 0 | 0 | 3 | 0 | 0 | 0 | 0 | 1500 | 820 |
| 85 | **El Fantasma de Sombra** | Negro translúcido con detalles verdes | #121212 | #00e676 | 15 | 1 | 0 | 0 | 0 | 0 | 0 | 1500 | 850 |

---

### LEGENDARY (15 skins)

| # | Nombre | Descripción | Color cuerpo | Color cañón | speedBonus | hpBonus | ammoBonus | wallBonus | bulletSpeedBonus | xpMultiplier | coinMultiplier | Precio gemas | matchesUnlock |
|---|--------|-------------|--------------|-------------|:---------:|:-------:|:---------:|:---------:|:---------------:|:------------:|:--------------:|:------------:|:-------------:|
| 86 | **Tanque Galáctico** | Negro espacial con nebulosa violeta | #0a0a2e | #7c4dff | 20 | 2 | 0 | 0 | 0 | 0 | 0 | 150 | 2000 |
| 87 | **El Leviatán** | Azul profundo marino con escamas | #0d1b2a | #4fc3f7 | 0 | 3 | 2 | 0 | 0 | 0 | 0 | 150 | 2000 |
| 88 | **El Fénix** | Naranja llamas con destellos dorados | #ff6d00 | #d4ac0d | 20 | 2 | 0 | 0 | 10 | 0 | 0 | 200 | 2500 |
| 89 | **Tanque Dimensional** | Violeta con portales dimensionales | #6a1b9a | #00e5ff | 20 | 0 | 0 | 0 | 20 | 0 | 0 | 200 | 2500 |
| 90 | **El Titán Supremo** | Dorado monumental con negro | #d4ac0d | #0d0d0d | 0 | 3 | 0 | 3 | 0 | 0 | 0 | 200 | 2500 |
| 91 | **El Señor del Vacío** | Negro absoluto con vacío cósmico | #000000 | #7c4dff | 20 | 0 | 3 | 0 | 10 | 0 | 0 | 250 | 3000 |
| 92 | **El Dios del Trueno** | Amarillo eléctrico tormentoso | #f9a825 | #212121 | 0 | 3 | 0 | 0 | 20 | 0 | 0 | 250 | 3000 |
| 93 | **Tanque Apocalipsis** | Rojo fuego con negro destrucción | #b71c1c | #0d0d0d | 20 | 3 | 0 | 0 | 0 | 0 | 0 | 250 | 3000 |
| 94 | **El Ángel Oscuro** | Negro con alas doradas dobles | #0d0d0d | #d4ac0d | 10 | 2 | 3 | 0 | 0 | 0 | 0 | 300 | 3500 |
| 95 | **El Dios del Hielo** | Azul cristalino con escarcha absoluta | #00b0ff | #e3f2fd | 20 | 2 | 0 | 0 | 20 | 0 | 0 | 300 | 4000 |
| 96 | **Tanque Primordial** | Tierra + fuego + agua + aire fusionados | #795548 | #ff6d00 | 20 | 3 | 0 | 2 | 0 | 0 | 0 | 350 | 4500 |
| 97 | **El Maestro del Universo** | Constelaciones + galaxias | #1a0533 | #7c4dff | 0 | 2 | 3 | 0 | 20 | 0 | 0 | 350 | 4000 |
| 98 | **El Gran Señor de la Guerra** | Rojo + negro + corona de batalla | #880e4f | #0d0d0d | 20 | 3 | 2 | 0 | 0 | 0 | 0 | 400 | 4500 |
| 99 | **El Absoluto** | Negro con detalles de todos los elementos | #080808 | #7c4dff | 0 | 3 | 3 | 3 | 0 | 0 | 0 | 450 | 5000 |
| 100 | **El Mítico** | Arcoíris + dorado, edición limitada | #7c4dff | #d4ac0d | 20 | 3 | 3 | 3 | 0 | 25 | 25 | 500 | 10000 |

---

## Reglas de negocio del sistema de skins

### Skins de inicio (starter skins)

- Las **8 primeras skins** (sortOrder 1–8, todas Common) se otorgan automáticamente a cada jugador nuevo al registrarse.
- Al registrarse se asigna **una de esas 8 al azar** como skin activa inicial.
- Los jugadores existentes (pre-lanzamiento) reciben las 8 skins la primera vez que el servidor llama a `GET /skins/user/active-skin` (lazy init).
- Esto aplica **sólo si el usuario no tiene ninguna skin aún**; es una operación idempotente.

Las 8 skins de inicio son:
`Base Clásico`, `El Verde`, `El Rojo`, `El Azul`, `El Amarillo`, `Gris Tormenta`, `Morado Pasión`, `Rosa Retro`

### Slug de skin

Cada skin tiene un **slug** derivado de su nombre: minúsculas, sin acentos, espacios→guiones.
Ejemplo: `"Morado Pasión"` → `morado-pasion`.

- Los assets residen en: `frontend/public/assets/tanks/skins/tank-{slug}-body.png` / `tank-{slug}-cannon.png`
- El game server incluye `skinSlug` en cada `PlayerSnapshot` enviado al cliente
- Phaser carga todas las texturas en `PreloadScene` con clave `skin-{slug}-body` / `skin-{slug}-cannon`

### Skins de bots

- Los bots reciben un `skinSlug` aleatorio entre los 50 primeros skins (sortOrder 1–50) al crear la sala.
- **No reciben bonuses de stats** — solo el aspecto visual cambia.
- Esto aplica a todos los bots de todas las salas independientemente.

### Adquisición

1. **Compra con coins**: El jugador gasta coins del saldo actual. Validado en servidor.
2. **Compra con gemas**: Solo para Legendary. Gasta `gemPrice` gemas.
3. **Desbloqueo gratuito**: Si `gamesPlayed >= matchesUnlock` y no es propietario → puede reclamar gratis con `POST /skins/:id/claim-free`.
4. **Reclamo automático**: El servidor verifica en cada partida completada si se desbloquean nuevas skins (hasta 5 skins por partida para no saturar).

### Progresión

- El endpoint `GET /skins/progression` devuelve:
  - `gamesPlayed`: total de partidas jugadas
  - `nextFreeSkin`: la próxima skin que se desbloquea (la de menor `matchesUnlock` > `gamesPlayed` que no se posea)
  - `nextFreeProgress`: porcentaje de avance (0–100)
  - `claimableSkins`: skins ya desbloqueadas que aún no han sido reclamadas

### Equipar

- Un jugador puede equipar cualquier skin que posea con `PUT /skins/:id/equip`.
- Hay exactamente 1 skin activa por jugador en todo momento (o ninguna = skin base).
- La skin activa se envía junto con el evento `room_joined` para que el game server aplique los bonos.

### Bonos en partida

Los bonos de skin se aplican **al inicio de la partida** (en el game server) sumando al estado base del jugador:
- `speedBonus`: `player.speed += player.speed * (skin.speedBonus / 100)`
- `hpBonus`: `player.maxHp += skin.hpBonus`
- `ammoBonus`: `player.maxAmmo += skin.ammoBonus`
- `wallBonus`: `player.maxWallCharges += skin.wallBonus`
- `bulletSpeedBonus`: `projectile.speed += projectile.speed * (skin.bulletSpeedBonus / 100)`
- `xpMultiplier`, `coinMultiplier`: aplicados en el servidor API al registrar la partida

### Balance

- Los bonos de Legendary (+3 HP, +20% speed) están disponibles a todos vía 2000-10000 partidas.
- Un jugador nuevo NO puede pagar para ganar instantáneamente skins legendarias (excepto con gemas — aceptado).
- La diferencia entre un jugador con skin Legendary y uno sin skin es ~20% velocidad + 3 HP, equivalente a ~nivel 6–8 de progresión normal.

---

## Notas de diseño

- **El Barrilito** (skin #15): Inspirada en el concepto de barril de pueblo, sin referencia directa a personajes de TV.
- **El Vecindario** (skin #19): Color de casas latinoamericanas, sin referencia a obras protegidas.
- **El Paletero / Tamalero** (skins #21, #47): Personajes del imaginario callejero latinoamericano — no copyrighted.
- **El Fantoche** (skin #38): Marioneta colorida genérica, sin referencia a shows específicos.
- Ninguna skin hace referencia directa a personajes de TV, películas o videojuegos con copyright activo.
