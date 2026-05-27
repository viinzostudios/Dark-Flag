import Phaser from 'phaser';
import { POWER_COLORS } from '../constants';
import type { PowerUpSnapshot, PowerUpType } from '../../core/services/game-socket.service';

export class PowerUpPickup {
  readonly id: string;
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private glow: Phaser.GameObjects.Graphics;
  private icon: Phaser.GameObjects.Image | Phaser.GameObjects.Arc;
  private pulseTween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene, snap: PowerUpSnapshot) {
    this.id = snap.id;
    this.scene = scene;

    this.glow = scene.add.graphics().setDepth(9);

    const textureKey = `power-${snap.type}`;
    if (scene.textures.exists(textureKey)) {
      this.icon = scene.add.image(snap.x, snap.y, textureKey)
        .setDisplaySize(28, 28).setDepth(10);
    } else {
      const color = POWER_COLORS[snap.type] ?? 0xffffff;
      this.icon = scene.add.arc(snap.x, snap.y, 14, 0, 360, false, color).setDepth(10);
    }

    this.container = scene.add.container(snap.x, snap.y).setDepth(9);
    this.drawGlow(snap.x, snap.y, snap.type);

    this.pulseTween = scene.tweens.add({
      targets: this.icon,
      scaleX: { from: 1, to: 1.2 },
      scaleY: { from: 1, to: 1.2 },
      duration: 600,
      yoyo: true,
      repeat: -1,
    });
  }

  private drawGlow(x: number, y: number, type: PowerUpType): void {
    const color = POWER_COLORS[type] ?? 0xffffff;
    this.glow.clear();
    this.glow.fillStyle(color, 0.12);
    this.glow.fillCircle(x, y, 32);
    this.glow.lineStyle(2, color, 0.6);
    this.glow.strokeCircle(x, y, 18);
  }

  setVisible(val: boolean): void {
    this.icon.setVisible(val);
    this.glow.setVisible(val);
  }

  destroy(): void {
    this.pulseTween?.stop();
    this.container.destroy();
    this.glow.destroy();
    this.icon.destroy();
  }
}
