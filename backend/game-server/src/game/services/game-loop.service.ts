import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { GameStateService, getMaceRange, getMaceStunMs, scoreToLevel } from './game-state.service';
import { RoomsService } from '../../rooms/rooms.service';
import {
  ServerGameState,
  ServerPlayerState,
  ServerStaticObstacleState,
  PowerUpType,
} from '../models/game-state.model';

// ─── Constants ────────────────────────────────────────────────────────────────

const TICK_RATE = 30;
const TICK_MS = 1000 / TICK_RATE;

const PLAYER_RADIUS = 20;
const MAX_SPEED = 220;

const MACE_COOLDOWN_MS = 12000;
const MACE_INVINCIBILITY_MS = 3000;

const FLAG_RADIUS = 20;
const DESTINATION_RADIUS = 80;

const TRAP_SPEED_THRESHOLD = 0.70;
const TRAP_STUN_MS = 2000;
const TRAP_RADIUS = 24;
const TRAP_RESPAWN_MS = 45000;

const MAX_POWERUPS_ON_MAP = 4;
const POWERUP_SPAWN_INTERVAL_MS = 20000;
const POWERUP_RADIUS = 18;

const SPRINT_SPEED_BONUS = 0.40;
const SPRINT_DURATION_MS = 8000;
const GHOST_DURATION_MS = 8000;
const BLACKOUT_DURATION_MS = 5000;
const REVELATION_DURATION_MS = 10000;

const SCORE_FLAG_PICKUP = 20;
const SCORE_MACE_HIT = 10;
const SCORE_POWERUP_PICKUP = 10;
const SCORE_FLAG_DELIVERY = 100;

const FLAG_PICKUP_COOLDOWN_MS = 5000;

const RESPAWN_MS = 3000;
const DEATH_KICK_TIMEOUT_MS = 60000;

const BOT_SPEED = 150;
const BOT_DIRECTION_CHANGE_MS = 2000;
const BOT_MACE_RANGE = 100;
const BOT_PULSE_INTERVAL_MS = 20000;

const POWER_WEIGHTS: { type: PowerUpType; weight: number }[] = [
  { type: 'MACE_SHIELD', weight: 25 },
  { type: 'REVELATION',  weight: 20 },
  { type: 'SPRINT',      weight: 25 },
  { type: 'BLACKOUT',    weight: 15 },
  { type: 'SUPER_MACE',  weight: 10 },
  { type: 'GHOST',       weight: 15 },
];

// ─── Level → speed mapping ────────────────────────────────────────────────────

function getLevelSpeed(level: number): number {
  const speeds = [220, 225, 230, 235, 240, 245, 248, 255, 258, 265, 268, 275, 278, 285, 290];
  return speeds[Math.min(level - 1, speeds.length - 1)];
}

