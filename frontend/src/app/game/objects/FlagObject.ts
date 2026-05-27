import Phaser from 'phaser';
import { GAME, COLORS } from '../constants';
import type { FlagSnapshot } from '../../core/services/game-socket.service';

export class FlagObject {
  private scene: Phaser.Scene;
  private glow: Phaser.GameObjects.Graphics;
  private icon: Phaser.GameObjects.Image | Phaser.GameObjects.Arc;
  private labelBg: Phaser.GameObjects.Rectangle;
  private label: Phaser.GameObjects.Text;
  private pulseTween: Phaser.Tweens.Tween | null = null;

  visible = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.glow = scene.add.graphics().setDepth(12);

    if (scene.textures.exists('flag-icon')) {
      this.icon = scene.add.image(0, 0, 'flag-icon')
        .setDisplaySize(32, 32).setDepth(13).setVisible(false);
    } else {
      this.icon = scene.add.arc(0, 0, GAME.FLAG_RADIUS, 0, 360, false, COLORS.FLAG_IDLE)
        .setDepth(13).setVisible(false);
    }

    this.labelBg = scene.add.rectangle(0, -36, 60, 16, 0x000000, 0.7).setDepth(14).setVisible(false);
    this.label = scene.add.text(0, -36, 'FLAG', {
      fontSize: '10px', color: '#f59e0b', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(15).setVisible(false);

    this.pulseTween = scene.tweens.add({
      targets: this.glow,
      alpha: { from: 0.5, to: 1.0 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });
  }

  update(snap: FlagSnapshot, localPlayerId: string, illuminatedByLocal: boolean): void {
    const { x, y, carriedBy, isOnGround } = snap;
    const show = isOnGround ? illuminatedByLocal : carriedBy !== null;

    this.visible = show;
    this.icon.setVisible(show).setPosition(x, y);
    this.labelBg.setVisible(show).setPosition(x, y - 36);
    this.label.setVisible(show).setPosition(x, y - 36);

    if (show) {
      const color = carriedBy !== null ? COLORS.FLAG_CARRIED : COLORS.FLAG_IDLE;
      const glowColor = carriedBy !== null ? 0xef4444 : 0xf59e0b;

      if (this.icon instanceof Phaser.GameObjects.Arc) {
        this.icon.setFillStyle(color);
      }
      this.label.setStyle({ color: carriedBy ? '#ef4444' : '#f59e0b' });
      if (carriedBy === localPlayerId) {
        this.label.setText('YOU');
      } else if (carriedBy) {
        this.label.setText('CARRIED');
      } else {
        this.label.setText('FLAG');
      }

      this.glow.clear();
      this.glow.fillStyle(glowColor, 0.15);
      this.glow.fillCircle(x, y, GAME.FLAG_RADIUS * 3);
      this.glow.fillStyle(glowColor, 0.3);
      this.glow.fillCircle(x, y, GAME.FLAG_RADIUS * 1.5);
    } else {
      this.glow.clear();
    }
  }

  destroy(): void {
    this.pulseTween?.stop();
    this.glow.destroy();
    this.icon.destroy();
    this.labelBg.destroy();
    this.label.destroy();
  }
}
