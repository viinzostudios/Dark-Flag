import { Component, OnInit, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MobileFullscreenService } from '../../core/services/mobile-fullscreen.service';

@Component({
  selector: 'app-mobile-install-prompt',
  standalone: true,
  imports: [TranslateModule],
  template: `
    @if (svc.showModal()) {
      <div class="install-overlay">
        <div class="install-card">
          <div class="install-icon">🎮</div>
          <h2 class="install-title">Dark Flag</h2>
          <p class="install-desc">{{ 'install.desc' | translate }}</p>

          @if (svc.canInstall()) {
            <button class="btn-install" (click)="svc.onInstall()">
              {{ 'install.btn_install' | translate }}
            </button>
          }

          <button class="btn-continue" (click)="svc.onContinue()">
            {{ svc.canInstall() ? ('install.btn_continue_install' | translate) : ('install.btn_play' | translate) }}
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    .install-overlay {
      position: fixed;
      inset: 0;
      background: rgba(7, 7, 26, 0.97);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Inter', system-ui, sans-serif;
    }

    .install-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 18px;
      padding: 40px 32px;
      text-align: center;
      max-width: 320px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(0, 232, 122, 0.2);
      border-radius: 20px;
      backdrop-filter: blur(12px);
    }

    .install-icon {
      font-size: 60px;
    }

    .install-title {
      font-size: 22px;
      font-weight: 900;
      color: #ffffff;
      letter-spacing: 1px;
      margin: 0;
      text-transform: uppercase;
    }

    .install-desc {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.55);
      line-height: 1.6;
      margin: 0;
    }

    .btn-install {
      width: 100%;
      padding: 14px 24px;
      background: #00e87a;
      color: #07071a;
      border: none;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 800;
      cursor: pointer;
      letter-spacing: 0.5px;
      transition: opacity 0.2s;

      &:active { opacity: 0.8; }
    }

    .btn-continue {
      width: 100%;
      padding: 12px 24px;
      background: transparent;
      color: rgba(255, 255, 255, 0.45);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: color 0.2s, border-color 0.2s;

      &:active {
        color: rgba(255, 255, 255, 0.7);
        border-color: rgba(255, 255, 255, 0.3);
      }
    }
  `],
})
export class MobileInstallPromptComponent implements OnInit {
  readonly svc = inject(MobileFullscreenService);

  ngOnInit(): void {
    this.svc.init();
  }
}
