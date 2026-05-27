import {
  Component, Output, EventEmitter, OnInit, signal, inject,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { environment } from '../../environments/environment';

interface RankEntry {
  rank: number;
  userId: string;
  username: string;
  avatarSlug: string;
  value: number;
}

@Component({
  selector: 'app-rankings-modal',
  standalone: true,
  imports: [FormsModule, TranslateModule],
  template: `
    <div class="rm-backdrop" (click)="close.emit()">
      <div class="rm-modal" (click)="$event.stopPropagation()">

        <!-- Header -->
        <div class="rm-hdr">
          <span class="rm-title">{{ 'rankings.title' | translate }}</span>
          <div class="rm-search-wrap">
            <input
              class="rm-search"
              [placeholder]="'rankings.search_placeholder' | translate"
              [(ngModel)]="searchQuery"
              (ngModelChange)="onSearch()"
            />
          </div>
          <button class="rm-close" (click)="close.emit()">{{ 'rankings.close' | translate }}</button>
        </div>

        <!-- Columns container -->
        <div class="rm-cols" (wheel)="onWheel($event)">

          <!-- Col 1: Kill streak -->
          <div class="rm-col">
            <div class="rm-col-hdr">
              <span class="rm-col-icon">💀</span>
              <span class="rm-col-title">{{ 'rankings.col_streak_title' | translate }}</span>
              <span class="rm-col-sub">{{ 'rankings.col_streak_sub' | translate }}</span>
            </div>
            <div class="rm-list" id="list-0">
              @for (e of streak(); track e.rank) {
                <div class="rm-row">
                  <span class="rm-rank" [class.rm-rank-gold]="e.rank === 1"
                        [class.rm-rank-silver]="e.rank === 2"
                        [class.rm-rank-bronze]="e.rank === 3">
                    {{ e.rank }}
                  </span>
                  <img class="rm-avatar" [src]="'assets/avatars/' + (e.avatarSlug || 'avatar-01') + '.png'"
                       [alt]="e.username" (error)="onAvatarErr($event)">
                  <span class="rm-name">{{ e.username }}</span>
                  <span class="rm-val">{{ e.value }}</span>
                </div>
              }
              @if (loadingStreak()) {
                <div class="rm-loading">{{ 'rankings.loading' | translate }}</div>
              }
            </div>
          </div>

          <div class="rm-divider"></div>

          <!-- Col 2: Survival time -->
          <div class="rm-col">
            <div class="rm-col-hdr">
              <span class="rm-col-icon">⏱️</span>
              <span class="rm-col-title">{{ 'rankings.col_survival_title' | translate }}</span>
              <span class="rm-col-sub">{{ 'rankings.col_survival_sub' | translate }}</span>
            </div>
            <div class="rm-list">
              @for (e of survival(); track e.rank) {
                <div class="rm-row">
                  <span class="rm-rank" [class.rm-rank-gold]="e.rank === 1"
                        [class.rm-rank-silver]="e.rank === 2"
                        [class.rm-rank-bronze]="e.rank === 3">
                    {{ e.rank }}
                  </span>
                  <img class="rm-avatar" [src]="'assets/avatars/' + (e.avatarSlug || 'avatar-01') + '.png'"
                       [alt]="e.username" (error)="onAvatarErr($event)">
                  <span class="rm-name">{{ e.username }}</span>
                  <span class="rm-val">{{ formatSeconds(e.value) }}</span>
                </div>
              }
              @if (loadingSurvival()) {
                <div class="rm-loading">{{ 'rankings.loading' | translate }}</div>
              }
            </div>
          </div>

          <div class="rm-divider"></div>

          <!-- Col 3: K/D ratio -->
          <div class="rm-col">
            <div class="rm-col-hdr">
              <span class="rm-col-icon">⚔️</span>
              <span class="rm-col-title">{{ 'rankings.col_kd_title' | translate }}</span>
              <span class="rm-col-sub">{{ 'rankings.col_kd_sub' | translate }}</span>
            </div>
            <div class="rm-list">
              @for (e of kd(); track e.rank) {
                <div class="rm-row">
                  <span class="rm-rank" [class.rm-rank-gold]="e.rank === 1"
                        [class.rm-rank-silver]="e.rank === 2"
                        [class.rm-rank-bronze]="e.rank === 3">
                    {{ e.rank }}
                  </span>
                  <img class="rm-avatar" [src]="'assets/avatars/' + (e.avatarSlug || 'avatar-01') + '.png'"
                       [alt]="e.username" (error)="onAvatarErr($event)">
                  <span class="rm-name">{{ e.username }}</span>
                  <span class="rm-val">{{ e.value }}</span>
                </div>
              }
              @if (loadingKd()) {
                <div class="rm-loading">{{ 'rankings.loading' | translate }}</div>
              }
            </div>
          </div>

          <div class="rm-divider"></div>

          <!-- Col 4: High-level kills -->
          <div class="rm-col">
            <div class="rm-col-hdr">
              <span class="rm-col-icon">☢️</span>
              <span class="rm-col-title">{{ 'rankings.col_high_title' | translate }}</span>
              <span class="rm-col-sub">{{ 'rankings.col_high_sub' | translate }}</span>
            </div>
            <div class="rm-list">
              @for (e of highLevel(); track e.rank) {
                <div class="rm-row">
                  <span class="rm-rank" [class.rm-rank-gold]="e.rank === 1"
                        [class.rm-rank-silver]="e.rank === 2"
                        [class.rm-rank-bronze]="e.rank === 3">
                    {{ e.rank }}
                  </span>
                  <img class="rm-avatar" [src]="'assets/avatars/' + (e.avatarSlug || 'avatar-01') + '.png'"
                       [alt]="e.username" (error)="onAvatarErr($event)">
                  <span class="rm-name">{{ e.username }}</span>
                  <span class="rm-val">{{ e.value }}</span>
                </div>
              }
              @if (loadingHighLevel()) {
                <div class="rm-loading">{{ 'rankings.loading' | translate }}</div>
              }
            </div>
          </div>

        </div><!-- /rm-cols -->
      </div>
    </div>
  `,
  styles: [`
    .rm-backdrop {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.82);
      backdrop-filter: blur(5px);
      z-index: 150;
      display: flex; align-items: center; justify-content: center;
      padding: 12px;
    }
    .rm-modal {
      background: var(--t-panel);
      border: 1px solid var(--t-accent-bd);
      border-radius: 16px;
      width: 100%;
      max-width: 1100px;
      max-height: 92vh;
      display: flex; flex-direction: column;
      overflow: hidden;
      box-shadow: 0 0 50px var(--t-accent-glow);
    }

    /* ── Header ─────────────────────── */
    .rm-hdr {
      display: flex; align-items: center; gap: 16px;
      padding: 18px 22px;
      border-bottom: 1px solid var(--t-panel-bd);
      flex-shrink: 0;
    }
    .rm-title {
      font-size: 15px; font-weight: 800;
      letter-spacing: 2px; color: var(--t-accent);
      white-space: nowrap;
    }
    .rm-search-wrap { flex: 1; }
    .rm-search {
      width: 100%;
      background: var(--t-surface);
      border: 1px solid var(--t-accent-bd2);
      border-radius: 8px;
      padding: 8px 14px;
      color: var(--t-tx);
      font-size: 13px;
      font-family: inherit;
      outline: none;
      box-sizing: border-box;
      transition: border-color 0.15s;
    }
    .rm-search:focus { border-color: var(--t-accent); }
    .rm-close {
      background: transparent;
      border: 1px solid var(--t-bd);
      color: var(--t-tx);
      border-radius: 7px;
      padding: 6px 12px;
      cursor: pointer;
      font-family: inherit;
      font-size: 13px;
      flex-shrink: 0;
      transition: background 0.1s;
    }
    .rm-close:hover { background: var(--t-surface); }

    /* ── Columns ─────────────────────── */
    .rm-cols {
      display: flex;
      flex: 1;
      overflow-x: auto;
      overflow-y: hidden;
      scroll-behavior: smooth;
      scrollbar-width: thin;
      scrollbar-color: var(--t-accent-bd2) transparent;
    }
    .rm-cols::-webkit-scrollbar { height: 6px; }
    .rm-cols::-webkit-scrollbar-track { background: transparent; }
    .rm-cols::-webkit-scrollbar-thumb {
      background: var(--t-accent-bd2);
      border-radius: 3px;
    }

    .rm-col {
      flex: 0 0 250px;
      display: flex; flex-direction: column;
      min-height: 0;
    }
    .rm-divider {
      flex-shrink: 0;
      width: 1px;
      background: var(--t-panel-bd);
      align-self: stretch;
    }

    .rm-col-hdr {
      padding: 14px 16px 10px;
      border-bottom: 1px solid var(--t-panel-bd);
      display: flex; flex-direction: column; gap: 3px;
      flex-shrink: 0;
    }
    .rm-col-icon { font-size: 18px; }
    .rm-col-title {
      font-size: 12px; font-weight: 800;
      letter-spacing: 1px; color: var(--t-tx);
      text-transform: uppercase;
    }
    .rm-col-sub {
      font-size: 10px; color: var(--t-dim); letter-spacing: 0.3px;
    }

    /* ── List ──────────────────────── */
    .rm-list {
      flex: 1;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: var(--t-accent-bd2) transparent;
    }
    .rm-list::-webkit-scrollbar { width: 4px; }
    .rm-list::-webkit-scrollbar-track { background: transparent; }
    .rm-list::-webkit-scrollbar-thumb {
      background: var(--t-accent-bd2);
      border-radius: 2px;
    }

    .rm-row {
      display: flex; align-items: center; gap: 10px;
      padding: 7px 16px;
      border-bottom: 1px solid var(--t-surface2);
      transition: background 0.1s;
    }
    .rm-row:hover:not(.rm-row-empty) { background: var(--t-accent-bg); }
    .rm-row-empty { opacity: 0.3; }

    .rm-rank {
      font-size: 11px; font-weight: 800;
      min-width: 26px; text-align: right;
      color: var(--t-dim);
    }
    .rm-rank-gold   { color: #ffd700; text-shadow: 0 0 6px #ffd70066; }
    .rm-rank-silver { color: #b0bec5; }
    .rm-rank-bronze { color: #c8865a; }

    .rm-avatar {
      width: 22px; height: 22px; border-radius: 50%;
      object-fit: cover; flex-shrink: 0;
      border: 1px solid var(--t-panel-bd);
      background: var(--t-surface);
    }
    .rm-name {
      flex: 1;
      font-size: 12px; color: var(--t-tx);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .rm-val {
      font-size: 12px; font-weight: 700;
      color: var(--t-accent);
      flex-shrink: 0;
    }
    .rm-empty-slot {
      flex: 1; font-size: 12px; color: var(--t-dim);
    }
    .rm-loading {
      padding: 16px;
      font-size: 12px; color: var(--t-dim);
      text-align: center;
    }

    @media (max-width: 768px) {
      .rm-backdrop { padding: 0; align-items: flex-end; }
      .rm-modal {
        max-width: 100%; width: 100%;
        max-height: 90vh;
        border-radius: 20px 20px 0 0;
        border-left: none; border-right: none; border-bottom: none;
      }
      .rm-hdr { padding: 14px 16px; gap: 10px; flex-wrap: wrap; }
      .rm-title { font-size: 12px; letter-spacing: 1.5px; }
      .rm-search-wrap { order: 3; width: 100%; }
      .rm-col { flex: 0 0 200px; }
    }
  `],
})
export class RankingsModalComponent implements OnInit {
  @Output() close = new EventEmitter<void>();

  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/stats`;

  searchQuery = '';
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  readonly streak      = signal<RankEntry[]>([]);
  readonly survival    = signal<RankEntry[]>([]);
  readonly kd          = signal<RankEntry[]>([]);
  readonly highLevel   = signal<RankEntry[]>([]);

  readonly loadingStreak    = signal(true);
  readonly loadingSurvival  = signal(true);
  readonly loadingKd        = signal(true);
  readonly loadingHighLevel = signal(true);

  ngOnInit(): void {
    this.loadAll();
  }

  onSearch(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.loadAll(), 350);
  }

  onWheel(event: WheelEvent): void {
    const el = event.currentTarget as HTMLElement;
    el.scrollLeft += event.deltaY;
  }

  formatSeconds(s: number): string {
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}m ${sec}s`;
  }

  onAvatarErr(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/avatars/avatar-01.png';
  }

  private loadAll(): void {
    const q = this.searchQuery.trim() ? `?search=${encodeURIComponent(this.searchQuery.trim())}` : '';

    this.loadingStreak.set(true);
    this.http.get<RankEntry[]>(`${this.api}/rankings/kill-streak${q}`).subscribe({
      next: rows => { this.streak.set(this.pad(rows)); this.loadingStreak.set(false); },
      error: () => this.loadingStreak.set(false),
    });

    this.loadingSurvival.set(true);
    this.http.get<RankEntry[]>(`${this.api}/rankings/survival${q}`).subscribe({
      next: rows => { this.survival.set(this.pad(rows)); this.loadingSurvival.set(false); },
      error: () => this.loadingSurvival.set(false),
    });

    this.loadingKd.set(true);
    this.http.get<RankEntry[]>(`${this.api}/rankings/kd${q}`).subscribe({
      next: rows => { this.kd.set(this.pad(rows)); this.loadingKd.set(false); },
      error: () => this.loadingKd.set(false),
    });

    this.loadingHighLevel.set(true);
    this.http.get<RankEntry[]>(`${this.api}/rankings/high-level-kills${q}`).subscribe({
      next: rows => { this.highLevel.set(this.pad(rows)); this.loadingHighLevel.set(false); },
      error: () => this.loadingHighLevel.set(false),
    });
  }

  private pad(rows: RankEntry[]): RankEntry[] {
    return rows.slice(0, 200);
  }
}
