import { Component, Input, Output, EventEmitter } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-register-prompt',
  standalone: true,
  imports: [TranslateModule],
  template: `
    <div class="rp-backdrop" (click)="cancel.emit()">
      <div class="rp-modal" (click)="$event.stopPropagation()">
        <div class="rp-icon">🔒</div>
        <h2 class="rp-title">{{ 'register_prompt.title' | translate }}</h2>
        <p class="rp-desc">
          {{ 'register_prompt.desc' | translate : { feature: featureName } }}
        </p>
        <div class="rp-perks">
          <span class="rp-perk">{{ 'register_prompt.perk_coins' | translate }}</span>
          <span class="rp-perk">{{ 'register_prompt.perk_skins' | translate }}</span>
          <span class="rp-perk">{{ 'register_prompt.perk_ranking' | translate }}</span>
          <span class="rp-perk">{{ 'register_prompt.perk_stats' | translate }}</span>
        </div>
        <div class="rp-actions">
          <button class="rp-btn rp-btn-primary" (click)="accept.emit()">
            {{ 'register_prompt.accept' | translate }}
          </button>
          <button class="rp-btn rp-btn-secondary" (click)="cancel.emit()">
            {{ 'register_prompt.cancel' | translate }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .rp-backdrop {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.75);
      backdrop-filter: blur(4px);
      z-index: 200;
      display: flex; align-items: center; justify-content: center;
      padding: 16px;
    }
    .rp-modal {
      background: var(--t-panel);
      border: 1px solid var(--t-accent-bd);
      border-radius: 8px;
      padding: 32px 28px;
      max-width: 400px;
      width: 100%;
      display: flex; flex-direction: column; align-items: center;
      gap: 16px;
      box-shadow: 0 8px 40px rgba(0,0,0,.70), 0 0 40px var(--t-accent-glow);
      text-align: center;
    }
    .rp-icon { font-size: 36px; }
    .rp-title {
      font-size: 20px; font-weight: 800;
      color: var(--t-accent); margin: 0;
      letter-spacing: 3px; text-transform: uppercase;
      font-family: 'Barlow Condensed', sans-serif;
    }
    .rp-desc {
      font-size: 13px; color: var(--t-muted);
      line-height: 1.6; margin: 0;
    }
    .rp-perks {
      display: flex; flex-direction: column; gap: 6px;
      align-self: stretch;
      background: var(--t-accent-bg);
      border: 1px solid var(--t-accent-bd);
      border-radius: 6px;
      padding: 14px 16px;
    }
    .rp-perk {
      font-size: 12px; color: var(--t-tx4);
      text-align: left;
    }
    .rp-actions {
      display: flex; flex-direction: column; gap: 10px;
      align-self: stretch;
    }
    .rp-btn {
      padding: 12px 0;
      border-radius: 4px;
      font-size: 14px; font-weight: 700;
      cursor: pointer; font-family: inherit;
      border: none;
      transition: opacity 0.15s, transform 0.1s;
      width: 100%;
    }
    .rp-btn:hover { opacity: 0.88; transform: translateY(-1px); }
    .rp-btn-primary {
      background: linear-gradient(135deg, var(--t-accent-dk), var(--t-accent));
      color: var(--t-on-accent);
      box-shadow: 0 0 16px var(--t-accent-glow);
    }
    .rp-btn-secondary {
      background: transparent;
      border: 1px solid var(--t-accent-bd2) !important;
      color: var(--t-sub);
    }

    @media (max-width: 768px) {
      .rp-backdrop { padding: 12px; align-items: center; }
      .rp-modal {
        padding: 20px 16px;
        gap: 10px;
        max-height: 95dvh;
        overflow-y: auto;
      }
      .rp-icon { font-size: 24px; }
      .rp-title { font-size: 15px; }
      .rp-desc { font-size: 12px; line-height: 1.4; }
      .rp-perks { padding: 10px 12px; gap: 5px; }
      .rp-perk { font-size: 11px; }
      .rp-actions { gap: 8px; }
      .rp-btn { padding: 11px 0; font-size: 13px; }
    }
  `],
})
export class RegisterPromptComponent {
  @Input() featureName = '';
  @Output() accept = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}
