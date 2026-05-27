import Phaser from 'phaser';
import { GAME, COLORS, getLevelColor } from '../constants';

// Dark Flag player (replaces Arena Siege Tanks BaseTank)
export abstract class BaseTank {
  x: number;
  y: number;
  aimAngle = 0;

  score     = 0;
  level     = 1;
  hasFlag   = false;
  isStunned = false;
  lightOn   = true;
  isDead    = false;

  readonly id: string;
  readonly scene: Phaser.Scene;

  readonly body: Phaser.GameObjects.Arc;
  protected readonly nameLabel: Phaser.GameObjects.Text;
  protected readonly levelBadge: Phaser.GameObjects.Text;
  protected readonly flagIndicator: Phaser.GameObjects.Arc;
  protected readonly stunOverlay: Phaser.GameObjects.Graphics;
  private   readonly maceIndicator: Phaser.GameObjects.Arc;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    id: string,
    username: string,
    color = COLORS.PLAYER_BODY,
  ) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.id = id;

    const r = GAME.PLAYER_RADIUS;

    this.body = scene.add.arc(x, y, r, 0, 360, false, color).setDepth(10);

    this.nameLabel = scene.add.text(x, y - r - 18, username, {
      fontSize: '9px', color: '#d1d5db', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(15);

    this.levelBadge = scene.add.text(x, y + r + 8, 'L1', {
      fontSize: '9px', color: '#6b7280', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(15);

    this.flagIndicator = scene.add.arc(x, y - r - 10, 6, 0, 360, false, COLORS.FLAG_IDLE)
      .setDepth(16).setVisible(false);

    this.maceIndicator = scene.add.arc(x + r + 6, y - r, 4, 0, 360, false, 0xef4444)
      .setDepth(16).setVisible(false);

    this.stunOverlay = scene.add.graphics().setDepth(17);
  }

  protected syncVisuals(): void {
    const visible = !this.isDead;

    this.body.setVisible(visible).setPosition(this.x, this.y);
    this.nameLabel.setVisible(visible).setPosition(this.x, this.y - GAME.PLAYER_RADIUS - 18);
    this.levelBadge.setVisible(visible).setPosition(this.x, this.y + GAME.PLAYER_RADIUS + 8);
    this.flagIndicator.setVisible(visible && this.hasFlag).setPosition(this.x, this.y - GAME.PLAYER_RADIUS - 10);
    this.maceIndicator.setVisible(visible && this.isStunned).setPosition(this.x + GAME.PLAYER_RADIUS + 6, this.y - GAME.PLAYER_RADIUS);
    this.stunOverlay.clear();

    if (visible) {
      const levelColor = getLevelColor(this.level);
      this.levelBadge.setText(`L${this.level}`).setStyle({ color: `#${levelColor.toString(16).padStart(6, '0')}` });

      // Stun ring
      if (this.isStunned) {
        this.stunOverlay.lineStyle(3, 0xff4444, 0.6);
        this.stunOverlay.strokeCircle(this.x, this.y, GAME.PLAYER_RADIUS + 4);
      }
    }
  }

  applyCharacter(slug: string): void {
    // No-op in base — texture system is programmatic in Dark Flag
    void slug;
  }

  protected clampToMap(): void {
    const r = GAME.PLAYER_RADIUS;
    this.x = Math.max(r, Math.min(GAME.MAP_WIDTH - r, this.x));
    this.y = Math.max(r, Math.min(GAME.MAP_HEIGHT - r, this.y));
  }

  protected abstract onDeath(): void;

  destroy(): void {
    this.body.destroy();
    this.nameLabel.destroy();
    this.levelBadge.destroy();
    this.flagIndicator.destroy();
    this.maceIndicator.destroy();
    this.stunOverlay.destroy();
  }
}
