# Arquitectura Angular — Arena Siege Tanks

> Angular 19 con standalone components. Sin NgModules. Signals para estado local. Services para lógica de negocio.

---

## Rutas

```typescript
// app.routes.ts — estado real a 2026-05
export const routes: Routes = [
  { path: '',             loadComponent: LandingComponent },      // sin guard
  { path: 'auth/login',   loadComponent: LoginComponent },        // sin guard
  { path: 'auth/register',loadComponent: RegisterComponent },     // sin guard
  { path: 'lobby',        loadComponent: LobbyComponent },        // sin guard — soporta anónimos
  { path: 'game',         loadComponent: GameComponent },         // sin guard — soporta anónimos
  { path: 'shop',         canActivate: [authGuard],               // requiere auth
                          loadComponent: ShopComponent },
];
```

> **Decisión clave**: `/lobby` y `/game` no tienen guard. El juego acepta jugadores anónimos
> que se conectan con username generado ("Tank-XXXX"). Solo `/shop` requiere JWT.

### Flujo de navegación

```
Landing (/)
  ├── "JUGAR AHORA"     → /lobby
  ├── "Iniciar Sesión"  → /auth/login  → /lobby
  └── "Crear Cuenta"    → /auth/register → /lobby

Lobby (/lobby)
  └── "Buscar partida" → conecta socket → room_joined
        └── PreEntryOverlay → [rewarded opcional] → /game

Game (/game)
  └── [player muere] → DeathOverlay (60s)
        ├── "Respawnear" → respawn en misma sala
        ├── [rewarded] → respawn con bonus
        ├── "Salir"    → [interstitial] → /lobby (auth) o / (anónimo)
        └── [timeout 60s] → auto-kick → /lobby (auth) o / (anónimo)
```

---

## Componentes

| Componente | Ruta / Contexto | Descripción |
|---|---|---|
| `LandingComponent` | `/` | Hero full-screen de presentación |
| `LoginComponent` | `/auth/login` | Formulario de login con glass morphism |
| `RegisterComponent` | `/auth/register` | Formulario de registro |
| `LobbyComponent` | `/lobby` | Sala de espera pre-partida con banner ad |
| `PreEntryOverlayComponent` | dentro de `/lobby` | Overlay de rewarded ads al entrar a sala |
| `GameComponent` | `/game` | Contenedor Phaser + capa de overlays Angular |
| `DeathOverlayComponent` | dentro de `/game` | Overlay de muerte con resumen, countdown y ads |
| `ShopComponent` | `/shop` | Tienda de skins y paquetes de coins |
| `OrientationPromptComponent` | global (`app-root`) | Overlay que pide girar el dispositivo a landscape en móvil |
| `MobileInstallPromptComponent` | global (`app-root`) | Modal PWA: pide instalar la app o continuar en navegador; activa fullscreen en el primer tap |

---

## LandingComponent

Página de entrada del juego. Diseño hero full-screen (100vw × 100vh, sin scroll).

**Estructura visual:**
- Fondo animado: 3 blobs con `filter: blur(90px)` + grid overlay
- Badge "🟢 Multijugador en vivo"
- Título con gradiente blanco→verde
- Botón principal "JUGAR AHORA" (navega a `/game` sin auth)
- Botones secundarios "Iniciar Sesión" y "Crear Cuenta"
- Pills de features + fine print

**No tiene lógica**: solo navegación con `routerLink`.
- Botón "JUGAR AHORA" → `/lobby` (antes apuntaba a `/game`)

---

## LobbyComponent

Pre-partida. Mismo design system que la landing (blobs + glass).

**Estructura visual:**
- Header: username del jugador (o "Jugador anónimo") + coins si está autenticado
- Banner ad HTML (`728×90` o responsivo) — parte superior
- Card central: botón "BUSCAR PARTIDA" con animación de pulso
- Stats de última sesión (kills, muertes, score) si hay datos en localStorage
- Panel de info: botón "☢ Ver Niveles" → abre modal con los 15 niveles del sistema de stacks

**Modal de niveles:**
- Grid de 15 tarjetas (una por nivel) con mini tanque CSS animado
- Tarjetas con variantes visuales:
  - Normal (1–9): borde neutro
  - Amarillo (`lvl-card-yellow`, nv. 10–14): borde dorado + aura amarilla animada en el tanque mini
  - Tóxico (`lvl-card-toxic`, nv. 13–14): borde verde + glow en el tanque
  - Radioactivo (`lvl-card-radio`, nv. 15): borde verde intenso + aura verde animada
- Texto de beneficio en `var(--t-tx)` a 11px para máxima legibilidad
- Signal `showLevels` controla visibilidad; click en backdrop cierra

