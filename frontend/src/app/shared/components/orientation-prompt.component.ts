import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

/**
 * Muestra un overlay pidiendo al usuario que gire el dispositivo a landscape.
 * Solo visible cuando:
 *   1. Es un dispositivo táctil (móvil / tablet)
 *   2. La orientación actual es portrait
 *
 * Se oculta automáticamente al girar a landscape.
 * No afecta escritorio ni tablets en landscape.
 */
@Component({
  selector: 'app-orientation-prompt',
  standalone: true,
  imports: [TranslateModule],
  template: `
    @if (showPrompt()) {
      <div class="orient-overlay">
        <div class="orient-card">
          <div class="orient-icon">📱</div>
          <div class="orient-arrow">↻</div>
          <p class="orient-title">{{ 'orientation.title' | translate }}</p>
          <p class="orient-desc">{{ 'orientation.desc' | translate }}</p>
        </div>
      </div>
    }
  `,
  styles: [`
    .orient-overlay {
      position: fixed;
      inset: 0;
      background: rgba(7, 7, 26, 0.96);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Inter', system-ui, sans-serif;
    }

    .orient-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 40px 32px;
      text-align: center;
      max-width: 280px;
    }

    .orient-icon {
      font-size: 56px;
      animation: tiltPhone 2s ease-in-out infinite;
    }

    @keyframes tiltPhone {
      0%   { transform: rotate(0deg); }
      40%  { transform: rotate(0deg); }
      60%  { transform: rotate(90deg); }
      100% { transform: rotate(90deg); }
    }

    .orient-arrow {
      font-size: 32px;
      color: #00e87a;
      animation: spin 1.8s ease-in-out infinite;
      opacity: 0.85;
    }

    @keyframes spin {
      0%,40%  { transform: rotate(0deg); opacity: 0.4; }
      60%,100% { transform: rotate(180deg); opacity: 1; }
    }

    .orient-title {
      font-size: 20px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: 1px;
      margin: 0;
    }

    .orient-desc {
      font-size: 13px;
      color: rgba(255,255,255,0.55);
      line-height: 1.6;
      margin: 0;
    }
  `],
})
export class OrientationPromptComponent implements OnInit, OnDestroy {
  readonly showPrompt = signal(false);

  private mq: MediaQueryList | null = null;
  private readonly onMqChange = (e: MediaQueryListEvent) => this.evaluate(e.matches);

  ngOnInit(): void {
    if (!this.isTouchDevice()) return;

    this.mq = window.matchMedia('(orientation: portrait)');
    this.evaluate(this.mq.matches);
    this.mq.addEventListener('change', this.onMqChange);
  }

  ngOnDestroy(): void {
    this.mq?.removeEventListener('change', this.onMqChange);
  }

  private evaluate(isPortrait: boolean): void {
    this.showPrompt.set(isPortrait);
  }

  private isTouchDevice(): boolean {
    return /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
}
