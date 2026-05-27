# Onboarding — Arena Siege Tanks

> Especificación de diseño e implementación del sistema de tutorial/onboarding para jugadores nuevos.
> **Estado**: Pendiente de implementación — último item de V1.

---

## Objetivo

Que un jugador que abre el juego por primera vez entienda los 4 controles fundamentales en menos de 30 segundos, sin bloquear la entrada a la partida.

**Principios**:
- No invasivo: el jugador puede saltarse todo en 1 click
- Contextual: los hints aparecen en el momento relevante
- Sin modo tutorial separado: no requiere sala especial ni lógica extra en el servidor
- Una sola vez: nunca vuelve a aparecer una vez completado o cerrado

---

## Estructura de dos capas

### Capa 1 — Modal pre-partida (4 cards)

Un modal de bienvenida con 4 slides que aparece en el lobby **antes de la primera búsqueda de partida**. Se puede cerrar en cualquier momento.

**Cuándo aparece**: si `localStorage.getItem('ast_tutorial_done') === null`
**Cuándo desaparece para siempre**: al presionar "Jugar" o al cerrar el modal
**En qué ruta**: `/lobby`, integrado en `LobbyComponent`

### Capa 2 — Hints contextuales en partida

Durante la **primera partida** (flag `ast_ingame_hints_done` en localStorage), pequeños tooltips de texto aparecen en pantalla ante situaciones específicas. No bloquean el juego.

---

## Capa 1: Contenido de las 4 cards

### Card 1 — Movimiento

**Título**: Muévete con el cursor
**Ícono**: 🖱️ (o ícono de joystick en móvil)
**Texto PC**: Mueve el mouse en la dirección que quieras ir. Cuanto más lejos del centro, más rápido. **Barra espaciadora** para frenar.
**Texto Mobile**: El joystick izquierdo controla la dirección y velocidad. El botón 🔒 ancla tu posición.
**Visual**: Animación CSS — punto (cursor) alejándose del centro, flecha indicando el tanque siguiéndolo

---

### Card 2 — Disparo

**Título**: Dispara con precisión
**Ícono**: 💥
**Texto PC**: **Click izquierdo** o tecla **E** para disparar. Tienes balas limitadas. Recoge los packs del suelo para reponerlas. Las balas rebotan hasta 3 veces.
**Texto Mobile**: Botón 🔥 para disparar. Busca packs dorados en el suelo.
**Visual**: Animación de bala rebotando en un borde (CSS o SVG simple)

---

### Card 3 — Muros

**Título**: Coloca muros para dominar
**Ícono**: 🧱
**Texto PC**: **Click derecho** o **W** pone un muro delante de ti. **Q** lo pone detrás. Los muros aguantan 3 impactos y bloquean el paso.
**Texto Mobile**: Botones 🧱 / ↩🧱 para muros delante/detrás.
**Visual**: Tanque colocando un muro, bala rebotando en él

---

### Card 4 — Sube de nivel

**Título**: Elimina y escala
**Ícono**: ⚡
**Texto**: Mata rivales para ganar **stacks**. Con más stacks: más velocidad, más HP, balas más poderosas. Llega a nivel 15 para el doble disparo. ¡Al morir perdes los stacks!
**Visual**: Barra de nivel subiendo, icono de corona para el líder

---

### UI del modal

```
┌────────────────────────────────────────────┐
│  [X cerrar]               Card 1 / 4       │
│                                            │
│     🖱️  Muévete con el cursor              │
│                                            │
│  [animación]                               │
│                                            │
│  Mueve el mouse hacia donde quieras...     │
│                                            │
│  ●───○──○──○   [Siguiente →]               │
│  [Saltar todo]                             │
└────────────────────────────────────────────┘
```

- Los 4 dots muestran el progreso
- "Saltar todo" cierra el modal y marca el tutorial como visto
- En la última card: botón "¡Entendido, a jugar!"
- Al cerrar con X también marca el tutorial como visto

---

## Capa 2: Hints contextuales en partida

Aparecen solo si `localStorage.getItem('ast_ingame_hints_done') === null`.
Se marcan como vistos al finalizar la primera partida o al salir al lobby.

Cada hint es un texto pequeño flotante en la parte inferior de la pantalla (sobre el HUD), fade-in de 0.3s, visible 4s, fade-out 0.5s.