**Lógica:**
1. Al montar: conecta `GameSocketService` (no emite `join_game` todavía)
2. Al click "BUSCAR PARTIDA": emite `join_game` → espera `room_joined`
3. Al recibir `room_joined`: activa `PreEntryOverlayComponent`
4. Al confirmar entrada: navega a `/game` pasando `bonus` como Navigation State

---

## PreEntryOverlayComponent

Se muestra dentro del lobby cuando `room_joined` llega. Timeout implícito de 15s (si no elige, entra sin bonus).

**Opciones:**
- "📺 Ver anuncio → Entrar con **balas llenas**" (MAX_AMMO en lugar de AMMO_START)
- "📺 Ver anuncio → Entrar con **muros llenos**" (MAX_WALL_CHARGES en lugar de WALL_CHARGES_START)
- "Entrar sin bonus →" — cierra overlay y navega a `/game`

**Reglas:**
- Solo se puede elegir **una** de las dos opciones (no ambas en el mismo ingreso)
- El botón queda disabled si el límite diario de rewarded (10/día) está agotado
- Al completar el ad: navega a `/game` con `{ state: { bonus: 'ammo' | 'walls' } }`

---

## Login y Register

Comparten el mismo diseño base:

- Mismo fondo animado que la landing (blobs + grid)
- Card glass morphism (`backdrop-filter: blur(20px)`, borde translúcido)
- Botón "← Volver" (top-left, navega a `/`)
- Formulario reactivo con validación
- Submit con gradiente verde + glow
- Después de login/register exitoso → navega a `/lobby`

**LoginComponent:**
- Campos: email, password
- Muestra link a `/auth/register` y "Jugar como invitado → /game"
- Error global para credenciales incorrectas

**RegisterComponent:**
- Campos: email, username (3–20 chars, `/^[\w-]+$/`), password (≥8 chars, ≥1 número)
- Muestra link a `/auth/login`

---

## Servicios core

### AuthService
```typescript
// core/services/auth.service.ts
interface AuthTokens { accessToken: string; refreshToken: string; }
interface UserPayload { sub: string; email: string; username: string; }

class AuthService {
  isLoggedIn: boolean            // basado en accessToken en localStorage
  isLoggedIn$: BehaviorSubject<boolean>

  register(email, username, password): Observable<AuthTokens>
  login(email, password): Observable<AuthTokens>
  refresh(): Observable<AuthTokens>
  logout(): void
  getAccessToken(): string | null
  getCurrentUsername(): string | null  // decodifica JWT
}
```

Almacenamiento: `localStorage` (`ast_access`, `ast_refresh`).  
En `/game` anónimo, no hay tokens — `getCurrentUsername()` devuelve `null` y el componente genera "Tank-XXXX".

### GameSocketService
```typescript
// core/services/game-socket.service.ts
class GameSocketService {
  connect(username?: string): void
  joinGame(roomId?: string, username?: string): void
  sendInput(input: ClientInput): void
  leaveGame(): void
  disconnect(): void

  room_joined$: ReplaySubject<RoomJoinedPayload>
  game_state$: Subject<GameStateEvent>
  player_joined$: Subject<...>
  player_left$: Subject<...>
  error$: Subject<...>
}
```

Conecta a `environment.socketUrl` (dev: `http://localhost:3001`).

### AdsService
- `showAmmoRewardedAd(onComplete)` — rewarded que da balas llenas al respawn/entrada
- `showWallsRewardedAd(onComplete)` — rewarded que da muros llenos al respawn/entrada
- `showExitInterstitial()` — interstitial al salir/ser kickeado de sala
- `canShowRewardedAd(): boolean` — verifica límite 10/día (localStorage)
- `onRewardedWatched()` — incrementa contador diario
- Todos usan `window.adBreak` (H5 Ads API) o fallback dev que simula en 2s

### MobileFullscreenService
```typescript
// core/services/mobile-fullscreen.service.ts
class MobileFullscreenService {
  showModal  = signal(false)   // controla visibilidad del modal de instalación
  canInstall = signal(false)   // true si el browser soporta PWA install prompt

  init(): void       // llamado en ngOnInit de MobileInstallPromptComponent
  onInstall(): Promise<void>   // fullscreen + dispara prompt de instalación PWA
  onContinue(): void           // fullscreen + cierra modal
}
```

**Flujo en móvil:**
1. Si ya es PWA standalone → llama `requestFullscreen()` directamente, sin modal
2. Si es browser normal → muestra `MobileInstallPromptComponent`
3. El usuario toca cualquier botón → `document.documentElement.requestFullscreen()` (requiere gesto de usuario)
4. Si el browser soporta `beforeinstallprompt` → botón "Instalar app" visible; dispara el prompt nativo del SO
5. Botón "Continuar en el navegador" → solo fullscreen, sin instalar

