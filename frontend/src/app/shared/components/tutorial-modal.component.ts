import {
  Component, Output, EventEmitter, signal, computed,
} from '@angular/core';

interface TutorialCard {
  icon: string;
  title: string;
  body: string;
  hint?: string;
  color: string;
}

const CARDS: TutorialCard[] = [
  {
    icon: '🖱️',
    title: 'Muévete con el cursor',
    body: 'Tu personaje se mueve hacia donde está el cursor. Cuanto más lejos del centro, más rápido corres.',
    hint: 'PC: mouse  |  Móvil: joystick izquierdo',
    color: '#3b82f6',
  },
  {
    icon: '🔦',
    title: 'Busca la bandera con la linterna',
    body: 'El mapa está oscuro. Tu linterna ilumina el área frente a ti. Explora hasta encontrar la bandera.',
    hint: 'Pulsa L o el botón 🔦 para apagar/encender la linterna',
    color: '#f59e0b',
  },
  {
    icon: '🏴',
    title: 'Lleva la bandera al destino',
    body: 'Toma la bandera y corre al punto de entrega antes de que te atrapen. ¡Cuidado con las trampas!',
    hint: 'Al llevar la bandera no puedes usar la maza',
    color: '#10b981',
  },
  {
    icon: '🔨',
    title: 'Maza a tus rivales',
    body: 'Aturde a rivales cercanos con la maza para bajarles el nivel. Si llevan la bandera, la soltarán.',
    hint: 'PC: E o clic  |  Móvil: botón ⚡',
    color: '#ef4444',
  },
];

@Component({
  selector: 'app-tutorial-modal',
  standalone: true,
  template: `
    <div class="backdrop" (click)="onBackdropClick()">
      <div class="modal" (click)="$event.stopPropagation()">

        <div class="header">
          <span class="logo">Dark Flag</span>
          <span class="step-dots">
            @for (c of cards; track $index) {
              <span class="dot" [class.active]="$index === current()"></span>
            }
          </span>
        </div>

        <div class="card-area">
          @let card = activeCard();
          <div class="card" [style.borderTopColor]="card.color">
            <div class="card-icon">{{ card.icon }}</div>
            <h3 class="card-title">{{ card.title }}</h3>
            <p class="card-body">{{ card.body }}</p>
            @if (card.hint) {
              <p class="card-hint">{{ card.hint }}</p>
            }
          </div>
        </div>

        <div class="footer">
          <button class="btn-skip" (click)="close()">Omitir</button>
          <div class="nav-btns">
            @if (current() > 0) {
              <button class="btn-prev" (click)="prev()">‹ Atrás</button>
            }
            @if (isLast()) {
              <button class="btn-play" (click)="close()">¡Jugar!</button>
            } @else {
              <button class="btn-next" (click)="next()">Siguiente ›</button>
            }
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .backdrop {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.82);
      backdrop-filter: blur(5px);
      display: flex; align-items: center; justify-content: center;
      z-index: 200;
    }

    .modal {
      background: rgba(8,13,24,.92);
      border: 1px solid rgba(245,158,11,.08);
      border-top: 2px solid rgba(245,158,11,.22);
      border-radius: 8px;
      width: min(420px, 92vw);
      padding: 24px 24px 20px;
      display: flex; flex-direction: column; gap: 20px;
      font-family: 'Inter', system-ui, sans-serif;
      box-shadow: 0 8px 40px rgba(0,0,0,.70);
      backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
    }

    .header {
      display: flex; align-items: center; justify-content: space-between;
    }
    .logo {
      font-size: 15px; font-weight: 800;
      letter-spacing: 3px; color: #f59e0b;
      text-transform: uppercase;
      font-family: 'Barlow Condensed', sans-serif;
    }
    .step-dots { display: flex; gap: 6px; }
    .dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: rgba(245,158,11,0.25);
      transition: background 0.2s;
    }
    .dot.active { background: #f59e0b; }

    .card-area { min-height: 200px; }
    .card {
      background: rgba(8,13,24,.80);
      border: 1px solid rgba(245,158,11,.08);
      border-top: 3px solid;
      border-radius: 6px;
      padding: 22px 20px;
      display: flex; flex-direction: column; gap: 10px;
    }
    .card-icon { font-size: 36px; line-height: 1; }
    .card-title {
      color: var(--t-tx, #f0f9ff); font-size: 17px; font-weight: 700; margin: 0;
    }
    .card-body {
      color: rgba(240,249,255,0.72); font-size: 14px; line-height: 1.55; margin: 0;
    }
    .card-hint {
      color: rgba(240,249,255,0.40);
      font-size: 12px; font-style: italic; margin: 4px 0 0;
    }

    .footer {
      display: flex; align-items: center; justify-content: space-between;
    }
    .nav-btns { display: flex; gap: 8px; }

    button {
      border: none; cursor: pointer;
      border-radius: 4px; font-family: inherit;
      font-weight: 600; transition: opacity 0.15s;
    }
    button:hover { opacity: 0.85; }

    .btn-skip {
      background: transparent; color: rgba(240,249,255,0.40);
      font-size: 13px; padding: 8px 10px;
    }
    .btn-skip:hover { color: rgba(240,249,255,0.70); opacity: 1; }

    .btn-prev {
      background: rgba(245,158,11,.06); color: #f59e0b;
      border: 1px solid rgba(245,158,11,.22) !important;
      font-size: 13px; padding: 9px 16px;
    }
    .btn-next {
      background: linear-gradient(135deg, #d97706, #f59e0b); color: #060912;
      font-size: 14px; padding: 9px 18px;
      font-family: 'Barlow Condensed', sans-serif;
      letter-spacing: 2px; text-transform: uppercase;
    }
    .btn-play {
      background: linear-gradient(135deg, #d97706, #f59e0b); color: #060912;
      font-size: 14px; padding: 9px 22px;
      font-family: 'Barlow Condensed', sans-serif;
      letter-spacing: 2px; text-transform: uppercase;
    }
  `],
})
export class TutorialModalComponent {
  @Output() closed = new EventEmitter<void>();

  readonly cards = CARDS;
  readonly current = signal(0);
  readonly activeCard = computed(() => CARDS[this.current()]);
  readonly isLast = computed(() => this.current() === CARDS.length - 1);

  next(): void {
    if (!this.isLast()) this.current.update(c => c + 1);
  }

  prev(): void {
    if (this.current() > 0) this.current.update(c => c - 1);
  }

  close(): void {
    this.closed.emit();
  }

  onBackdropClick(): void {
    // Only close on backdrop click after the last card to avoid accidental dismissal
    if (this.isLast()) this.close();
  }
}
