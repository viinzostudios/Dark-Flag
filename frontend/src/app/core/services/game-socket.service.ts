import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Subject, ReplaySubject } from 'rxjs';
import { environment } from '../../../environments/environment';

// ─── Snapshot types (must match server game-state.model.ts) ─────────────────

export type PowerUpType = 'MACE_SHIELD' | 'REVELATION' | 'SPRINT' | 'BLACKOUT' | 'SUPER_MACE' | 'GHOST';

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
  invincibleUntil: number;
  isGhost: boolean;
  sprintActive: boolean;
  hasMaceShield: boolean;
  activePowerType: PowerUpType | null;
  powerExpiresAt: number;
  isDead: boolean;
  isBot: boolean;
  characterId: string | null;
  characterSlug: string | null;
}

export interface FlagSnapshot {
  id: string;
  x: number;
  y: number;
  carriedBy: string | null;
  isOnGround: boolean;
  firstIlluminatedBy: string | null;
}

export interface DestinationSnapshot {
  x: number;
  y: number;
  radius: number;
  visibleToAll: boolean;
}

export interface TrapSnapshot {
  id: string;
  x: number;
  y: number;
  active: boolean;
}

export interface PowerUpSnapshot {
  id: string;
  type: PowerUpType;
  x: number;
  y: number;
}

export interface StaticObstacleSnapshot {
  id: string;
  type?: 'BUNKER' | 'BARRIER' | 'ROUND';
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

export interface GameStateEvent {
  tick: number;
  serverTime: number;
  mapWidth: number;
  mapHeight: number;
  players: PlayerSnapshot[];
  flag: FlagSnapshot;
  destination: DestinationSnapshot | null;
  powerUps: PowerUpSnapshot[];
  traps: TrapSnapshot[];
  leaderboard: LeaderboardEntry[];
  blackoutUntil: number;
}

export interface RoomJoinedEvent {
  roomId: string;
  playerId: string;
  config: { mapWidth: number; mapHeight: number; maxPlayers: number };
  initialState: GameStateEvent;
  obstacles: StaticObstacleSnapshot[];
}

export interface ClientInput {
  mouseAngle:   number;
  speedFactor:  number;
  aimAngle:     number;
  mace:         boolean;
  toggleLight:  boolean;
  pulse:        boolean;
  clientTick:   number;
}

// ─── Event types ──────────────────────────────────────────────────────────────

export interface FlagPickedEvent  { playerId: string; playerName: string }
export interface FlagDroppedEvent { x: number; y: number; reason: string }
export interface FlagDeliveredEvent { playerId: string; playerName: string; newScore: number }
export interface MacedEvent { attackerId: string; targetId: string; targetName: string }
export interface TrapTriggeredEvent { trapId: string; playerId: string }
export interface PowerUpPickedEvent { playerId: string; type: PowerUpType }

@Injectable({ providedIn: 'root' })
export class GameSocketService implements OnDestroy {
  private socket: Socket | null = null;

  onRoomJoined$ = new ReplaySubject<RoomJoinedEvent>(1);
  readonly onPlayerJoined$ = new Subject<{ playerId: string; username: string }>();
  readonly onPlayerLeft$   = new Subject<{ playerId: string; reason: string }>();
  readonly onGameState$    = new Subject<GameStateEvent>();
  readonly onError$        = new Subject<{ code: string; message: string }>();
  readonly onPlayerKicked$ = new Subject<{ playerId: string; reason: string }>();

  readonly onFlagPicked$    = new Subject<FlagPickedEvent>();
  readonly onFlagDropped$   = new Subject<FlagDroppedEvent>();
  readonly onFlagDelivered$ = new Subject<FlagDeliveredEvent>();
  readonly onMaced$         = new Subject<MacedEvent>();
  readonly onTrapTriggered$ = new Subject<TrapTriggeredEvent>();
  readonly onPowerUpPicked$ = new Subject<PowerUpPickedEvent>();

  currentRoomId: string | null = null;

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  get socketId(): string | undefined {
    return this.socket?.id;
  }

  connect(username?: string): void {
    if (this.socket?.connected) return;
    this.onRoomJoined$ = new ReplaySubject<RoomJoinedEvent>(1);

    this.socket = io(environment.socketUrl, {
      transports: ['websocket'],
      reconnection: false,
      query: username ? { username } : {},
    });

    this.socket.on('room_joined',   (d: RoomJoinedEvent)   => { this.currentRoomId = d.roomId; this.onRoomJoined$.next(d); });
    this.socket.on('player_joined', (d: { playerId: string; username: string }) => this.onPlayerJoined$.next(d));
    this.socket.on('player_left',   (d: { playerId: string; reason: string })   => this.onPlayerLeft$.next(d));
    this.socket.on('game_state',    (d: GameStateEvent)    => this.onGameState$.next(d));
    this.socket.on('error',         (d: { code: string; message: string })      => this.onError$.next(d));
    this.socket.on('player_kicked', (d: { playerId: string; reason: string })   => this.onPlayerKicked$.next(d));

    this.socket.on('flag_picked',    (d: FlagPickedEvent)    => this.onFlagPicked$.next(d));
    this.socket.on('flag_dropped',   (d: FlagDroppedEvent)   => this.onFlagDropped$.next(d));
    this.socket.on('flag_delivered', (d: FlagDeliveredEvent) => this.onFlagDelivered$.next(d));
    this.socket.on('player_maced',   (d: MacedEvent)         => this.onMaced$.next(d));
    this.socket.on('trap_triggered', (d: TrapTriggeredEvent) => this.onTrapTriggered$.next(d));
    this.socket.on('power_picked',   (d: PowerUpPickedEvent) => this.onPowerUpPicked$.next(d));
  }

  joinGame(roomId?: string, username?: string, token?: string | null): void {
    this.socket?.emit('join_game', { roomId, username, token: token ?? undefined });
  }

  joinOnConnect(roomId?: string, username?: string, token?: string | null): void {
    if (this.socket?.connected) {
      this.joinGame(roomId, username, token);
    } else {
      this.socket?.once('connect', () => this.joinGame(roomId, username, token));
    }
  }

  sendInput(input: ClientInput): void {
    this.socket?.emit('player_input', input);
  }

  usePulse(): void {
    this.socket?.emit('use_pulse');
  }

  respawn(): void {
    this.socket?.emit('respawn_request');
  }

  leaveGame(): void {
    this.socket?.emit('leave_game');
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.currentRoomId = null;
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
