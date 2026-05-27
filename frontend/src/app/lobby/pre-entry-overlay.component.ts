import {
  Component, Input, Output, EventEmitter, OnInit, OnDestroy, signal, computed,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { AdsService } from '../core/services/ads.service';

type Bonus = 'ammo' | 'walls';

@Component({
  selector: 'app-pre-entry-overlay',
  standalone: true,
  imports: [TranslateModule],
  template: `
    <div class="overlay">
      <div class="card">
        <button class="close-btn" [disabled]="!!watching()" (click)="cancel()" title="Cancelar búsqueda">✕</button>
        <div class="badge">{{ 'pre_entry.room_found' | translate }}</div>
        <h3 class="sub">{{ 'pre_entry.choose_bonus' | translate }}</h3>

        <div class="options">
          <button
            class="opt-btn"
            [class.watching]="watching() === 'ammo'"
            [disabled]="!!watching() || !canShowAd || chosen()"
            (click)="watch('ammo')"
          >
            <span class="opt-icon"><img src="/assets/ui/icon-claqueta.png" class="claq-icon" alt=""></span>
            <span class="opt-text">
              <strong>{{ 'pre_entry.full_ammo' | translate }}</strong>
              <small>{{ 'pre_entry.watch_ad' | translate : { remaining: remaining(), max: MAX_PER_DAY } }}</small>
            </span>
          </button>

          <button
            class="opt-btn"
            [class.watching]="watching() === 'walls'"
            [disabled]="!!watching() || !canShowAd || chosen()"
            (click)="watch('walls')"
          >
            <span class="opt-icon"><img src="/assets/ui/icon-claqueta.png" class="claq-icon" alt=""></span>
            <span class="opt-text">
              <strong>{{ 'pre_entry.full_walls' | translate }}</strong>
              <small>{{ 'pre_entry.watch_ad' | translate : { remaining: remaining(), max: MAX_PER_DAY } }}</small>
            </span>
          </button>
        </div>

        <button class="skip-btn" [disabled]="!!watching()" (click)="enter(undefined)">
          {{ chosen() ? ('pre_entry.entering' | translate) : ('pre_entry.enter_no_bonus' | translate) }}
        </button>

        <div class="room-code-row">
          <span class="room-code-label">{{ 'pre_entry.room_code' | translate }}</span>
          <span class="room-code">{{ shortCode() }}</span>
          <button class="copy-btn" (click)="copyLink()" [title]="'pre_entry.copy_link' | translate">
            {{ copied() ? '✓' : '🔗' }}
          </button>
        </div>

        <p class="hint">{{ 'pre_entry.auto_enter' | translate : { secs: autoSecs() } }}</p>
      </div>
    </div>
  `,
  styles: [`
    .overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.72);
      display: flex; align-items: center; justify-content: center;
      z-index: 50;
      font-family: 'Inter', system-ui, monospace;
    }
    .card {
      background: var(--t-surface2);
      border: 1px solid var(--t-accent-bd2);
      border-radius: 16px;
      padding: 32px 36px;
      width: min(420px, 90vw);
      backdrop-filter: blur(20px);
      display: flex; flex-direction: column; gap: 20px;
      text-align: center;
      position: relative;
    }
    .close-btn {
      position: absolute;
      top: 12px; right: 14px;
      background: transparent;
      border: none;
      color: var(--t-tx4);
      font-size: 18px;
      cursor: pointer;
      line-height: 1;
      padding: 4px 6px;
      border-radius: 4px;
      transition: color 0.15s, background 0.15s;
      touch-action: manipulation;
    }
    .close-btn:hover:not(:disabled) { color: var(--t-tx); background: var(--t-hover); }
    .close-btn:disabled { opacity: 0.3; cursor: not-allowed; }
    .badge {
      color: var(--t-accent); font-size: 18px; font-weight: 700; letter-spacing: 1px;
    }
    .sub { color: var(--t-tx4); font-size: 13px; margin: 0; font-weight: 400; }
    .options { display: flex; flex-direction: column; gap: 10px; }
    .opt-btn {
      display: flex; align-items: center; gap: 14px;
      padding: 14px 18px;
      background: var(--t-opt-bg);
      border: 1px solid var(--t-opt-bd);
      border-radius: 10px;
      color: var(--t-opt-tx);
      font-size: 14px;
      cursor: pointer;
      transition: background 0.15s, transform 0.1s;
      font-family: inherit;
      text-align: left;
      touch-action: manipulation;
    }
    .opt-btn:not(:disabled):hover { background: var(--t-hover); transform: translateY(-1px); }
    .opt-btn:disabled { opacity: 0.35; cursor: not-allowed; }
    .opt-btn.watching { background: var(--t-hover); animation: pulse 1.2s infinite; }
    .opt-icon { font-size: 20px; flex-shrink: 0; display: flex; align-items: center; }
    .claq-icon { width: 26px; height: 26px; object-fit: contain; display: block; }
    .opt-text { display: flex; flex-direction: column; gap: 2px; }
    .opt-text strong { color: var(--t-tx); font-size: 15px; }
    .opt-text small { color: var(--t-tx4); font-size: 11px; }
    .skip-btn {
      background: #e67e22;
      border: none;
      border-radius: 8px;
      color: #fff;
      padding: 11px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
      transition: opacity 0.15s, transform 0.1s;
      touch-action: manipulation;
    }
    .skip-btn:not(:disabled):hover { opacity: 0.85; transform: translateY(-1px); }
    .skip-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .room-code-row {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      background: var(--t-surface); border: 1px solid var(--t-bd2);
      border-radius: 8px; padding: 8px 12px;
    }
    .room-code-label { color: var(--t-tx4); font-size: 11px; }
    .room-code { color: var(--t-accent); font-family: monospace; font-size: 13px; font-weight: 700; letter-spacing: 2px; }
    .copy-btn {
      background: transparent; border: none; cursor: pointer;
      font-size: 15px; padding: 2px 6px; border-radius: 4px;
      transition: background 0.15s;
    }
    .copy-btn:hover { background: var(--t-hover); }
    .hint { color: var(--t-muted); font-size: 11px; margin: 0; }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }

    /* Landscape móvil */
    @media (max-height: 500px) and (orientation: landscape) {
      .card { padding: 16px 20px; gap: 12px; width: min(480px, 92vw); }
      .badge { font-size: 15px; }
      .sub { font-size: 11px; }
      .opt-btn { padding: 8px 14px; font-size: 12px; }
      .opt-icon { font-size: 16px; }
      .claq-icon { width: 20px; height: 20px; }
      .opt-text strong { font-size: 13px; }
      .opt-text small { font-size: 10px; }
      .skip-btn { padding: 8px; font-size: 12px; }
    }
  `],
})
export class PreEntryOverlayComponent implements OnInit, OnDestroy {
  @Input() roomId = '';
  @Output() onEnter  = new EventEmitter<Bonus | undefined>();
  @Output() onCancel = new EventEmitter<void>();

  readonly MAX_PER_DAY = 10;
  readonly AUTO_TIMEOUT_S = 15;

  canShowAd = false;
  remaining = signal(0);
  watching  = signal<Bonus | null>(null);
  chosen    = signal(false);
  autoSecs  = signal(this.AUTO_TIMEOUT_S);
  copied    = signal(false);

  shortCode(): string {
    // Toma los últimos 6 chars del roomId para un código legible
    return this.roomId ? this.roomId.slice(-6).toUpperCase() : '';
  }

  copyLink(): void {
    const url = `${window.location.origin}/lobby?room=${this.roomId}`;
    navigator.clipboard.writeText(url).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  private timerId: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly ads: AdsService) {}

  ngOnInit(): void {
    this.canShowAd = this.ads.canShowRewardedAd();
    this.updateRemaining();
    this.startAutoTimer();
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  watch(bonus: Bonus): void {
    if (this.watching() || !this.canShowAd || this.chosen()) return;
    this.watching.set(bonus);
    this.clearTimer();

    const handler = bonus === 'ammo'
      ? (cb: () => void) => this.ads.showAmmoRewardedAd(cb)
      : (cb: () => void) => this.ads.showWallsRewardedAd(cb);

    handler(() => {
      this.watching.set(null);
      this.updateRemaining();
      this.enter(bonus);
    });
  }

  enter(bonus: Bonus | undefined): void {
    if (this.chosen()) return;
    this.chosen.set(true);
    this.clearTimer();
    this.onEnter.emit(bonus);
  }

  cancel(): void {
    if (this.watching()) return;
    this.clearTimer();
    this.onCancel.emit();
  }

  private startAutoTimer(): void {
    let secs = this.AUTO_TIMEOUT_S;
    this.timerId = setInterval(() => {
      if (this.watching()) return;
      secs--;
      this.autoSecs.set(secs);
      if (secs <= 0) { this.enter(undefined); }
    }, 1000);
  }

  private clearTimer(): void {
    if (this.timerId !== null) { clearInterval(this.timerId); this.timerId = null; }
  }

  private updateRemaining(): void {
    const key = `ast_rewarded_${new Date().toISOString().slice(0, 10)}`;
    const used = parseInt(localStorage.getItem(key) ?? '0', 10);
    this.remaining.set(this.MAX_PER_DAY - used);
  }
}
