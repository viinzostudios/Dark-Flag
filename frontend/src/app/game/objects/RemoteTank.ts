import Phaser from 'phaser';
import { BaseTank } from './BaseTank';
import { PlayerSnapshot } from '../../core/services/game-socket.service';

interface StateBuffer {
  time: number;
  x: number;
  y: number;
  aimAngle: number;
  score: number;
  level: number;
  hasFlag: boolean;
  isStunned: boolean;
  isDead: boolean;
  lightOn: boolean;
}

// 5 estados: a 10Hz (móvil) = 500ms de historia; a 30Hz (desktop) = 165ms.
// Ambos superan el INTERP_DELAY_MS respectivo, dando una ventana de interpolación sólida.
const BUFFER_SIZE = 5;

export class RemoteTank extends BaseTank {
  private buffer: StateBuffer[] = [];
  private lastKnownX = 0;
  private lastKnownY = 0;

  constructor(
    scene: Phaser.Scene,
    id: string,
    x: number,
    y: number,
    username: string,
    characterSlug: string | null = null,
  ) {
    super(scene, x, y, id, username);
    this.lastKnownX = x;
    this.lastKnownY = y;
    void characterSlug; // GameScene calls applyCharacter after construction
  }

  pushState(serverTime: number, p: PlayerSnapshot): void {
    this.buffer.push({
      time:      serverTime,
      x:         p.x,
      y:         p.y,
      aimAngle:  p.aimAngle,
      score:     p.score,
      level:     p.level,
      hasFlag:   p.hasFlag,
      isStunned: p.isStunned,
      isDead:    p.isDead,
      lightOn:   p.lightOn,
    });
    if (this.buffer.length > BUFFER_SIZE) this.buffer.shift();
  }

  interpolate(renderTime: number): void {
    if (this.buffer.length === 0) return;

    let prev: StateBuffer | null = null;
    let next: StateBuffer | null = null;

    for (let i = 0; i < this.buffer.length - 1; i++) {
      if (this.buffer[i].time <= renderTime && this.buffer[i + 1].time >= renderTime) {
        prev = this.buffer[i];
        next = this.buffer[i + 1];
        break;
      }
    }

    let state: StateBuffer;
    if (prev && next) {
      const t = (renderTime - prev.time) / (next.time - prev.time);
      this.x        = prev.x + (next.x - prev.x) * t;
      this.y        = prev.y + (next.y - prev.y) * t;
      this.aimAngle = this.lerpAngle(prev.aimAngle, next.aimAngle, t);
      state = t > 0.5 ? next : prev;

      const dx = Math.abs(next.x - prev.x);
      const dy = Math.abs(next.y - prev.y);
      this.isMoving = (dx + dy) > 0.5;
      if (dx > 0.5) this.movingLeft = next.x < prev.x;
    } else {
      state = this.buffer[this.buffer.length - 1];
      this.x        = state.x;
      this.y        = state.y;
      this.aimAngle = state.aimAngle;
      this.isMoving = false;
    }

    this.lastKnownX = this.x;
    this.lastKnownY = this.y;

    this.level     = state.level;
    this.hasFlag   = state.hasFlag;
    this.isStunned = state.isStunned;
    this.isDead    = state.isDead;
    this.lightOn   = state.lightOn;

    this.syncVisuals();
  }

  /** Posición interpolada actual para cálculo de linterna */
  getPosition(): { x: number; y: number } {
    return { x: this.lastKnownX, y: this.lastKnownY };
  }

  protected onDeath(): void {}

  private lerpAngle(a: number, b: number, t: number): number {
    let diff = b - a;
    while (diff > Math.PI)  diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    return a + diff * t;
  }
}
