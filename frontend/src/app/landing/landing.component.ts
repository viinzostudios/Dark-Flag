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
      <div class="bg">
        <div class="bg-floor"></div>
        <div class="blob b1"></div>
        <div class="blob b2"></div>
        <div class="blob b3"></div>
        <div class="grid"></div>
      </div>

      <!-- ── Nav ─────────────────────────────────────── -->
      <nav class="nav">
        <span class="nav-logo">🏳️ <strong>DARK FLAG</strong></span>
        <div class="nav-links">
          <app-lang-selector variant="nav" />
          <button class="nav-btn" routerLink="/auth/login">{{ 'nav.login' | translate }}</button>
          <button class="nav-btn nav-accent" routerLink="/auth/register">{{ 'nav.register' | translate }}</button>
        </div>
      </nav>

      <!-- ── Hero — título izquierda / CTA derecha ────── -->
      <div class="content">

        <div class="cta-left">
          <span class="live-badge">🟢&nbsp;{{ 'landing.live_badge' | translate }}</span>
          <h1 class="title">DARK<br>FLAG</h1>
          <p class="tagline">Explora la oscuridad.&nbsp; Encuentra la bandera.&nbsp; Escapa de todos.</p>
        </div>

        <div class="cta-right">
          <button class="btn-play" routerLink="/lobby">
            <span class="play-icon">⚡</span>
            <span class="play-text">
              <span class="play-label">{{ 'landing.play_now' | translate }}</span>
              <span class="play-sub">{{ 'landing.play_sub' | translate }}</span>
            </span>
          </button>
          <p class="fine-print">{{ 'landing.fine_print' | translate }}</p>
          <span class="version-badge">v{{ version }}</span>
        </div>

      </div>

      <!-- ── Bottom cards strip ─────────────────────── -->
      <div class="cards">

        <div class="feat-card card-darkness" routerLink="/lobby">
          <div class="card-art card-icon">🔦</div>
          <div class="card-info">
            <span class="card-tag">Mecánica</span>
            <div class="card-name">Oscuridad total</div>
            <div class="card-desc">Solo ves lo que iluminas. Los rivales se ocultan en las sombras.</div>
          </div>
        </div>

        <div class="feat-card card-mace" routerLink="/lobby">
          <div class="card-art card-icon">⚡</div>
          <div class="card-info">
            <span class="card-tag">Combate</span>
            <div class="card-name">Mazo vs todos</div>
            <div class="card-desc">Un golpe aturde. Arrebata la bandera al portador en el momento exacto.</div>
          </div>
        </div>

        <div class="feat-card card-flag" routerLink="/lobby">
          <div class="card-art card-icon">🏳️</div>
          <div class="card-info">
            <span class="card-tag">Objetivo</span>
            <div class="card-name">Porta la bandera</div>
            <div class="card-desc">Recoge la bandera y llévala a la zona de entrega. Todos van a por ti.</div>
          </div>
        </div>

        <div class="feat-card card-levels" routerLink="/lobby">
          <div class="card-art card-icon">🏆</div>
          <div class="card-info">
            <span class="card-tag">Progresión</span>
            <div class="card-name">15 niveles</div>
            <div class="card-desc">Desbloquea mejoras únicas con cada nivel. Llega al nivel 15 y domina la arena.</div>
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

    /* ── Background ───────────────────────────────── */
    .bg { position: absolute; inset: 0; background: var(--t-bg); }

    .bg-floor {
      position: absolute; inset: 0;
      background: url('/assets/environment/bg-floor-tile.png') repeat center;
      background-size: 80px 80px;
      opacity: var(--t-floor-op, .08);
    }

    .blob { position: absolute; border-radius: 50%; filter: blur(110px); will-change: transform; }
    .b1 {
      width: 75vw; height: 75vw; max-width: 980px; max-height: 980px;
      background: var(--t-b1); opacity: var(--t-b1-op);
      top: -35%; left: -25%;
      animation: drift 22s ease-in-out infinite alternate;
    }
    .b2 {
      width: 60vw; height: 60vw; max-width: 780px; max-height: 780px;
      background: var(--t-b2); opacity: var(--t-b2-op);
      bottom: 10%; right: -18%;
      animation: drift 28s ease-in-out infinite alternate-reverse;
    }
    .b3 {
      width: 42vw; height: 42vw; max-width: 540px; max-height: 540px;
      background: var(--t-b3); opacity: var(--t-b3-op);
      top: 25%; right: 15%;
      animation: drift 18s ease-in-out infinite alternate;
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
      to   { transform: translate(44px,36px) scale(1.08); }
    }

    /* ── Nav ──────────────────────────────────────── */
    .nav {
      position: relative; z-index: 20;
      flex-shrink: 0;
      display: flex; align-items: center; justify-content: space-between;
      padding: 22px 54px;
    }
    .nav-logo {
      font-size: 12px; font-weight: 800; letter-spacing: 2.5px;
      color: var(--t-tx3); display: flex; align-items: center; gap: 6px;
      text-transform: uppercase;
    }
    .nav-links { display: flex; gap: 8px; }
    .nav-btn {
      padding: 8px 18px; border-radius: 8px;
      background: var(--t-ghost-bg);
      border: 1px solid var(--t-ghost-bd);
      color: var(--t-ghost-tx);
      font-size: 12px; font-weight: 600;
      cursor: pointer; font-family: inherit;
      transition: background .15s, border-color .15s;
    }
    .nav-btn:hover { background: var(--t-ghost-bg-h); }
    .nav-accent {
      background: var(--t-accent-bg);
      border-color: var(--t-accent-bd2);
      color: var(--t-accent);
    }
    .nav-accent:hover { border-color: var(--t-accent); }

    /* ── Content — split izquierda/derecha ───────── */
    .content {
      position: relative; z-index: 10;
      flex: 1;
      display: grid;
      grid-template-columns: 1fr auto;
      align-items: center;
      padding: 0 54px 24px;
      gap: 56px;
      min-height: 0;
    }

    /* Izquierda: badge + título + tagline */
    .cta-left {
      display: flex; flex-direction: column;
      gap: clamp(12px, 1.8vh, 22px);
    }

    .live-badge {
      display: inline-flex; align-items: center; gap: 6px;
      width: fit-content;
      padding: 5px 14px; border-radius: 100px;
      background: var(--t-badge-bg);
      border: 1px solid var(--t-badge-bd);
      color: var(--t-badge-tx);
      font-size: 10px; font-weight: 700; letter-spacing: .10em;
      text-transform: uppercase;
    }

    .title {
      font-size: clamp(54px, 9.5vw, 148px);
      font-weight: 900; line-height: .84;
      letter-spacing: -.03em;
      background: var(--t-title-grad);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text; margin: 0;
    }

    .tagline {
      font-size: clamp(12px, 1.2vw, 15px);
      color: var(--t-tx5); letter-spacing: .18em;
      text-transform: uppercase; margin: 0;
    }

    /* Derecha: botón + nota */
    .cta-right {
      display: flex; flex-direction: column;
      align-items: center; gap: 16px;
      flex-shrink: 0;
    }

    .btn-play {
      display: flex; align-items: center; gap: 14px;
      padding: clamp(16px, 2.2vh, 22px) clamp(24px, 3vw, 40px);
      background: linear-gradient(135deg, var(--t-accent-dk), var(--t-accent));
      border: none; border-radius: 16px;
      color: var(--t-on-accent);
      cursor: pointer; font-family: inherit;
      white-space: nowrap;
      animation: glow-pulse 2.4s ease-in-out infinite;
      transition: transform .15s;
    }
    .btn-play:hover {
      animation: none; transform: translateY(-4px);
      box-shadow: 0 0 70px var(--t-accent-glow2), 0 10px 36px rgba(0,0,0,.35);
    }
    .play-icon  { font-size: clamp(22px, 2.4vw, 30px); flex-shrink: 0; }
    .play-text  { display: flex; flex-direction: column; gap: 2px; text-align: left; }
    .play-label { font-size: clamp(16px, 1.9vw, 24px); font-weight: 900; letter-spacing: .05em; }
    .play-sub   { font-size: clamp(10px, .85vw, 12px); font-weight: 500; opacity: .65; }

    @keyframes glow-pulse {
      0%,100% { box-shadow: 0 0 32px var(--t-accent-glow), 0 4px 20px rgba(0,0,0,.30); }
      50%      { box-shadow: 0 0 64px var(--t-accent-glow2), 0 4px 20px rgba(0,0,0,.30); }
    }

    .fine-print {
      font-size: 11px; color: var(--t-tx6);
      letter-spacing: .04em; text-align: center;
      margin: 0; line-height: 1.6;
    }

    /* ── Bottom cards strip ───────────────────────── */
    .cards {
      position: relative; z-index: 10;
      flex-shrink: 0;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      height: clamp(155px, 21vh, 215px);
      border-top: 1px solid var(--t-bd);
    }

    .feat-card {
      overflow: hidden;
      cursor: pointer;
      display: flex;
      transition: filter .2s;
      border-right: 1px solid rgba(255,255,255,.05);
    }
    .feat-card:last-child { border-right: none; }
    .feat-card:hover { filter: brightness(1.14); }

    /* Fondos oscuros — paleta Dark Flag */
    .card-darkness { background: linear-gradient(155deg, #0d0818 0%, #1a0d3a 100%); }
    .card-mace     { background: linear-gradient(155deg, #0a0618 0%, #120a38 100%); }
    .card-flag     { background: linear-gradient(155deg, #1a1000 0%, #3a2200 100%); }
    .card-levels   { background: linear-gradient(155deg, #041018 0%, #062030 100%); }

    /* Icono emoji en lugar de imagen */
    .card-icon {
      font-size: clamp(28px, 3.5vw, 42px);
      display: flex; align-items: center; justify-content: center;
      filter: drop-shadow(0 2px 10px rgba(124,58,237,.55));
    }

    .card-art {
      flex-shrink: 0;
      width: clamp(88px, 11vw, 136px);
      display: flex; align-items: center; justify-content: center;
      padding: 14px 10px;
      position: relative; overflow: hidden;
    }
    .card-art-duo { gap: 2px; }

    .card-illus {
      width: clamp(64px, 9vw, 110px);
      height: clamp(64px, 9vw, 110px);
      object-fit: contain;
      filter: drop-shadow(0 3px 14px rgba(0,0,0,.65));
    }

    .card-info {
      flex: 1;
      display: flex; flex-direction: column; justify-content: center;
      padding: 12px 14px 12px 0;
      min-width: 0;
    }
    .card-tag {
      display: block;
      font-size: 9px; font-weight: 700; letter-spacing: .14em;
      text-transform: uppercase; color: rgba(255,255,255,.40);
      margin-bottom: 4px;
    }
    .card-name { font-size: clamp(13px, 1.3vw, 17px); font-weight: 800; color: #fff; line-height: 1.2; }
    .card-desc { font-size: 11px; color: rgba(255,255,255,.38); margin-top: 3px; }

    /* ── Responsive ───────────────────────────────── */
    @media (max-width: 960px) {
      .nav { padding: 16px 24px; }

      .content {
        grid-template-columns: 1fr;
        grid-template-rows: 1fr auto;
        padding: 0 28px 20px;
        gap: 20px;
        align-items: end;
      }
      .cta-left { align-items: flex-start; }
      .title { font-size: clamp(40px, 12vw, 68px); }
      .cta-right { align-items: flex-start; }

      .cards { height: clamp(138px, 19vh, 175px); }
      .card-art { width: clamp(70px, 10vw, 96px); padding: 10px 8px; }
      .card-info { padding: 10px 10px 10px 0; }
      .card-desc { display: none; }
    }

    @media (max-width: 640px) {
      .nav-links { gap: 6px; }
      .nav-links .nav-btn:first-child { display: flex; }
      .nav-links .nav-accent { background: transparent; border-color: transparent; color: var(--t-tx4); font-size: 11px; padding: 5px 8px; }
      .title { font-size: clamp(32px, 13vw, 52px); }
      .tagline { display: none; }
      .cards { height: 148px; }
      .card-tag { display: none; }
      .card-name { font-size: 12px; }
    }

    /* Teléfonos pequeños (<400px) */
    @media (max-width: 400px) {
      .nav { padding: 14px 16px; }
      .nav-logo { font-size: 10px; letter-spacing: 1.5px; }
      .nav-btn { padding: 6px 12px; font-size: 11px; }
      .content { padding: 0 18px 16px; gap: 14px; }
      .btn-play { padding: 14px 18px; gap: 10px; }
      .cards { grid-template-columns: repeat(2, 1fr); height: auto; min-height: 120px; }
      .feat-card { flex-direction: column; align-items: center; padding: 10px 6px; }
      .card-art { width: 100%; height: 54px; padding: 6px; }
      .card-info { padding: 0 6px 8px; align-items: center; text-align: center; }
    }

    /* ── Legal footer bar ────────────────────────── */
    .legal-bar {
      position: relative; z-index: 20;
      flex-shrink: 0;
      display: flex; align-items: center; justify-content: center; gap: 20px;
      height: 28px;
      border-top: 1px solid rgba(255,255,255,.04);
      background: rgba(0,0,0,.18);
    }
    .legal-copy {
      font-size: 10px; color: var(--t-tx6, rgba(255,255,255,.22));
      letter-spacing: .04em;
    }
    .legal-link {
      font-size: 10px; font-weight: 600; letter-spacing: .04em;
      color: var(--t-tx5, rgba(255,255,255,.35));
      text-decoration: none;
      transition: color .15s;
    }
    .legal-link:hover { color: var(--t-accent, #5B6AF7); }
    .version-badge {
      font-size: 10px; color: rgba(255,255,255,.25);
      letter-spacing: .08em; font-variant-numeric: tabular-nums;
    }

    /* ── Móvil landscape: todos los elementos, distribuidos ── */
    @media (max-height: 450px) and (orientation: landscape) {
      .nav { padding: 7px 18px; }

      /* Restaura 2 columnas (override del breakpoint max-width: 960px) */
      .content {
        grid-template-columns: 1fr auto;
        grid-template-rows: auto;
        align-items: center;
        padding: 0 20px 8px;
        gap: 24px;
      }
      .cta-left { gap: 6px; }
      .cta-right { align-items: center; }

      .live-badge { padding: 3px 10px; font-size: 9px; }
      .tagline    { font-size: 10px; letter-spacing: .12em; }
      .title      { font-size: clamp(32px, 10vh, 54px); }

      .btn-play   { padding: 8px 14px; gap: 8px; }
      .play-icon  { font-size: 17px; }
      .play-label { font-size: 13px; }
      .play-sub   { display: none; }
      .fine-print { font-size: 9px; line-height: 1.4; text-align: center; }

      /* Cards compactas pero visibles */
      .cards     { height: 72px; }
      .card-art  { width: 52px; padding: 6px 4px; }
      .card-illus { width: 38px; height: 38px; }
      .card-tag  { display: none; }
      .card-desc { display: none; }
      .card-name { font-size: 11px; }
      .card-info { padding: 0 8px 0 0; justify-content: center; }

      .legal-bar { height: 20px; }
    }
  `]
})
export class LandingComponent {
  readonly version = APP_VERSION;
}
