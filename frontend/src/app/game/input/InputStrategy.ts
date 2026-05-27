/**
 * Contrato de input para el jugador local.
 * Dos implementaciones completamente independientes:
 *   - DesktopInput  → mouse + teclado (PC)
 *   - MobileInput   → joystick virtual + botones táctiles (celular)
 *
 * GameScene instancia la correcta al detectar el dispositivo.
 * PlayerTank sólo conoce esta interfaz — nunca sabe en qué plataforma corre.
 */
export interface InputStrategy {
  /** Llamado cada frame de Phaser antes de enviar input. Recibe posición actual del jugador. */
  update(time: number, tankX: number, tankY: number): void;

  /** Ángulo de movimiento en radianes */
  getAngle(): number;

  /** Factor de velocidad [0 = quieto, 1 = máxima] */
  getSpeed(): number;

  /** Ángulo de apuntado del cuerpo/linterna en radianes */
  getAimAngle(): number;

  /** Retorna true UNA vez por evento de mazo (edge-trigger) */
  consumeMace(): boolean;

  /** Retorna true UNA vez — alternar linterna encendida/apagada */
  consumeToggleLight(): boolean;

  /** Retorna true UNA vez — pulso de revelación */
  consumePulse(): boolean;

  /** Llamado cuando el viewport cambia de tamaño */
  onResize(): void;

  /** Limpia listeners y recursos */
  destroy(): void;
}