@Injectable()
export class GameLoopService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(GameLoopService.name);
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private server: Server | null = null;

  constructor(
    private readonly gameState: GameStateService,
    private readonly rooms: RoomsService,
  ) {}

  setServer(server: Server): void {
    this.server = server;
  }

  onModuleInit(): void {
    this.intervalId = setInterval(() => this.tick(), TICK_MS);
    this.logger.log(`Dark Flag game loop started at ${TICK_RATE} Hz`);
  }

  onModuleDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // ─── Main tick ─────────────────────────────────────────────────────────────

  private tick(): void {
    if (!this.server) return;
    const now = Date.now();
    const dt = TICK_MS / 1000;

    for (const roomId of this.gameState.allRoomIds()) {
      const state = this.gameState.getRoomState(roomId);
      if (!state) continue;

      state.tick++;
      this.processInputs(state, now, dt);
      this.updateBots(state, now, dt);
      this.resolveTankCollisions(state);
      this.processMaces(state, now, roomId);
      this.checkTrapCollisions(state, now, roomId);
      this.checkFlagPickup(state, now, roomId);
      this.checkFlagDelivery(state, now, roomId);
      this.checkPowerUpPickups(state, now, roomId);
      this.handlePowerUpExpiry(state, now, roomId);
      this.spawnPowerUps(state, now, roomId);
      this.updateTraps(state, now);
      this.handleRespawns(state, now, roomId);
      this.kickTimeoutHumans(roomId, state, now);
      this.emitGameState(roomId, state);
    }
  }

  // ─── Input processing ──────────────────────────────────────────────────────

  private processInputs(state: ServerGameState, now: number, dt: number): void {
    for (const player of state.players.values()) {
      if (player.isBot || player.isDead) continue;
      const input = player.pendingInput;
      if (!input) continue;

      if (!player.hasStartedPlaying) {
        player.hasStartedPlaying = true;
      }

      // Stun check — cannot move while stunned
      if (now < player.stunUntil) {
        player.pendingInput = null;
        continue;
      }

      player.aimAngle = input.aimAngle;

      // Toggle flashlight
      if (input.toggleLight) {
        player.lightOn = !player.lightOn;
      }

      // Apply knockback
      if (player.knockbackTicks > 0) {
        player.x += player.knockbackVx;
        player.y += player.knockbackVy;
        player.knockbackTicks--;
      }

      // Movement
      const safeSpeed = Math.max(0, Math.min(1.0, input.speedFactor));
      const speedBonus = player.sprintActive ? SPRINT_SPEED_BONUS : 0;
      const baseSpeed = getLevelSpeed(player.level);
      const speed = safeSpeed * baseSpeed * (1 + speedBonus);

      player.x += Math.cos(input.mouseAngle) * speed * dt;
      player.y += Math.sin(input.mouseAngle) * speed * dt;

      this.resolveAllStaticCollisions(player, state);
      this.clampToMap(player, state);

      // Mace input is processed in processMaces()
      player.pendingInput = { ...input, mace: false, toggleLight: false, pulse: false };
    }
  }

  // ─── Mace logic ────────────────────────────────────────────────────────────

  private processMaces(state: ServerGameState, now: number, roomId: string): void {
    for (const attacker of state.players.values()) {
      if (attacker.isDead) continue;
      if (attacker.hasFlag) continue;                     // carrier cannot mace
      if (now < attacker.maceCooldownEnd) continue;
      if (now < attacker.stunUntil) continue;

      const wantMace = attacker.isBot
        ? this.botWantsMace(attacker, state, now)
        : (attacker.pendingInput?.mace ?? false);

      if (!wantMace) continue;

      const maceRange = getMaceRange(attacker.level);
      let hitTarget: ServerPlayerState | null = null;
      let minDist = Infinity;

      for (const target of state.players.values()) {
        if (target.id === attacker.id) continue;
        if (target.isDead) continue;
        if (now < target.invincibleUntil) continue;
        if (target.isGhost && !attacker.isBot) continue;  // ghost is immune

        const dx = target.x - attacker.x;
        const dy = target.y - attacker.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < maceRange && d < minDist) {
          minDist = d;
          hitTarget = target;
        }
      }

      if (!hitTarget) continue;

      // Mace shield absorbs the hit
      if (hitTarget.hasMaceShield) {
        hitTarget.hasMaceShield = false;
        hitTarget.activePowerType = null;
        attacker.maceCooldownEnd = now + MACE_COOLDOWN_MS;

        if (this.server) {
          this.server.to(roomId).emit('mace_blocked', {
            attackerId: attacker.id,
            targetId: hitTarget.id,
          });
        }
        continue;
      }

      // Level 10+ counterattack: attacker gets stunned 2s
      if (hitTarget.level >= 10) {
        attacker.stunUntil = now + 2000;
        if (this.server) {
          this.server.to(roomId).emit('player_stunned', { playerId: attacker.id, duration: 2000 });
        }
      }

      // Apply stun to target
      const stunMs = getMaceStunMs(hitTarget.level);
      hitTarget.stunUntil = now + stunMs;
      hitTarget.invincibleUntil = now + MACE_INVINCIBILITY_MS;

      // Drop flag if target was carrying
      if (hitTarget.hasFlag) {
        hitTarget.hasFlag = false;
        state.flag.carriedBy = null;
        state.flag.isOnGround = true;
        state.flag.x = hitTarget.x;
        state.flag.y = hitTarget.y;
        state.flag.droppedAt = now;

        if (this.server) {
          this.server.to(roomId).emit('flag_dropped', {
            playerId: hitTarget.id,
            playerName: hitTarget.username,
            x: hitTarget.x,
            y: hitTarget.y,
            reason: 'maced',
          });
        }
      }

      // Super mace effect
      const superMaceActive = attacker.superMaceCharges > 0;
      if (superMaceActive) {
        hitTarget.stunUntil = now + stunMs * 2;
        attacker.superMaceCharges--;
        if (attacker.superMaceCharges === 0) {
          attacker.activePowerType = null;
        }
      }

      // Level down for target
      const prevLevel = hitTarget.level;
      hitTarget.level = Math.max(1, hitTarget.level - 1);

      // Score + level up for attacker
      const prevAttackerLevel = attacker.level;
      attacker.score += SCORE_MACE_HIT;
      const newAttackerLevel = scoreToLevel(attacker.score);
      if (newAttackerLevel > attacker.level) {
        attacker.level = newAttackerLevel;
      }

      attacker.maceCooldownEnd = now + (superMaceActive ? MACE_COOLDOWN_MS / 2 : MACE_COOLDOWN_MS);

      if (this.server) {
        this.server.to(roomId).emit('mace_hit', {
          attackerId: attacker.id,
          targetId: hitTarget.id,
          targetLevel: hitTarget.level,
        });

        if (hitTarget.level < prevLevel) {
          this.server.to(roomId).emit('level_down', {
            playerId: hitTarget.id,
            newLevel: hitTarget.level,
          });
        }

        if (attacker.level > prevAttackerLevel) {
          this.server.to(roomId).emit('level_up', {
            playerId: attacker.id,
            newLevel: attacker.level,
            benefit: this.getLevelBenefit(attacker.level),
          });
        }

        this.server.to(roomId).emit('system_message', {
          text: `${attacker.username} mazó a ${hitTarget.username}`,
          emoji: '🔨',
          type: 'mace',
        });
      }
    }

    // Clear mace flags from human inputs
    for (const player of state.players.values()) {
      if (!player.isBot && player.pendingInput) {
        player.pendingInput.mace = false;
      }
    }
  }

  // ─── Trap collisions ───────────────────────────────────────────────────────

  private checkTrapCollisions(state: ServerGameState, now: number, roomId: string): void {
    for (const trap of state.traps.values()) {
      if (!trap.active) continue;

      for (const player of state.players.values()) {
        if (player.isDead) continue;
        if (now < player.stunUntil) continue;
        if (now < player.invincibleUntil) continue;

        const dx = player.x - trap.x;
        const dy = player.y - trap.y;
        if (dx * dx + dy * dy > (PLAYER_RADIUS + TRAP_RADIUS) ** 2) continue;

        // Only triggers at high speed
        const speed = player.pendingInput?.speedFactor ?? 0;
        if (speed < TRAP_SPEED_THRESHOLD && !player.isBot) continue;

        trap.active = false;
        trap.respawnAt = now + TRAP_RESPAWN_MS;

        player.stunUntil = now + TRAP_STUN_MS;

        // Drop flag if carrier
        if (player.hasFlag) {
          player.hasFlag = false;
          state.flag.carriedBy = null;
          state.flag.isOnGround = true;
          state.flag.x = player.x;
          state.flag.y = player.y;
          state.flag.droppedAt = now;

          if (this.server) {
            this.server.to(roomId).emit('flag_dropped', {
              playerId: player.id,
              playerName: player.username,
              x: player.x,
              y: player.y,
              reason: 'trapped',
            });
          }
        }

        if (this.server) {
          this.server.to(roomId).emit('trap_triggered', {
            playerId: player.id,
            trapId: trap.id,
          });
          this.server.to(roomId).emit('player_stunned', {
            playerId: player.id,
            duration: TRAP_STUN_MS,
          });
        }
        break;
      }
    }
  }

  // ─── Flag pickup ───────────────────────────────────────────────────────────

  private checkFlagPickup(state: ServerGameState, now: number, roomId: string): void {
    if (!state.flag.isOnGround) return;

    for (const player of state.players.values()) {
      if (player.isDead) continue;
      if (now < player.stunUntil) continue;
      if (player.hasFlag) continue;
      // Rate-limit: prevent picking up the flag more than once per 5s
      if (!player.isBot && now - player.lastFlagPickupAt < FLAG_PICKUP_COOLDOWN_MS) continue;

      const dx = player.x - state.flag.x;
      const dy = player.y - state.flag.y;
      if (dx * dx + dy * dy > (PLAYER_RADIUS + FLAG_RADIUS) ** 2) continue;

      // Pick up flag
      player.hasFlag = true;
      player.lastFlagPickupAt = now;
      state.flag.carriedBy = player.id;
      state.flag.isOnGround = false;
      state.flag.x = player.x;
      state.flag.y = player.y;

      const prevLevel = player.level;
      player.score += SCORE_FLAG_PICKUP;
      const newLevel = scoreToLevel(player.score);
      if (newLevel > player.level) {
        player.level = newLevel;
      }

      if (this.server) {
        this.server.to(roomId).emit('flag_picked', {
          playerId: player.id,
          playerName: player.username,
          x: player.x,
          y: player.y,
        });

        if (player.level > prevLevel) {
          this.server.to(roomId).emit('level_up', {
            playerId: player.id,
            newLevel: player.level,
            benefit: this.getLevelBenefit(player.level),
          });
        }

        this.server.to(roomId).emit('system_message', {
          text: `${player.username} tomó la bandera`,
          emoji: '🏴',
          type: 'flag',
        });
      }
      break;
    }
  }

  // ─── Flag delivery ─────────────────────────────────────────────────────────

  private checkFlagDelivery(state: ServerGameState, now: number, roomId: string): void {
    if (!state.flag.carriedBy) return;

    const carrier = state.players.get(state.flag.carriedBy);
    if (!carrier || carrier.isDead) return;

    // Update flag position to carrier position
    state.flag.x = carrier.x;
    state.flag.y = carrier.y;

    // Check delivery
    const dx = carrier.x - state.destination.x;
    const dy = carrier.y - state.destination.y;
    if (dx * dx + dy * dy > DESTINATION_RADIUS ** 2) return;

    // Deliver flag
    carrier.hasFlag = false;
    state.flag.lastCarrierId = carrier.id;

    const prevLevel = carrier.level;
    carrier.score += SCORE_FLAG_DELIVERY;
    const newLevel = scoreToLevel(carrier.score);
    if (newLevel > carrier.level) {
      carrier.level = Math.min(15, newLevel);
    }

    // Level 15 bonus: reveal destination for 3s
    if (carrier.level >= 15) {
      state.destination.revealUntil = now + 3000;
    }

    if (this.server) {
      this.server.to(roomId).emit('flag_scored', {
        playerId: carrier.id,
        playerName: carrier.username,
        newScore: carrier.score,
        totalCaptures: 1,
      });

      if (carrier.level > prevLevel) {
        this.server.to(roomId).emit('level_up', {
          playerId: carrier.id,
          newLevel: carrier.level,
          benefit: this.getLevelBenefit(carrier.level),
        });
      }

      this.server.to(roomId).emit('system_message', {
        text: `🏆 ${carrier.username} entregó la bandera! (+${SCORE_FLAG_DELIVERY})`,
        emoji: '🏆',
        type: 'flag',
      });
    }

    // Reset flag and destination
    this.gameState.resetFlag(state);
    this.gameState.resetDestination(state);

    if (this.server) {
      this.server.to(roomId).emit('flag_reset', { x: state.flag.x, y: state.flag.y });
      this.server.to(roomId).emit('destination_reset', { x: state.destination.x, y: state.destination.y });
    }
  }

  // ─── Power-up pickup ────────────────────────────────────────────────────────

  private checkPowerUpPickups(state: ServerGameState, now: number, roomId: string): void {
    for (const [powerId, power] of state.powerUps) {
      for (const player of state.players.values()) {
        if (player.isDead) continue;
        if (now < player.stunUntil) continue;

        const dx = player.x - power.x;
        const dy = player.y - power.y;
        if (dx * dx + dy * dy > (PLAYER_RADIUS + POWERUP_RADIUS) ** 2) continue;

        this.activatePower(player, power.type, now);
        state.powerUps.delete(powerId);

        const prevLevel = player.level;
        player.score += SCORE_POWERUP_PICKUP;
        const newLevel = scoreToLevel(player.score);
        if (newLevel > player.level) {
          player.level = newLevel;
        }

        if (this.server) {
          this.server.to(roomId).emit('power_collected', {
            playerId: player.id,
            powerType: power.type,
          });

          if (player.level > prevLevel) {
            this.server.to(roomId).emit('level_up', {
              playerId: player.id,
              newLevel: player.level,
              benefit: this.getLevelBenefit(player.level),
            });
          }

          if (power.type === 'BLACKOUT') {
            state.blackoutUntil = now + BLACKOUT_DURATION_MS;
            this.server.to(roomId).emit('blackout_start', {
              sourceId: player.id,
              duration: BLACKOUT_DURATION_MS,
            });
          }
        }
        break;
      }
    }
  }

  private activatePower(player: ServerPlayerState, type: PowerUpType, now: number): void {
    // Clear previous non-stacking power
    player.activePowerType = type;
    player.hasMaceShield = false;
    player.sprintActive = false;
    player.isGhost = false;
    player.revelationActive = false;
    player.superMaceCharges = 0;

    switch (type) {
      case 'MACE_SHIELD':
        player.hasMaceShield = true;
        player.powerExpiresAt = 0;
        break;
      case 'REVELATION':
        player.revelationActive = true;
        player.powerExpiresAt = now + REVELATION_DURATION_MS;
        break;
      case 'SPRINT':
        player.sprintActive = true;
        player.powerExpiresAt = now + SPRINT_DURATION_MS;
        break;
      case 'BLACKOUT':
        player.powerExpiresAt = now + BLACKOUT_DURATION_MS;
        break;
      case 'SUPER_MACE':
        player.superMaceCharges = 2;
        player.powerExpiresAt = 0;
        break;
      case 'GHOST':
        player.isGhost = true;
        player.powerExpiresAt = now + GHOST_DURATION_MS;
        break;
    }
  }

  // ─── Power-up expiry ────────────────────────────────────────────────────────

  private handlePowerUpExpiry(state: ServerGameState, now: number, roomId: string): void {
    for (const player of state.players.values()) {
      if (!player.activePowerType) continue;
      if (player.activePowerType === 'MACE_SHIELD' || player.activePowerType === 'SUPER_MACE') continue;
      if (player.powerExpiresAt > 0 && now >= player.powerExpiresAt) {
        player.activePowerType = null;
        player.powerExpiresAt = 0;
        player.sprintActive = false;
        player.isGhost = false;
        player.revelationActive = false;

        if (player.activePowerType === 'BLACKOUT' && this.server) {
          this.server.to(roomId).emit('blackout_end');
        }
      }
    }

    if (state.blackoutUntil > 0 && now >= state.blackoutUntil) {
      state.blackoutUntil = 0;
      if (this.server) this.server.to(roomId).emit('blackout_end');
    }
  }

  // ─── Power-up spawn ────────────────────────────────────────────────────────

  private spawnPowerUps(state: ServerGameState, now: number, roomId: string): void {
    if (state.powerUps.size >= MAX_POWERUPS_ON_MAP) return;
    if (now - state.lastSpawnPowerUp < POWERUP_SPAWN_INTERVAL_MS) return;

    const type = this.weightedRandomPower();
    this.gameState.spawnPowerUp(state, type);
    state.lastSpawnPowerUp = now;

    const pu = [...state.powerUps.values()].slice(-1)[0];
    if (pu && this.server) {
      this.server.to(roomId).emit('power_spawned', {
        powerUp: { id: pu.id, type: pu.type, x: pu.x, y: pu.y },
      });
    }
  }

  // ─── Trap respawn ─────────────────────────────────────────────────────────

  private updateTraps(state: ServerGameState, now: number): void {
    for (const trap of state.traps.values()) {
      if (!trap.active && now >= trap.respawnAt) {
        trap.active = true;
        trap.respawnAt = 0;
      }
    }
  }

  // ─── Bot AI ────────────────────────────────────────────────────────────────

  private updateBots(state: ServerGameState, now: number, dt: number): void {
    for (const bot of state.players.values()) {
      if (!bot.isBot || bot.isDead) continue;
      if (now < bot.stunUntil) continue;

      this.updateBotState(bot, state, now);

      const dx = bot.botDirectionX;
      const dy = bot.botDirectionY;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      bot.aimAngle = Math.atan2(dy / len, dx / len);

      bot.x += (dx / len) * BOT_SPEED * dt;
      bot.y += (dy / len) * BOT_SPEED * dt;

      this.resolveAllStaticCollisions(bot, state);
      this.clampToMap(bot, state);
    }
  }

  private updateBotState(bot: ServerPlayerState, state: ServerGameState, now: number): void {
    const carrier = state.flag.carriedBy ? state.players.get(state.flag.carriedBy) : null;

    if (bot.hasFlag) {
      bot.botState = 'CARRY_FLAG';
    } else if (carrier && carrier.id !== bot.id) {
      bot.botState = 'HUNT_CARRIER';
    } else if (state.flag.isOnGround) {
      bot.botState = 'SEEK_FLAG';
    } else {
      bot.botState = 'PATROL';
    }

    switch (bot.botState) {
      case 'CARRY_FLAG': {
        const ddx = state.destination.x - bot.x;
        const ddy = state.destination.y - bot.y;
        bot.botDirectionX = ddx;
        bot.botDirectionY = ddy;
        break;
      }
      case 'SEEK_FLAG': {
        const fdx = state.flag.x - bot.x;
        const fdy = state.flag.y - bot.y;
        bot.botDirectionX = fdx;
        bot.botDirectionY = fdy;
        break;
      }
      case 'HUNT_CARRIER': {
        if (carrier) {
          bot.botDirectionX = carrier.x - bot.x;
          bot.botDirectionY = carrier.y - bot.y;
        }
        break;
      }
      default: {
        if (now >= bot.botNextDirectionChange) {
          bot.botDirectionX = Math.random() * 2 - 1;
          bot.botDirectionY = Math.random() * 2 - 1;
          bot.botNextDirectionChange = now + BOT_DIRECTION_CHANGE_MS + Math.random() * 1000;
        }
      }
    }
  }

  private botWantsMace(bot: ServerPlayerState, state: ServerGameState, now: number): boolean {
    if (now < bot.maceCooldownEnd) return false;
    if (bot.hasFlag) return false;
    const range = getMaceRange(bot.level) + 20;
    for (const target of state.players.values()) {
      if (target.id === bot.id || target.isDead || target.isGhost) continue;
      const dx = target.x - bot.x;
      const dy = target.y - bot.y;
      if (Math.sqrt(dx * dx + dy * dy) <= range) return true;
    }
    return false;
  }

  // ─── Respawn ───────────────────────────────────────────────────────────────

  private handleRespawns(state: ServerGameState, now: number, roomId: string): void {
    for (const player of state.players.values()) {
      if (!player.isDead || !player.isBot) continue;
      if (now < player.respawnAt) continue;
      this.doRespawn(player, state, now);
      if (this.server) {
        this.server.to(roomId).emit('player_respawned', { playerId: player.id, x: player.x, y: player.y });
      }
    }
  }

  private doRespawn(player: ServerPlayerState, state: ServerGameState, now: number): void {
    player.x = 200 + Math.random() * (state.mapWidth - 400);
    player.y = 200 + Math.random() * (state.mapHeight - 400);
    player.isDead = false;
    player.stunUntil = 0;
    player.invincibleUntil = now + 1500;
    player.hasFlag = false;
    player.activePowerType = null;
    player.powerExpiresAt = 0;
    player.hasMaceShield = false;
    player.sprintActive = false;
    player.isGhost = false;
    player.superMaceCharges = 0;
    player.knockbackVx = 0;
    player.knockbackVy = 0;
    player.knockbackTicks = 0;
  }

  requestHumanRespawn(roomId: string, playerId: string): void {
    const state = this.gameState.getRoomState(roomId);
    if (!state) return;
    const player = state.players.get(playerId);
    if (!player || player.isBot || !player.isDead) return;
    if (Date.now() < player.respawnAt) return;
    this.doRespawn(player, state, Date.now());
    if (this.server) {
      this.server.to(roomId).emit('player_respawned', { playerId, x: player.x, y: player.y });
    }
  }

  private kickTimeoutHumans(roomId: string, state: ServerGameState, now: number): void {
    if (!this.server) return;
    for (const player of state.players.values()) {
      if (player.isBot || !player.isDead) continue;
      if (now - player.respawnAt < DEATH_KICK_TIMEOUT_MS) continue;

      this.gameState.removeHumanPlayer(roomId, player.id);
      this.server.to(player.id).emit('player_kicked', { playerId: player.id, reason: 'timeout' });
      this.server.to(roomId).emit('player_left', { playerId: player.id, reason: 'timeout' });
    }
  }

  // ─── Emit ──────────────────────────────────────────────────────────────────

  private emitGameState(roomId: string, state: ServerGameState): void {
    if (!this.server) return;
    const payload = this.gameState.buildSnapshot(state);
    this.server.to(roomId).emit('game_state', payload);
  }

  // ─── Physics helpers ───────────────────────────────────────────────────────

  private resolveTankCollisions(state: ServerGameState): void {
    const alive = [...state.players.values()].filter(p => !p.isDead);
    const minDist = PLAYER_RADIUS * 2;

    for (let i = 0; i < alive.length; i++) {
      for (let j = i + 1; j < alive.length; j++) {
        const a = alive[i];
        const b = alive[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
        if (dist >= minDist) continue;

        const nx = dx / dist;
        const ny = dy / dist;
        const overlap = (minDist - dist) / 2;

        a.x -= nx * overlap;
        a.y -= ny * overlap;
        b.x += nx * overlap;
        b.y += ny * overlap;
      }
    }
  }

  private resolveAllStaticCollisions(player: ServerPlayerState, state: ServerGameState): void {
    for (const obs of state.obstacles) {
      if (obs.isCircle) {
        this.resolveCircleObstacleCollision(player, obs.x, obs.y, obs.w / 2);
      } else {
        this.resolveOBBObstacleCollision(player, obs);
      }
    }
  }

  private resolveOBBObstacleCollision(
    player: ServerPlayerState,
    obs: { x: number; y: number; angle: number; w: number; h: number },
  ): void {
    const r = PLAYER_RADIUS;
    const cosA = Math.cos(obs.angle);
    const sinA = Math.sin(obs.angle);
    const dx = player.x - obs.x;
    const dy = player.y - obs.y;
    const localX = cosA * dx + sinA * dy;
    const localY = -sinA * dx + cosA * dy;
    const halfW = obs.w / 2;
    const halfH = obs.h / 2;
    const nearX = Math.max(-halfW, Math.min(halfW, localX));
    const nearY = Math.max(-halfH, Math.min(halfH, localY));
    const distLocalX = localX - nearX;
    const distLocalY = localY - nearY;
    const dist2 = distLocalX * distLocalX + distLocalY * distLocalY;
    if (dist2 < r * r) {
      const dist = Math.sqrt(dist2) || 0.001;
      const overlap = r - dist;
      const pushLocalX = (distLocalX / dist) * overlap;
      const pushLocalY = (distLocalY / dist) * overlap;
      player.x += cosA * pushLocalX - sinA * pushLocalY;
      player.y += sinA * pushLocalX + cosA * pushLocalY;
    }
  }

  private resolveCircleObstacleCollision(player: ServerPlayerState, cx: number, cy: number, radius: number): void {
    const dx = player.x - cx;
    const dy = player.y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
    const minDist = PLAYER_RADIUS + radius;
    if (dist < minDist) {
      const overlap = minDist - dist;
      player.x += (dx / dist) * overlap;
      player.y += (dy / dist) * overlap;
    }
  }

  private clampToMap(player: ServerPlayerState, state: ServerGameState): void {
    const r = PLAYER_RADIUS;
    player.x = Math.max(r, Math.min(state.mapWidth - r, player.x));
    player.y = Math.max(r, Math.min(state.mapHeight - r, player.y));
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private weightedRandomPower(): PowerUpType {
    const total = POWER_WEIGHTS.reduce((s, w) => s + w.weight, 0);
    let r = Math.random() * total;
    for (const w of POWER_WEIGHTS) {
      r -= w.weight;
      if (r <= 0) return w.type;
    }
    return POWER_WEIGHTS[POWER_WEIGHTS.length - 1].type;
  }

  private getLevelBenefit(level: number): string {
    const benefits: Record<number, string> = {
      3:  'Linterna más potente',
      5:  'Mayor alcance',
      6:  'Pulso desbloqueado',
      8:  'Stun reducido al recibir mazo',
      10: 'Contramazo: atacante stunned 2s',
      12: 'Sprint leve permanente',
      14: 'Contramazo mejorado',
      15: 'Destino visible 3s al puntuar',
    };
    return benefits[level] ?? `Nivel ${level} alcanzado`;
  }
}
