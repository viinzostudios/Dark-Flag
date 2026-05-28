import Phaser from 'phaser';
import { GAME, COLORS, getArenaColor, scoreToLevel } from '../constants';
import { SPRITESHEET_CHARS } from './PreloadScene';
import { PlayerTank } from '../objects/PlayerTank';
import { RemoteTank } from '../objects/RemoteTank';
import { FlagObject } from '../objects/FlagObject';
import { DestinationZone } from '../objects/DestinationZone';
import { TrapObject } from '../objects/TrapObject';
import { PowerUpPickup } from '../objects/PowerUpPickup';
import { DesktopInput } from '../input/DesktopInput';
import { MobileInput } from '../input/MobileInput';
import { HUD } from '../ui/HUD';
import { AudioManager } from '../audio/AudioManager';
import { TranslateFn } from '../game.config';
import {
  GameSocketService, GameStateEvent, PlayerSnapshot,
  StaticObstacleSnapshot, ClientInput, PowerUpSnapshot, TrapSnapshot,
} from '../../core/services/game-socket.service';
import { GameStateSignalService } from '../../core/services/game-state-signal.service';
import { Subscription } from 'rxjs';

function isTouchDevice(): boolean {
  return /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Retraso de interpolación para remotos: permite acumular al menos 2-3 estados antes de renderizar
const INTERP_DELAY_MS = isTouchDevice() ? 200 : 100;

// ─── GameScene ────────────────────────────────────────────────────────────────

export class GameScene extends Phaser.Scene {
  private player!: PlayerTank;
  private localPlayerId = '';
  private hud: HUD | null = null;
  private audio: AudioManager | null = null;
  private isMobile = false;
  private translateFn: TranslateFn = (k) => k;

  // Remote players
  private remoteTanks = new Map<string, RemoteTank>();

  // Game objects
  private flagObject!: FlagObject;
  private destinationZone!: DestinationZone;
  private traps     = new Map<string, TrapObject>();
  private powerUps  = new Map<string, PowerUpPickup>();
  private obstacleImages: Phaser.GameObjects.Image[] = [];

  // Darkness: full-screen RenderTexture filled with black; flashlight cone erased each frame
  private darkOverlay: Phaser.GameObjects.RenderTexture | null = null;
  private flashlightGfx: Phaser.GameObjects.Graphics | null = null;

  // Socket
  private socketService: GameSocketService | null = null;
  private gameStateSignal: GameStateSignalService | null = null;
  private socketSubs: Subscription[] = [];

  // Input & prediction
  private pendingInputs: Array<ClientInput & { time: number }> = [];
  private clientTick  = 0;
  private lastInputSend = 0;
  private snapCooldownUntil = 0;

  // Map dimensions
  private mapW: number = GAME.MAP_WIDTH;
  private mapH: number = GAME.MAP_HEIGHT;

  // Local player state (authoritative copy from server)
  private localScore  = 0;
  private localLevel  = 1;
  private localHasFlag    = false;
  private localIsDead     = false;
  private localIsGhost    = false;
  private localLightOn    = true;
  private localInvincibleUntil = 0;
  private localActivePower: import('../../core/services/game-socket.service').PowerUpType | null = null;
  private localPowerExpiresAt = 0;

  // Track death/respawn
  private localRespawnAt = 0;
  private pendingMacerName: string | null = null;
  private deathOverlayTimer: Phaser.Time.TimerEvent | null = null;

  // Last game state for flashlight + visibility updates
  private lastPlayers: PlayerSnapshot[] = [];
  private lastBlackoutUntil = 0;
  private leaderboard: GameStateEvent['leaderboard'] = [];

  // World text cooldown
  private lastWorldTextAt = 0;

  // Debug state counter
  private _dbgCount = 0;
  private _dbgLastAt = 0;

  constructor() {
    super({ key: 'GameScene' });
  }

  // ─── Create ───────────────────────────────────────────────────────────────

  create(): void {
    const t = this.registry.get('translateFn') as TranslateFn | undefined;
    if (t) this.translateFn = t;

    this.input.mouse?.disableContextMenu();

    this.createPlayer();

    // Persistent game objects (created once, updated every frame)
    this.flagObject      = new FlagObject(this);
    this.destinationZone = new DestinationZone(this);

    // Flashlight cone graphics — invisible to scene camera, used only as erase() source
    this.flashlightGfx = this.add.graphics().setScrollFactor(0).setDepth(49).setVisible(false);

    this.audio = new AudioManager();
    this.setupSocket();
    this.setupSignals();

    this.scale.on('resize', () => {
      this.player?.onResize();
      this.rebuildDarkOverlay();
    });
  }

  // ─── Socket ───────────────────────────────────────────────────────────────

  private setupSocket(): void {
    const svc = this.registry.get('socketService') as GameSocketService | undefined;
    if (!svc) return;
    this.socketService = svc;

    this.socketSubs.push(
      svc.onRoomJoined$.subscribe(({ playerId, config, initialState, obstacles }) => {
        this.localPlayerId = playerId;
        this.mapW = config?.mapWidth  ?? initialState.mapWidth  ?? GAME.MAP_WIDTH;
        this.mapH = config?.mapHeight ?? initialState.mapHeight ?? GAME.MAP_HEIGHT;

        this.createArena();
        this.setupCamera();
        this.createObstacles(obstacles ?? []);

        const me = initialState.players.find((p: PlayerSnapshot) => p.id === playerId);
        if (me?.characterSlug) {
          localStorage.setItem('df_active_character', me.characterSlug);
        }

        this.applyGameState(initialState);
        this.loadRemoteCharacters(initialState.players, playerId);
        this.audio?.startMusic();
      }),

      svc.onPlayerLeft$.subscribe(({ playerId }) => {
        this.remoteTanks.get(playerId)?.destroy();
        this.remoteTanks.delete(playerId);
      }),

      svc.onGameState$.subscribe(state => this.applyGameState(state)),

      // ── Dark Flag–specific events ────────────────────────────────────────
      svc.onFlagPicked$.subscribe(({ playerName }) => {
        const isMe = playerName === this.localPlayerId;
        const txt = isMe ? '🚩 ¡TOMASTE LA BANDERA!' : `🚩 ${playerName.slice(0, 12)} tomó la bandera`;
        this.hud?.pushFeedEvent(txt, isMe ? '#ef4444' : '#f59e0b');
        this.audio?.playPickup?.();
      }),

      svc.onFlagDropped$.subscribe(() => {
        this.hud?.pushFeedEvent('🚩 Bandera caída', '#f59e0b');
      }),

      svc.onFlagDelivered$.subscribe(({ playerName }) => {
        const isMe = playerName === this.localPlayerId;
        const txt = isMe ? '🏆 ¡ENTREGASTE LA BANDERA!' : `🏆 ${playerName.slice(0, 12)} entregó la bandera`;
        this.hud?.pushFeedEvent(txt, isMe ? '#10b981' : '#6b7280');
        if (isMe) this.spawnCelebration(this.player.x, this.player.y);
        this.audio?.playPickup?.();
      }),

      svc.onMaced$.subscribe(({ attackerId, targetId, targetName }) => {
        const iAmTarget   = targetId   === this.localPlayerId;
        const iAmAttacker = attackerId === this.localPlayerId;
        if (iAmTarget) {
          this.pendingMacerName = attackerId;
          this.spawnStunEffect(this.player.x, this.player.y);
          this.hud?.pushFeedEvent('⚡ ¡FUI GOLPEADO!', '#ff4444');
        } else if (iAmAttacker) {
          this.hud?.pushFeedEvent(`⚡ Golpeaste a ${targetName.slice(0, 10)}`, '#00e5ff');
        } else {
          this.hud?.pushFeedEvent(`⚡ ${targetName.slice(0, 10)} fue golpeado`, '#888888');
        }
        const rt = this.remoteTanks.get(targetId);
        if (rt) this.spawnStunEffect(rt.getPosition().x, rt.getPosition().y);
      }),

      svc.onTrapTriggered$.subscribe(({ playerId }) => {
        const isMe = playerId === this.localPlayerId;
        if (isMe) this.hud?.pushFeedEvent('🔴 ¡TRAMPA ACTIVADA!', '#ff4444');
      }),

      svc.onPowerUpPicked$.subscribe(({ playerId, type }) => {
        const isMe = playerId === this.localPlayerId;
        if (isMe) {
          this.hud?.pushFeedEvent(`✨ PODER: ${type}`, '#ffd600');
          this.spawnPickupRing(this.player.x, this.player.y, true);
        }
      }),
    );

    this.events.on('destroy', () => this.teardownSocket());
  }

  private setupSignals(): void {
    const sig = this.registry.get('gameStateSignal') as GameStateSignalService | undefined;
    if (!sig) return;
    this.gameStateSignal = sig;
    sig.reset();
    sig.onSessionStart();
  }

  private teardownSocket(): void {
    for (const sub of this.socketSubs) sub.unsubscribe();
    this.socketSubs = [];
    this.remoteTanks.forEach(t => t.destroy());
    this.remoteTanks.clear();
    this.traps.forEach(t => t.destroy());
    this.traps.clear();
    this.powerUps.forEach(p => p.destroy());
    this.powerUps.clear();
    this.flagObject?.destroy();
    this.destinationZone?.destroy();
    this.player?.destroyStrategy();
    this.audio?.destroy();
    this.darkOverlay?.destroy();
    this.darkOverlay = null;
    this.flashlightGfx?.destroy();
    this.flashlightGfx = null;
  }

  // ─── Update ───────────────────────────────────────────────────────────────

  override update(time: number, delta: number): void {
    if (!this.localPlayerId) return;

    this.player.update(time, delta);

    if (time - this.lastInputSend > 33) {
      this.sendInput(time);
      this.lastInputSend = time;
    }

    // Interpolate remote tanks
    const renderTime = Date.now() - INTERP_DELAY_MS;
    this.remoteTanks.forEach(rt => rt.interpolate(renderTime));

    // Dark overlay: erase flashlight cones for all visible lit players
    this.updateDarkness();

    // Alpha effects: ghost blink (250 ms) overrides invincibility blink (120 ms)
    const now = Date.now();
    if (this.localIsGhost) {
      const blinkOn = Math.floor(now / 250) % 2 === 0;
      this.player.setVisualAlpha(blinkOn ? 0.55 : 0.2);
    } else if (this.localInvincibleUntil > now) {
      const blinkOn = Math.floor(now / GAME.BLINK_INTERVAL_MS) % 2 === 0;
      this.player.setVisualAlpha(blinkOn ? 1 : 0.3);
    } else {
      this.player.setVisualAlpha(1);
    }

    // HUD
    const myRank     = this.leaderboard.findIndex(e => e.id === this.localPlayerId) + 1;
    const totalCount = this.lastPlayers.length;

    this.hud?.update(
      this.localScore,
      this.localLevel,
      this.player.maceCooldownRemaining(time),
      this.localHasFlag,
      time,
      this.leaderboard,
      totalCount,
      myRank,
      this.localPlayerId,
      this.localActivePower,
      this.localPowerExpiresAt,
    );
  }

  // ─── Dark overlay / flashlight ────────────────────────────────────────────

  private rebuildDarkOverlay(): void {
    this.darkOverlay?.destroy();
    this.darkOverlay = null;

    const { width, height } = this.scale;
    const cam = this.cameras.main;
    const zoom = cam?.zoom || 1;
    // RT spans full screen in world units: width/zoom × height/zoom.
    // cam.x ≠ 0 when zoom ≠ 1 (Phaser shifts viewport), but the texture size
    // only needs to cover screenW/zoom world units regardless of cam.x.
    const texW = Math.ceil(width  / zoom) + 4;
    const texH = Math.ceil(height / zoom) + 4;
    this.darkOverlay = this.add.renderTexture(0, 0, texW, texH)
      .setDepth(50).setOrigin(0, 0);
  }

  private updateDarkness(): void {
    if (!this.darkOverlay || !this.flashlightGfx) return;

    const cam = this.cameras.main;
    const isBlackout = Date.now() < this.lastBlackoutUntil;
    const alpha = isBlackout ? 0.995 : 0.97;

    // getWorldPoint(0,0) is the authoritative world position that maps to screen (0,0),
    // accounting for all camera transforms (scroll, zoom, cam.x/cam.y offsets).
    const topLeft = cam.getWorldPoint(0, 0);
    const rtX = topLeft.x;
    const rtY = topLeft.y;
    this.darkOverlay.setPosition(rtX, rtY);
    this.darkOverlay.setAlpha(1);

    this.flashlightGfx.clear();

    // REVELATION: ocultar overlay por completo → visibilidad total del escenario
    if (this.localActivePower === 'REVELATION') {
      this.darkOverlay.setAlpha(0);
      return;
    }

    const seeOthers = this.localActivePower === 'SEE_OTHERS';

    for (const p of this.lastPlayers) {
      if (!p.lightOn || p.isDead) continue;
      if (isBlackout && p.id !== this.localPlayerId) continue;

      let wx: number, wy: number, angle: number;
      if (p.id === this.localPlayerId) {
        wx = this.player.x;
        wy = this.player.y;
        angle = this.player.aimAngle;
      } else {
        const rt = this.remoteTanks.get(p.id);
        if (!rt) continue;
        const pos = rt.getPosition();

        if (!seeOthers) {
          // Solo dibuja la linterna ajena si los conos se cruzan:
          // ellos están en mi cono O yo estoy en el suyo
          const theyInMyCone = this.isPointIlluminated(pos.x, pos.y);
          const iInTheirCone = this.isPointInCone(
            this.player.x, this.player.y,
            pos.x, pos.y, p.aimAngle, p.level,
          );
          if (!theyInMyCone && !iInTheirCone) continue;
        }

        wx = pos.x; wy = pos.y; angle = p.aimAngle;
      }

      // Cone drawn in WORLD coordinates (zoom=1 → world units)
      this.drawFlashlightCone(this.flashlightGfx, wx, wy, angle, 1, p.level);
    }

    // Fill RT black, erase cone. Erase offset = -rtX/-rtY maps world→texture-local coords.
    // render() MUST be called — fill/erase only queue commands in Phaser 4.
    this.darkOverlay.fill(0x000000, alpha);
    this.darkOverlay.erase(this.flashlightGfx, -rtX, -rtY);
    this.darkOverlay.render();
  }

  private drawFlashlightCone(
    gfx: Phaser.GameObjects.Graphics,
    sx: number,
    sy: number,
    angle: number,
    zoom: number,
    level = 1,
  ): void {
    const levelBonus = Math.min(level - 1, GAME.MAX_LEVEL - 1);
    const coneAngle  = GAME.LIGHT_CONE_ANGLE + (levelBonus * 2 * Math.PI / 180);
    const range      = (GAME.LIGHT_CONE_RANGE + levelBonus * 8) * zoom;
    const halfAngle  = coneAngle / 2;
    const playerR    = GAME.PLAYER_RADIUS * zoom;
    const rays       = GAME.LIGHT_RAY_COUNT;

    gfx.fillStyle(0xffffff, 1);

    // Small ambient circle around the player (always visible near self)
    gfx.fillCircle(sx, sy, playerR + 6 * zoom);

    // Main cone
    gfx.beginPath();
    gfx.moveTo(sx, sy);
    for (let i = 0; i <= rays; i++) {
      const a = angle - halfAngle + (i / rays) * coneAngle;
      gfx.lineTo(sx + Math.cos(a) * range, sy + Math.sin(a) * range);
    }
    gfx.closePath();
    gfx.fillPath();

    // Soft edge: slightly wider cone at lower alpha (extends the visible area a bit)
    gfx.fillStyle(0xffffff, 0.35);
    gfx.beginPath();
    gfx.moveTo(sx, sy);
    for (let i = 0; i <= rays; i++) {
      const a = angle - halfAngle + (i / rays) * coneAngle;
      gfx.lineTo(sx + Math.cos(a) * range * 1.18, sy + Math.sin(a) * range * 1.18);
    }
    gfx.closePath();
    gfx.fillPath();
  }

  // ─── Input & client-side prediction ──────────────────────────────────────

  private sendInput(time: number): void {
    if (!this.socketService || this.localIsDead) return;

    const angle       = this.player.getAngle();
    const speedFactor = this.player.getSpeed();
    const mace        = this.player.consumeMaceIntent(time);
    const toggleLight = this.player.consumeToggleLightIntent();
    const pulse       = this.player.consumePulseIntent();

    if (pulse) this.socketService.usePulse();

    const input: ClientInput = {
      mouseAngle:  angle,
      speedFactor,
      aimAngle:    this.player.aimAngle,
      mace,
      toggleLight,
      pulse,
      clientTick:  this.clientTick++,
    };

    // Client-side position prediction
    if (speedFactor > 0 && Date.now() >= this.snapCooldownUntil) {
      const dt = 33 / 1000;
      const speed = speedFactor * GAME.MAX_SPEED * (this.localActivePower === 'SPRINT' ? 1.5 : 1);
      const newX = Math.max(GAME.PLAYER_RADIUS, Math.min(this.mapW - GAME.PLAYER_RADIUS,
        this.player.x + Math.cos(angle) * speed * dt));
      const newY = Math.max(GAME.PLAYER_RADIUS, Math.min(this.mapH - GAME.PLAYER_RADIUS,
        this.player.y + Math.sin(angle) * speed * dt));
      this.player.setPosition(newX, newY);
    }

    this.socketService.sendInput(input);
  }

  // ─── Server state reconciliation ─────────────────────────────────────────

  private applyGameState(state: GameStateEvent): void {
    this.leaderboard = state.leaderboard;
    this.lastPlayers = state.players;
    this.lastBlackoutUntil = state.blackoutUntil ?? 0;

    const me = state.players.find(p => p.id === this.localPlayerId);
    if (me) {
      const wasDead = this.localIsDead;
      this.localIsDead    = me.isDead;
      this.localHasFlag   = me.hasFlag;
      this.localScore     = me.score;
      this.localLevel     = me.level;
      this.localLightOn   = me.lightOn;
      this.localIsGhost   = me.isGhost;
      this.localInvincibleUntil = me.invincibleUntil;
      this.localActivePower     = me.activePowerType;
      this.localPowerExpiresAt  = me.powerExpiresAt;

      // Sync mace cooldown from server
      // Server sends stunUntil for stun end — use as proxy for mace CD sync
      // Actual mace CD is tracked locally via consumeMaceIntent

      this.player.isDead    = me.isDead;
      this.player.hasFlag   = me.hasFlag;
      this.player.level     = me.level;
      this.player.isStunned = me.isStunned;
      this.player.lightOn   = me.lightOn;

      if (!me.isDead && wasDead) {
        // Respawn
        if (this.deathOverlayTimer) { this.deathOverlayTimer.remove(false); this.deathOverlayTimer = null; }
        this.player.setPosition(me.x, me.y);
        this.snapCooldownUntil = Date.now() + (this.isMobile ? 400 : 0);
        this.spawnSpawnEffect(me.x, me.y);
        this.gameStateSignal?.onPlayerRespawned(this.localScore);
      } else if (!me.isDead) {
        // Server reconciliation
        const dx = me.x - this.player.x;
        const dy = me.y - this.player.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > 2500) {
          this.player.setPosition(me.x, me.y);
        } else if (this.isMobile && d2 > 100) {
          const alpha = this.player.getSpeed() > 0 ? 0.05 : 0.12;
          this.player.setPosition(this.player.x + dx * alpha, this.player.y + dy * alpha);
        } else if (!this.isMobile && d2 > 9) {
          this.player.setPosition(this.player.x + dx * 0.85, this.player.y + dy * 0.85);
        }
      }

      if (me.isDead && !wasDead) {
        this.localRespawnAt = state.serverTime + GAME.RESPAWN_DELAY_MS;
        this.spawnExplosion(me.x, me.y);
        this.audio?.playDeath?.();
        const rank = state.leaderboard.find(e => e.id === this.localPlayerId)?.rank ?? 0;
        this.deathOverlayTimer = this.time.delayedCall(2500, () => {
          this.deathOverlayTimer = null;
          this.gameStateSignal?.onPlayerDied(this.localScore, rank, this.pendingMacerName);
          this.pendingMacerName = null;
        });
      }

      this.gameStateSignal?.onScoreUpdate(me.score);
    }

    // ── Remote players ────────────────────────────────────────────────────
    const now     = Date.now();
    const seenIds = new Set<string>();

    for (const p of state.players) {
      if (p.id === this.localPlayerId) continue;
      seenIds.add(p.id);

      let rt = this.remoteTanks.get(p.id);
      if (!rt) {
        rt = new RemoteTank(this, p.id, p.x, p.y, p.username, p.characterSlug);
        this.remoteTanks.set(p.id, rt);
        if (p.characterSlug) rt.applyCharacter(p.characterSlug);
        if (!p.isDead) this.spawnSpawnEffect(p.x, p.y);
      }

      rt.pushState(now, p);
    }

    for (const [id] of this.remoteTanks) {
      if (!seenIds.has(id)) {
        this.remoteTanks.get(id)?.destroy();
        this.remoteTanks.delete(id);
      }
    }

    // ── Flag ─────────────────────────────────────────────────────────────
    // Determine if local player's flashlight illuminates the flag area
    const flagIlluminated = this.isPointIlluminated(state.flag.x, state.flag.y);
    this.flagObject.update(state.flag, this.localPlayerId, flagIlluminated);

    // ── Destination zone ──────────────────────────────────────────────────
    const destIlluminated = state.destination
      ? this.isPointIlluminated(state.destination.x, state.destination.y)
      : false;
    this.destinationZone.update(state.destination, this.localHasFlag, destIlluminated);

    // ── Traps ─────────────────────────────────────────────────────────────
    this.syncTraps(state.traps ?? []);

    // ── Power-ups ──────────────────────────────────────────────────────────
    this.syncPowerUps(state.powerUps ?? []);

    // Debug: log state rate every 3 seconds (dev only)
    const _n = Date.now();
    this._dbgCount++;
    if (_n - this._dbgLastAt > 3000) {
      this._dbgCount = 0;
      this._dbgLastAt = _n;
    }
  }

  // ─── Visibility check ─────────────────────────────────────────────────────

  private isPointIlluminated(wx: number, wy: number): boolean {
    // REVELATION overrides everything — check before lightOn
    if (this.localActivePower === 'REVELATION') return true;
    if (!this.localLightOn) return false;

    // Comprobar cono propio
    if (this.isPointInCone(wx, wy, this.player.x, this.player.y, this.player.aimAngle, this.localLevel)) {
      return true;
    }

    // Con SEE_OTHERS también cuentan los conos ajenos
    if (this.localActivePower === 'SEE_OTHERS') {
      for (const p of this.lastPlayers) {
        if (p.id === this.localPlayerId || !p.lightOn || p.isDead) continue;
        const rt = this.remoteTanks.get(p.id);
        if (!rt) continue;
        const pos = rt.getPosition();
        if (this.isPointInCone(wx, wy, pos.x, pos.y, p.aimAngle, p.level)) return true;
      }
    }

    return false;
  }

  private isPointInCone(
    px: number, py: number,
    cx: number, cy: number,
    aimAngle: number,
    level: number,
  ): boolean {
    const levelBonus = Math.min(level - 1, GAME.MAX_LEVEL - 1);
    const range      = GAME.LIGHT_CONE_RANGE + levelBonus * 8;
    const halfCone   = (GAME.LIGHT_CONE_ANGLE + levelBonus * 2 * Math.PI / 180) / 2;

    const dx   = px - cx;
    const dy   = py - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > range) return false;

    const angle = Math.atan2(dy, dx);
    let diff = angle - aimAngle;
    while (diff > Math.PI)  diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    return Math.abs(diff) <= halfCone;
  }

  // ─── Traps ────────────────────────────────────────────────────────────────

  private syncTraps(traps: TrapSnapshot[]): void {
    const seenIds = new Set<string>();
    for (const snap of traps) {
      seenIds.add(snap.id);
      let t = this.traps.get(snap.id);
      if (!t) {
        t = new TrapObject(this, snap.id, snap.x, snap.y);
        this.traps.set(snap.id, t);
      }
      t.update(snap, this.isPointIlluminated(snap.x, snap.y));
    }
    for (const [id, obj] of this.traps) {
      if (!seenIds.has(id)) { obj.destroy(); this.traps.delete(id); }
    }
  }

  // ─── Power-ups ────────────────────────────────────────────────────────────

  private syncPowerUps(powerUps: PowerUpSnapshot[]): void {
    const seenIds = new Set<string>();
    for (const snap of powerUps) {
      seenIds.add(snap.id);
      if (!this.powerUps.has(snap.id)) {
        const pu = new PowerUpPickup(this, snap);
        this.powerUps.set(snap.id, pu);
      }
      // Show only if illuminated
      this.powerUps.get(snap.id)?.setVisible(this.isPointIlluminated(snap.x, snap.y));
    }
    for (const [id, pu] of this.powerUps) {
      if (!seenIds.has(id)) {
        this.spawnPickupRing(
          (pu as unknown as { icon: { x: number } }).icon?.x ?? 0,
          (pu as unknown as { icon: { y: number } }).icon?.y ?? 0,
          true,
        );
        pu.destroy();
        this.powerUps.delete(id);
      }
    }
  }

  // ─── Obstacles ───────────────────────────────────────────────────────────

  private createObstacles(obstacles: StaticObstacleSnapshot[]): void {
    for (const img of this.obstacleImages) img.destroy();
    this.obstacleImages = [];

    for (const obs of obstacles) {
      const key = obs.isCircle ? 'obs-round'
        : obs.type === 'BUNKER' ? 'obs-bunker'
        : 'obs-barrier';
      if (this.textures.exists(key)) {
        const img = this.add.image(obs.x, obs.y, key)
          .setDisplaySize(obs.w, obs.h)
          .setAngle(obs.angle * (180 / Math.PI))
          .setDepth(3);
        this.obstacleImages.push(img);
      } else {
        const gfx = this.add.graphics().setDepth(3);
        gfx.lineStyle(2, COLORS.OBS_STROKE, 1);
        gfx.fillStyle(COLORS.OBS_FILL, 1);
        if (obs.isCircle) {
          gfx.fillCircle(obs.x, obs.y, obs.w / 2);
          gfx.strokeCircle(obs.x, obs.y, obs.w / 2);
        } else {
          gfx.fillRect(obs.x - obs.w / 2, obs.y - obs.h / 2, obs.w, obs.h);
          gfx.strokeRect(obs.x - obs.w / 2, obs.y - obs.h / 2, obs.w, obs.h);
        }
      }
    }
  }

  // ─── Arena builder ────────────────────────────────────────────────────────

  private createArena(): void {
    const w = this.mapW;
    const h = this.mapH;
    const arenaSlug = localStorage.getItem('df_arena') ?? 'space-station';

    if (this.textures.exists(`floor-${arenaSlug}`)) {
      this.add.tileSprite(w / 2, h / 2, w, h, `floor-${arenaSlug}`).setDepth(0);
    } else {
      this.add.rectangle(w / 2, h / 2, w, h, getArenaColor(arenaSlug)).setDepth(0);
    }

    // Subtle grid
    const grid = this.add.graphics().setDepth(1);
    grid.lineStyle(1, 0x0a0a18, 0.6);
    const step = 200;
    for (let x = 0; x <= w; x += step) grid.moveTo(x, 0).lineTo(x, h);
    for (let y = 0; y <= h; y += step) grid.moveTo(0, y).lineTo(w, y);
    grid.strokePath();

    // Border
    const border = this.add.graphics().setDepth(2);
    border.lineStyle(6, COLORS.MAP_BORDER, 1);
    border.strokeRect(0, 0, w, h);
    border.lineStyle(2, 0x1f1f3a, 0.6);
    const cs = 40;
    for (const [cx, cy] of [[0,0],[w,0],[w,h],[0,h]] as [number,number][]) {
      const sx2 = cx === 0 ? 1 : -1, sy2 = cy === 0 ? 1 : -1;
      border.moveTo(cx, cy + sy2 * cs).lineTo(cx, cy).lineTo(cx + sx2 * cs, cy);
    }
    border.strokePath();
  }

  // ─── Camera ───────────────────────────────────────────────────────────────

  private createPlayer(): void {
    const username = localStorage.getItem('df_username') ?? 'Jugador';
    this.player = new PlayerTank(this, 0, 0, username);
    const slug = localStorage.getItem('df_active_character') ?? 'phantom';
    this.player.applyCharacter(slug);
  }

  private setupCamera(): void {
    this.isMobile = isTouchDevice();
    this.cameras.main.setBounds(0, 0, this.mapW, this.mapH);
    this.cameras.main.startFollow(this.player.body, true, 0.1, 0.1);
    this.cameras.main.setZoom(this.isMobile ? 0.50 : 0.90);

    this.rebuildDarkOverlay();

    const strategy = this.isMobile ? new MobileInput(this) : new DesktopInput(this);
    this.player.setStrategy(strategy);

    if (!this.hud) this.hud = new HUD(this, this.isMobile, this.translateFn);
  }

  // ─── Character loading ────────────────────────────────────────────────────

  private loadRemoteCharacters(players: PlayerSnapshot[], excludeId: string): void {
    const toLoad: string[] = [];
    for (const p of players) {
      if (p.id === excludeId || !p.characterSlug) continue;
      const key = `char-${p.characterSlug}`;
      if (this.textures.exists(key)) continue;
      toLoad.push(p.characterSlug);
      if (SPRITESHEET_CHARS.has(p.characterSlug)) {
        this.load.spritesheet(key, `assets/characters/${p.characterSlug}.png`, { frameWidth: 512, frameHeight: 512 });
      } else {
        this.load.image(key, `assets/characters/${p.characterSlug}.png`);
      }
    }
    if (toLoad.length === 0) return;
    this.load.start();
  }

  // ─── VFX ──────────────────────────────────────────────────────────────────

  private showWorldText(msg: string, color = '#ffffff'): void {
    const now = Date.now();
    if (now - this.lastWorldTextAt < 600) return;
    this.lastWorldTextAt = now;
    const txt = this.add.text(this.player.x, this.player.y - 40, msg, {
      fontFamily: 'monospace', fontSize: '13px', color,
      stroke: '#000000', strokeThickness: 3,
    }).setDepth(70).setOrigin(0.5, 1);
    this.tweens.add({
      targets: txt, y: txt.y - 35, alpha: 0, duration: 900, ease: 'Power2',
      onComplete: () => txt.destroy(),
    });
  }

  private spawnExplosion(x: number, y: number): void {
    if (this.anims.exists('anim-mace-impact')) {
      const s = this.add.sprite(x, y, 'vfx-mace-impact').setDepth(30).setDisplaySize(120, 120);
      s.play('anim-mace-impact');
      this.time.delayedCall(400, () => { if (s.active) s.destroy(); });
      return;
    }
    // Fallback: burst of orange particles
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 80 + Math.random() * 100;
      const r = 4 + Math.random() * 4;
      const col = Math.random() < 0.5 ? 0xff4444 : 0xff8800;
      const spark = this.add.arc(x, y, r, 0, 360, false, col, 1).setDepth(30);
      this.tweens.add({
        targets: spark,
        x: x + Math.cos(a) * spd, y: y + Math.sin(a) * spd,
        alpha: 0, scale: 0.2, duration: 250 + Math.random() * 150,
        ease: 'Quad.easeOut', onComplete: () => spark.destroy(),
      });
    }
  }

  private spawnStunEffect(x: number, y: number): void {
    if (this.anims.exists('anim-trap-trigger')) {
      const s = this.add.sprite(x, y, 'vfx-trap-trigger').setDepth(30).setDisplaySize(80, 80);
      s.play('anim-trap-trigger');
      this.time.delayedCall(400, () => { if (s.active) s.destroy(); });
    }
    // Stars spinning around — stun indicator
    for (let i = 0; i < 5; i++) {
      const star = this.add.text(x, y - GAME.PLAYER_RADIUS - 8 + i * 6, '✦',
        { fontSize: '12px', color: '#ffd600' }).setDepth(31).setOrigin(0.5);
      this.tweens.add({
        targets: star,
        angle: { from: 0, to: 360 * (i % 2 === 0 ? 1 : -1) },
        alpha: 0, y: star.y - 30, duration: 1200,
        delay: i * 80, ease: 'Quad.easeOut',
        onComplete: () => star.destroy(),
      });
    }
  }

  private spawnSpawnEffect(x: number, y: number): void {
    const ring = this.add.graphics().setDepth(24).setPosition(x, y);
    ring.lineStyle(3, 0x4a6fa5, 1.0);
    ring.strokeCircle(0, 0, GAME.PLAYER_RADIUS);
    this.tweens.add({
      targets: ring, alpha: 0, scale: 4,
      duration: 700, ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    });
  }

  private spawnCelebration(x: number, y: number): void {
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      const spd = 90 + Math.random() * 80;
      const col = [0xf59e0b, 0x10b981, 0x7c3aed, 0xef4444][i % 4];
      const p = this.add.arc(x, y, 4, 0, 360, false, col, 1).setDepth(35);
      this.tweens.add({
        targets: p,
        x: x + Math.cos(a) * spd, y: y + Math.sin(a) * spd,
        alpha: 0, scale: 0.1, duration: 600 + Math.random() * 300,
        ease: 'Quad.easeOut', onComplete: () => p.destroy(),
      });
    }
    this.showWorldText('¡ENTREGADA!', '#f59e0b');
  }

  private spawnPickupRing(x: number, y: number, isPower: boolean): void {
    const col  = isPower ? 0x7c3aed : 0xf59e0b;
    const ring = this.add.graphics().setDepth(24).setPosition(x, y);
    ring.lineStyle(2, col, 1.0);
    ring.strokeCircle(0, 0, 12);
    this.tweens.add({
      targets: ring, alpha: 0, scale: isPower ? 3.5 : 2.5,
      duration: isPower ? 400 : 280, ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    });
  }
}
