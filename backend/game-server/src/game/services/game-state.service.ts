import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  ServerGameState,
  ServerPlayerState,
  ServerStaticObstacleState,
  StaticObstacleType,
  PowerUpType,
  ClientInput,
  GameStatePayload,
  PlayerSnapshot,
  PowerUpSnapshot,
  TrapSnapshot,
  FlagSnapshot,
  DestinationSnapshot,
  StaticObstacleSnapshot,
  LeaderboardEntry,
} from '../models/game-state.model';

export interface CharacterBonuses {
  characterId: string | null;
  characterSlug: string | null;
}

const BOT_COUNT = Math.min(50, Math.max(0, parseInt(process.env['GAME_BOT_COUNT'] ?? '4', 10)));
const TRAP_COUNT = 7;
const MACE_RANGE = 120;
const MACE_STUN_MS = 5000;
const LEVEL_POINTS = 50;   // score points per level step
const LEVEL_MAX = 15;

// Alternate between the two available spritesheets: gearhead (walker) and phantom (floater)
const BOT_CHARACTER_SLUGS: string[] = [
  'gearhead', 'phantom', 'gearhead', 'phantom',
  'gearhead', 'phantom', 'gearhead', 'phantom',
  'gearhead', 'phantom', 'gearhead', 'phantom',
  'gearhead', 'phantom', 'gearhead', 'phantom',
];

const BOT_NAMES = [
  'Shadow', 'Reaper', 'Vortex', 'Blaze', 'Storm', 'Cobra', 'Razor', 'Titan',
  'Bolt', 'Fury', 'Shade', 'Ghost', 'Iron', 'Nova', 'Spike', 'Crush',
  'Hawk', 'Raven', 'Dusk', 'Apex', 'Drake', 'Ember', 'Frost', 'Grim',
  'Howl', 'Jolt', 'Knave', 'Lynx', 'Mace', 'Nyte',
];

// ─── Obstacle geometry ────────────────────────────────────────────────────────

const OBSTACLE_DEFS: Record<StaticObstacleType, { w: number; h: number; isCircle: boolean }> = {
  BUNKER:  { w: 300, h: 200, isCircle: false },
  BARRIER: { w: 400, h:  99, isCircle: false },
  ROUND:   { w: 160, h: 160, isCircle: true  },
};
const OBSTACLE_TYPES: StaticObstacleType[] = ['BUNKER', 'BARRIER', 'ROUND'];
const BARRIER_ANGLES = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4];

function generateObstacles(mapWidth: number, mapHeight: number): ServerStaticObstacleState[] {
  const count = Math.min(12, Math.max(6, Math.floor((mapWidth * mapHeight) / 600000)));
  const margin = 220;
  const minSep = 260;
  const obstacles: ServerStaticObstacleState[] = [];

  for (let attempt = 0; attempt < count * 20 && obstacles.length < count; attempt++) {
    const type: StaticObstacleType = OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];
    const def = OBSTACLE_DEFS[type];
    const angle = type === 'BARRIER'
      ? BARRIER_ANGLES[Math.floor(Math.random() * BARRIER_ANGLES.length)]
      : 0;
    const x = margin + Math.random() * (mapWidth - margin * 2);
    const y = margin + Math.random() * (mapHeight - margin * 2);

    const tooClose = obstacles.some(o => {
      const dx = o.x - x;
      const dy = o.y - y;
      return Math.sqrt(dx * dx + dy * dy) < minSep;
    });
    if (tooClose) continue;

    obstacles.push({
      id: uuidv4().slice(0, 8),
      type,
      x,
      y,
      angle,
      w: def.w,
      h: def.h,
      isCircle: def.isCircle,
    });
  }

  return obstacles;
}

function randomMapPoint(mapWidth: number, mapHeight: number, margin = 150): { x: number; y: number } {
  return {
    x: margin + Math.random() * (mapWidth - margin * 2),
    y: margin + Math.random() * (mapHeight - margin * 2),
  };
}

