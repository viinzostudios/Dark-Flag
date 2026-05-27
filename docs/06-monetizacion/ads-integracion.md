# Integración de Ads — Arena Siege Tanks

> Google AdSense H5 Ads API (`adBreak`) para interstitial y rewarded.
> AdSense estándar para banners y side ads (skyscraper).

---

## Tipos de ads y su ubicación

### 1. Side Ad (Skyscraper) — PC únicamente
- **Formato**: 160×600 px en pantallas ≥ 1420px / 300×600 px en pantallas ≥ 1700px
- **Dónde aparece** (solo en desktop, nunca en móvil):
  | Pantalla | Posición |
  |----------|----------|
  | `/lobby` | Flanqueando el bloque central (izquierda y derecha del `.main`) |
  | `/auth/login` | Flanqueando el card del formulario |
  | `/auth/register` | Flanqueando el card del formulario |
  | Modal de muerte (`DeathOverlayComponent`) | Flanqueando el card de "ELIMINADO" |
- **Componente**: `SideAdComponent` (`shared/components/side-ad.component.ts`)
- **Ocultado en móvil**: el componente usa `display: none` por defecto y solo se activa con `@media (min-width: 1420px)` — sin lógica JS de detección
- **Lobby**: el banner horizontal (`BannerAdComponent`) se oculta automáticamente cuando los side ads están activos (`@media (min-width: 1420px) { .ad-strip { display: none } }`)

### 2. Banner Ad — fallback en pantallas < 1420px
- **Cuándo**: visible en `/lobby` cuando el viewport no tiene espacio para side ads
- **Dónde**: `BannerAdComponent` debajo del header, encima del contenido principal
- **Tamaño**: 728×90 (desktop) / responsivo en mobile (máx 90px de altura)
- **Nunca** durante la partida activa

### 3. Rewarded Ads — bonus de entrada o de respawn
- **Trigger A**: al recibir `room_joined` → aparece `PreEntryOverlayComponent`
- **Trigger B**: al morir → aparece `DeathOverlayComponent`
- **Opciones** (elegir exactamente una por evento):
  | Opción | Reward |
  |--------|--------|
  | "Ver anuncio → Balas llenas" | Respawn/entrada con `ammo = MAX_AMMO` |
  | "Ver anuncio → Muros llenos" | Respawn/entrada con `wallCharges = MAX_WALL_CHARGES` |
- **Límite**: 10 rewarded ads por día por usuario (`ast_rewarded_YYYY-MM-DD`)
- **Duración típica**: 15–30 segundos
- **Countdown**: se **pausa** durante el ad y se reanuda al terminar

### 4. Interstitial Ad — por muerte (principal)
- **Trigger**: cada vez que el jugador muere si se cumple alguna de estas condiciones:
  - **3 muertes acumuladas** desde el último interstitial mostrado, O
  - **2 minutos de sesión** transcurridos desde el último interstitial mostrado
- **Momento**: se dispara al abrirse el `DeathOverlayComponent` (en `ngOnInit`)
- **Countdown**: se **pausa** mientras se muestra el interstitial, se reanuda al cerrarlo
- **No mostrar si**: el usuario compró algo en las últimas 24h
- **Comportamiento sobre PC**: fullscreen por encima del overlay de muerte. Al cerrarlo, el overlay de muerte queda visible con las opciones de respawn.
- **Comportamiento sobre móvil**: ídem — actúa como el equivalente del side ad en escritorio

### 5. Interstitial Ad — por salida (secundario)
- **Trigger**: cuando el jugador pulsa "Salir al lobby" o se agota el countdown de 60s
- **Frecuencia**: máximo 1 por cada 3 salidas de sala (`ast_interstitial_exits`)
- **No mostrar si**: el usuario compró algo en las últimas 24h
- **Independiente** del interstitial por muerte — ambos conviven con sus propios contadores

---

## Flujo completo

