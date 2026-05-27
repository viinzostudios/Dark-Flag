// ─── Dark Flag — server-authoritative game state types ───────────────────────

// ─── Input ────────────────────────────────────────────────────────────────────

export interface ClientInput {
  mouseAngle:   number;   // radians — direction from player center to cursor
  speedFactor:  number;   // [0, 1] — distance-based speed
  aimAngle:     number;   // flashlight direction (same as mouseAngle normally)
  mace:         boolean;  // player pressed mace this frame
  toggleLight:  boolean;  // player pressed spacebar (toggle flashlight)
  pulse:        boolean;  // player activated Pulse ability (level 6+)
  clientTick:   number;
}

// ─── Power-ups ────────────────────────────────────────────────────────────────

export type PowerUpType =
  | 'MACE_SHIELD'    // blocks next mace hit
  | 'REVELATION'     // reveals all players for 10s
  | 'SPRINT'         // +40% speed for 8s
  | 'BLACKOUT'       // turns off everyone's flashlight for 5s
  | 'SUPER_MACE'     // next 2 maces deal double stun
  | 'GHOST';         // invisible to others for 8s

// ─── Static obstacles ─────────────────────────────────────────────────────────

export type StaticObstacleType = 'BUNKER' | 'BARRIER' | 'ROUND';

export interface ServerStaticObstacleState {
  id: string;
  type: StaticObstacleType;
  x: number;
  y: number;
  angle: number;
  w: number;
  h: number;
  isCircle: boolean;
}

// ─── Flag ─────────────────────────────────────────────────────────────────────

export interface ServerFlagState {
  id: string;
  x: number;
  y: number;
  carriedBy: string | null;       // playerId or null
  lastCarrierId: string | null;
  droppedAt: number;              // timestamp
  isOnGround: boolean;
  firstIlluminatedBy: string | null;
}

// ─── Destination ──────────────────────────────────────────────────────────────

export interface ServerDestinationState {
  x: number;
  y: number;
  radius: number;                 // default 80
  revealUntil: number;            // timestamp: global visible until (level 15 bonus)
}

// ─── Traps ────────────────────────────────────────────────────────────────────

export interface ServerTrapState {
  id: string;
  x: number;
  y: number;
  active: boolean;
  respawnAt: number;              // timestamp when trap becomes active again
}

// ─── Power-up on map ──────────────────────────────────────────────────────────

export interface ServerPowerUpState {
  id: string;
  type: PowerUpType;
  x: number;
  y: number;
}

// ─── Player ───────────────────────────────────────────────────────────────────

export interface ServerPlayerState {
  id: string;
  username: string;
  x: number;
  y: number;
  aimAngle: number;
  lightOn: boolean;

  // Flag & scoring
  hasFlag: boolean;
  score: number;
  level: number;                  // 1–15

  // Mace
  maceCooldownEnd: number;
  stunUntil: number;
  invincibleUntil: number;        // brief invincibility after being maced

  // Power-up state
  activePowerType: PowerUpType | null;
  powerExpiresAt: number;
  hasMaceShield: boolean;
  sprintActive: boolean;
  isGhost: boolean;
  superMaceCharges: number;       // remaining super-mace hits (0–2)
  revelationActive: boolean;

  // Skin
  characterId: string | null;
  characterSlug: string | null;

  // Bot fields
  isBot: boolean;
  botState: 'PATROL' | 'SEEK_FLAG' | 'CARRY_FLAG' | 'HUNT_CARRIER' | 'FLEE';
  botDirectionX: number;
  botDirectionY: number;
  botNextDirectionChange: number;

  // Input queue
  pendingInput: ClientInput | null;

  // Misc
  isDead: boolean;
  respawnAt: number;
  hasStartedPlaying: boolean;
  knockbackVx: number;
  knockbackVy: number;
  knockbackTicks: number;

  // Anti-cheat
  lastFlagPickupAt: number;         // rate-limits flag pickup to 1 per 5s
}

// ─── Server game state ────────────────────────────────────────────────────────

export interface ServerGameState {
  tick: number;
  lastSpawnPowerUp: number;
  mapWidth: number;
  mapHeight: number;
  players: Map<string, ServerPlayerState>;
  flag: ServerFlagState;
  destination: ServerDestinationState;
  traps: Map<string, ServerTrapState>;
  powerUps: Map<string, ServerPowerUpState>;
  obstacles: ServerStaticObstacleState[];
  blackoutUntil: number;          // global flashlight off until this timestamp
}

// ─── Snapshots sent to clients ───────────────────────────────────────────────

export interface PlayerSnapshot {
  id: string;
  username: string;
  x: number;
  y: number;
  aimAngle: number;
  lightOn: boolean;
  hasFlag: boolean;
  score: number;
  level: number;
  isStunned: boolean;
  stunUntil: number;
  isGhost: boolean;
  hasMaceShield: boolean;
  sprintActive: boolean;
  superMaceCharges: number;
  activePowerType: PowerUpType | null;
  powerExpiresAt: number;
  maceCooldownEnd: number;
  isBot: boolean;
  isDead: boolean;
  characterSlug: string | null;
}

export interface FlagSnapshot {
  id: string;
  x: number;
  y: number;
  carriedBy: string | null;
  isOnGround: boolean;
}

export interface DestinationSnapshot {
  x: number;
  y: number;
  radius: number;
  visibleToAll: boolean;          // true during level-15 reveal or within 150px of carrier
}

export interface PowerUpSnapshot {
  id: string;
  type: PowerUpType;
  x: number;
  y: number;
}

export interface TrapSnapshot {
  id: string;
  x: number;
  y: number;
  active: boolean;
}

export interface StaticObstacleSnapshot {
  id: string;
  type: StaticObstacleType;
  x: number;
  y: number;
  angle: number;
  w: number;
  h: number;
  isCircle: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  username: string;
  score: number;
  level: number;
  hasFlag: boolean;
}

export interface GameStatePayload {
  tick: number;
  serverTime: number;
  mapWidth: number;
  mapHeight: number;
  players: PlayerSnapshot[];
  flag: FlagSnapshot;
  destination: DestinationSnapshot;
  powerUps: PowerUpSnapshot[];
  traps: TrapSnapshot[];
  leaderboard: LeaderboardEntry[];
  blackoutUntil: number;
}