function isClearOfObstacles(
  x: number, y: number, clearance: number,
  obstacles: ServerStaticObstacleState[],
): boolean {
  for (const obs of obstacles) {
    const obsR = obs.isCircle ? obs.w / 2 : Math.max(obs.w, obs.h) / 2;
    const dx = x - obs.x;
    const dy = y - obs.y;
    if (Math.sqrt(dx * dx + dy * dy) < clearance + obsR + 30) return false;
  }
  return true;
}

function randomMapPointSafe(
  mapWidth: number, mapHeight: number,
  obstacles: ServerStaticObstacleState[],
  clearance: number,
  margin = 150,
): { x: number; y: number } {
  for (let i = 0; i < 40; i++) {
    const x = margin + Math.random() * (mapWidth - margin * 2);
    const y = margin + Math.random() * (mapHeight - margin * 2);
    if (isClearOfObstacles(x, y, clearance, obstacles)) return { x, y };
  }
  return randomMapPoint(mapWidth, mapHeight, margin);
}

export function scoreToLevel(score: number): number {
  return Math.min(LEVEL_MAX, Math.floor(score / LEVEL_POINTS) + 1);
}

// Mace range increases slightly with level
export function getMaceRange(level: number): number {
  return MACE_RANGE + (level - 1) * 4;
}

export function getMaceStunMs(targetLevel: number): number {
  return targetLevel >= 8 ? 3000 : MACE_STUN_MS;
}

@Injectable()
export class GameStateService {
  private readonly states = new Map<string, ServerGameState>();

  // ─── Init ──────────────────────────────────────────────────────────────────

  createRoomState(roomId: string, mapWidth = 2800, mapHeight = 1867): ServerGameState {
    const now = Date.now();
    const obstacles = generateObstacles(mapWidth, mapHeight);

    const flagPos = randomMapPointSafe(mapWidth, mapHeight, obstacles, 40);
    const destPos = randomMapPointSafe(mapWidth, mapHeight, obstacles, 80, 200);

    const state: ServerGameState = {
      tick: 0,
      lastSpawnPowerUp: now,
      mapWidth,
      mapHeight,
      players: new Map(),
      flag: {
        id: uuidv4().slice(0, 8),
        x: flagPos.x,
        y: flagPos.y,
        carriedBy: null,
        lastCarrierId: null,
        droppedAt: 0,
        isOnGround: true,
        firstIlluminatedBy: null,
      },
      destination: {
        x: destPos.x,
        y: destPos.y,
        radius: 80,
        revealUntil: 0,
      },
      traps: new Map(),
      powerUps: new Map(),
      obstacles,
      blackoutUntil: 0,
    };

    // Generate traps spread across the map
    for (let i = 0; i < TRAP_COUNT; i++) {
      const pos = randomMapPointSafe(mapWidth, mapHeight, obstacles, 30, 100);
      const trapId = uuidv4().slice(0, 8);
      state.traps.set(trapId, {
        id: trapId,
        x: pos.x,
        y: pos.y,
        active: true,
        respawnAt: 0,
      });
    }

    // Spawn initial power-ups (garantiza que SEE_OTHERS aparezca desde el inicio)
    const initialPowerTypes: PowerUpType[] = ['MACE_SHIELD', 'SPRINT', 'SEE_OTHERS', 'GHOST'];
    for (const type of initialPowerTypes) {
      this.spawnPowerUp(state, type);
    }

    // Spawn bots
    const margin = 300;
    for (let i = 0; i < BOT_COUNT; i++) {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const bx = margin + (col / 3) * (mapWidth - margin * 2);
      const by = margin + (row / Math.max(1, Math.ceil(BOT_COUNT / 4) - 1)) * (mapHeight - margin * 2);

      const bot: ServerPlayerState = {
        id: `bot-${i}`,
        username: BOT_NAMES[i % BOT_NAMES.length],
        x: bx + (Math.random() - 0.5) * 150,
        y: by + (Math.random() - 0.5) * 150,
        aimAngle: Math.random() * Math.PI * 2,
        lightOn: true,
        hasFlag: false,
        score: 0,
        level: 1,
        maceCooldownEnd: 0,
        stunUntil: 0,
        invincibleUntil: 0,
        activePowerType: null,
        powerExpiresAt: 0,
        hasMaceShield: false,
        sprintActive: false,
        isGhost: false,
        superMaceCharges: 0,
        revelationActive: false,
        characterId: null,
        characterSlug: BOT_CHARACTER_SLUGS[i % BOT_CHARACTER_SLUGS.length],
        isBot: true,
        botState: 'PATROL',
        botDirectionX: Math.random() * 2 - 1,
        botDirectionY: Math.random() * 2 - 1,
        botNextDirectionChange: now + 2000,
        pendingInput: null,
        isDead: false,
        respawnAt: 0,
        hasStartedPlaying: true,
        knockbackVx: 0,
        knockbackVy: 0,
        knockbackTicks: 0,
        lastFlagPickupAt: 0,
        botFlagKnownUntil: 0,
      };

      state.players.set(bot.id, bot);
    }

    this.states.set(roomId, state);
    return state;
  }