```
[Lobby] → click "Buscar partida" → ads.startGameSession() → room_joined
    ↓
PreEntryOverlay (15s timeout implícito)
    ├── [ver ad balas]  → ad completo → navega a /game con bonus='ammo'
    ├── [ver ad muros]  → ad completo → navega a /game con bonus='walls'
    └── [entrar sin bonus] → navega a /game sin bonus

[Game] → player muere → DeathOverlay ngOnInit
    ├── ads.incrementDeathCount()
    ├── ads.tryShowDeathInterstitial()
    │     ├── condición OK → pausa countdown → interstitial → reanuda countdown
    │     └── condición NO → nada (countdown corre normal)
    │
    ├── [ver ad balas]  → pausa countdown → rewarded → respawn con ammo=MAX
    ├── [ver ad muros]  → pausa countdown → rewarded → respawn con walls=MAX
    ├── [▶ Respawnear]  → respawn normal (disponible después de 3s)
    └── [🚪 Salir / timeout]
          ├── ads.incrementExitCount()
          └── ads.showExitInterstitial() → interstitial si aplica → /lobby

[Login / Register / Lobby] → side ads visibles en PC >= 1420px (sin lógica extra)
```

---

## Implementación técnica

### AdsService (`core/services/ads.service.ts`)

```typescript
@Injectable({ providedIn: 'root' })
class AdsService {
  // ── Sesión ──────────────────────────────────────────────────────────
  startGameSession(): void        // llamar en LobbyComponent.enterGame() → resetea contadores de muertes y guarda timestamp
  incrementDeathCount(): void     // llamar en DeathOverlay.ngOnInit()

  // ── Rewarded ─────────────────────────────────────────────────────────
  canShowRewardedAd(): boolean
  onRewardedWatched(): void       // incrementa contador diario + llama /economy/ad-reward si logueado
  showAmmoRewardedAd(onComplete: () => void): void
  showWallsRewardedAd(onComplete: () => void): void

  // ── Interstitial por muerte ────────────────────────────────────────
  tryShowDeathInterstitial(onWillShow: () => void, afterAd: () => void): void
  // onWillShow: callback llamado SOLO si el interstitial efectivamente se mostrará
  // afterAd: callback llamado cuando el interstitial termina (o simulado en dev)

  // ── Interstitial por salida ────────────────────────────────────────
  showExitInterstitial(): void
  incrementExitCount(): void

  // ── Banner ────────────────────────────────────────────────────────
  pushBannerAd(): void            // (window.adsbygoogle ??= []).push({})

  // ── Compra ────────────────────────────────────────────────────────
  onPurchaseCompleted(): void     // suprime interstitials durante 24h
}
```

Todos los métodos usan `window.adBreak` (H5 Ads API). Si no está disponible (dev o sin script), simulan el resultado después de 1500ms con `console.info('[Ads] simulated')`.

### SideAdComponent (`shared/components/side-ad.component.ts`)

Componente standalone. Renderiza `<ins class="adsbygoogle">` en 160×600.
- `adClient`: `ca-pub-6638397630622757`
- `adSlot`: `8929285176` (unidad `bt-display-side`)
- `display: none` por defecto (mobile-first)
- Se activa como `display: block` a partir de `min-width: 1420px`
- Escala a `width: 300px` a partir de `min-width: 1700px`
- En dev (`localhost`) muestra un placeholder visual

### BannerAdComponent (`shared/components/banner-ad.component.ts`)

Componente standalone. Renderiza `<ins class="adsbygoogle">` estándar.
- `adClient`: `ca-pub-6638397630622757`
- `adSlot`: `5836217975` (unidad `bt-display-banner`)
- `:host` tiene `max-height: 90px; overflow: hidden` para forzar formato leaderboard
- En lobby: oculto automáticamente en viewports ≥ 1420px cuando los side ads están activos
- En dev muestra un placeholder de 60px de alto

### Scripts y meta tag en index.html

```html
<meta name="google-adsense-account" content="ca-pub-6638397630622757">

<!-- H5 Games Ads API stubs: permiten llamar adBreak/adConfig antes de que cargue adsbygoogle.js -->
<script>
  window.adsbygoogle = window.adsbygoogle || [];
  window.adBreak = window.adBreak || function(o) { if (o.f) o.f(); };
  window.adConfig = window.adConfig || function(o) {};
</script>
<script async
  src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6638397630622757"
  crossorigin="anonymous">
</script>
```

