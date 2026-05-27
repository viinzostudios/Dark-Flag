import Phaser from 'phaser';
import { GAME, COLORS } from '../constants';
import type { TrapSnapshot } from '../../core/services/game-socket.service';

export class TrapObject {
  readonly id: string;
  private gfx: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, id: string, x: number, y: number) {
    this.id = id;
    this.gfx = scene.add.graphics().setDepth(6);
    this.drawAt(x, y, true);
  }

  private drawAt(x: number, y: number, active: boolean): void {
    this.gfx.clear();
    if (active) {
      // Active trap: subtle floor marking
      this.gfx.lineStyle(2, COLORS.TRAP_ACTIVE, 0.5);
      this.gfx.strokeCircle(x, y, GAME.TRAP_RADIUS);
      this.gfx.fillStyle(COLORS.TRAP_ACTIVE, 0.08);
      this.gfx.fillCircle(x, y, GAME.TRAP_RADIUS);
      // Cross hairs
      this.gfx.lineStyle(1, COLORS.TRAP_ACTIVE, 0.4);
      this.gfx.strokeRect(x - GAME.TRAP_RADIUS, y - 1, GAME.TRAP_RADIUS * 2, 2);
      this.gfx.strokeRect(x - 1, y - GAME.TRAP_RADIUS, 2, GAME.TRAP_RADIUS * 2);
    }
  }

  update(snap: TrapSnapshot, illuminated: boolean): void {
    if (!illuminated) {
      this.gfx.clear();
      return;
    }
    this.drawAt(snap.x, snap.y, snap.active);
  }

  destroy(): void {
    this.gfx.destroy();
  }
}
