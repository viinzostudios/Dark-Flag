import Phaser from 'phaser';
import { GAME } from '../constants';
import { InputStrategy } from './InputStrategy';

/**
 * Input para PC: mouse determina dirección + ángulo de linterna,
 * teclado controla mazo (E / click izq), linterna (L) y pulso (F).
 *
 * Esta clase NO conoce nada de móvil. Cambiarla no afecta MobileInput.
 */
export class DesktopInput implements InputStrategy {
  private readonly lKey: Phaser.Input.Keyboard.Key;
  private readonly eKey: Phaser.Input.Keyboard.Key;
  private readonly fKey: Phaser.Input.Keyboard.Key;

  private _angle    = 0;
  private _speed    = 0;
  private _aimAngle = 0;

  private _maceIntent        = false;
  private _toggleLightIntent = false;
  private _pulseIntent       = false;

  private mouseWasDown = false;
  private eWasDown     = false;
  private lWasDown     = false;
  private fWasDown     = false;

  constructor(private readonly scene: Phaser.Scene) {
    this.lKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.L);
    this.eKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.fKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.F);
  }

  update(_time: number, tankX: number, tankY: number): void {
    const pointer    = this.scene.input.activePointer;
    const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);

    this._angle    = Phaser.Math.Angle.Between(tankX, tankY, worldPoint.x, worldPoint.y);
    this._aimAngle = this._angle;

    const dx   = worldPoint.x - tankX;
    const dy   = worldPoint.y - tankY;
    const zoom = this.scene.cameras.main.zoom;
    const dist = Math.sqrt(dx * dx + dy * dy) * zoom;
    this._speed = dist < GAME.MOUSE_MIN_DIST ? 0 : 1;

    // Mazo (edge-trigger: click izq o tecla E)
    const leftDown = pointer.leftButtonDown();
    const eDown    = this.eKey.isDown;
    if ((leftDown && !this.mouseWasDown) || (eDown && !this.eWasDown)) this._maceIntent = true;
    this.mouseWasDown = leftDown;
    this.eWasDown     = eDown;

    // Alternar linterna (edge-trigger: tecla L)
    const lDown = this.lKey.isDown;
    if (lDown && !this.lWasDown) this._toggleLightIntent = true;
    this.lWasDown = lDown;

    // Pulso (edge-trigger: tecla F)
    const fDown = this.fKey.isDown;
    if (fDown && !this.fWasDown) this._pulseIntent = true;
    this.fWasDown = fDown;
  }

  getAngle():    number { return this._angle; }
  getSpeed():    number { return this._speed; }
  getAimAngle(): number { return this._aimAngle; }

  consumeMace():        boolean { const v = this._maceIntent;        this._maceIntent        = false; return v; }
  consumeToggleLight(): boolean { const v = this._toggleLightIntent; this._toggleLightIntent = false; return v; }
  consumePulse():       boolean { const v = this._pulseIntent;       this._pulseIntent       = false; return v; }

  onResize(): void {
    this._speed             = 0;
    this._maceIntent        = false;
    this._toggleLightIntent = false;
    this._pulseIntent       = false;
    this.mouseWasDown       = false;
    this.eWasDown           = false;
    this.lWasDown           = false;
    this.fWasDown           = false;
  }

  destroy(): void {}
}
