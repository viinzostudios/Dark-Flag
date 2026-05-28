import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { APP_VERSION } from '../version';
import { LangSelectorComponent } from '../shared/components/lang-selector.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, TranslateModule, LangSelectorComponent],
  template: `
    <div class="hero">

      <!-- ── Background ───────────────────────────────── -->
      <div class="bg">
        <div class="bg-img"></div>
        <div class="bg-overlay"></div>
        <div class="bg-vignette"></div>
        <div class="grid"></div>
      </div>

      <!-- ── Nav ─────────────────────────────────────── -->
      <nav class="nav">
        <span class="nav-logo">
          <span class="logo-icon">⚑</span>
          <span class="logo-text">DARK FLAG</span>
        </span>
        <div class="nav-right">
          <app-lang-selector variant="nav" />
          <a class="nav-link" routerLink="/auth/login">{{ 'nav.login' | translate }}</a>
          <button class="nav-cta" routerLink="/auth/register">{{ 'nav.register' | translate }}</button>
        </div>
      </nav>

      <!-- ── Hero content ─────────────────────────────── -->
      <div class="content">
        <div class="hero-left">
          <div class="eyebrow">
            <span class="dot-live"></span>
            <span>{{ 'landing.live_badge' | translate }}</span>
          </div>
          <h1 class="title">DARK<br>FLAG</h1>
          <p class="tagline">{{ 'landing.tagline_line1' | translate }}<br>{{ 'landing.tagline_line2' | translate }}</p>
          <div class="cta-group">
            <button class="btn-primary" routerLink="/lobby">
              {{ 'landing.play_now' | translate }}
            </button>
            <button class="btn-ghost" routerLink="/auth/register">
              {{ 'landing.create_account' | translate }}
            </button>
          </div>
          <p class="fine-print">{{ 'landing.fine_print' | translate }}</p>
        </div>
        <div class="hero-right">
          <span class="version-badge">v{{ version }}</span>
        </div>
      </div>

      <!-- ── Bottom cards strip ─────────────────────── -->
      <div class="cards">

        <div class="feat-card" routerLink="/lobby">
          <div class="card-accent" style="background:#0ea5e9"></div>
          <div class="card-body">
            <span class="card-tag">{{ 'landing.card_mechanic' | translate }}</span>
            <div class="card-name">{{ 'landing.card_darkness_name' | translate }}</div>
            <div class="card-desc">{{ 'landing.card_darkness_desc' | translate }}</div>
          </div>
        </div>

        <div class="feat-card" routerLink="/lobby">
          <div class="card-accent" style="background:#22d3ee"></div>
          <div class="card-body">
            <span class="card-tag">{{ 'landing.card_combat' | translate }}</span>
            <div class="card-name">{{ 'landing.card_mace_name' | translate }}</div>
            <div class="card-desc">{{ 'landing.card_mace_desc' | translate }}</div>
          </div>
        </div>

        <div class="feat-card" routerLink="/lobby">
          <div class="card-accent" style="background:#f59e0b"></div>
          <div class="card-body">
            <span class="card-tag">{{ 'landing.card_objective' | translate }}</span>
            <div class="card-name">{{ 'landing.card_flag_name' | translate }}</div>
            <div class="card-desc">{{ 'landing.card_flag_desc' | translate }}</div>
          </div>
        </div>

        <div class="feat-card" routerLink="/lobby">
          <div class="card-accent" style="background:#e11d48"></div>
          <div class="card-body">
            <span class="card-tag">{{ 'landing.card_progression' | translate }}</span>
            <div class="card-name">{{ 'landing.card_levels_name' | translate }}</div>
            <div class="card-desc">{{ 'landing.card_levels_desc' | translate }}</div>
          </div>
        </div>

      </div>

      <!-- ── Legal footer ──────────────────────────── -->
      <div class="legal-bar">
        <span class="legal-copy">© 2026 VIINZO STUDIOS S.A.S.</span>
        <a class="legal-link" routerLink="/legal/privacy-policy">{{ 'landing.privacy' | translate }}</a>
      </div>

    </div>
  `,
  styles: [`
    :host { display: block; }

    .hero {
      position: relative;
      width: 100vw; height: 100vh;
      overflow: hidden;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      display: flex;
      flex-direction: column;
    }

    /* ── Background ───────────────────────────────────────── */
    .bg { position: absolute; inset: 0; }

    .bg-img {
      position: absolute; inset: 0;
      background: url('/assets/environment/hero-landing.png') center center / cover no-repeat;
    }

    .bg-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(
        115deg,
        rgba(6,9,18,.92) 0%,
        rgba(6,9,18,.78) 40%,
        rgba(6,9,18,.45) 70%,
        rgba(6,9,18,.25) 100%
      );
    }

    .bg-vignette {
      position: absolute; inset: 0;
      background: radial-gradient(ellipse 140% 120% at 100% 50%, transparent 40%, rgba(6,9,18,.70) 100%);
    }

    .grid {
      position: absolute; inset: 0;
      background-image:
        linear-gradient(rgba(14,165,233,.014) 1px, transparent 1px),
        linear-gradient(90deg, rgba(14,165,233,.014) 1px, transparent 1px);
      background-size: 72px 72px;
    }

    /* ── Nav ──────────────────────────────────────────────── */
    .nav {
      position: relative; z-index: 20;
      flex-shrink: 0;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 48px;
      height: 64px;
      border-bottom: 1px solid rgba(14,165,233,.10);
      background: rgba(6,9,18,.60);
      backdrop-filter: blur(12px);
    }

    .nav-logo {
      display: flex; align-items: center; gap: 10px;
      text-decoration: none;
    }
    .logo-icon {
      font-size: 18px;
      color: var(--t-flag);
      filter: drop-shadow(0 0 8px rgba(245,158,11,.60));
    }
    .logo-text {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 20px; font-weight: 900;
      letter-spacing: 4px; color: var(--t-tx);
      text-transform: uppercase;
    }

    .nav-right {
      display: flex; align-items: center; gap: 12px;
    }
    .nav-link {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 13px; font-weight: 700;
      letter-spacing: 2px; text-transform: uppercase;
      color: var(--t-tx3); text-decoration: none;
      padding: 6px 2px;
      transition: color .15s;
    }
    .nav-link:hover { color: var(--t-tx); }

    .nav-cta {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 13px; font-weight: 700;
      letter-spacing: 2px; text-transform: uppercase;
      padding: 8px 20px;
      background: transparent;
      border: 1px solid rgba(14,165,233,.55);
      border-radius: 3px;
      color: var(--t-accent);
      cursor: pointer;
      transition: background .15s, border-color .15s;
    }
    .nav-cta:hover {
      background: rgba(14,165,233,.10);
      border-color: var(--t-accent);
    }

    /* ── Hero content ─────────────────────────────────────── */
    .content {
      position: relative; z-index: 10;
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 48px 28px;
      min-height: 0;
    }

    .hero-left {
      display: flex; flex-direction: column;
      gap: clamp(14px, 2vh, 26px);
      max-width: 600px;
    }

    /* Live badge */
    .eyebrow {
      display: inline-flex; align-items: center; gap: 10px;
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 12px; font-weight: 700;
      letter-spacing: 3px; text-transform: uppercase;
      color: var(--t-tx3);
    }
    .dot-live {
      width: 7px; height: 7px; border-radius: 50%;
      background: #22d3ee;
      box-shadow: 0 0 8px rgba(34,211,238,.80);
      animation: blink 2s ease-in-out infinite;
      flex-shrink: 0;
    }
    @keyframes blink {
      0%,100% { opacity: 1; }
      50%      { opacity: .35; }
    }

    /* Main title */
    .title {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: clamp(72px, 12vw, 172px);
      font-weight: 900; line-height: .86;
      letter-spacing: -2px;
      color: #ffffff;
      text-transform: uppercase;
      text-shadow: 0 0 80px rgba(14,165,233,.35), 0 4px 32px rgba(0,0,0,.80);
      margin: 0;
    }

    /* Tagline */
    .tagline {
      font-size: clamp(12px, 1.1vw, 15px);
      color: var(--t-tx4); letter-spacing: .20em;
      text-transform: uppercase; line-height: 1.8;
      margin: 0;
    }

    /* CTA group */
    .cta-group {
      display: flex; align-items: center; gap: 14px;
      flex-wrap: wrap;
    }

    .btn-primary {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: clamp(14px, 1.4vw, 18px);
      font-weight: 900; letter-spacing: 3px; text-transform: uppercase;
      padding: clamp(12px, 1.8vh, 18px) clamp(28px, 3.5vw, 48px);
      background: var(--t-flag);
      border: none; border-radius: 3px;
      color: #060912;
      cursor: pointer;
      transition: transform .15s, box-shadow .15s;
      box-shadow: 0 0 28px var(--t-flag-glow);
      animation: gold-pulse 2.6s ease-in-out infinite;
    }
    .btn-primary:hover {
      animation: none;
      transform: translateY(-3px);
      box-shadow: 0 0 60px var(--t-flag-glow2), 0 8px 28px rgba(0,0,0,.40);
    }
    @keyframes gold-pulse {
      0%,100% { box-shadow: 0 0 22px var(--t-flag-glow); }
      50%      { box-shadow: 0 0 52px var(--t-flag-glow2); }
    }

    .btn-ghost {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: clamp(13px, 1.2vw, 16px);
      font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase;
      padding: clamp(11px, 1.8vh, 17px) clamp(22px, 2.8vw, 38px);
      background: transparent;
      border: 1px solid rgba(240,249,255,.25);
      border-radius: 3px;
      color: rgba(240,249,255,.65);
      cursor: pointer;
      transition: border-color .15s, color .15s, background .15s;
    }
    .btn-ghost:hover {
      border-color: rgba(240,249,255,.55);
      color: #f0f9ff;
      background: rgba(255,255,255,.05);
    }

    .fine-print {
      font-size: 11px; color: var(--t-tx6);
      letter-spacing: .05em; margin: 0; line-height: 1.6;
    }

    /* Right side */
    .hero-right {
      display: flex; flex-direction: column;
      align-items: flex-end;
      align-self: flex-end;
    }
    .version-badge {
      font-size: 10px; color: rgba(240,249,255,.22);
      letter-spacing: .10em; font-variant-numeric: tabular-nums;
      font-family: 'Barlow Condensed', sans-serif;
    }

    /* ── Feature cards ────────────────────────────────────── */
    .cards {
      position: relative; z-index: 10;
      flex-shrink: 0;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      height: clamp(88px, 14vh, 148px);
      border-top: 1px solid rgba(14,165,233,.12);
      background: rgba(6,9,18,.82);
      backdrop-filter: blur(16px);
    }

    .feat-card {
      display: flex;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      border-right: 1px solid rgba(255,255,255,.04);
      transition: background .20s;
    }
    .feat-card:last-child { border-right: none; }
    .feat-card:hover { background: rgba(255,255,255,.03); }

    /* Left accent bar */
    .card-accent {
      width: 3px;
      flex-shrink: 0;
      height: 100%;
      opacity: .85;
    }

    .card-body {
      flex: 1;
      display: flex; flex-direction: column; justify-content: center;
      padding: 14px 18px;
      min-width: 0;
    }
    .card-tag {
      display: block;
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 9px; font-weight: 700; letter-spacing: .20em;
      text-transform: uppercase; color: rgba(240,249,255,.35);
      margin-bottom: 4px;
    }
    .card-name {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: clamp(13px, 1.3vw, 18px);
      font-weight: 700; color: #f0f9ff;
      letter-spacing: .5px; line-height: 1.1;
      text-transform: uppercase;
    }
    .card-desc {
      font-size: 10px; color: rgba(240,249,255,.35);
      margin-top: 4px; line-height: 1.5;
    }

    /* ── Legal footer ─────────────────────────────────────── */
    .legal-bar {
      position: relative; z-index: 20;
      flex-shrink: 0;
      display: flex; align-items: center; justify-content: center; gap: 24px;
      height: 30px;
      border-top: 1px solid rgba(255,255,255,.03);
      background: rgba(0,0,0,.40);
    }
    .legal-copy {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 10px; color: var(--t-tx6);
      letter-spacing: .08em; text-transform: uppercase;
    }
    .legal-link {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 10px; font-weight: 700; letter-spacing: .08em;
      text-transform: uppercase;
      color: var(--t-tx5);
      text-decoration: none;
      transition: color .15s;
    }
    .legal-link:hover { color: var(--t-accent); }

    /* ── Responsive ───────────────────────────────────────── */
    @media (max-width: 960px) {
      .nav { padding: 0 24px; }

      .content {
        padding: 0 28px 20px;
        flex-direction: column;
        align-items: flex-start;
        justify-content: flex-end;
        gap: 0;
      }
      .hero-right { display: none; }
      .hero-left { max-width: 100%; }
      .title { font-size: clamp(56px, 14vw, 96px); }

      .cards { height: clamp(80px, 13vh, 120px); }
      .card-desc { display: none; }
      .card-body { padding: 10px 12px; }
    }

    @media (max-width: 640px) {
      .nav { height: 52px; padding: 0 18px; }
      .logo-text { font-size: 16px; letter-spacing: 3px; }
      .nav-link { display: none; }
      .title { font-size: clamp(48px, 15vw, 72px); }
      .tagline { display: none; }
      .cards { height: 84px; }
      .card-tag { display: none; }
      .card-name { font-size: 12px; }
      .cta-group { gap: 10px; }
    }

    @media (max-width: 400px) {
      .nav { padding: 0 14px; }
      .logo-icon { font-size: 14px; }
      .logo-text { font-size: 14px; }
      .content { padding: 0 16px 16px; }
      .btn-primary { padding: 12px 22px; }
      .cards { grid-template-columns: repeat(2, 1fr); height: auto; min-height: 80px; }
      .feat-card { min-height: 80px; }
    }

    /* Landscape muy corto */
    @media (max-height: 450px) and (orientation: landscape) {
      .nav { height: 44px; padding: 0 18px; }
      .logo-text { font-size: 14px; }

      .content {
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;
        padding: 0 22px 8px;
      }
      .hero-right { display: none; }
      .hero-left { gap: 6px; }
      .title { font-size: clamp(32px, 10vh, 54px); }
      .tagline { display: none; }
      .eyebrow { font-size: 10px; }
      .btn-primary { padding: 8px 18px; font-size: 13px; }
      .btn-ghost { padding: 8px 14px; font-size: 12px; }
      .fine-print { display: none; }

      .cards { height: 60px; }
      .card-tag { display: none; }
      .card-desc { display: none; }
      .card-name { font-size: 11px; }
      .card-body { padding: 8px 10px; }

      .legal-bar { height: 22px; }
    }
  `]
})
export class LandingComponent {
  readonly version = APP_VERSION;
}
