import Phaser from 'phaser';
import { InputStrategy } from './InputStrategy';

/**
 * Input para celular: joystick virtual flotante (izquierda) + botones de acción (derecha).
 *
 * Controles:
 *   - Joystick (mano izquierda)  → mueve el jugador
 *   - Botón 🔒 (sobre joystick)  → ancla el jugador; joystick controla solo la mira
 *   - Botón ⚡ (mano derecha)    → mazo
 *   - Botón 🔦 (mano derecha)    → alterna linterna
 *   - Botón 💫 (mano derecha)    → pulso de revelación
 *
 * Esta clase NO conoce nada de desktop. Cambiarla no afecta DesktopInput.
 */

// ─── Constantes visuales (en píxeles de pantalla) ────────────────────────────
const JR       = 55;  // radio base del joystick
const TR       = 24;  // radio del pulgar
const JD       = 50;  // desplazamiento máximo del pulgar
const BR       = 40;  // radio de botones de acción
const LR       = 22;  // radio del botón lock
const DEADZONE = 15;  // zona muerta: mínimo desplazamiento para activar movimiento

type Positionable = { setPosition(x: number, y: number): unknown };

export class MobileInput implements InputStrategy {
  private W: number;
  private H: number;
  private z: number;

  // Joystick — se identifica por pointerId para evitar el bug de "pointer pegado"
  private readonly joyBase:  Phaser.GameObjects.Arc;
  private readonly joyThumb: Phaser.GameObjects.Arc;
  private joyPointer:   Phaser.Input.Pointer | null = null;
  private joyPointerId  = -1;
  private joyCX = 0;
  private joyCY = 0;
  private joyDefaultX = 0;
  private joyDefaultY = 0;

  // Botón lock
  private readonly lockBtn:  Phaser.GameObjects.Arc;
  private readonly lockIcon: Phaser.GameObjects.Text;
  private locked = false;
  private lockScreenX = 0;
  private lockScreenY = 0;

  // Botón mazo (⚡)
  private readonly maceBtn: Phaser.GameObjects.Arc;
  private readonly maceLbl: Phaser.GameObjects.Text;
  private macePointer:   Phaser.Input.Pointer | null = null;
  private macePointerId  = -1;
  private _maceIntent    = false;

  // Botón linterna (🔦)
  private readonly lightBtn: Phaser.GameObjects.Arc;
  private readonly lightLbl: Phaser.GameObjects.Text;
  private lightPointer:   Phaser.Input.Pointer | null = null;
  private lightPointerId  = -1;
  private _toggleLightIntent = false;

  // Botón pulso (💫)
  private readonly pulseBtn: Phaser.GameObjects.Arc;
  private readonly pulseLbl: Phaser.GameObjects.Text;
  private pulsePointer:   Phaser.Input.Pointer | null = null;
  private pulsePointerId  = -1;
  private _pulseIntent    = false;

  // Native touch handler — más fiable que Phaser pointerup en multi-touch
  private readonly boundNativeTouchEnd: (e: TouchEvent) => void;

  // Estado de salida
  private _angle    = 0;
  private _speed    = 0;
  private _aimAngle = 0;

