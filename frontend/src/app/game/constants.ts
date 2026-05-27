export const GAME = {
  // Map
  MAP_WIDTH:  2400,
  MAP_HEIGHT: 1600,

  // Player
  PLAYER_RADIUS:      20,
  RESPAWN_DELAY_MS:   3000,
  INVINCIBILITY_MS:   2000,
  BLINK_INTERVAL_MS:  120,

  // Movement
  MOUSE_MIN_DIST:  30,   // dead zone radius — inside this, speedFactor = 0
  MOUSE_MAX_DIST:  180,  // distance at which full speed is reached
  MAX_SPEED:       220,  // px/s at speedFactor=1

  // Mace
  MACE_COOLDOWN_MS:  12000,
  MACE_STUN_MS:      5000,
  MACE_RANGE_BASE:   80,   // level 1 range, px

  // Flashlight
  LIGHT_CONE_ANGLE:   Math.PI * 0.7,   // ~126° in radians
  LIGHT_CONE_RANGE:   320,              // illumination radius, px
  LIGHT_RAY_COUNT:    60,               // rays for flashlight polygon

  // Flag
  FLAG_RADIUS:    20,
  FLAG_GLOW_BASE: 0xf59e0b,   // amber glow when visible

  // Destination zone
  DESTINATION_RADIUS: 80,

  // Traps
  TRAP_RADIUS:   18,

  // Power-ups
  MAX_POWERUPS_ON_MAP: 4,

  // Bots
  BOT_COUNT: 4,

  // Level
  SCORE_PER_LEVEL: 50,
  MAX_LEVEL:       15,
} as const;

// Power-up visual colors
export const POWER_COLORS: Record<string, number> = {
  MACE_SHIELD:  0x00e5ff,   // cyan
  REVELATION:   0xffd600,   // gold
  SPRINT:       0x76ff03,   // lime green
  BLACKOUT:     0x7c3aed,   // purple
  SUPER_MACE:   0xff6d00,   // deep orange
  GHOST:        0xd1d5db,   // silver-white
};

export const COLORS = {
  MAP_BG:         0x070710,
  MAP_BORDER:     0x1f1f3a,
  MAP_GRID:       0x0f0f1a,

  PLAYER_BODY:    0x4a6fa5,
  BOT_BODY:       0x7c3aed,

  FLAG_IDLE:      0xf59e0b,   // amber
  FLAG_CARRIED:   0xef4444,   // red when carried
  DESTINATION:    0x10b981,   // teal zone

  TRAP_ACTIVE:    0xff4444,
  TRAP_INACTIVE:  0x444466,

  HUD_BG:     0x000000,
  HUD_TEXT:   0xffffff,
  HUD_ACCENT: 0x7c3aed,   // purple brand color

  // Levels
  LEVEL_COMMON:    0x6b7280,
  LEVEL_RARE:      0x0288d1,
  LEVEL_EPIC:      0x7b1fa2,
  LEVEL_LEGENDARY: 0xf9a825,

  // Static obstacles
  OBS_FILL:   0x1e1e2e,
  OBS_STROKE: 0x3a3a5e,
} as const;

// Arena background colors (used as fallback if no texture)
export const ARENA_COLORS: Record<string, number> = {
  'space-station':   0x080810,
  'lava-subterranea': 0x1a0500,
  'profundidades':   0x001122,
  'cienaga-toxica':  0x031a0a,
  'desierto-nocturno': 0x1a1000,
  'glaciar':         0x001633,
  'ceniza-volcanica': 0x0d0d0d,
  'bosque-oscuro':   0x020e02,
  'cosmos':          0x000008,
  'neon-urbano':     0x050505,
};

export function getArenaColor(slug: string): number {
  return ARENA_COLORS[slug] ?? COLORS.MAP_BG;
}

export function scoreToLevel(score: number): number {
  return Math.min(GAME.MAX_LEVEL, Math.floor(score / GAME.SCORE_PER_LEVEL) + 1);
}

export function getLevelColor(level: number): number {
  if (level >= 12) return COLORS.LEVEL_LEGENDARY;
  if (level >= 8)  return COLORS.LEVEL_EPIC;
  if (level >= 4)  return COLORS.LEVEL_RARE;
  return COLORS.LEVEL_COMMON;
}