  getRoomState(roomId: string): ServerGameState | undefined {
    return this.states.get(roomId);
  }

  deleteRoomState(roomId: string): void {
    this.states.delete(roomId);
  }

  allRoomIds(): string[] {
    return [...this.states.keys()];
  }

  // ─── Players ───────────────────────────────────────────────────────────────

  addHumanPlayer(roomId: string, playerId: string, username: string, bonuses?: CharacterBonuses): void {
    const state = this.states.get(roomId);
    if (!state) return;

    const player: ServerPlayerState = {
      id: playerId,
      username,
      x: 200 + Math.random() * (state.mapWidth - 400),
      y: 200 + Math.random() * (state.mapHeight - 400),
      aimAngle: 0,
      lightOn: true,
      hasFlag: false,
      score: 0,
      level: 1,
      maceCooldownEnd: 0,
      stunUntil: 0,
      invincibleUntil: Date.now() + 1500,
      activePowerType: null,
      powerExpiresAt: 0,
      hasMaceShield: false,
      sprintActive: false,
      isGhost: false,
      superMaceCharges: 0,
      revelationActive: false,
      characterId: bonuses?.characterId ?? null,
      characterSlug: bonuses?.characterSlug ?? null,
      isBot: false,
      botState: 'PATROL',
      botDirectionX: 0,
      botDirectionY: 0,
      botNextDirectionChange: 0,
      pendingInput: null,
      isDead: false,
      respawnAt: 0,
      hasStartedPlaying: false,
      knockbackVx: 0,
      knockbackVy: 0,
      knockbackTicks: 0,
      lastFlagPickupAt: 0,
      botFlagKnownUntil: 0,
    };

    state.players.set(playerId, player);
  }

  removeHumanPlayer(roomId: string, playerId: string): void {
    const state = this.states.get(roomId);
    if (!state) return;
    const player = state.players.get(playerId);
    if (player?.hasFlag) {
      state.flag.carriedBy = null;
      state.flag.isOnGround = true;
      state.flag.x = player.x;
      state.flag.y = player.y;
      state.flag.droppedAt = Date.now();
    }
    state.players.delete(playerId);
  }

  queueInput(roomId: string, playerId: string, input: ClientInput): void {
    const state = this.states.get(roomId);
    if (!state) return;
    const player = state.players.get(playerId);
    if (!player || player.isBot) return;

    // Preserve one-shot booleans if previous input not yet consumed
    if (player.pendingInput) {
      input.mace        = input.mace        || player.pendingInput.mace;
      input.toggleLight = input.toggleLight || player.pendingInput.toggleLight;
      input.pulse       = input.pulse       || player.pendingInput.pulse;
    }

    player.pendingInput = input;
  }

  // ─── Power-up spawn ────────────────────────────────────────────────────────