**PWA configurada con** `@angular/pwa` (`@angular/service-worker`):
- `public/manifest.webmanifest`: `display: fullscreen`, `orientation: landscape`, colores `#07071a`
- `ngsw-config.json`: service worker para cache de assets (solo en production build)
- Service worker habilitado con `provideServiceWorker('ngsw-worker.js', { enabled: !isDevMode() })`

---

### GameStateSignalService
Puente de estado entre Phaser y Angular. Expone signals que `GameScene` actualiza:

```typescript
class GameStateSignalService {
  isDead     = signal(false)
  killsThisLife = signal(0)
  scoreGained  = signal(0)
  leaderboardRank = signal(0)
  deathTimestamp  = signal(0)  // Date.now() al morir — inicia el countdown de 60s
}
```

### SkinsService
- CRUD de skins: list, purchase, equip, unequip
- Gestión de wallet y paquetes de coins

---

## Interceptors

### authInterceptor
Inyecta `Authorization: Bearer <token>` en cada request HTTP.  
En 401 intenta `refresh()`. Si falla → `logout()`.

---

## Guards

### authGuard
```typescript
// core/guards/auth.guard.ts
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn) return true;
  return router.createUrlTree(['/auth/login']);
};
```

Aplicado **solo a `/shop`**. El resto de rutas son libres.

---

## Design system

Paleta y estilo definidos en los componentes (CSS-in-component):

| Token | Valor |
|---|---|
| Fondo base | `#07071a` |
| Acento principal | `#00e87a` (verde) |
| Gradiente título | `#fff → #b8ffdf → #00e87a` |
| Blob azul | `#0d4a8e` |
| Blob verde | `#0e5c30` |
| Blob violeta | `#4a0e80` |
| Error | `#ff6b6b` |
| Glass card | `rgba(255,255,255,0.05)` + `backdrop-filter: blur(20px)` |
| Fuente | `'Inter', system-ui, -apple-system` |

Todos los tamaños de fuente usan `clamp()` para ser responsivos sin media queries.

---

## GameComponent

Contenedor de Phaser **con capa de overlays Angular**. El template tiene dos capas apiladas:

```html
<!-- game/game.component.ts template -->
<div class="game-root">
  <div #gameContainer class="phaser-layer"></div>
  <div class="overlay-layer" [class.active]="isDead()">
    <app-death-overlay
      *ngIf="isDead()"
      [killsThisLife]="killsThisLife()"
      [scoreGained]="scoreGained()"
      [leaderboardRank]="rank()"
      [deathTimestamp]="deathTimestamp()"
      (onRespawn)="handleRespawn($event)"
      (onExit)="handleExit()"
    />
  </div>
</div>
```

**Lógica:**
- Al montar: lee `bonus` del Navigation State (`router.getCurrentNavigation().extras.state`)
- Pasa el bonus a Phaser Registry → `GameScene` lo aplica al primer respawn del servidor
- Suscribe los signals de `GameStateSignalService` para mostrar/ocultar `DeathOverlayComponent`
- `handleRespawn(bonus?)` → llama `GameSocketService.respawn(bonus)`
- `handleExit()` → `AdsService.showExitInterstitial()` → navega a `/lobby` o `/`

Phaser corre en modo `RESIZE` (ocupa todo el viewport). Las escenas son:
- `PreloadScene` — carga assets
- `GameScene` — lógica principal (ya no renderiza overlay de muerte)

## DeathOverlayComponent

Overlay Angular que aparece sobre el canvas cuando el jugador muere.

**Props de entrada:** `killsThisLife`, `scoreGained`, `leaderboardRank`, `deathTimestamp`
**Eventos de salida:** `onRespawn(bonus?: 'ammo' | 'walls')`, `onExit()`

**Comportamiento:**
- Countdown de 60s visible (barra de progreso) desde `deathTimestamp`
- Los primeros 3s: botón "Respawnear" deshabilitado (cooldown mínimo del servidor)
- Al llegar a 0s: emite `onExit()` automáticamente (timeout kick)
- Ads disponibles mientras el countdown corre:
  - "📺 Ver anuncio → Respawnear con **balas llenas**" → pausa countdown durante el ad
  - "📺 Ver anuncio → Respawnear con **muros llenos**" → pausa countdown durante el ad
  - Solo una opción por muerte. Deshabilitado si límite 10/día agotado
- Botón "🚪 Salir al lobby" → emite `onExit()` (el componente padre maneja el interstitial)

---

## Comunicación Angular ↔ Phaser

El `GameSocketService` se pasa al `Registry` de Phaser:

```typescript
this.game.registry.set('socketService', this.socketService);
this.game.registry.set('adsService', this.adsService);
```

Las escenas lo obtienen con `this.registry.get('socketService')`. No hay EventBus global.