| Condición de disparo | Texto del hint | Una sola vez |
|---------------------|----------------|--------------|
| Primeros 5s de partida | "Mueve el cursor para moverte — el tanque te sigue" | ✅ |
| Primera vez que ammo = 0 | "¡Sin balas! Busca los packs dorados en el mapa" | ✅ |
| Primera vez que wallCharges = 0 | "Sin cargas de muro — recoge los packs plateados" | ✅ |
| Primera vez que el jugador muere | (ninguno — el death overlay ya explica el respawn) | — |
| Primera vez que recoge un pickup | "¡Recursos obtenidos! Siguen reapareciendo en el mapa" | ✅ |
| Primer stack ganado | "¡Nivel 1! Sigues matando para subir" | ✅ |
| Primer power-up recogido | "¡Poder activado! Dura 10 segundos" | ✅ |

Los hints no se acumulan: si ya hay uno visible, el siguiente se descarta.

---

## Implementación técnica

### Archivos nuevos

```
frontend/src/app/
├── shared/
│   └── components/
│       └── tutorial-modal.component.ts     ← Modal de 4 cards (standalone)
└── core/
    └── services/
        └── tutorial.service.ts             ← Estado del tutorial + localStorage
```

### Archivos modificados

```
frontend/src/app/lobby/lobby.component.ts   ← Montar el modal si es primera vez
frontend/src/app/game/scenes/GameScene.ts   ← Disparar hints contextuales
```

---

### `TutorialService`

```typescript
@Injectable({ providedIn: 'root' })
export class TutorialService {
  private readonly TUTORIAL_KEY    = 'ast_tutorial_done';
  private readonly HINTS_KEY       = 'ast_ingame_hints_done';
  private readonly SHOWN_HINTS_KEY = 'ast_hints_shown';

  shouldShowTutorial(): boolean {
    return localStorage.getItem(this.TUTORIAL_KEY) === null;
  }

  markTutorialDone(): void {
    localStorage.setItem(this.TUTORIAL_KEY, '1');
  }

  shouldShowIngameHints(): boolean {
    return localStorage.getItem(this.HINTS_KEY) === null;
  }

  markIngameHintsDone(): void {
    localStorage.setItem(this.HINTS_KEY, '1');
  }

  // Evita mostrar el mismo hint dos veces en la misma sesión
  wasHintShown(hintKey: string): boolean {
    const shown = JSON.parse(localStorage.getItem(this.SHOWN_HINTS_KEY) ?? '[]') as string[];
    return shown.includes(hintKey);
  }

  markHintShown(hintKey: string): void {
    const shown = JSON.parse(localStorage.getItem(this.SHOWN_HINTS_KEY) ?? '[]') as string[];
    if (!shown.includes(hintKey)) {
      shown.push(hintKey);
      localStorage.setItem(this.SHOWN_HINTS_KEY, JSON.stringify(shown));
    }
  }
}
```

---

### `TutorialModalComponent`

