import Phaser from 'phaser';
import { COLORS } from '../constants';
import type { DestinationSnapshot } from '../../core/services/game-socket.service';

export class DestinationZone {
  private gfx: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;
  private pulseTween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene) {
    this.gfx = scene.add.graphics().setDepth(8);
    this.label = scene.add.text(0, 0, 'DESTINO', {
      fontSize: '11px', color: '#10b981', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(9).setVisible(false);

    this.pulseTween = scene.tweens.add({
      targets: this.gfx,
      alpha: { from: 0.4, to: 0.9 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });
  }

  update(snap: DestinationSnapshot | null, localHasFlag: boolean, illuminated: boolean): void {
    this.gfx.clear();

    if (!snap) {
      this.label.setVisible(false);
      return;
    }

    const visible = snap.visibleToAll || localHasFlag || illuminated;
    this.label.setVisible(visible);

    if (!visible) return;

    const { x, y, radius } = snap;

    // Outer glow
    this.gfx.fillStyle(COLORS.DESTINATION, 0.08);
    this.gfx.fillCircle(x, y, radius * 1.6);

    // Ring
    this.gfx.lineStyle(3, COLORS.DESTINATION, 0.7);
    this.gfx.strokeCircle(x, y, radius);

    // Inner fill
    this.gfx.fillStyle(COLORS.DESTINATION, 0.12);
    this.gfx.fillCircle(x, y, radius);

    // Center marker
    this.gfx.fillStyle(COLORS.DESTINATION, 0.6);
    this.gfx.fillCircle(x, y, 8);

    this.label.setPosition(x, y - radius - 18);
  }

  destroy(): void {
    this.pulseTween?.stop();
    this.gfx.destroy();
    this.label.destroy();
  }
}
