# Economía del Juego — Arena Siege Tanks

---

## Monedas

### Tipos de moneda

| Tipo | Nombre | Descripción | Cómo obtener |
|------|--------|-------------|-------------|
| `coins` | Monedas | Moneda gratuita principal | Jugando, misiones, daily rewards, rewarded ads |
| `premium_coins` | Gemas | Moneda de pago | Compra real con Stripe |

### Ganancia de coins por partida

La ganancia se calcula al terminar cada partida:

```
coins_base = 5
coins_por_duracion = floor(duracion_segundos / 60) * 3    // +3 por minuto
coins_por_kill = kills * 2
coins_por_ranking = bonos según posición final

bonus_ranking:
  Top 1 → +20 coins
  Top 2–3 → +15 coins
  Top 4–6 → +10 coins
  Top 7–10 → +5 coins

total = coins_base + coins_por_duracion + coins_por_kill + bonus_ranking
```

**Ejemplo**: Partida de 5 min, 3 kills, posición #4
```
total = 5 + (5*3) + (3*2) + 10 = 5 + 15 + 6 + 10 = 36 coins
```

---

## Precios de skins

### Por rareza

*(Precios actualizados en v1.2.0 — multiplicados para reflejar la ganancia real por partida)*

| Rareza | Precio en coins | Precio en gemas | Desbloqueo gratuito (tiempo) |
|--------|----------------|-----------------|------------------------------|
| Common | 0 – 4 500 | — | gratis / ~por tiempo jugado |
| Rare | 7 500 – 10 500 | — | por tiempo jugado |
| Epic | 12 000 – 15 000 | — | por tiempo jugado |
| Legendary | — | 150 – 500 | por tiempo jugado |

*Las skins Legendary no se pueden comprar con coins — solo con gemas o por mérito de tiempo.*
*La skin #1 "Base Clásico" es gratuita para todos desde el inicio.*

*Las skins Legendary no se pueden comprar con coins — solo con gemas o por mérito de partidas.*
*La skin #1 "Base Clásico" es gratuita para todos desde el inicio.*
*El catálogo completo (100 skins) está en `docs/06-monetizacion/catalogo-skins.md`.*

### Sistema de desbloqueo por partidas

Cada skin tiene un campo `matchesUnlock` (número de partidas totales acumuladas para desbloquearla gratis).

- El servidor compara `player.stats.gamesPlayed` con `skin.matchesUnlock`.
- Si `gamesPlayed >= matchesUnlock` y el jugador no posee la skin → puede reclamarla gratis.
- Al finalizar cada partida, el servidor detecta automáticamente hasta 5 nuevas skins desbloqueadas y las notifica.
- El jugador puede reclamar skins pendientes desde el Lobby o desde la Tienda.

**Progresión estimada de un jugador casual** (5 partidas/día):
- 100 partidas → ~20 días → desbloquea todas las Common
- 350 partidas → ~70 días → desbloquea todas las Rare
- 900 partidas → ~6 meses → desbloquea todas las Epic
- 5 000 partidas → ~2.7 años → desbloquea casi todas las Legendary

**Progresión de un jugador hardcore** (20 partidas/día):
- 900 partidas → ~45 días → desbloquea todas las Epic
- 5 000 partidas → ~8 meses → desbloquea la mayoría de Legendary

---

## Packs de monedas premium (Stripe)

*(Paquetes recalculados en v1.2.0 para reflejar la nueva escala de precios)*

| Pack ID | Coins | Gemas bonus | Precio USD |
|---------|-------|-------------|------------|
| `coins_5000` | 5 000 | — | $4.99 |
| `coins_13000` | 13 000 | +50 gemas | $9.99 |
| `coins_30000` | 30 000 | +150 gemas | $19.99 |
| `coins_65000` | 65 000 | +400 gemas | $39.99 |

*Los paquetes con gemas bonus permiten al jugador comprar escenarios (100 gemas c/u) o skins Legendary.*

---

## Daily Rewards (recompensas por login diario)

| Día de streak | Recompensa |
|---------------|-----------|
| 1 | 20 coins |
| 2 | 30 coins |
| 3 | 50 coins + 10 XP |
| 4 | 50 coins |
| 5 | 80 coins + 10 XP |
| 6 | 80 coins |
| 7 (bonus) | 150 coins + 5 gemas + 50 XP |

*Si se rompe el streak, se reinicia desde el día 1.*
*Si el streak supera 7 días, se repite el ciclo.*

---

## Misiones y recompensas

### Misiones diarias (se renuevan a las 00:00 UTC)