```typescript
@Component({
  selector: 'app-tutorial-modal',
  standalone: true,
  template: `
    @if (visible()) {
      <div class="tutorial-overlay" (click)="onOverlayClick($event)">
        <div class="tutorial-card">
          <button class="close-btn" (click)="dismiss()">✕</button>
          <div class="card-indicator">
            @for (i of [0,1,2,3]; track i) {
              <span class="dot" [class.active]="i === currentCard()"></span>
            }
          </div>
          <!-- contenido por card según currentCard() -->
          <div class="card-content">
            <div class="card-icon">{{ cards[currentCard()].icon }}</div>
            <h2>{{ cards[currentCard()].title }}</h2>
            <p>{{ isMobile ? cards[currentCard()].textMobile : cards[currentCard()].textPC }}</p>
          </div>
          <div class="card-actions">
            @if (currentCard() < 3) {
              <button class="skip-btn" (click)="dismiss()">Saltar todo</button>
              <button class="next-btn" (click)="nextCard()">Siguiente →</button>
            } @else {
              <button class="play-btn" (click)="dismiss()">¡Entendido, a jugar!</button>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class TutorialModalComponent {
  // ...
  @Output() closed = new EventEmitter<void>();
  currentCard = signal(0);
  visible = signal(true);
  isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);

  nextCard() { this.currentCard.update(n => Math.min(n + 1, 3)); }

  dismiss() {
    this.visible.set(false);
    this.closed.emit();
    inject(TutorialService).markTutorialDone();
  }

  onOverlayClick(e: Event) {
    if ((e.target as HTMLElement).classList.contains('tutorial-overlay')) {
      this.dismiss();
    }
  }
}
```

---

### Integración en `LobbyComponent`

```typescript
// En template:
@if (showTutorial()) {
  <app-tutorial-modal (closed)="showTutorial.set(false)" />
}

// En ngOnInit:
showTutorial = signal(this.tutorialService.shouldShowTutorial());
```

El modal se muestra inmediatamente al llegar al lobby si es la primera vez. No bloquea la búsqueda de partida — si el jugador presiona "Buscar partida" sin cerrar el modal, el modal se cierra automáticamente.

---

### Hints en `GameScene`

```typescript
// Inyectar al crear la escena (via Phaser Registry):
private hints: { key: string; text: string }[] = [];
private hintText: Phaser.GameObjects.Text | null = null;
private hintVisible = false;
private hintsEnabled = false;

// En create():
this.hintsEnabled = this.registry.get('hintsEnabled') as boolean ?? false;

// Método privado:
private showHint(key: string, text: string): void {
  if (!this.hintsEnabled) return;
  if (this.hintVisible) return; // no apilar hints
  // check TutorialService.wasHintShown via registry
  if (this.registry.get('hintShown_' + key)) return;
  this.registry.set('hintShown_' + key, true);

  this.hintText?.destroy();
  this.hintText = this.add.text(
    this.cameras.main.width / 2,
    this.cameras.main.height - 80,
    text,
    { fontSize: '14px', color: '#ffffff', backgroundColor: '#00000099', padding: { x: 12, y: 6 } }
  ).setScrollFactor(0).setOrigin(0.5).setDepth(100).setAlpha(0);

  this.hintVisible = true;
  this.tweens.add({
    targets: this.hintText,
    alpha: 1, duration: 300,
    onComplete: () => {
      this.time.delayedCall(4000, () => {
        this.tweens.add({
          targets: this.hintText,
          alpha: 0, duration: 500,
          onComplete: () => { this.hintVisible = false; }
        });
      });
    }
  });
}

// Llamadas en applyGameState():
// Cuando ammo baja a 0 por primera vez:
if (me.ammo === 0 && this.localAmmo > 0) {
  this.showHint('no_ammo', '¡Sin balas! Busca los packs dorados en el mapa');
}
// Al ganar el primer stack:
if (me.stacks === 1 && this.localStacks === 0) {
  this.showHint('first_stack', '¡Nivel 1! Sigue eliminando rivales para subir');
}
// etc.
```

**El `hintsEnabled` se pasa desde `GameComponent` via `Phaser.Registry`** al crear la instancia, leyendo `TutorialService.shouldShowIngameHints()`.

---

## Consideraciones de estilo

- El modal usa el mismo design system del lobby (glass morphism, blur, colores del tema)
- En móvil: el modal ocupa el 90% del ancho y es fácilmente tappeable
- Los hints en partida: fondo negro semitransparente, texto blanco, esquinas redondeadas — igual al diseño del HUD
- Sin emojis en el código fuente, solo en el texto del contenido visible

---

## Criterio de done

- Un jugador nuevo llega al lobby → ve el modal de 4 cards
- Puede cerrarlo con X, "Saltar todo" o "¡A jugar!"
- Al volver al lobby (misma sesión o sesión nueva): el modal NO vuelve a aparecer
- Durante su primera partida: ve hints relevantes según lo que hace
- Al salir de la partida: los hints no vuelven a aparecer

---

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `frontend/src/app/shared/components/tutorial-modal.component.ts` | Nuevo |
| `frontend/src/app/core/services/tutorial.service.ts` | Nuevo |
| `frontend/src/app/lobby/lobby.component.ts` | Agregar `<app-tutorial-modal>` + signal `showTutorial` |
| `frontend/src/app/game/scenes/GameScene.ts` | Agregar `showHint()` + llamadas en `applyGameState()` |
| `frontend/src/app/game/game.component.ts` | Pasar `hintsEnabled` via Phaser Registry |
