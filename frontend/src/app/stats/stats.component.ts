import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { environment } from '../../environments/environment';
import { ThemeService } from '../core/services/theme.service';

interface PlayerStats {
  kills: number;
  deaths: number;
  gamesPlayed: number;
  wins: number;
  totalScore: number;
  bestKillStreak: number;
  totalPlayTimeSeconds: number;
}

interface GameSession {
  id: string;
  score: number;
  kills: number;
  deaths: number;
  durationSeconds: number;
  playedAt: string;
}

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [RouterLink, TranslateModule],
  template: `
    <div class="page">
      <div class="bg">
        <div class="blob b1"></div>
        <div class="blob b2"></div>
        <div class="grid"></div>
      </div>

      <!-- Header -->
      <header class="hdr">
        <div class="logo">🏳️ <span>DARK FLAG</span></div>
        <nav class="nav-links">
          <a routerLink="/lobby">{{ 'stats.back_lobby' | translate }}</a>
          <a routerLink="/shop">{{ 'nav.shop' | translate }}</a>
        </nav>
      </header>

      <div class="content">
        <h1 class="page-title">{{ 'stats.my_progress' | translate }}</h1>

        @if (loading()) {
          <div class="loader">{{ 'stats.loading' | translate }}</div>
        } @else if (loadError()) {
          <div class="empty error-state">
            <div>⚠️ {{ 'stats.error_load' | translate }}</div>
            <div class="error-hint">{{ 'stats.error_hint' | translate }}</div>
            <a class="retry-link" routerLink="/auth/login">{{ 'stats.error_login' | translate }}</a>
          </div>
        } @else if (!stats()) {
          <div class="empty">{{ 'stats.empty' | translate }}</div>
        } @else {
          <!-- ── KPI cards ─────────────────────────────────────── -->
          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-value">{{ stats()!.gamesPlayed }}</div>
              <div class="kpi-label">{{ 'stats.kpi_games' | translate }}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-value">{{ stats()!.totalScore }}</div>
              <div class="kpi-label">{{ 'stats.kpi_score' | translate }}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-value">{{ stats()!.kills }}</div>
              <div class="kpi-label">{{ 'stats.kpi_kills' | translate }}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-value">{{ stats()!.deaths }}</div>
              <div class="kpi-label">{{ 'stats.kpi_deaths' | translate }}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-value accent">{{ kdr() }}</div>
              <div class="kpi-label">{{ 'stats.kpi_kd' | translate }}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-value accent">{{ stats()!.bestKillStreak }}</div>
              <div class="kpi-label">{{ 'stats.kpi_best_streak' | translate }}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-value">{{ playTime() }}</div>
              <div class="kpi-label">{{ 'stats.kpi_playtime' | translate }}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-value accent">{{ avgScore() }}</div>
              <div class="kpi-label">{{ 'stats.kpi_avg_score' | translate }}</div>
            </div>
          </div>

          <!-- ── Score over time chart ─────────────────────────── -->
          @if (sessions().length >= 2) {
            <section class="chart-section">
              <h2 class="chart-title">{{ 'stats.chart_score' | translate }}</h2>
              <div class="chart-wrap">
                <svg [attr.viewBox]="'0 0 ' + CHART_W + ' ' + CHART_H" class="chart-svg" preserveAspectRatio="none">
                  <!-- Grid lines -->
                  @for (y of yGridLines(); track y.label) {
                    <line [attr.x1]="PAD_L" [attr.x2]="CHART_W - PAD_R"
                          [attr.y1]="y.py" [attr.y2]="y.py"
                          [attr.stroke]="chartGridStroke()" stroke-width="1"/>
                    <text [attr.x]="PAD_L - 6" [attr.y]="y.py + 4"
                          [attr.fill]="chartLabelFill()" font-size="10" text-anchor="end">{{ y.label }}</text>
                  }

                  <!-- Area fill -->
                  <path [attr.d]="areaPath()" fill="rgba(0,232,122,0.08)" stroke="none"/>

                  <!-- Line -->
                  <path [attr.d]="linePath()" fill="none" stroke="#00e87a" stroke-width="2" stroke-linejoin="round"/>

                  <!-- Dots -->
                  @for (pt of chartPoints(); track pt.i) {
                    <circle [attr.cx]="pt.x" [attr.cy]="pt.y" r="3.5"
                            fill="#00e87a" [attr.stroke]="chartDotStroke()" stroke-width="1.5">
                      <title>Partida {{ pt.i + 1 }}: {{ pt.score }} pts</title>
                    </circle>
                  }

                  <!-- X labels (last 5 only) -->
                  @for (pt of xLabels(); track pt.i) {
                    <text [attr.x]="pt.x" [attr.y]="CHART_H - 4"
                          [attr.fill]="chartLabelFill()" font-size="10" text-anchor="middle">
                      {{ pt.label }}
                    </text>
                  }
                </svg>
              </div>
            </section>

            <!-- ── Kills over time chart ─────────────────────────── -->
            <section class="chart-section">
              <h2 class="chart-title">{{ 'stats.chart_kills' | translate }}</h2>
              <div class="chart-wrap">
                <svg [attr.viewBox]="'0 0 ' + CHART_W + ' ' + CHART_H" class="chart-svg" preserveAspectRatio="none">
                  @for (y of yGridLinesKills(); track y.label) {
                    <line [attr.x1]="PAD_L" [attr.x2]="CHART_W - PAD_R"
                          [attr.y1]="y.py" [attr.y2]="y.py"
                          [attr.stroke]="chartGridStroke()" stroke-width="1"/>
                    <text [attr.x]="PAD_L - 6" [attr.y]="y.py + 4"
                          [attr.fill]="chartLabelFill()" font-size="10" text-anchor="end">{{ y.label }}</text>
                  }
                  <path [attr.d]="killsAreaPath()" fill="rgba(33,150,243,0.08)" stroke="none"/>
                  <path [attr.d]="killsLinePath()" fill="none" stroke="#2196f3" stroke-width="2" stroke-linejoin="round"/>
                  @for (pt of killsChartPoints(); track pt.i) {
                    <circle [attr.cx]="pt.x" [attr.cy]="pt.y" r="3.5"
                            fill="#2196f3" [attr.stroke]="chartDotStroke()" stroke-width="1.5">
                      <title>Partida {{ pt.i + 1 }}: {{ pt.score }} kills</title>
                    </circle>
                  }
                  @for (pt of xLabels(); track pt.i) {
                    <text [attr.x]="pt.x" [attr.y]="CHART_H - 4"
                          [attr.fill]="chartLabelFill()" font-size="10" text-anchor="middle">
                      {{ pt.label }}
                    </text>
                  }
                </svg>
              </div>
            </section>

            <!-- ── Recent sessions table ────────────────────────── -->
            <section class="chart-section">
              <h2 class="chart-title">{{ 'stats.table_recent' | translate : { count: sessions().length } }}</h2>
              <div class="table-wrap">
                <table class="sessions-table">
                  <thead>
                    <tr>
                      <th>{{ 'stats.th_num' | translate }}</th>
                      <th>{{ 'stats.th_date' | translate }}</th>
                      <th>{{ 'stats.th_score' | translate }}</th>
                      <th>{{ 'stats.th_kills' | translate }}</th>
                      <th>{{ 'stats.th_deaths' | translate }}</th>
                      <th>{{ 'stats.th_duration' | translate }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (s of sessions(); track s.id; let i = $index) {
                      <tr>
                        <td class="dim">{{ sessions().length - i }}</td>
                        <td class="dim">{{ formatDate(s.playedAt) }}</td>
                        <td class="score-cell">{{ s.score }}</td>
                        <td>{{ s.kills }}</td>
                        <td class="dim">{{ s.deaths }}</td>
                        <td class="dim">{{ formatDur(s.durationSeconds) }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </section>
          } @else if (sessions().length === 1) {
            <div class="empty">{{ 'stats.need_more_games' | translate }}</div>
          } @else {
            <div class="empty">{{ 'stats.no_games' | translate }}</div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; overflow: hidden; }

    .page {
      position: relative; height: 100%; overflow-y: auto;
      background: var(--t-bg); color: var(--t-tx);
      font-family: 'Inter', system-ui, sans-serif;
    }

    /* Background */
    .bg { position: fixed; inset: 0; pointer-events: none; background: var(--t-bg); }
    .blob { position: absolute; border-radius: 50%; filter: blur(90px); }
    .b1 {
      width: 50vw; height: 50vw; max-width: 600px; max-height: 600px;
      background: var(--t-b1);
      opacity: var(--t-b1-op); top: -10%; left: -5%;
      animation: drift 22s ease-in-out infinite alternate;
    }
    .b2 {
      width: 45vw; height: 45vw; max-width: 550px; max-height: 550px;
      background: var(--t-b2);
      opacity: var(--t-b2-op); bottom: -10%; right: -5%;
      animation: drift 18s ease-in-out infinite alternate-reverse;
    }
    .grid {
      position: absolute; inset: 0;
      background-image:
        linear-gradient(var(--t-grid) 1px, transparent 1px),
        linear-gradient(90deg, var(--t-grid) 1px, transparent 1px);
      background-size: 60px 60px;
    }
    @keyframes drift {
      from { transform: translate(0,0) scale(1); }
      to   { transform: translate(30px,30px) scale(1.06); }
    }

    /* Header */
    .hdr {
      position: relative; z-index: 10;
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 28px;
      border-bottom: 1px solid var(--t-accent-bd);
      background: var(--t-hdr-bg);
      backdrop-filter: blur(10px);
    }
    .logo { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 800; letter-spacing: 3px; color: var(--t-accent); }
    .nav-links { display: flex; gap: 16px; }
    .nav-links a { color: var(--t-tx4); text-decoration: none; font-size: 13px; transition: color .15s; }
    .nav-links a:hover { color: var(--t-accent); }

    /* Content */
    .content {
      position: relative; z-index: 1;
      max-width: 900px; margin: 0 auto; padding: 32px 24px 48px;
    }
    .page-title {
      font-size: 26px; font-weight: 800; margin: 0 0 28px;
      background: var(--t-logo-grad);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    }

    /* Loader / empty */
    .loader, .empty { color: var(--t-muted); font-size: 14px; text-align: center; padding: 40px; }
    .error-state { color: #ff6b6b; display: flex; flex-direction: column; gap: 8px; align-items: center; }
    .error-hint { font-size: 12px; color: var(--t-muted); }
    .retry-link { color: var(--t-accent); font-size: 13px; text-decoration: none; margin-top: 8px; }
    .retry-link:hover { text-decoration: underline; }

    /* KPI Grid */
    .kpi-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 12px; margin-bottom: 36px;
    }
    .kpi-card {
      background: var(--t-surface);
      border: 1px solid var(--t-bd);
      border-radius: 6px; padding: 16px;
      text-align: center;
    }
    .kpi-value { font-size: 26px; font-weight: 800; color: var(--t-tx); }
    .kpi-value.accent { color: var(--t-accent); }
    .kpi-label { font-size: 11px; color: var(--t-muted); margin-top: 4px; text-transform: uppercase; letter-spacing: 1px; }

    /* Chart */
    .chart-section { margin-bottom: 36px; }
    .chart-title { font-size: 15px; font-weight: 700; color: var(--t-tx4); margin: 0 0 12px; letter-spacing: 1px; text-transform: uppercase; }
    .chart-wrap {
      background: var(--t-surface);
      border: 1px solid var(--t-bd);
      border-radius: 6px; padding: 12px 4px 4px;
    }
    .chart-svg { width: 100%; height: 180px; display: block; overflow: visible; }

    /* Table */
    .table-wrap { overflow-x: auto; border-radius: 6px; border: 1px solid var(--t-bd); }
    .sessions-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .sessions-table th {
      background: var(--t-surface2); color: var(--t-muted); font-size: 10px; text-transform: uppercase;
      letter-spacing: 1px; padding: 10px 14px; text-align: left; font-weight: 600;
      border-bottom: 1px solid var(--t-bd);
    }
    .sessions-table td { padding: 9px 14px; border-bottom: 1px solid var(--t-bd); color: var(--t-tx2); }
    .sessions-table tr:last-child td { border-bottom: none; }
    .sessions-table tr:hover td { background: var(--t-hover); }
    .dim { color: var(--t-muted) !important; }
    .score-cell { color: var(--t-accent) !important; font-weight: 700; }

    /* ══════════════════════════════════════════════════════════════
       RESPONSIVE MOBILE
       ══════════════════════════════════════════════════════════════ */
    @media (max-width: 768px) {
      /* Header */
      .hdr { padding: 12px 16px; }
      .logo { font-size: 11px; letter-spacing: 1.5px; }
      .nav-links { gap: 12px; }
      .nav-links a { font-size: 12px; }

      /* Content */
      .content { padding: 20px 14px 40px; }
      .page-title { font-size: 20px; margin-bottom: 20px; }

      /* KPI: 2 columnas fijas */
      .kpi-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
        margin-bottom: 24px;
      }
      .kpi-card { padding: 12px 10px; border-radius: 6px; }
      .kpi-value { font-size: 22px; }

      /* Charts */
      .chart-title { font-size: 13px; }
      .chart-svg { height: 140px; }
      .chart-section { margin-bottom: 24px; }

      /* Tabla de sesiones: scroll horizontal */
      .sessions-table { font-size: 11px; }
      .sessions-table th { padding: 8px 10px; font-size: 9px; }
      .sessions-table td { padding: 7px 10px; }
    }

    @media (max-width: 480px) {
      .hdr { padding: 10px 12px; }
      .logo span { display: none; }
      .content { padding: 16px 12px 32px; }
      .kpi-card { padding: 10px 8px; }
      .kpi-value { font-size: 20px; }
      .kpi-label { font-size: 10px; }
    }
  `],
})
export class StatsComponent implements OnInit {
  readonly CHART_W = 800;
  readonly CHART_H = 160;
  readonly CHART_BOTTOM = 130;
  readonly PAD_L = 44;
  readonly PAD_R = 12;
  readonly PAD_TOP = 10;

