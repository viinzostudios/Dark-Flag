import Phaser from 'phaser';
import { GAME } from '../constants';
import type { TrapSnapshot } from '../../core/services/game-socket.service';

export class TrapObject {
  readonly id: string;
  private img: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, id: string, x: number, y: number) {
    this.id = id;
    const size = GAME.TRAP_RADIUS * 2;
    this.img = scene.add.image(x, y, 'trap-marker')
      .setDisplaySize(size, size)
      .setDepth(6)
      .setVisible(false);
  }

  update(snap: TrapSnapshot, illuminated: boolean): void {
    if (!illuminated || !snap.active) {
      this.img.setVisible(false);
      return;
    }
    this.img.setVisible(true).setPosition(snap.x, snap.y);
  }

  destroy(): void {
    this.img.destroy();
  }
}
