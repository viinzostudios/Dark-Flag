# Modelo de Negocio — Arena Siege Tanks

> Free-to-Play. No pay-to-win. Monetización por estética y conveniencia.

---

## Fuentes de ingreso (en orden de implementación)

| Fase | Fuente | Tipo | Activación |
|------|--------|------|-----------|
| 4 | Economía interna (coins) | Retención | Al lanzar cuentas |
| 6 | Google AdSense — Banner | CPM | Fase 6 |
| 6 | Google AdSense — Rewarded | CPC/CPM | Fase 6 |
| 6 | Google AdSense — Interstitial | CPM | Fase 6 |
| 6 | Stripe — Packs de gemas | Microtransacción | Fase 6 |
| 6 | Stripe — Skins premium | Microtransacción | Fase 6 |

---

## Proyección de ingresos (estimado conservador)

### Con 1000 DAU (usuarios activos al día)

| Fuente | Estimado mensual |
|--------|-----------------|
| Banner ads (1000 DAU × 30 días × $0.001 CPM) | $30 |
| Rewarded ads (20% DAU × 3 ads/día × $0.01) | $180 |
| Interstitial (1000 DAU × 0.5 ad/día × $0.005) | $75 |
| Compras Stripe (2% conversión × $5 ARPU) | $100 |
| **Total estimado** | **~$385/mes** |

### Con 10,000 DAU

| Fuente | Estimado mensual |
|--------|-----------------|
| Ads combinados | ~$2,800 |
| Compras Stripe | ~$1,000 |
| **Total estimado** | **~$3,800/mes** |

---

## Estrategia de retención (clave para ingresos)

La monetización depende 100% de la retención. Sin jugadores recurrentes, no hay ingresos.

### Mecanismos de retención implementados

1. **Daily Rewards**: incentivo diario de 30 segundos para volver
2. **Misiones**: dan propósito a cada partida
3. **Ranking**: presión social de competir
4. **Power Stack**: cada kill es satisfactoria y acumula poder
5. **Skins**: personalización = identidad = apego al juego
6. **Progresión de nivel**: sensación constante de avance

### Momentos clave de monetización

| Momento | Oportunidad |
|---------|-------------|
| Primera muerte | Rewarded ad "revivir ahora" |
| Después de 5 muertes | Interstitial ad |
| Ver una skin epic en tienda | Impulso de compra |
| Ranking terminado | "Solo te faltan 200 coins para esa skin" |
| Racha de daily rewards día 7 | Ofrecer pack de gemas con descuento |

---

## Reglas de experiencia de usuario

Estas reglas son innegociables para no destruir la retención:

1. **Nunca** mostrar un ad mientras la partida está activa
2. Ads solo en: pantalla de muerte, pantalla de resultados, lobby
3. Interstitials máximo 1 vez cada 5 partidas por jugador
4. Las skins **pueden tener bonos de stats** (velocidad, HP, balas, muros, XP, coins). Esto es diseño intencional: recompensa la dedicación, no solo el pago.
5. Siempre hay un camino gratuito para conseguir **cualquier** skin — incluyendo las Legendary — jugando las partidas requeridas.
6. Los bonos de skins están balanceados para no crear una brecha insalvable: equivalen al avance de ~6–8 niveles de progresión.

### Sistema de skins con bonos — justificación de diseño

El modelo F2P de Arena Siege Tanks acepta **skins con ventajas de stats** bajo las siguientes condiciones:

- Todo bono es alcanzable **gratis** vía partidas jugadas (puede requerir miles de partidas).
- Los jugadores de pago llegan antes al bono, pero los jugadores dedicados llegan igual.
- El matchmaking futuro puede agrupar por nivel/skin-tier para mayor equidad.
- El catálogo completo está en `docs/06-monetizacion/catalogo-skins.md`.