  readonly loading  = signal(true);
  readonly stats    = signal<PlayerStats | null>(null);
  readonly sessions = signal<GameSession[]>([]);
  readonly loadError = signal(false);

  readonly kdr = computed(() => {
    const s = this.stats();
    if (!s || s.deaths === 0) return s ? s.kills.toFixed(1) : '0';
    return (s.kills / s.deaths).toFixed(2);
  });

  readonly playTime = computed(() => {
    const t = this.stats()?.totalPlayTimeSeconds ?? 0;
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  });

  readonly avgScore = computed(() => {
    const s = this.stats();
    if (!s || s.gamesPlayed === 0) return '0';
    return Math.round(s.totalScore / s.gamesPlayed).toString();
  });

  // ── Chart computeds (score) ──────────────────────────────────────────────

  readonly chartPoints = computed(() => this.buildPoints(this.sessions().map(s => s.score)));
  readonly yGridLines  = computed(() => this.buildYGrid(this.sessions().map(s => s.score)));
  readonly linePath    = computed(() => this.buildLinePath(this.chartPoints()));
  readonly areaPath    = computed(() => this.buildAreaPath(this.chartPoints()));
  readonly xLabels     = computed(() => this.buildXLabels());

  // ── Chart computeds (kills) ──────────────────────────────────────────────