  spawnPowerUp(state: ServerGameState, type: PowerUpType): void {
    const pos = randomMapPointSafe(state.mapWidth, state.mapHeight, state.obstacles, 30, 100);
    const id = uuidv4().slice(0, 8);
    state.powerUps.set(id, { id, type, x: pos.x, y: pos.y });
  }

  // ─── Flag helpers ──────────────────────────────────────────────────────────

  resetFlag(state: ServerGameState): void {
    const pos = randomMapPoint(state.mapWidth, state.mapHeight);
    state.flag.x = pos.x;
    state.flag.y = pos.y;
    state.flag.carriedBy = null;
    state.flag.isOnGround = true;
    state.flag.droppedAt = 0;
    state.flag.lastCarrierId = null;
    state.flag.firstIlluminatedBy = null;
  }

  resetDestination(state: ServerGameState): void {
    const pos = randomMapPoint(state.mapWidth, state.mapHeight, 200);
    state.destination.x = pos.x;
    state.destination.y = pos.y;
    state.destination.revealUntil = 0;
  }

  // ─── Snapshot builder ──────────────────────────────────────────────────────

  buildSnapshot(state: ServerGameState): GameStatePayload {
    const now = Date.now();

    const leaderboard: LeaderboardEntry[] = [...state.players.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((p, i) => ({
        rank: i + 1,
        id: p.id,
        username: p.username,
        score: p.score,
        level: p.level,
        hasFlag: p.hasFlag,
      }));

    const players: PlayerSnapshot[] = [...state.players.values()].map(p => ({
      id: p.id,
      username: p.username,
      x: p.x,
      y: p.y,
      aimAngle: p.aimAngle,
      lightOn: p.lightOn,
      hasFlag: p.hasFlag,
      score: p.score,
      level: p.level,
      isStunned: now < p.stunUntil,
      stunUntil: p.stunUntil,
      isGhost: p.isGhost,
      hasMaceShield: p.hasMaceShield,
      sprintActive: p.sprintActive,
      superMaceCharges: p.superMaceCharges,
      activePowerType: p.activePowerType,
      powerExpiresAt: p.powerExpiresAt,
      maceCooldownEnd: p.maceCooldownEnd,
      isBot: p.isBot,
      isDead: p.isDead,
      characterSlug: p.characterSlug,
    }));

    const flag: FlagSnapshot = {
      id: state.flag.id,
      x: state.flag.x,
      y: state.flag.y,
      carriedBy: state.flag.carriedBy,
      isOnGround: state.flag.isOnGround,
    };

    const carrier = state.flag.carriedBy ? state.players.get(state.flag.carriedBy) : null;
    const distToCarrier = carrier
      ? (cx: number, cy: number) => {
          const dx = cx - carrier.x;
          const dy = cy - carrier.y;
          return Math.sqrt(dx * dx + dy * dy);
        }
      : null;

    const destination: DestinationSnapshot = {
      x: state.destination.x,
      y: state.destination.y,
      radius: state.destination.radius,
      visibleToAll:
        now < state.destination.revealUntil ||
        (distToCarrier !== null &&
          distToCarrier(state.destination.x, state.destination.y) <= 150),
    };

    const powerUps: PowerUpSnapshot[] = [...state.powerUps.values()].map(p => ({
      id: p.id,
      type: p.type,
      x: p.x,
      y: p.y,
    }));

    const traps: TrapSnapshot[] = [...state.traps.values()].map(t => ({
      id: t.id,
      x: t.x,
      y: t.y,
      active: t.active,
    }));

    return {
      tick: state.tick,
      serverTime: now,
      mapWidth: state.mapWidth,
      mapHeight: state.mapHeight,
      players,
      flag,
      destination,
      powerUps,
      traps,
      leaderboard,
      blackoutUntil: state.blackoutUntil,
    };
  }

  buildObstacleSnapshot(state: ServerGameState): StaticObstacleSnapshot[] {
    return state.obstacles.map(o => ({
      id: o.id,
      type: o.type,
      x: o.x,
      y: o.y,
      angle: o.angle,
      w: o.w,
      h: o.h,
      isCircle: o.isCircle,
    }));
  }
}
