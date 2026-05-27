import Phaser from 'phaser';
import { GAME } from '../constants';
import { BaseTank } from './BaseTank';
import { InputStrategy } from '../input/InputStrategy';

/**
 * Jugador local de Dark Flag.
 * No contiene lógica de input — delega completamente en InputStrategy.
 * La estrategia correcta (DesktopInput / MobileInput) se inyecta desde GameScene.
 */
export class PlayerTank extends BaseTank {
  private strategy: InputStrategy | null = null;
  private maceCooldownEnd = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, username: string) {
    super(scene, x, y, 'player', username);
  }

  // ─── Inyección de estrategia ──────────────────────────────────────────────

  setStrategy(strategy: InputStrategy): void {
    this.strategy = strategy;
  }

  // ─── API para GameScene.sendInput() ──────────────────────────────────────

  getAngle(): number { return this.strategy?.getAngle() ?? 0; }
  getSpeed(): number { return this.strategy?.getSpeed() ?? 0; }

  consumeMaceIntent(time: number): boolean {
    const intent = this.strategy?.consumeMace() ?? false;
    if (intent) this.maceCooldownEnd = time + GAME.MACE_COOLDOWN_MS;
    return intent;
  }

  consumeToggleLightIntent(): boolean {
    return this.strategy?.consumeToggleLight() ?? false;
  }

  consumePulseIntent(): boolean {
    return this.strategy?.consumePulse() ?? false;
  }

  maceCooldownRemaining(time: number): number {
    return Math.max(0, this.maceCooldownEnd - time);
  }

  setMaceCooldownEnd(end: number): void {
    this.maceCooldownEnd = end;
  }

  // ─── Llamado en resize de viewport ───────────────────────────────────────

  onResize(): void {
    this.strategy?.onResize();
  }

  // ─── Llamado cada frame ───────────────────────────────────────────────────

  update(time: number, _delta: number): void {
    if (!this.strategy) return;
    this.strategy.update(time, this.x, this.y);
    this.aimAngle = this.strategy.getAimAngle();

    const speed = this.strategy.getSpeed();
    this.isMoving = speed > 0;
    if (speed > 0) {
      this.movingLeft = Math.cos(this.strategy.getAngle()) < 0;
    }

    this.syncVisuals();
  }

  setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  // ─── Limpieza ─────────────────────────────────────────────────────────────

  destroyStrategy(): void {
    this.strategy?.destroy();
    this.strategy = null;
  }

  protected onDeath(): void {}
}
