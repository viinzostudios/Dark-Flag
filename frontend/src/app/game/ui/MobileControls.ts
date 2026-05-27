import Phaser from 'phaser';

const JR = 55;  // joystick base radius, screen px
const TR = 24;  // thumb radius, screen px
const JD = 50;  // max thumb displacement, screen px
const BR = 40;  // action button radius, screen px
const LR = 22;  // lock button radius, screen px

type Positionable = { setPosition(x: number, y: number): unknown };

export class MobileControls {
  private W: number;
  private H: number;
  private z: number;

  private readonly joyBase: Phaser.GameObjects.Arc;
  private readonly joyThumb: Phaser.GameObjects.Arc;
  private joyPointer: Phaser.Input.Pointer | null = null;
  private joyCX = 0;
  private joyCY = 0;
  private joyDefaultX = 0;
  private joyDefaultY = 0;

  private readonly lockBtn: Phaser.GameObjects.Arc;
  private readonly lockIcon: Phaser.GameObjects.Text;
  private locked = false;

  private readonly fireBtn: Phaser.GameObjects.Arc;
  private readonly fireLbl: Phaser.GameObjects.Text;
  private firePointer: Phaser.Input.Pointer | null = null;
  private _fireIntent = false;

  private readonly wallBtn: Phaser.GameObjects.Arc;
  private readonly wallLbl: Phaser.GameObjects.Text;
  private wallPointer: Phaser.Input.Pointer | null = null;
  private _wallIntent = false;

  private _moveAngle = 0;
  private _moveSpeed = 0;
  private _aimAngle = 0;

  private active = true;

  constructor(private readonly scene: Phaser.Scene) {
    this.W = scene.scale.width;
    this.H = scene.scale.height;
    this.z = scene.cameras.main.zoom || 1;

    const D = 50;
    const ws = (n: number) => Math.round(n / this.z);

    this.joyBase = scene.add.arc(0, 0, ws(JR), 0, 360, false, 0xffffff, 0.13)
      .setScrollFactor(0).setDepth(D)
      .setStrokeStyle(ws(2), 0xffffff, 0.35);

    this.joyThumb = scene.add.arc(0, 0, ws(TR), 0, 360, false, 0xffffff, 0.6)
      .setScrollFactor(0).setDepth(D + 1);

    this.lockBtn = scene.add.arc(0, 0, ws(LR), 0, 360, false, 0x888888, 0.8)
      .setScrollFactor(0).setDepth(D);
    this.lockIcon = scene.add.text(0, 0, '🔒', { fontSize: `${ws(14)}px` })
      .setScrollFactor(0).setDepth(D + 1).setOrigin(0.5);

    this.fireBtn = scene.add.arc(0, 0, ws(BR), 0, 360, false, 0xe74c3c, 0.8)
      .setScrollFactor(0).setDepth(D);
    this.fireLbl = scene.add.text(0, 0, '🔥', { fontSize: `${ws(22)}px` })
      .setScrollFactor(0).setDepth(D + 1).setOrigin(0.5);

    this.wallBtn = scene.add.arc(0, 0, ws(BR), 0, 360, false, 0x607d8b, 0.8)
      .setScrollFactor(0).setDepth(D);
    this.wallLbl = scene.add.text(0, 0, '🧱', { fontSize: `${ws(22)}px` })
      .setScrollFactor(0).setDepth(D + 1).setOrigin(0.5);

    this.positionAll();

    scene.input.addPointer(4);
    scene.input.on('pointerdown', this.onDown, this);
    scene.input.on('pointermove', this.onMove, this);
    scene.input.on('pointerup', this.onUp, this);
    scene.scale.on('resize', this.onResize, this);
  }

  // ─── Coordinate helpers ───────────────────────────────────────────────────

  // Screen-space → world-space position, compensating for camera zoom
  private sp(sx: number, sy: number): { x: number; y: number } {
    const cx = this.W / 2, cy = this.H / 2;
    return { x: cx + (sx - cx) / this.z, y: cy + (sy - cy) / this.z };
  }

  private move(obj: Positionable, sx: number, sy: number): void {
    const { x, y } = this.sp(sx, sy);
    obj.setPosition(x, y);
  }

  private positionAll(): void {
    const W = this.W, H = this.H;
    this.joyDefaultX = 110;
    this.joyDefaultY = H - 85;
    this.joyCX = this.joyDefaultX;
    this.joyCY = this.joyDefaultY;

    const lockX = 110;
    const lockY = H - 85 - JR - LR - 14;
    const fireX = W - 75;
    const fireY = H - 85;
    const wallX = W - 160;
    const wallY = H - 85;

    this.move(this.joyBase,  this.joyDefaultX, this.joyDefaultY);
    this.move(this.joyThumb, this.joyDefaultX, this.joyDefaultY);
    this.move(this.lockBtn,  lockX, lockY);
    this.move(this.lockIcon, lockX, lockY);
    this.move(this.fireBtn,  fireX, fireY);
    this.move(this.fireLbl,  fireX, fireY);
    this.move(this.wallBtn,  wallX, wallY);
    this.move(this.wallLbl,  wallX, wallY);
  }

