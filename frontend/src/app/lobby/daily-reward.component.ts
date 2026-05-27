import {
  Component, OnInit, Output, EventEmitter, signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { environment } from '../../environments/environment';

interface DailyStatus {
  canClaim: boolean;
  streakDays: number;
  nextResetAt: string | null;
  coinsToEarn: number;
}

@Component({
  selector: 'app-daily-reward',
  standalone: true,
  imports: [TranslateModule],
  template: `
    @if (status() && status()!.canClaim && !claimed()) {
      <div class="banner" (click)="claim()">
        <div class="banner-left">
          <span class="icon">🎁</span>
          <div>
            <div class="title">{{ 'daily.available' | translate }}</div>
            <div class="sub">
              {{ 'daily.streak' | translate : { days: status()!.streakDays + 1, plural: status()!.streakDays + 1 !== 1 ? 's' : '' } }}
              — {{ status()!.coinsToEarn }} 💰
              @if (status()!.streakDays + 1 >= 7) {
                <span class="bonus">{{ 'daily.special_bonus' | translate }}</span>
              }
            </div>
          </div>
        </div>
        <button class="claim-btn" [disabled]="loading()">
          {{ loading() ? ('daily.claiming' | translate) : ('daily.claim_btn' | translate) }}
        </button>
      </div>
    }

    @if (claimed()) {
      <div class="banner success">
        <span class="icon">✅</span>
        <div class="title">{{ 'daily.success' | translate : { coins: earnedCoins() } }}</div>
      </div>
    }
  `,
  styles: [`
    .banner {
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
      background: var(--t-daily-bg);
      border: 1px solid var(--t-daily-bd);
      border-radius: 10px; padding: 12px 16px;
      cursor: pointer; transition: background 0.15s;
    }
    .banner:hover { background: var(--t-hover); }
    .banner.success { background: var(--t-accent-bg); border-color: var(--t-accent-bd); cursor: default; }
    .banner-left { display: flex; align-items: center; gap: 12px; }
    .icon { font-size: 22px; flex-shrink: 0; }
    .title { font-size: 13px; font-weight: 700; color: var(--t-tx); }
    .sub { font-size: 11px; color: var(--t-tx4); margin-top: 2px; }
    .bonus { color: var(--t-daily-bonus); font-weight: 700; }
    .claim-btn {
      background: var(--t-daily-btn); color: var(--t-daily-btn-tx);
      border: none; border-radius: 6px; padding: 7px 16px;
      font-size: 12px; font-weight: 800; cursor: pointer; font-family: inherit;
      white-space: nowrap; flex-shrink: 0;
      transition: opacity 0.15s;
    }
    .claim-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  `],
})
export class DailyRewardComponent implements OnInit {
  @Output() onClaimed = new EventEmitter<number>();

  readonly status     = signal<DailyStatus | null>(null);
  readonly loading    = signal(false);
  readonly claimed    = signal(false);
  readonly earnedCoins = signal(0);

  constructor(private readonly http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<DailyStatus>(`${environment.apiUrl}/daily-reward/status`).subscribe({
      next: s => this.status.set(s),
      error: () => {},
    });
  }

  claim(): void {
    if (this.loading() || this.claimed() || !this.status()?.canClaim) return;
    this.loading.set(true);
    this.http.post<{ coinsEarned: number; newStreak: number }>(
      `${environment.apiUrl}/daily-reward/claim`, {},
    ).subscribe({
      next: res => {
        this.earnedCoins.set(res.coinsEarned);
        this.claimed.set(true);
        this.loading.set(false);
        this.onClaimed.emit(res.coinsEarned);
      },
      error: () => { this.loading.set(false); },
    });
  }
}