**Publisher ID**: `ca-pub-6638397630622757`

**IMPORTANTE**: No agregar manualmente ninguna URL del tipo `pagead/managed/js/adsense/mYYYYMMDD/show_ads_impl_*.js`. Ese script lo carga automáticamente `adsbygoogle.js` con la versión correcta. Hardcodearlo causa 404 cuando Google rota versiones.

### Inicialización H5 Games Ads (adConfig)

`AdsService` llama `adConfig()` en el constructor:

```typescript
constructor() {
  window.adConfig?.({ preloadAdBreaks: 'on', sound: 'off' });
}
```

Esto le indica a Google que precargue los ad breaks y que el juego no usa sonido en los ads. Debe llamarse exactamente una vez, antes de cualquier `adBreak()`. Los stubs en `index.html` garantizan que la llamada no falle si `adsbygoogle.js` aún no terminó de cargar.

### Control de frecuencia (localStorage)

| Key | Tipo | Propósito |
|-----|------|-----------|
| `ast_rewarded_YYYY-MM-DD` | número (0–10) | rewarded vistas hoy |
| `ast_interstitial_exits` | número | salidas acumuladas desde último exit-interstitial |
| `ast_last_purchase` | timestamp ms | suprime interstitials 24h post-compra |
| `ast_deaths_since_int` | número | muertes desde último death-interstitial |
| `ast_session_start` | timestamp ms | inicio de la sesión de juego actual |
| `ast_last_int_ts` | timestamp ms | timestamp del último death-interstitial mostrado |

---

## Diferenciación PC vs. Móvil

| Formato | PC (≥ 1420px) | Móvil (< 1420px) |
|---------|---------------|------------------|
| Side ads (skyscraper) | ✅ Lobby, Login, Register, Death modal | ❌ Ocultos |
| Banner horizontal | Solo como fallback (< 1420px) | ✅ Lobby |
| Rewarded video | ✅ Pre-entrada + muerte | ✅ Pre-entrada + muerte |
| Interstitial por muerte | ✅ Fullscreen | ✅ Fullscreen |
| Interstitial por salida | ✅ Cada 3 salidas | ✅ Cada 3 salidas |

---

## Reward en el servidor (game-server)

El bonus del rewarded ad se aplica en el respawn del servidor.

**Evento WebSocket cliente → servidor:**
```typescript
socket.emit('respawn_request', {
  bonus: 'ammo' | 'walls' | null
});
```

**Lógica del servidor:**
- Si `bonus === 'ammo'`: `player.ammo = GAME_CONSTANTS.MAX_AMMO`
- Si `bonus === 'walls'`: `player.wallCharges = GAME_CONSTANTS.MAX_WALL_CHARGES`
- Si `bonus === null`: valores normales de respawn

> **Seguridad**: el servidor no verifica que el ad fue realmente visto — AdSense no expone token server-side verificable en web. Aceptable para el modelo F2P actual.

---

## Estado de configuración

| Item | Estado |
|------|--------|
| Publisher ID (`ca-pub-6638397630622757`) | ✅ Configurado |
| Slot `bt-display-side` (`8929285176`) | ✅ Configurado |
| Slot `bt-display-banner` (`5836217975`) | ✅ Configurado |
| H5 Games Ads API (`adConfig` + stubs) | ✅ Configurado |
| Bug doble llamada `onExitInterstitialShown` | ✅ Corregido |
| Script `show_ads_impl_fy2021.js` hardcodeado | ✅ Eliminado |
| Rewarded + Interstitial via `adBreak` | ✅ Operativo (no requiere slot ID) |

---

## Alternativas si AdSense no aprueba rewarded

1. **Google Ad Manager** — requiere cuenta avanzada con contrato directo
2. **PropellerAds** — soporta rewarded en web sin restricciones de aprobación
3. Evaluar cuando el juego tenga tráfico real para presentar a AdSense
