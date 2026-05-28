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

  // Set by subclasses before syncVisuals()
  protected isMoving  = false;
  protected movingLeft = false;

  readonly id: string;
  readonly scene: Phaser.Scene;

  // body: Arc kept as position anchor and camera follow target (hidden in sprite mode)
  readonly body: Phaser.GameObjects.Arc;
  protected charSprite: Phaser.GameObjects.Sprite | null = null;
  private   charSlug:   string | null = null;

  protected readonly nameLabel:     Phaser.GameObjects.Text;
  protected readonly levelBadge:    Phaser.GameObjects.Text;
  protected readonly flagIndicator: Phaser.GameObjects.Arc;
  protected readonly stunOverlay:   Phaser.GameObjects.Graphics;
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

  // ─── Character sprite ────────────────────────────────────────────────────────

  applyCharacter(slug: string): void {
    let textureKey  = `char-${slug}`;
    let effectiveSlug = slug;

    // Fallback: if requested character isn't loaded, use phantom (always preloaded)
    if (!this.scene.textures.exists(textureKey)) {
      textureKey    = 'char-phantom';
      effectiveSlug = 'phantom';
      if (!this.scene.textures.exists(textureKey)) return;
    }

    // frameTotal > 2 → spritesheet con animaciones; ≤ 2 → imagen estática
    const texture    = this.scene.textures.get(textureKey);
    const isAnimated = texture.frameTotal > 2;

    this.charSlug = isAnimated ? effectiveSlug : null;
    this.charSprite?.destroy();
    this.charSprite = this.scene.add
      .sprite(this.x, this.y, textureKey, 0)
      .setDisplaySize(GAME.PLAYER_RADIUS * 3, GAME.PLAYER_RADIUS * 3)
      .setDepth(10);
    if (isAnimated) this.charSprite.play(`${effectiveSlug}-idle`);
  }

  // Apply alpha to both the arc fallback and the sprite (for blink effects)
  setVisualAlpha(alpha: number): void {
    this.body.setAlpha(alpha);
    this.charSprite?.setAlpha(alpha);
  }

  // ─── Sync visuals ────────────────────────────────────────────────────────────

  protected syncVisuals(): void {
    const visible = !this.isDead;

    if (this.charSprite) {
      // Arc must track position always — camera follows it even when invisible
      this.body.setVisible(false).setPosition(this.x, this.y);
      this.charSprite.setVisible(visible).setPosition(this.x, this.y);
      this.charSprite.setFlipX(this.movingLeft);

      if (visible && this.charSlug) {
        this.updateSpriteAnimation(this.charSlug);
      }
    } else {
      // Fallback arc mode
      this.body.setVisible(visible).setPosition(this.x, this.y);
    }

    this.nameLabel.setVisible(visible).setPosition(this.x, this.y - GAME.PLAYER_RADIUS - 18);
    this.levelBadge.setVisible(visible).setPosition(this.x, this.y + GAME.PLAYER_RADIUS + 8);
    this.flagIndicator.setVisible(visible && this.hasFlag).setPosition(this.x, this.y - GAME.PLAYER_RADIUS - 10);
    // maceIndicator only shown in arc mode (sprite has its own stunned frame)
    this.maceIndicator.setVisible(visible && this.isStunned && !this.charSprite)
      .setPosition(this.x + GAME.PLAYER_RADIUS + 6, this.y - GAME.PLAYER_RADIUS);
    this.stunOverlay.clear();

    if (visible) {
      const levelColor = getLevelColor(this.level);
      this.levelBadge.setText(`L${this.level}`).setStyle({ color: `#${levelColor.toString(16).padStart(6, '0')}` });

      // Stun ring only in arc mode
      if (this.isStunned && !this.charSprite) {
        this.stunOverlay.lineStyle(3, 0xff4444, 0.6);
        this.stunOverlay.strokeCircle(this.x, this.y, GAME.PLAYER_RADIUS + 4);
      }
    }
  }

  private updateSpriteAnimation(slug: string): void {
    const currentKey = this.charSprite!.anims.currentAnim?.key ?? '';

    if (this.isStunned) {
      if (!currentKey.endsWith('-stunned')) {
        this.charSprite!.play(`${slug}-stunned`);
      }
    } else if (this.isMoving) {
      if (!currentKey.endsWith('-move')) {
        this.charSprite!.play(`${slug}-move`);
      }
    } else {
      // Return to idle if stunned/move animation ended or still playing
      if (!currentKey.endsWith('-idle')) {
        // Don't interrupt non-looping animations (strike, victory) while playing
        const anim = this.charSprite!.anims.currentAnim;
        const looping = anim?.repeat === -1;
        if (looping || !this.charSprite!.anims.isPlaying) {
          this.charSprite!.play(`${slug}-idle`);
        }
      }
    }
  }

  // ─── Misc ────────────────────────────────────────────────────────────────────

  protected clampToMap(): void {
    const r = GAME.PLAYER_RADIUS;
    this.x = Math.max(r, Math.min(GAME.MAP_WIDTH - r, this.x));
    this.y = Math.max(r, Math.min(GAME.MAP_HEIGHT - r, this.y));
  }

  protected abstract onDeath(): void;

  destroy(): void {
    this.body.destroy();
    this.charSprite?.destroy();
    this.nameLabel.destroy();
    this.levelBadge.destroy();
    this.flagIndicator.destroy();
    this.maceIndicator.destroy();
    this.stunOverlay.destroy();
  }
}
