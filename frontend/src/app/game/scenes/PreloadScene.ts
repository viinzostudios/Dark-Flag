import Phaser from 'phaser';

// Characters that have a 6-pose spritesheet (1536×1024, 3×2 grid, 512×512 cells)
export const SPRITESHEET_CHARS = new Set(['phantom', 'gearhead']);
const SPRITE_CFG = { frameWidth: 512, frameHeight: 512 };

// All 100 character slugs from the Dark Flag catalog (sortOrder 1-100)
export const CHARACTER_SLUGS: string[] = [
  'novato', 'sombra-gris', 'noctambulo', 'centinela', 'acechador',
  'linternero', 'vagabundo', 'silencioso', 'rastreador', 'explorador',
  'vigilante', 'fugitivo', 'intruso', 'perdido', 'umbral',
  'niebla', 'susurro', 'testigo', 'errante', 'penumbra',
  'cazador', 'anonimo', 'reflejo', 'escondido', 'infiltrado',
  'brecha', 'viajero-nocturno', 'observador', 'acosador', 'tinieblas',
  'mascara-roja', 'eco', 'murmullo', 'fosforito', 'eco-azul',
  'polilla', 'vela', 'cuervo', 'luna-menguante', 'sombra-esmeralda',
  'recluso', 'espectro', 'destello', 'emboscada', 'tormenta-arena',
  'voraz', 'corsario', 'alquimista', 'mercenario', 'cazarrecompensas',
  'asesino-sombra', 'saboteador', 'pionero-oscuro', 'escolta', 'profeta-oscuro',
  'demonio-silente', 'vigia', 'mente-colmena', 'orador', 'depredador',
  'heraldo', 'forjador', 'nomada', 'encapuchado', 'exiliado',
  'jinete-nocturno', 'susurrador', 'escorpion-negro', 'luz-rota', 'corriente-oscura',
  'cazador-almas', 'guardia-caido', 'senor-tinieblas', 'sombra-viviente', 'ejecutor',
  'centinela-eterno', 'gearhead', 'mente-oscura', 'portador-caos', 'silencio-eterno',
  'angel-negro', 'volatil', 'guardian-reliquias', 'hijo-sombras', 'espectro-violeta',
  'tormenta-profunda', 'sombra-dorada', 'ultimo-linternero', 'abismo-caminante', 'portavoz-oscuridad',
  'dios-linterna', 'devorador-luz', 'senor-banderas', 'tiempo-oscuro', 'maestro-sombras',
  'phantom', 'fragmento-destino', 'primer-portador', 'abismo-total', 'leyenda-viva',
];

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    // Arena floor — key must match what GameScene looks for: `floor-${slug}`
    const arenaSlug = localStorage.getItem('df_arena') ?? 'space-station';
    this.load.image(`floor-${arenaSlug}`, `assets/environment/arenas/${arenaSlug}.png`);
    if (arenaSlug !== 'space-station') {
      this.load.image('floor-space-station', 'assets/environment/arenas/space-station.png');
    }

    // Always load spritesheet characters
    for (const slug of SPRITESHEET_CHARS) {
      this.load.spritesheet(`char-${slug}`, `assets/characters/${slug}.png`, SPRITE_CFG);
    }

    // Active character (image fallback if not already a spritesheet char)
    const activeCharSlug = localStorage.getItem('df_active_character') ?? null;
    if (activeCharSlug && !SPRITESHEET_CHARS.has(activeCharSlug)) {
      this.load.image(`char-${activeCharSlug}`, `assets/characters/${activeCharSlug}.png`);
    }

    // Flag & destination
    this.load.image('flag-icon', 'assets/ui/flag-icon.png');

    // Power-up icons
    this.load.image('power-MACE_SHIELD',  'assets/pickups/power-mace-shield.png');
    this.load.image('power-REVELATION',   'assets/pickups/power-revelation.png');
    this.load.image('power-SPRINT',       'assets/pickups/power-sprint.png');
    this.load.image('power-BLACKOUT',     'assets/pickups/power-blackout.png');
    this.load.image('power-SUPER_MACE',   'assets/pickups/power-super-mace.png');
    this.load.image('power-GHOST',        'assets/pickups/power-ghost.png');

    // Static obstacles — keys match GameScene: obs-round (isCircle) and obs-barrier (rect)
    this.load.image('obs-round',    'assets/environment/obs-round.png');
    this.load.image('obs-barrier',  'assets/environment/obs-barrier.png');
    this.load.image('obs-bunker',   'assets/environment/obs-bunker.png');

    // Trap marker
    this.load.image('trap-marker', 'assets/environment/trap-marker.png');

    // VFX
    this.load.spritesheet('vfx-mace-impact', 'assets/effects/vfx-mace-impact.png', { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('vfx-trap-trigger', 'assets/effects/vfx-trap-trigger.png', { frameWidth: 96, frameHeight: 96 });
  }

  create(): void {
    // Character animations (6 frames: idle, move_a, move_b, strike, stunned, victory)
    for (const slug of SPRITESHEET_CHARS) {
      if (this.anims.exists(`${slug}-idle`)) continue;
      const k = `char-${slug}`;
      this.anims.create({ key: `${slug}-idle`,    frames: [{ key: k, frame: 0 }], frameRate: 1,  repeat: -1 });
      this.anims.create({ key: `${slug}-move`,    frames: this.anims.generateFrameNumbers(k, { frames: [1, 2] }), frameRate: 8, repeat: -1 });
      this.anims.create({ key: `${slug}-strike`,  frames: [{ key: k, frame: 3 }], frameRate: 1,  repeat: 0  });
      this.anims.create({ key: `${slug}-stunned`, frames: [{ key: k, frame: 4 }], frameRate: 1,  repeat: -1 });
      this.anims.create({ key: `${slug}-victory`, frames: [{ key: k, frame: 5 }], frameRate: 1,  repeat: 0  });
    }

    // Mace impact animation
    if (!this.anims.exists('anim-mace-impact')) {
      this.anims.create({
        key: 'anim-mace-impact',
        frames: this.anims.generateFrameNumbers('vfx-mace-impact', { start: 0, end: 5 }),
        frameRate: 18,
        repeat: 0,
      });
    }
    if (!this.anims.exists('anim-trap-trigger')) {
      this.anims.create({
        key: 'anim-trap-trigger',
        frames: this.anims.generateFrameNumbers('vfx-trap-trigger', { start: 0, end: 3 }),
        frameRate: 12,
        repeat: 0,
      });
    }

    this.scene.start('GameScene');
  }
}
