/**
 * AudioManager — procedural Web Audio API sounds + ambient music loop.
 * No external files required.
 */
export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicNodes: AudioNode[] = [];
  private musicRunning = false;
  private enabled = true;

  // Lazy-init AudioContext on first user interaction (browser policy)
  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.7;
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.8;
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.22;
      this.musicGain.connect(this.masterGain);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => undefined);
    }
    return this.ctx;
  }

  // ─── Master toggle ────────────────────────────────────────────────────────

  setEnabled(on: boolean): void {
    this.enabled = on;
    if (this.masterGain) this.masterGain.gain.value = on ? 0.7 : 0;
  }

  // ─── SFX helpers ──────────────────────────────────────────────────────────

  /**
   * Ruido blanco filtrado. filterType/freq/Q controlan el timbre.
   * delayStart permite escalonar capas dentro de un mismo sonido.
   */
  private noise(
    duration = 0.05,
    vol = 0.3,
    filterType: BiquadFilterType = 'bandpass',
    filterFreq = 600,
    filterQ = 0.8,
    delayStart = 0,
  ): void {
    if (!this.enabled) return;
    try {
      const ctx = this.getCtx();
      const t = ctx.currentTime + delayStart;
      const bufLen = Math.floor(ctx.sampleRate * duration);
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1);

      const src = ctx.createBufferSource();
      src.buffer = buf;

      const g = ctx.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + duration);

      const f = ctx.createBiquadFilter();
      f.type = filterType;
      f.frequency.value = filterFreq;
      f.Q.value = filterQ;

      src.connect(f);
      f.connect(g);
      g.connect(this.sfxGain!);
      src.start(t);
      src.stop(t + duration);
    } catch { /* silent fail */ }
  }

  private tone(
    freq: number,
    duration: number,
    vol = 0.4,
    type: OscillatorType = 'sine',
    freqEnd?: number,
    delayStart = 0,
  ): void {
    if (!this.enabled) return;
    try {
      const ctx = this.getCtx();
      const t = ctx.currentTime + delayStart;
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      if (freqEnd !== undefined) {
        osc.frequency.exponentialRampToValueAtTime(freqEnd, t + duration);
      }

      const g = ctx.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + duration);

      osc.connect(g);
      g.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + duration);
    } catch { /* silent fail */ }
  }

  // ─── SFX ──────────────────────────────────────────────────────────────────

  playShoot(): void {
    // Sub-boom del cañón — muy grave, la firma de un cañón de tanque real
    this.tone(90, 0.38, 0.75, 'sine', 22);
    // Onda de presión del blast — ruido grave y denso
    this.noise(0.25, 0.85, 'lowpass', 260, 0.5);
    // Crack supersónico — brevísimo, high-end del disparo
    this.noise(0.016, 0.55, 'highpass', 3800, 0.3);
  }

  playHit(): void {
    // Metallic thud
    this.tone(200, 0.12, 0.35, 'sawtooth', 80);
    this.noise(0.08, 0.25);
  }

  playPickup(): void {
    // Rising chime
    this.tone(600, 0.06, 0.3, 'sine');
    this.tone(900, 0.06, 0.25, 'sine');
  }

  playPowerPickup(): void {
    // Ascending sweep — more dramatic
    this.tone(400, 0.18, 0.4, 'sine', 1200);
    this.tone(500, 0.14, 0.3, 'triangle', 1400);
    this.noise(0.06, 0.1);
  }

  playShieldAbsorb(): void {
    // Energy dissipation
    this.tone(800, 0.15, 0.35, 'sine', 300);
    this.noise(0.1, 0.15);
  }

  playWallPlace(): void {
    this.tone(180, 0.1, 0.3, 'sawtooth', 120);
    this.noise(0.06, 0.2);
  }

  playDeath(): void {
    // Sub-bass profundo — la onda expansiva de la explosión
    this.tone(42, 0.9, 1.0, 'sine', 12);
    // Onda de choque principal — boom denso y largo
    this.noise(1.1, 1.0, 'lowpass', 180, 0.5);
    // Segunda capa grave con timbre áspero
    this.tone(85, 0.6, 0.7, 'sawtooth', 18);
    // Cuerpo medio de la explosión — rellena el espacio entre graves y agudos
    this.noise(0.8, 0.6, 'lowpass', 600, 0.8, 0.03);
    // Debris metálico — metralla con delay natural
    this.noise(0.65, 0.45, 'bandpass', 1800, 1.5, 0.07);
  }

  playCollisionTank(): void {
    this.tone(280, 0.07, 0.2, 'square', 140);
    this.noise(0.05, 0.15);
  }

  playCollisionWall(): void {
    this.noise(0.06, 0.18);
    this.tone(220, 0.08, 0.15, 'sawtooth', 110);
  }

  // ─── Ambient music loop ───────────────────────────────────────────────────
  // Simple 4-note pentatonic drone with slow arpeggiation.

  startMusic(): void {
    if (this.musicRunning) return;
    this.musicRunning = true;
    try {
      this.buildMusicLoop();
    } catch { /* silent fail */ }
  }

  stopMusic(): void {
    this.musicRunning = false;
    for (const n of this.musicNodes) {
      try { (n as OscillatorNode | GainNode).disconnect(); } catch { /* ok */ }
    }
    this.musicNodes = [];
  }

  private buildMusicLoop(): void {
    if (!this.enabled) return;
    const ctx = this.getCtx();
    // Pentatonic notes (A minor pentatonic): A2, C3, D3, E3, G3
    const notes = [110, 130.81, 146.83, 164.81, 196];
    const loopDur = 8; // seconds per cycle

    const playNote = (freq: number, startTime: number, dur: number, vol: number) => {
      if (!this.musicRunning) return;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const osc2 = ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.value = freq * 2.002; // slight detune for warmth

      const g = ctx.createGain();
      g.gain.setValueAtTime(0, startTime);
      g.gain.linearRampToValueAtTime(vol, startTime + 0.3);
      g.gain.setValueAtTime(vol, startTime + dur - 0.4);
      g.gain.linearRampToValueAtTime(0, startTime + dur);

      // Reverb-like effect using a delay
      const delay = ctx.createDelay(1.0);
      delay.delayTime.value = 0.35;
      const delayGain = ctx.createGain();
      delayGain.gain.value = 0.3;

      osc.connect(g);
      osc2.connect(g);
      g.connect(this.musicGain!);
      g.connect(delay);
      delay.connect(delayGain);
      delayGain.connect(this.musicGain!);

      osc.start(startTime);
      osc.stop(startTime + dur + 0.1);
      osc2.start(startTime);
      osc2.stop(startTime + dur + 0.1);

      this.musicNodes.push(osc, osc2, g, delay, delayGain);
    };

    const schedule = (offset: number) => {
      if (!this.musicRunning) return;
      const t = ctx.currentTime + offset;

      // Slow arpeggio pattern
      playNote(notes[0], t + 0.0, 3.0, 0.18);
      playNote(notes[2], t + 2.0, 2.5, 0.14);
      playNote(notes[4], t + 4.0, 2.5, 0.12);
      playNote(notes[1], t + 6.0, 2.5, 0.14);

      // Drone bass
      const bassOsc = ctx.createOscillator();
      bassOsc.type = 'sine';
      bassOsc.frequency.value = notes[0] / 2; // one octave below

      const bassGain = ctx.createGain();
      bassGain.gain.setValueAtTime(0.1, t);
      bassGain.gain.linearRampToValueAtTime(0, t + loopDur);

      bassOsc.connect(bassGain);
      bassGain.connect(this.musicGain!);
      bassOsc.start(t);
      bassOsc.stop(t + loopDur);

      this.musicNodes.push(bassOsc, bassGain);

      // Schedule next loop
      setTimeout(() => {
        if (this.musicRunning) schedule(loopDur - 0.1);
      }, (loopDur - 1) * 1000);
    };

    schedule(0.5);
  }

  destroy(): void {
    this.stopMusic();
    this.ctx?.close().catch(() => undefined);
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;
  }
}