  readonly killsChartPoints = computed(() => this.buildPoints(this.sessions().map(s => s.kills)));
  readonly yGridLinesKills  = computed(() => this.buildYGrid(this.sessions().map(s => s.kills)));
  readonly killsLinePath    = computed(() => this.buildLinePath(this.killsChartPoints()));
  readonly killsAreaPath    = computed(() => this.buildAreaPath(this.killsChartPoints()));

  // ── SVG dynamic colors (CSS vars can't reach SVG attributes directly) ────

  private readonly themeService = inject(ThemeService);

  readonly chartGridStroke = computed(() =>
    this.themeService.theme() === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)');
  readonly chartLabelFill = computed(() =>
    this.themeService.theme() === 'dark' ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.45)');
  readonly chartDotStroke = computed(() =>
    this.themeService.theme() === 'dark' ? '#07071a' : '#FBF8F4');

  constructor(private readonly http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<PlayerStats>(`${environment.apiUrl}/stats/me`).subscribe({
      next: s => { this.stats.set(s); this.loading.set(false); },
      error: () => { this.loadError.set(true); this.loading.set(false); },
    });
    this.http.get<GameSession[]>(`${environment.apiUrl}/stats/sessions`).subscribe({
      next: s => this.sessions.set([...s].reverse()),
      error: () => {},
    });
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-CO', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  formatDur(secs: number): string {
    if (secs < 60) return `${secs}s`;
    return `${Math.floor(secs / 60)}m ${secs % 60}s`;
  }