  constructor(private readonly scene: Phaser.Scene) {
    this.W = scene.scale.width;
    this.H = scene.scale.height;
    this.z = scene.cameras.main.zoom || 1;

    const D  = 50;
    const ws = (n: number) => Math.round(n / this.z);

    // ── Joystick ──────────────────────────────────────────────────────────
    this.joyBase = scene.add.arc(0, 0, ws(JR), 0, 360, false, 0xffffff, 0.13)
      .setScrollFactor(0).setDepth(D)
      .setStrokeStyle(ws(2), 0xffffff, 0.35);
    this.joyThumb = scene.add.arc(0, 0, ws(TR), 0, 360, false, 0xffffff, 0.6)
      .setScrollFactor(0).setDepth(D + 1);

    // ── Botón lock ────────────────────────────────────────────────────────
    this.lockBtn  = scene.add.arc(0, 0, ws(LR), 0, 360, false, 0x888888, 0.8)
      .setScrollFactor(0).setDepth(D);
    this.lockIcon = scene.add.text(0, 0, '🔒', { fontSize: `${ws(14)}px` })
      .setScrollFactor(0).setDepth(D + 1).setOrigin(0.5);

    // ── Botón mazo (⚡) ───────────────────────────────────────────────────
    this.maceBtn = scene.add.arc(0, 0, ws(BR), 0, 360, false, 0x00e5ff, 0.8)
      .setScrollFactor(0).setDepth(D);
    this.maceLbl = scene.add.text(0, 0, '⚡', { fontSize: `${ws(22)}px` })
      .setScrollFactor(0).setDepth(D + 1).setOrigin(0.5);

    // ── Botón linterna (🔦) ───────────────────────────────────────────────
    this.lightBtn = scene.add.arc(0, 0, ws(BR), 0, 360, false, 0xf59e0b, 0.8)
      .setScrollFactor(0).setDepth(D);
    this.lightLbl = scene.add.text(0, 0, '🔦', { fontSize: `${ws(20)}px` })
      .setScrollFactor(0).setDepth(D + 1).setOrigin(0.5);

    // ── Botón pulso (💫) ──────────────────────────────────────────────────
    this.pulseBtn = scene.add.arc(0, 0, ws(BR), 0, 360, false, 0x7c3aed, 0.8)
      .setScrollFactor(0).setDepth(D);
    this.pulseLbl = scene.add.text(0, 0, '💫', { fontSize: `${ws(18)}px` })
      .setScrollFactor(0).setDepth(D + 1).setOrigin(0.5);

    this.positionAll();

    this.boundNativeTouchEnd = (e: TouchEvent) => {
      if (this.joyPointerId === -1) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.joyPointerId) {
          this.releaseJoy();
          break;
        }
      }
    };
    scene.game.canvas.addEventListener('touchend',    this.boundNativeTouchEnd, { passive: true });
    scene.game.canvas.addEventListener('touchcancel', this.boundNativeTouchEnd, { passive: true });

    scene.input.addPointer(4);
    scene.input.on('pointerdown',      this.onDown,   this);
    scene.input.on('pointermove',      this.onMove,   this);
    scene.input.on('pointerup',        this.onUp,     this);
    scene.input.on('pointerupoutside', this.onUp,     this);
    scene.scale.on('resize',           this.onResize, this);
  }

  // ─── InputStrategy ───────────────────────────────────────────────────────

  update(_time: number, _tankX: number, _tankY: number): void {
    if (this.macePointer && !this.macePointer.isDown) {
      this.macePointer = null; this.macePointerId = -1;
      this.maceBtn.setFillStyle(0x00e5ff, 0.8);
    }
    if (this.lightPointer && !this.lightPointer.isDown) {
      this.lightPointer = null; this.lightPointerId = -1;
      this.lightBtn.setFillStyle(0xf59e0b, 0.8);
    }
    if (this.pulsePointer && !this.pulsePointer.isDown) {
      this.pulsePointer = null; this.pulsePointerId = -1;
      this.pulseBtn.setFillStyle(0x7c3aed, 0.8);
    }
  }

  getAngle():    number { return this._angle; }
  getSpeed():    number { return this._speed; }
  getAimAngle(): number { return this._aimAngle; }

  consumeMace():        boolean { const v = this._maceIntent;        this._maceIntent        = false; return v; }
  consumeToggleLight(): boolean { const v = this._toggleLightIntent; this._toggleLightIntent = false; return v; }
  consumePulse():       boolean { const v = this._pulseIntent;       this._pulseIntent       = false; return v; }

  onResize(): void {
    this.W = this.scene.scale.width;
    this.H = this.scene.scale.height;
    this.z = this.scene.cameras.main.zoom || 1;
    if (this.joyPointer) this.releaseJoy();
    this.positionAll();
  }

  destroy(): void {
    this.scene.input.off('pointerdown',      this.onDown,   this);
    this.scene.input.off('pointermove',      this.onMove,   this);
    this.scene.input.off('pointerup',        this.onUp,     this);
    this.scene.input.off('pointerupoutside', this.onUp,     this);
    this.scene.scale.off('resize',           this.onResize, this);
    this.scene.game.canvas.removeEventListener('touchend',    this.boundNativeTouchEnd);
    this.scene.game.canvas.removeEventListener('touchcancel', this.boundNativeTouchEnd);
    this.joyBase.destroy();
    this.joyThumb.destroy();
    this.lockBtn.destroy();
    this.lockIcon.destroy();
    this.maceBtn.destroy();
    this.maceLbl.destroy();
    this.lightBtn.destroy();
    this.lightLbl.destroy();
    this.pulseBtn.destroy();
    this.pulseLbl.destroy();
  }

  // ─── Helpers de coordenadas ───────────────────────────────────────────────

  private toWorld(sx: number, sy: number): { x: number; y: number } {
    const cx = this.W / 2, cy = this.H / 2;
    return { x: cx + (sx - cx) / this.z, y: cy + (sy - cy) / this.z };
  }

  private place(obj: Positionable, sx: number, sy: number): void {
    const { x, y } = this.toWorld(sx, sy);
    obj.setPosition(x, y);
  }

  private positionAll(): void {
    this.z = this.scene.cameras.main.zoom || 1;
    const W = this.W, H = this.H;
    this.joyDefaultX = 110;
    this.joyDefaultY = H - 85;
    this.joyCX = this.joyDefaultX;
    this.joyCY = this.joyDefaultY;

    const lockDX = JR + LR + 18;
    const lockDY = 48;
    this.lockScreenX = Math.round(this.joyDefaultX + lockDX);
    this.lockScreenY = Math.round(this.joyDefaultY - lockDY);

    const maceX  = W - 75,  maceY  = H - 85;
    const lightX = W - 165, lightY = H - 85;
    const pulseX = W - 250, pulseY = H - 85;

    this.place(this.joyBase,  this.joyDefaultX, this.joyDefaultY);
    this.place(this.joyThumb, this.joyDefaultX, this.joyDefaultY);
    this.place(this.lockBtn,  this.lockScreenX, this.lockScreenY);
    this.place(this.lockIcon, this.lockScreenX, this.lockScreenY);
    this.place(this.maceBtn,  maceX,  maceY);
    this.place(this.maceLbl,  maceX,  maceY);
    this.place(this.lightBtn, lightX, lightY);
    this.place(this.lightLbl, lightX, lightY);
    this.place(this.pulseBtn, pulseX, pulseY);
    this.place(this.pulseLbl, pulseX, pulseY);
  }

  private hit(px: number, py: number, bx: number, by: number, r: number): boolean {
    return (px - bx) ** 2 + (py - by) ** 2 < r * r;
  }

  private releaseJoy(): void {
    this.joyPointer   = null;
    this.joyPointerId = -1;
    this.joyCX = this.joyDefaultX;
    this.joyCY = this.joyDefaultY;
    this.place(this.joyBase,  this.joyDefaultX, this.joyDefaultY);
    this.place(this.joyThumb, this.joyDefaultX, this.joyDefaultY);
  }

  // ─── Handlers de toque ───────────────────────────────────────────────────

  private onDown(p: Phaser.Input.Pointer): void {
    const { x: sx, y: sy } = p;
    const W = this.W;

    if (sx < W / 2) {
      if (this.hit(sx, sy, this.lockScreenX, this.lockScreenY, LR + 16)) {
        this.locked = !this.locked;
        this.lockBtn.setFillStyle(this.locked ? 0xf1c40f : 0x888888, 0.8);
        this.lockIcon.setText(this.locked ? '🔓' : '🔒');
        if (this.locked) this._speed = 0;
        return;
      }
      if (this.joyPointerId === -1) {
        this.joyPointer   = p;
        this.joyPointerId = p.pointerId;
        this.joyCX = sx;
        this.joyCY = sy;
        this.place(this.joyBase,  sx, sy);
        this.place(this.joyThumb, sx, sy);
      }
    } else {
      const maceX  = W - 75,  maceY  = this.H - 85;
      const lightX = W - 165, lightY = this.H - 85;
      const pulseX = W - 250, pulseY = this.H - 85;

      if (this.macePointerId === -1 && this.hit(sx, sy, maceX, maceY, BR + 14)) {
        this.macePointer   = p;
        this.macePointerId = p.pointerId;
        this._maceIntent   = true;
        this.maceBtn.setFillStyle(0x00ffff, 1.0);
      } else if (this.lightPointerId === -1 && this.hit(sx, sy, lightX, lightY, BR + 14)) {
        this.lightPointer        = p;
        this.lightPointerId      = p.pointerId;
        this._toggleLightIntent  = true;
        this.lightBtn.setFillStyle(0xffcc00, 1.0);
      } else if (this.pulsePointerId === -1 && this.hit(sx, sy, pulseX, pulseY, BR + 14)) {
        this.pulsePointer   = p;
        this.pulsePointerId = p.pointerId;
        this._pulseIntent   = true;
        this.pulseBtn.setFillStyle(0x9b59b6, 1.0);
      }
    }
  }

  private onMove(p: Phaser.Input.Pointer): void {
    if (p.pointerId !== this.joyPointerId || this.joyPointerId === -1) return;
    if (p.x >= this.W / 2) return;

    const dx    = p.x - this.joyCX;
    const dy    = p.y - this.joyCY;
    const dist  = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    if (this.locked) {
      if (dist > DEADZONE) this._aimAngle = angle;
      this._speed = 0;
    } else {
      if (dist >= DEADZONE) {
        this._angle    = angle;
        this._aimAngle = angle;
        this._speed    = 1;
      }
    }

    const clamped = Math.min(dist, JD);
    this.place(this.joyThumb,
      this.joyCX + Math.cos(angle) * clamped,
      this.joyCY + Math.sin(angle) * clamped,
    );
  }

  private onUp(p: Phaser.Input.Pointer): void {
    // Joystick release via native touchend — no manejar aquí
    if (p.pointerId === this.macePointerId && this.macePointerId !== -1) {
      this.macePointer = null; this.macePointerId = -1;
      this.maceBtn.setFillStyle(0x00e5ff, 0.8);
    }
    if (p.pointerId === this.lightPointerId && this.lightPointerId !== -1) {
      this.lightPointer = null; this.lightPointerId = -1;
      this.lightBtn.setFillStyle(0xf59e0b, 0.8);
    }
    if (p.pointerId === this.pulsePointerId && this.pulsePointerId !== -1) {
      this.pulsePointer = null; this.pulsePointerId = -1;
      this.pulseBtn.setFillStyle(0x7c3aed, 0.8);
    }
  }
}
