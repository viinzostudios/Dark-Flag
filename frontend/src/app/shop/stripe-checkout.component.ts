import {
  Component, Input, Output, EventEmitter,
  OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit,
  signal,
} from '@angular/core';
import { loadStripe, Stripe, StripeElements, StripePaymentElement } from '@stripe/stripe-js';
import { environment } from '../../environments/environment';
import type { CoinPackage } from '../core/services/skins.service';

@Component({
  selector: 'app-stripe-checkout',
  standalone: true,
  template: `
    <div class="overlay" (click)="onOverlayClick($event)">
      <div class="modal">
        <button class="close-btn" (click)="cancel.emit()">✕</button>

        <div class="modal-header">
          <span class="modal-icon">💎</span>
          <div>
            <div class="modal-title">{{ pkg.label }}</div>
            <div class="modal-price">\${{ (pkg.amountCents / 100).toFixed(2) }} USD</div>
          </div>
        </div>

        @if (loadError()) {
          <div class="error-msg">
            {{ loadError() }}
          </div>
          <button class="btn-cancel" (click)="cancel.emit()">Cerrar</button>
        } @else if (!ready()) {
          <div class="loading-wrap">
            <div class="spinner"></div>
            <span>Cargando formulario seguro…</span>
          </div>
        } @else {
          <!-- Stripe injects Payment Element here -->
          <div #paymentEl id="payment-element" class="payment-element"></div>

          @if (payError()) {
            <div class="error-msg">{{ payError() }}</div>
          }

          <button class="btn-pay" (click)="confirmPayment()" [disabled]="processing()">
            @if (processing()) {
              <span class="spinner-sm"></span> Procesando…
            } @else {
              🔒 Pagar \${{ (pkg.amountCents / 100).toFixed(2) }}
            }
          </button>
          <p class="secure-note">Pago seguro procesado por Stripe. Tus datos nunca tocan nuestros servidores.</p>
        }
      </div>
    </div>
  `,
  styles: [`
    .overlay {
      position: fixed; inset: 0; z-index: 1000;
      background: rgba(0,0,0,0.72);
      display: flex; align-items: center; justify-content: center;
      backdrop-filter: blur(4px);
    }
    .modal {
      background: var(--t-bg2, #12121f);
      border: 1px solid var(--t-bd);
      border-radius: 16px;
      padding: 28px;
      width: 100%; max-width: 440px;
      position: relative;
      display: flex; flex-direction: column; gap: 20px;
    }
    .close-btn {
      position: absolute; top: 14px; right: 16px;
      background: transparent; border: none; color: var(--t-muted);
      font-size: 18px; cursor: pointer; line-height: 1;
    }
    .close-btn:hover { color: var(--t-tx); }

    .modal-header {
      display: flex; align-items: center; gap: 14px;
    }
    .modal-icon { font-size: 32px; }
    .modal-title { font-size: 18px; font-weight: 800; color: var(--t-tx); font-family: 'Inter', system-ui; }
    .modal-price { font-size: 14px; color: #ab47bc; font-weight: 600; font-family: 'Inter', system-ui; }

    .loading-wrap {
      display: flex; flex-direction: column; align-items: center; gap: 12px;
      padding: 24px 0; color: var(--t-tx4); font-family: 'Inter', system-ui; font-size: 14px;
    }
    .spinner {
      width: 28px; height: 28px;
      border: 3px solid var(--t-bd2);
      border-top-color: var(--t-accent);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    .spinner-sm {
      display: inline-block;
      width: 14px; height: 14px;
      border: 2px solid var(--t-bd2);
      border-top-color: var(--t-on-accent);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      vertical-align: middle; margin-right: 6px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .payment-element { min-height: 120px; }

    .error-msg {
      background: rgba(244,67,54,0.1);
      border: 1px solid rgba(244,67,54,0.3);
      border-radius: 8px; padding: 10px 14px;
      color: #ef5350; font-size: 13px; font-family: 'Inter', system-ui;
    }

    .btn-pay {
      width: 100%; padding: 14px;
      background: linear-gradient(135deg, var(--t-accent-dk), var(--t-accent));
      border: none; border-radius: 10px;
      color: var(--t-on-accent); font-weight: 800; font-size: 15px;
      cursor: pointer; font-family: 'Inter', system-ui;
      display: flex; align-items: center; justify-content: center; gap: 6px;
      transition: opacity 0.15s, transform 0.1s;
    }
    .btn-pay:not(:disabled):hover { transform: scale(1.01); }
    .btn-pay:disabled { opacity: 0.6; cursor: not-allowed; }

    .btn-cancel {
      width: 100%; padding: 10px;
      background: var(--t-ghost-bg); border: 1px solid var(--t-ghost-bd);
      border-radius: 8px; color: var(--t-ghost-tx); cursor: pointer;
      font-family: 'Inter', system-ui; font-size: 13px;
    }

    .secure-note {
      font-size: 11px; color: var(--t-muted); text-align: center;
      margin: 0; font-family: 'Inter', system-ui; line-height: 1.5;
    }
  `],
})
export class StripeCheckoutComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input({ required: true }) pkg!: CoinPackage;
  @Input({ required: true }) clientSecret!: string;
  @Output() readonly cancel = new EventEmitter<void>();
  @Output() readonly success = new EventEmitter<void>();

  @ViewChild('paymentEl') paymentElRef!: ElementRef<HTMLDivElement>;

  readonly ready      = signal(false);
  readonly processing = signal(false);
  readonly loadError  = signal('');
  readonly payError   = signal('');

  private stripe: Stripe | null = null;
  private elements: StripeElements | null = null;
  private paymentElement: StripePaymentElement | null = null;

  async ngOnInit(): Promise<void> {
    try {
      this.stripe = await loadStripe(environment.stripePublishableKey);
      if (!this.stripe) {
        this.loadError.set('No se pudo cargar Stripe. Verifica tu conexión.');
      }
    } catch {
      this.loadError.set('Error al inicializar el sistema de pago.');
    }
  }

  async ngAfterViewInit(): Promise<void> {
    if (!this.stripe || this.loadError()) return;

    this.elements = this.stripe.elements({
      clientSecret: this.clientSecret,
      appearance: {
        theme: 'night',
        variables: {
          colorPrimary: '#00e87a',
          colorBackground: '#12121f',
          colorText: '#ffffff',
          colorDanger: '#ef5350',
          borderRadius: '8px',
        },
      },
    });

    this.paymentElement = this.elements.create('payment');
    this.paymentElement.on('ready', () => this.ready.set(true));
    this.paymentElement.mount(this.paymentElRef.nativeElement);
  }

  ngOnDestroy(): void {
    this.paymentElement?.destroy();
  }

  async confirmPayment(): Promise<void> {
    if (!this.stripe || !this.elements || this.processing()) return;
    this.processing.set(true);
    this.payError.set('');

    const { error } = await this.stripe.confirmPayment({
      elements: this.elements,
      confirmParams: {
        return_url: `${window.location.origin}/shop?payment=success`,
      },
      redirect: 'if_required',
    });

    if (error) {
      this.payError.set(error.message ?? 'Error al procesar el pago.');
      this.processing.set(false);
    } else {
      this.success.emit();
    }
  }

  onOverlayClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('overlay')) {
      this.cancel.emit();
    }
  }
}
