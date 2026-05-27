import {
  Component, Input, Output, EventEmitter,
  OnInit, OnDestroy, ChangeDetectionStrategy, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AdsService } from '../../core/services/ads.service';
import { SideAdComponent } from '../../shared/components/side-ad.component';

@Component({
  selector: 'app-death-overlay',
  standalone: true,
  imports: [CommonModule, RouterLink, SideAdComponent, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="overlay">
      <div class="overlay-side-col"><app-side-ad /></div>
      <div class="card" [class.card-anon]="isAnonymous">
        <h2 class="title">{{ 'death.eliminated' | translate }}</h2>
        @if (killerName) {
          <p class="killer-line">{{ 'death.by_killer' | translate }} <span class="killer-name">{{ killerName }}</span></p>
        }

        <div class="stats">
          <div class="stat">
            <span class="label">{{ 'death.points_this_life' | translate }}</span>
            <span class="value score">+{{ scoreGained }}</span>
          </div>
          <div class="stat">
            <span class="label">{{ 'death.position' | translate }}</span>
            <span class="value">
              {{ leaderboardRank > 0 ? '#' + leaderboardRank : '—' }}
            </span>
          </div>
        </div>

        <div class="countdown-wrap">
          <div class="countdown-bar">
            <div class="countdown-fill" [style.width.%]="countdownPct()"></div>
          </div>
          <span class="countdown-label">
            {{ watching() ? ('death.watching_ad' | translate) : ('death.auto_exit' | translate : { secs: countdownSecs() }) }}
          </span>
        </div>

        @if (isAnonymous) {
          <!-- Mobile 2-col layout: anon-cta left, actions right -->
          <div class="anon-split">
            <div class="anon-cta">
              <p class="cta-title">{{ 'death.save_progress' | translate }}</p>
              <p class="cta-desc">{{ 'death.register_cta' | translate }}</p>
              <a class="btn-register" routerLink="/auth/register">{{ 'death.register_btn' | translate }}</a>
            </div>
            <div class="actions">
              <button
                class="btn btn-ad"
                [disabled]="adUsed() || !canShowAd || watching()"
                (click)="watchAd('ammo')"
              >
                {{ 'death.full_ammo_respawn' | translate }}
              </button>

              <button
                class="btn btn-ad"
                [disabled]="adUsed() || !canShowAd || watching()"
                (click)="watchAd('walls')"
              >
                {{ 'death.full_walls_respawn' | translate }}
              </button>

              <button
                class="btn btn-respawn"
                [disabled]="!canRespawn() || watching()"
                (click)="respawn()"
              >
                {{ canRespawn() ? ('death.respawn' | translate) : ('death.wait' | translate) }}
              </button>

              <button class="btn btn-exit" (click)="exit()">
                {{ 'death.exit_lobby' | translate }}
              </button>
            </div>
          </div>
        } @else {
          <div class="actions">
            <button
              class="btn btn-ad"
              [disabled]="adUsed() || !canShowAd || watching()"
              (click)="watchAd('ammo')"
            >
              {{ 'death.full_ammo_respawn' | translate }}
            </button>

            <button
              class="btn btn-ad"
              [disabled]="adUsed() || !canShowAd || watching()"
              (click)="watchAd('walls')"
            >
              {{ 'death.full_walls_respawn' | translate }}
            </button>

            <button
              class="btn btn-respawn"
              [disabled]="!canRespawn() || watching()"
              (click)="respawn()"
            >
              {{ canRespawn() ? ('death.respawn' | translate) : ('death.wait' | translate) }}
            </button>

            <button class="btn btn-exit" [disabled]="watching()" (click)="exit()">
              {{ 'death.exit_lobby' | translate }}
            </button>
          </div>
        }
      </div>
      <div class="overlay-side-col"><app-side-ad /></div>
    </div>
  `,
  styles: [`
    .overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.82);
      display: flex; align-items: center; justify-content: center;
      z-index: 100;
      font-family: 'Inter', system-ui, monospace;
    }
    /* Columnas laterales: ocultas en móvil, centran el ad en el espacio disponible */
    .overlay-side-col {
      display: none;
      flex: 1;
      align-items: center;
      justify-content: center;
    }
    @media (min-width: 1420px) {
      .overlay-side-col { display: flex; }
    }
    .card {
      background: var(--t-surface2);
      border: 1px solid var(--t-accent-bd);
      border-radius: 16px;
      padding: 36px 40px;
      width: min(480px, 90vw);
      backdrop-filter: blur(20px);
      display: flex; flex-direction: column; gap: 24px;
    }
    .title {
      color: #ff6b6b;
      font-size: clamp(24px,4vw,32px);
      font-weight: 900;
      letter-spacing: 4px;
      text-align: center;
      margin: 0;
    }
    .killer-line {
      text-align: center;
      font-size: 13px;
      color: var(--t-tx4);
      margin: -12px 0 0;
    }
    .killer-name {
      color: #ff6b6b;
      font-weight: 700;
    }
    .stats {
      display: flex; gap: 16px; justify-content: center;
    }
    .stat {
      background: var(--t-surface);
      border: 1px solid var(--t-bd2);
      border-radius: 10px;
      padding: 12px 20px;
      display: flex; flex-direction: column; align-items: center; gap: 4px;
      flex: 1;
    }
    .label { color: var(--t-tx4); font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
    .value { color: var(--t-tx); font-size: 22px; font-weight: 700; }
    .value.score { color: var(--t-accent); }
    .countdown-wrap { display: flex; flex-direction: column; gap: 8px; }
    .countdown-bar {
      height: 4px; background: var(--t-bd2); border-radius: 2px; overflow: hidden;
    }
    .countdown-fill {
      height: 100%; background: var(--t-accent);
      transition: width 1s linear;
    }
    .countdown-label { color: var(--t-muted); font-size: 12px; text-align: center; }
    .actions { display: flex; flex-direction: column; gap: 10px; }
    .btn {
      padding: 12px 16px;
      border-radius: 8px;
      border: none;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.15s, transform 0.1s;
      font-family: inherit;
      touch-action: manipulation;
    }
    .btn:disabled { opacity: 0.35; cursor: not-allowed; transform: none !important; }
    .btn:not(:disabled):hover { transform: translateY(-1px); }
    .btn-ad {
      background: var(--t-opt-bg);
      color: var(--t-opt-tx);
      border: 1px solid var(--t-opt-bd);
    }
    .btn-respawn {
      background: var(--t-accent);
      color: var(--t-on-accent);
      font-size: 16px;
      padding: 14px;
    }
    .btn-exit {
      background: var(--t-ghost-bg);
      color: var(--t-ghost-tx);
      font-size: 13px;
      border: 1px solid var(--t-ghost-bd);
    }
    .btn-exit:not(:disabled):hover { color: var(--t-tx2); }
    .anon-cta {
      background: var(--t-accent-bg);
      border: 1px solid var(--t-accent-bd);
      border-radius: 10px;
      padding: 16px 20px;
      display: flex; flex-direction: column; gap: 8px;
      text-align: center;
    }
    .cta-title {
      color: var(--t-accent); font-size: 14px; font-weight: 700; margin: 0;
    }
    .cta-desc {
      color: var(--t-tx4); font-size: 12px; line-height: 1.5; margin: 0;
    }
    .btn-register {
      display: block;
      background: linear-gradient(135deg, var(--t-accent-dk), var(--t-accent));
      color: var(--t-on-accent);
      border-radius: 7px;
      padding: 10px;
      font-size: 13px;
      font-weight: 700;
      text-decoration: none;
      transition: opacity 0.15s;
    }
    .btn-register:hover { opacity: 0.85; }

    /* Anon split: single column por defecto, 2 columnas en móvil portrait */
    .anon-split {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    /* ── Mobile portrait (≤ 768px) ─────────────────────────────────── */
    @media (max-width: 768px) {
      .card {
        padding: 18px 14px;
        gap: 12px;
        width: min(96vw, 480px);
        max-height: 95dvh;
        overflow-y: auto;
      }
      .title { font-size: 20px; letter-spacing: 2px; }
      .stat { padding: 8px 10px; }
      .value { font-size: 17px; }
      .countdown-label { font-size: 11px; }

      /* CTA anónimo: oculto en mobile */
      .anon-cta { display: none; }

      /* Botones en cuadrícula 2 columnas */
      .actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }
      .btn-ad { font-size: 11px; padding: 10px 6px; line-height: 1.3; }
      .btn-respawn {
        grid-column: 1 / -1;
        font-size: 15px;
        padding: 13px;
      }
      .btn-exit {
        grid-column: 1 / -1;
        font-size: 11px;
        padding: 8px;
      }

      /* anon-split: columna simple, la cuadrícula de botones ya comprime */
      .anon-split { flex-direction: column; gap: 10px; }
    }

    /* ── Landscape móvil: card compacta ─────────────────────────────── */
    @media (max-height: 500px) and (orientation: landscape) {
      .card {
        padding: 12px 16px;
        gap: 10px;
        max-height: 90dvh;
        overflow-y: auto;
        width: min(580px, 94vw);
      }
      .title { font-size: 18px; letter-spacing: 2px; }
      .stat { padding: 6px 10px; }
      .value { font-size: 14px; }
      .anon-cta { display: none; }
      .actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px;
      }
      .btn-ad { font-size: 10px; padding: 7px 4px; line-height: 1.3; }
      .btn-respawn { grid-column: 1 / -1; font-size: 13px; padding: 9px; }
      .btn-exit { grid-column: 1 / -1; font-size: 10px; padding: 6px; }
      .anon-split .actions { flex: 1; }
    }
  `],
})
export class DeathOverlayComponent implements OnInit, OnDestroy {
  @Input() scoreGained = 0;
  @Input() leaderboardRank = 0;
  @Input() deathTimestamp = 0;
  @Input() isAnonymous = false;
  @Input() killerName: string | null = null;

  @Output() onRespawn = new EventEmitter<'ammo' | 'walls' | undefined>();
  @Output() onExit    = new EventEmitter<void>();

  readonly TIMEOUT_MS = 60_000;
  readonly MIN_RESPAWN_MS = 3_000;

  canShowAd = false;
  adUsed    = signal(false);
  watching  = signal(false);
  canRespawn = signal(false);
  countdownPct = signal(100);
  countdownSecs = signal(60);

  private pendingBonus: 'ammo' | 'walls' | undefined;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private respawnTimerId: ReturnType<typeof setTimeout> | null = null;
  private pausedAt = 0;
  private elapsed = 0;

  constructor(private readonly ads: AdsService) {}

  ngOnInit(): void {
    this.canShowAd = this.ads.canShowRewardedAd();

    this.ads.incrementDeathCount();
    this.ads.tryShowDeathInterstitial(
      () => this.watching.set(true),   // pausar countdown mientras se muestra el interstitial
      () => this.watching.set(false),  // reanudar después
    );

    // Single-shot timer as the primary trigger for canRespawn.
    // setInterval at 500ms can be throttled by Phaser's rAF loop on mobile,
    // delaying the 6th tick (3000ms) by seconds. setTimeout is more reliable
    // because it fires once and the browser prioritizes it over repeat timers.
    this.respawnTimerId = setTimeout(() => {
      this.canRespawn.set(true);
      this.respawnTimerId = null;
    }, this.MIN_RESPAWN_MS);
    this.startCountdown();
  }

  ngOnDestroy(): void {
    this.clearInterval();
    if (this.respawnTimerId !== null) {
      clearTimeout(this.respawnTimerId);
      this.respawnTimerId = null;
    }
  }

  watchAd(bonus: 'ammo' | 'walls'): void {
    if (this.adUsed() || this.watching()) return;
    this.watching.set(true);
    this.pausedAt = Date.now();
    this.pendingBonus = bonus;

    const handler = bonus === 'ammo'
      ? (cb: () => void) => this.ads.showAmmoRewardedAd(cb)
      : (cb: () => void) => this.ads.showWallsRewardedAd(cb);

    handler(() => {
      this.adUsed.set(true);
      this.watching.set(false);
      // Resume countdown, adding the time spent watching
      this.elapsed += Date.now() - this.pausedAt;
      this.pausedAt = 0;
      this.onRespawn.emit(bonus);
    });
  }

  respawn(): void {
    if (!this.canRespawn()) return;
    this.onRespawn.emit(this.pendingBonus);
  }

  exit(): void {
    this.onExit.emit();
  }

  private startCountdown(): void {
    const start = Date.now();
    this.intervalId = setInterval(() => {
      if (this.watching()) return; // paused

      const now = Date.now();
      const total = this.TIMEOUT_MS;
      this.elapsed = now - start;
      const remaining = Math.max(0, total - this.elapsed);

      this.countdownSecs.set(Math.ceil(remaining / 1000));
      this.countdownPct.set((remaining / total) * 100);

      if (this.elapsed >= this.MIN_RESPAWN_MS) this.canRespawn.set(true);

      if (remaining <= 0) {
        this.clearInterval();
        this.onExit.emit();
      }
    }, 500);
  }

  private clearInterval(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