| Misión | Descripción | Recompensa |
|--------|-------------|-----------|
| Shooter | Realiza 30 disparos | 25 coins + 10 XP |
| Hunter | Elimina 3 jugadores | 40 coins + 15 XP |
| Survivor | Sobrevive 3 minutos en una partida | 35 coins + 10 XP |
| Builder | Coloca 10 muros | 25 coins + 10 XP |

*Se asignan 3 misiones diarias aleatorias por jugador.*

### Misiones semanales

| Misión | Descripción | Recompensa |
|--------|-------------|-----------|
| Elite | Llega al Top 3 en 5 partidas | 200 coins + 30 XP |
| Unstoppable | Consigue 5 kills en una partida | 150 coins + 25 XP |
| Tactician | Coloca 50 muros en la semana | 100 coins + 20 XP |
| Social | Juega 15 partidas | 120 coins + 20 XP |

---

## Progresión de nivel

### XP requerida por nivel

```
xp_para_nivel(n) = 100 * n * 1.2  (crecimiento del 20% por nivel)

Nivel 1 → 2: 100 XP
Nivel 2 → 3: 144 XP
Nivel 3 → 4: 207 XP
Nivel 5 → 6: 430 XP
Nivel 10 → 11: 1862 XP
```

### Ganancia de XP por partida
- Base: 10 XP
- Por kill: 3 XP
- Por minuto jugado: 2 XP
- Misiones: según tabla anterior

### Recompensas por subir de nivel
- Cada nivel par: +30 coins
- Nivel 5: 1 skin Common aleatoria
- Nivel 10: 10 gemas
- Nivel 20: 1 skin Rare aleatoria
- Nivel 50: 1 skin Epic aleatoria

---

## Recompensa de supervivencia

Si un jugador sobrevive **15 minutos consecutivos sin morir** en una partida, recibe automáticamente **10 gemas (premiumCoins)**.

**Implementación**:
- El game server rastrea `bornAt` (timestamp del inicio de la vida actual) en el estado del jugador
- Al superar los 15 min, el servidor emite el evento socket `survival_reward` al jugador
- El cliente llama a `POST /economy/survival-reward` (con JWT) para acreditar las gemas
- **Rate limit**: un reclamo por usuario cada 15 minutos (en memoria del servidor API)
- El contador se reinicia al morir; al respawnear, el contador empieza de nuevo

**Condiciones**:
- Solo para jugadores humanos autenticados (guests no reciben el premio)
- Solo una vez por vida continua (el flag `survivalRewardGranted` se resetea en muerte)

---

## Precios de avatares/stickers

*(Actualizados en v1.2.0 — multiplicados ×10 y ordenados por precio ascendente)*

| Tier | Precio en coins | Descripción |
|------|----------------|-------------|
| Tier 1 | 2 000 | Animales básicos, vehículos comunes |
| Tier 2 | 5 000 | Personajes de fantasía, guerreros |
| Tier 3 | 10 000 | Personajes épicos, criaturas |
| Tier 4 | 20 000 | Legendarios, heroínas especiales |

*Los avatares se listan ordenados por precio ascendente (Tier 1 primero).*

---

## Rewarded Ads

| Acción | Recompensa |
|--------|-----------|
| Ver anuncio (30s) | 50 coins |
| Ver anuncio en pantalla de muerte | 20 coins + respawn instantáneo |

**Límites**:
- Máximo 5 rewarded ads por día por jugador
- Cooldown entre ads: 3 minutos

---

## Balance económico

### Flujo de coins (por jugador promedio en un día activo)

**Ingresos estimados**:
- 5 partidas × 30 coins promedio = 150 coins
- Daily reward = 20–150 coins
- 3 misiones diarias completadas = ~90 coins
- 2 rewarded ads = 100 coins
- **Total día**: ~360–490 coins

**Skin más barata (Common)**: 200 coins → 1 día de juego
**Skin Rare**: 500 coins → ~1.5 días de juego activo
**Skin Epic (coins)**: 1200 coins → ~3 días de juego activo

*El balance está diseñado para que un jugador casual pueda conseguir skins Rare cada 2 días y Epic cada semana, incentivando el regreso diario.*

---

## Reglas anti-explotación

1. Las coins ganadas por partida tienen cap: máximo 100 coins por partida
2. Las misiones no se pueden completar múltiples veces el mismo día
3. Los rewarded ads tienen límite diario (5 vistas)
4. Las transacciones de compra se validan en el servidor (no en el cliente)
5. El saldo nunca puede ser negativo (validar antes de cualquier débito)
