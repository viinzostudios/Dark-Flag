import {
  Component, ElementRef, ViewChild, HostListener,
  AfterViewInit, OnDestroy, inject, signal,
} from '@angular/core';
import Phaser from 'phaser';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { buildPhaserConfig } from './game.config';
import { GameSocketService } from '../core/services/game-socket.service';
import { AuthService } from '../core/services/auth.service';
import { AdsService } from '../core/services/ads.service';
import { GameStateSignalService } from '../core/services/game-state-signal.service';
import { DeathOverlayComponent } from './death-overlay/death-overlay.component';
import { Subscription } from 'rxjs';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [DeathOverlayComponent],
  template: `
    <div class="game-root">
      <div #gameContainer class="phaser-layer"></div>

      <!-- Botón flotante de salida + código de sala -->
      @if (!isDead() && !showExitConfirm()) {
        <button class="exit-fab" (click)="requestExit()" title="Salir al lobby">☰</button>
        @if (roomId()) {
          <div class="room-chip" (click)="copyRoomLink()" title="Copiar link de sala">
            🔗 {{ roomId()!.slice(-6).toUpperCase() }}
          </div>
        }
      }

      @if (isDead()) {
        <app-death-overlay
          class="overlay-layer"
          [scoreGained]="scoreGained()"
          [leaderboardRank]="rank()"
          [deathTimestamp]="deathTimestamp()"
          [isAnonymous]="isAnonymous"
          [killerName]="killerName()"
          (onRespawn)="handleRespawn($event)"
          (onExit)="handleExit()"
        />
      }

      @if (showExitConfirm()) {
        <div class="exit-overlay">
          <div class="exit-card">
            <p class="exit-title">¿Salir al lobby?</p>
            <p class="exit-sub">Tu partida terminará y perderás el progreso no guardado.</p>
            <div class="exit-actions">
              <button class="btn-confirm" (click)="handleExit()">Sí, salir</button>
              <button class="btn-cancel" (click)="showExitConfirm.set(false)">Cancelar</button>
            </div>
          </div>
        </div>
      }

      @if (initError()) {
        <div class="error-overlay">
          <div class="error-card">
            <p class="error-title">⚠ Error al cargar el juego</p>
            <p class="error-msg">{{ initError() }}</p>
            <button (click)="handleExit()">Volver al lobby</button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; width: 100vw; height: 100vh; overflow: hidden; background: #07071a; }
    .game-root { position: relative; width: 100%; height: 100%; }
    .phaser-layer { position: absolute; inset: 0; }
    .overlay-layer { position: absolute; inset: 0; }

    /* Chip de código de sala */
    .room-chip {
      position: absolute;
      top: 12px; right: 58px;
      z-index: 50;
      background: rgba(0,0,0,0.55);
      border: 1px solid rgba(255,255,255,0.18);
      color: rgba(255,255,255,0.7);
      border-radius: 8px;
      padding: 0 10px;
      height: 38px;
      font-family: monospace;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1px;
      cursor: pointer;
      display: flex; align-items: center; gap: 4px;
      touch-action: manipulation;
      transition: background 0.15s, color 0.15s;
      user-select: none;
    }
    .room-chip:hover { background: rgba(0,0,0,0.8); color: #fff; }

    /* Botón flotante de salida — siempre visible en móvil, discreto en desktop */
    .exit-fab {
      position: absolute;
      top: 12px; right: 12px;
      z-index: 50;
      background: rgba(0,0,0,0.55);
      border: 1px solid rgba(255,255,255,0.18);
      color: rgba(255,255,255,0.7);
      border-radius: 8px;
      width: 38px; height: 38px;
      font-size: 18px;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      touch-action: manipulation;
      transition: background 0.15s, color 0.15s;
    }
    .exit-fab:hover { background: rgba(0,0,0,0.8); color: #fff; }

    /* Modal de confirmación de salida */
    .exit-overlay {
      position: absolute; inset: 0;
      background: rgba(0,0,0,0.72);
      display: flex; align-items: center; justify-content: center;
      z-index: 80;
    }
    .exit-card {
      background: #1e1e2e;
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 14px;
      padding: 28px 32px;
      width: min(340px, 88vw);
      font-family: 'Inter', monospace;
      display: flex; flex-direction: column; gap: 16px;
      text-align: center;
    }
    .exit-title { color: #fff; font-size: 18px; font-weight: 700; margin: 0; }
    .exit-sub { color: #aaa; font-size: 13px; margin: 0; line-height: 1.5; }
    .exit-actions { display: flex; gap: 10px; }
    .btn-confirm, .btn-cancel {
      flex: 1; padding: 11px; border: none; border-radius: 8px;
      font-size: 14px; font-weight: 600; cursor: pointer;
      font-family: inherit; touch-action: manipulation;
      transition: opacity 0.15s;
    }
    .btn-confirm:hover, .btn-cancel:hover { opacity: 0.85; }
    .btn-confirm { background: #e74c3c; color: #fff; }
    .btn-cancel  { background: rgba(255,255,255,0.1); color: #ccc; }

    .error-overlay {
      position: absolute; inset: 0;
      display: flex; align-items: center; justify-content: center;
      background: rgba(0,0,0,0.85); z-index: 99;
    }
    .error-card {
      background: #1e1e2e; border: 1px solid #e74c3c;
      border-radius: 12px; padding: 28px 32px;
      text-align: center; max-width: 340px;
      font-family: monospace; color: #eee;
      display: flex; flex-direction: column; gap: 12px;
    }
    .error-title { font-size: 16px; font-weight: 700; color: #e74c3c; margin: 0; }
    .error-msg { font-size: 12px; color: #aaa; margin: 0; word-break: break-word; }
    .error-card button {
      background: #e74c3c; border: none; color: #fff;
      border-radius: 8px; padding: 10px; cursor: pointer; font-size: 13px;
    }
  `],
})
export class GameComponent implements AfterViewInit, OnDestroy {
  @ViewChild('gameContainer', { static: true })
  private containerRef!: ElementRef<HTMLDivElement>;

