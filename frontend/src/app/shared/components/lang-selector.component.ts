import {
  Component, inject, signal, HostListener, Input,
} from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { LanguageService } from '../../core/services/language.service';
import { AuthService } from '../../core/services/auth.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-lang-selector',
  standalone: true,
  imports: [TranslateModule, UpperCasePipe],
  template: `
    <div class="lang-wrap" [class.open]="open()">
      <button class="lang-btn" (click)="toggle()" [title]="'lang_selector.label' | translate">
        <span class="globe">🌐</span>
        <span class="code">{{ currentCode() | uppercase }}</span>
        @if (mode !== 'modal') {
          <span class="caret">{{ open() ? '▲' : '▼' }}</span>
        }
      </button>

      <!-- Modo dropdown (desktop) -->
      @if (mode !== 'modal' && open()) {
        <div class="lang-dropdown">
          @for (lang of langs; track lang.code) {
            <button
              class="lang-item"
              [class.active]="lang.code === currentCode()"
              (click)="select(lang.code)"
            >
              <span class="lang-flag">{{ lang.flag }}</span>
              <span class="lang-name">{{ lang.nativeName }}</span>
              @if (lang.code === currentCode()) {
                <span class="lang-check">✓</span>
              }
            </button>
          }
        </div>
      }
    </div>

    <!-- Modo modal (mobile) -->
    @if (mode === 'modal' && open()) {
      <div class="lm-backdrop" (click)="open.set(false)">
        <div class="lm-panel" (click)="$event.stopPropagation()">
          <div class="lm-header">
            <span class="lm-title">{{ 'lang_selector.label' | translate }}</span>
            <button class="lm-close" (click)="open.set(false)">✕</button>
          </div>
          <div class="lm-grid">
            @for (lang of langs; track lang.code) {
              <button
                class="lm-item"
                [class.lm-active]="lang.code === currentCode()"
                (click)="select(lang.code)"
              >
                <span class="lm-flag">{{ lang.flag }}</span>
                <span class="lm-name">{{ lang.nativeName }}</span>
                @if (lang.code === currentCode()) {
                  <span class="lm-check">✓</span>
                }
              </button>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .lang-wrap {
      position: relative;
      display: inline-block;
    }
    .lang-btn {
      display: flex; align-items: center; gap: 4px;
      padding: 6px 10px;
      background: var(--t-ghost-bg);
      border: 1px solid var(--t-ghost-bd);
      border-radius: 8px;
      color: var(--t-ghost-tx);
      font-size: 12px; font-weight: 600;
      cursor: pointer; font-family: inherit;
      transition: background .15s, border-color .15s;
      white-space: nowrap;
    }
    .lang-btn:hover { background: var(--t-ghost-bg-h); }
    .globe { font-size: 13px; }
    .code  { letter-spacing: .05em; }
    .caret { font-size: 8px; opacity: .6; }

    /* ── Dropdown ── */
    .lang-dropdown {
      position: absolute;
      top: calc(100% + 6px);
      right: 0;
      z-index: 500;
      background: var(--t-panel);
      border: 1px solid var(--t-bd);
      border-radius: 12px;
      padding: 6px;
      min-width: 170px;
      box-shadow: 0 8px 32px rgba(0,0,0,.35);
      display: flex; flex-direction: column; gap: 2px;
    }
    .lang-item {
      display: flex; align-items: center; gap: 10px;
      width: 100%;
      padding: 8px 12px;
      background: transparent;
      border: none;
      border-radius: 8px;
      color: var(--t-tx4);
      font-size: 13px; font-weight: 500;
      cursor: pointer; font-family: inherit;
      text-align: left;
      transition: background .12s, color .12s;
    }
    .lang-item:hover { background: var(--t-hover); color: var(--t-tx); }
    .lang-item.active { color: var(--t-accent); font-weight: 700; }
    .lang-flag { font-size: 16px; }
    .lang-name { flex: 1; }
    .lang-check { color: var(--t-accent); font-size: 12px; }

    /* ── Modal ── */
    .lm-backdrop {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.72);
      backdrop-filter: blur(6px);
      z-index: 1000;
      display: flex; align-items: center; justify-content: center;
      padding: 16px;
    }
    .lm-panel {
      background: var(--t-bg2, #1e1e24);
      border: 1px solid var(--t-bd, rgba(255,255,255,.12));
      border-radius: 18px;
      width: min(340px, 96vw);
      box-shadow: 0 20px 60px rgba(0,0,0,.55);
      overflow: hidden;
    }
    .lm-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 18px 10px;
      border-bottom: 1px solid var(--t-bd, rgba(255,255,255,.1));
    }
    .lm-title {
      font-size: 14px; font-weight: 700;
      color: var(--t-tx, #fff);
      letter-spacing: .04em;
    }
    .lm-close {
      background: none; border: none;
      color: var(--t-dim, rgba(255,255,255,.4));
      font-size: 14px; cursor: pointer; padding: 4px 6px;
      border-radius: 6px;
      transition: color .12s, background .12s;
    }
    .lm-close:hover { color: var(--t-tx, #fff); background: var(--t-hover, rgba(255,255,255,.08)); }
    .lm-grid {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 4px; padding: 10px;
    }
    .lm-item {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 12px;
      background: transparent;
      border: 1px solid transparent;
      border-radius: 10px;
      color: var(--t-tx4, rgba(255,255,255,.6));
      font-size: 13px; font-weight: 500;
      cursor: pointer; font-family: inherit;
      text-align: left;
      transition: background .12s, color .12s, border-color .12s;
    }
    .lm-item:hover { background: var(--t-hover, rgba(255,255,255,.08)); color: var(--t-tx, #fff); }
    .lm-item.lm-active {
      background: var(--t-accent-dim, rgba(64,196,255,.12));
      border-color: var(--t-accent-bd, rgba(64,196,255,.3));
      color: var(--t-accent, #40c4ff);
      font-weight: 700;
    }
    .lm-flag { font-size: 18px; }
    .lm-name { flex: 1; }
    .lm-check { color: var(--t-accent, #40c4ff); font-size: 11px; }
  `],
})
export class LangSelectorComponent {
  /** Variant: 'nav' (landing/auth) | 'header' (lobby) */
  @Input() variant: 'nav' | 'header' = 'nav';
  /** Display: 'dropdown' (default) | 'modal' (mobile overlay) */
  @Input() mode: 'dropdown' | 'modal' = 'dropdown';

  private readonly langSvc = inject(LanguageService);
  private readonly auth    = inject(AuthService);

  readonly open        = signal(false);
  readonly currentCode = this.langSvc.currentLang;
  readonly langs       = this.langSvc.langs;

  toggle(): void { this.open.update(v => !v); }

  select(code: string): void {
    this.langSvc.setLang(code, this.auth.isLoggedIn);
    this.open.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    if (this.mode === 'modal') return; // el modal se cierra con el backdrop
    const target = e.target as HTMLElement;
    if (!target.closest('app-lang-selector')) this.open.set(false);
  }
}