  // ── SVG helpers ─────────────────────────────────────────────────────────

  private buildPoints(values: number[]): { x: number; y: number; i: number; score: number }[] {
    const n = values.length;
    if (n === 0) return [];
    const maxV = Math.max(...values, 1);
    const usableW = this.CHART_W - this.PAD_L - this.PAD_R;
    const usableH = this.CHART_BOTTOM - this.PAD_TOP;

    return values.map((v, i) => ({
      x: this.PAD_L + (n === 1 ? usableW / 2 : (i / (n - 1)) * usableW),
      y: this.PAD_TOP + usableH - (v / maxV) * usableH,
      i,
      score: v,
    }));
  }

  private buildLinePath(pts: { x: number; y: number }[]): string {
    if (pts.length < 2) return '';
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  }

  private buildAreaPath(pts: { x: number; y: number }[]): string {
    if (pts.length < 2) return '';
    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const last = pts[pts.length - 1];
    const first = pts[0];
    return `${line} L ${last.x.toFixed(1)} ${this.CHART_BOTTOM} L ${first.x.toFixed(1)} ${this.CHART_BOTTOM} Z`;
  }

  private buildYGrid(values: number[]): { label: string; py: number }[] {
    const maxV = Math.max(...values, 1);
    const steps = 4;
    const usableH = this.CHART_BOTTOM - this.PAD_TOP;
    return Array.from({ length: steps + 1 }, (_, i) => {
      const frac = i / steps;
      const v = Math.round(maxV * frac);
      return {
        label: v.toString(),
        py: this.PAD_TOP + usableH - frac * usableH,
      };
    });
  }

  private buildXLabels(): { x: number; label: string; i: number }[] {
    const n = this.sessions().length;
    if (n < 2) return [];
    const usableW = this.CHART_W - this.PAD_L - this.PAD_R;
    const step = Math.max(1, Math.floor(n / 5));
    const indices = [];
    for (let i = 0; i < n; i += step) indices.push(i);
    if (indices[indices.length - 1] !== n - 1) indices.push(n - 1);
    return indices.map(i => ({
      x: this.PAD_L + (n === 1 ? usableW / 2 : (i / (n - 1)) * usableW),
      label: `#${i + 1}`,
      i,
    }));
  }
}