  private phaserGame: Phaser.Game | null = null;
  private subs: Subscription[] = [];
  private readonly popstateHandler = () => {
    // Restaurar la entrada de historial para que el siguiente "atrás" vuelva a disparar el modal
    history.pushState(null, '');
    this.requestExit();
  };

  private readonly router         = inject(Router);
  private readonly socketService  = inject(GameSocketService);
  private readonly authService    = inject(AuthService);
  private readonly adsService     = inject(AdsService);
  private readonly stateSignal    = inject(GameStateSignalService);
  private readonly http           = inject(HttpClient);
  private readonly translate      = inject(TranslateService);

  readonly isDead         = this.stateSignal.isDead;
  readonly scoreGained    = this.stateSignal.scoreGained;
  readonly rank           = this.stateSignal.leaderboardRank;
  readonly deathTimestamp = this.stateSignal.deathTimestamp;
  readonly killerName     = this.stateSignal.killerName;
  readonly initError      = signal<string | null>(null);
  readonly showExitConfirm = signal(false);
  readonly roomId = signal<string | null>(null);

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (!this.isDead() && !this.showExitConfirm()) {
      this.showExitConfirm.set(true);
    } else if (this.showExitConfirm()) {
      this.showExitConfirm.set(false);
    }
  }

  requestExit(): void {
    if (this.isDead()) return; // ya hay overlay de muerte
    this.showExitConfirm.set(true);
  }

  ngAfterViewInit(): void {
    if (!this.socketService.isConnected) {
      void this.router.navigate(['/lobby']);
      return;
    }

    // Defensive reset: ensure no stale isDead state from a previous session
    this.stateSignal.reset();

    // Botón atrás de Android → muestra confirm de salida en lugar de navegar
    history.pushState(null, '');
    window.addEventListener('popstate', this.popstateHandler);

    // Capturar roomId para el chip de sala
    this.roomId.set(this.socketService.currentRoomId);
    this.subs.push(
      this.socketService.onRoomJoined$.subscribe(room => this.roomId.set(room.roomId)),
      this.socketService.onPlayerKicked$.subscribe(({ playerId }) => {
        if (playerId === this.socketService.socketId) {
          this.handleExit();
        }
      }),
    );

    try {
      const config = buildPhaserConfig(
        this.containerRef.nativeElement,
        this.socketService,
        this.adsService,
        this.stateSignal,
        (key, params) => this.translate.instant(key, params),
      );
      this.phaserGame = new Phaser.Game(config);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[GameComponent] Phaser init error:', err);
      this.initError.set(msg);
    }
  }

  handleRespawn(_bonus?: 'ammo' | 'walls'): void {
    this.socketService.respawn();
  }

  copyRoomLink(): void {
    const id = this.roomId();
    if (!id) return;
    const url = `${window.location.origin}/lobby?room=${id}`;
    navigator.clipboard.writeText(url).catch(() => {});
  }

  readonly isAnonymous = !this.authService.isLoggedIn;

  handleExit(): void {
    this.recordSession();
    this.adsService.incrementExitCount();
    this.adsService.showExitInterstitial();
    this.socketService.leaveGame();
    this.socketService.disconnect();
    void this.router.navigate(['/lobby']);
  }

  private recordSession(): void {
    const score    = this.stateSignal.totalScore();
    const deaths   = this.stateSignal.totalDeaths();
    const kills    = Math.round(score / 10);
    const duration = this.stateSignal.sessionStartMs
      ? Math.round((Date.now() - this.stateSignal.sessionStartMs) / 1000)
      : 0;

    // Save to localStorage for lobby "última sesión"
    localStorage.setItem('ast_last_score', String(score));
    localStorage.setItem('ast_last_time', duration > 0
      ? `${Math.floor(duration / 60)}m ${duration % 60}s`
      : '—');

    // Persist to API if logged in (fire-and-forget)
    if (this.authService.isLoggedIn && duration >= 1) {
      this.http.post(`${environment.apiUrl}/stats/session`, {
        kills,
        deaths,
        score,
        durationSeconds: duration,
        isWinner: false,
        bestSurvivalSeconds: this.stateSignal.bestSurvivalSeconds(),
        highLevelKills: this.stateSignal.highLevelKills(),
      }).subscribe({ error: () => {} });

      // Reward coins for the session
      this.http.post(`${environment.apiUrl}/economy/session-reward`, {
        kills,
        durationSeconds: duration,
      }).subscribe({ error: () => {} });
    }
  }

  ngOnDestroy(): void {
    window.removeEventListener('popstate', this.popstateHandler);
    for (const s of this.subs) s.unsubscribe();
    this.phaserGame?.destroy(true);
    this.phaserGame = null;
    this.stateSignal.reset();
    // Always clean up socket regardless of how the user exits
    this.socketService.leaveGame();
    this.socketService.disconnect();
  }
}