  // ─── Touch handling ───────────────────────────────────────────────────────

  private hit(px: number, py: number, bx: number, by: number, r: number): boolean {
    const dx = px - bx, dy = py - by;
    return dx * dx + dy * dy < r * r;
  }

  private onDown(p: Phaser.Input.Pointer): void {
    if (!this.active) return;
    const { x: sx, y: sy } = p;
    const W = this.W, H = this.H;

    if (sx < W / 2) {
      // Lock button (above joystick)
      const lockX = 110, lockY = H - 85 - JR - LR - 14;
      if (this.hit(sx, sy, lockX, lockY, LR + 16)) {
        this.locked = !this.locked;
        this.lockBtn.setFillStyle(this.locked ? 0xf1c40f : 0x888888, 0.8);
        this.lockIcon.setText(this.locked ? '🔓' : '🔒');
        return;
      }
      // Joystick — float to touch position
      if (!this.joyPointer) {
        this.joyPointer = p;
        this.joyCX = sx;
        this.joyCY = sy;
        this.move(this.joyBase,  sx, sy);
        this.move(this.joyThumb, sx, sy);
      }
    } else {
      const fireX = W - 75, fireY = H - 85;
      const wallX = W - 160, wallY = H - 85;
      if (!this.firePointer && this.hit(sx, sy, fireX, fireY, BR + 14)) {
        this.firePointer = p;
        this._fireIntent = true;
        this.fireBtn.setFillStyle(0xff2020, 1.0);
      } else if (!this.wallPointer && this.hit(sx, sy, wallX, wallY, BR + 14)) {
        this.wallPointer = p;
        this._wallIntent = true;
        this.wallBtn.setFillStyle(0x4a90d9, 1.0);
      }
    }
  }

  private onMove(p: Phaser.Input.Pointer): void {
    if (!this.active || p !== this.joyPointer) return;
    const dx = p.x - this.joyCX;
    const dy = p.y - this.joyCY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    if (this.locked) {
      // Locked: joystick aims only, tank stays still
      if (dist > 15) this._aimAngle = angle;
      this._moveSpeed = 0;
    } else {
      if (dist < 15) {
        this._moveSpeed = 0;
      } else {
        this._moveAngle = angle;
        this._aimAngle  = angle;
        this._moveSpeed = 1;
      }
    }

    const clamped = Math.min(dist, JD);
    this.move(this.joyThumb,
      this.joyCX + Math.cos(angle) * clamped,
      this.joyCY + Math.sin(angle) * clamped,
    );
  }

  private onUp(p: Phaser.Input.Pointer): void {
    if (p === this.joyPointer) {
      this.joyPointer = null;
      this._moveSpeed = 0;
      this.joyCX = this.joyDefaultX;
      this.joyCY = this.joyDefaultY;
      this.move(this.joyBase,  this.joyDefaultX, this.joyDefaultY);
      this.move(this.joyThumb, this.joyDefaultX, this.joyDefaultY);
    }
    if (p === this.firePointer) { this.firePointer = null; this.fireBtn.setFillStyle(0xe74c3c, 0.8); }
    if (p === this.wallPointer) { this.wallPointer = null; this.wallBtn.setFillStyle(0x607d8b, 0.8); }
  }

  private onResize(size: Phaser.Structs.Size): void {
    this.W = size.width;
    this.H = size.height;
    // Cancel active joystick on resize to avoid stale coords
    if (this.joyPointer) { this.joyPointer = null; this._moveSpeed = 0; }
    this.positionAll();
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  getMoveAngle(): number { return this._moveAngle; }
  getMoveSpeed(): number { return this._moveSpeed; }
  getAimAngle():  number { return this._aimAngle; }
  isActive():     boolean { return this.active; }

  setVisible(v: boolean): void {
    this.active = v;
    for (const obj of [
      this.joyBase, this.joyThumb,
      this.lockBtn, this.lockIcon,
      this.fireBtn, this.fireLbl,
      this.wallBtn, this.wallLbl,
    ]) { obj.setVisible(v); }
    if (!v) {
      this.joyPointer = null; this._moveSpeed = 0;
      this.firePointer = null; this._fireIntent = false;
      this.wallPointer = null; this._wallIntent = false;
    }
  }

  consumeFireIntent(): boolean { const v = this._fireIntent; this._fireIntent = false; return v; }
  consumeWallIntent(): boolean { const v = this._wallIntent; this._wallIntent = false; return v; }

  destroy(): void {
    this.scene.input.off('pointerdown', this.onDown, this);
    this.scene.input.off('pointermove', this.onMove, this);
    this.scene.input.off('pointerup',   this.onUp,   this);
    this.scene.scale.off('resize', this.onResize, this);
  }
}
