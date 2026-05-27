import {
  WebSocketGateway, WebSocketServer,
  SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect,
  MessageBody, ConnectedSocket, OnGatewayInit,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import { RoomsService } from '../rooms/rooms.service';
import { GameStateService, CharacterBonuses } from './services/game-state.service';
import { GameLoopService } from './services/game-loop.service';
import { ClientInput, StaticObstacleSnapshot } from './models/game-state.model';

const NO_BONUSES: CharacterBonuses = {
  characterId: null,
  characterSlug: null,
};

async function fetchActiveCharacter(token: string): Promise<CharacterBonuses> {
  const apiUrl = process.env['API_URL'] ?? 'http://localhost:3000';
  try {
    const res = await fetch(`${apiUrl}/characters/user/active`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(800),
    });
    if (!res.ok) return NO_BONUSES;

    const char = await res.json() as { id?: string; slug?: string } | null;
    if (!char?.id) return NO_BONUSES;

    return {
      characterId: char.id,
      characterSlug: char.slug ?? null,
    };
  } catch {
    return NO_BONUSES;
  }
}

@WebSocketGateway({
  cors: { origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:4201', credentials: true },
})
export class GameGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(GameGateway.name);

  constructor(
    private readonly rooms: RoomsService,
    private readonly gameStateService: GameStateService,
    private readonly gameLoop: GameLoopService,
  ) {}

  afterInit(server: Server): void {
    this.gameLoop.setServer(server);
  }

  // ─── Connection lifecycle ──────────────────────────────────────────────────

  handleConnection(client: Socket): void {
    client.data.playerId = client.id;
    client.data.username = `Explorer-${client.id.slice(0, 4)}`;
    client.data.violations = 0;
  }

  handleDisconnect(client: Socket): void {
    const roomId = client.data.roomId as string | undefined;
    if (!roomId) return;

    this.rooms.removePlayer(roomId, client.id);
    this.gameStateService.removeHumanPlayer(roomId, client.id);
    client.leave(roomId);

    this.server.to(roomId).emit('player_left', {
      playerId: client.id,
      reason: 'disconnect',
    });
  }

  // ─── join_game ─────────────────────────────────────────────────────────────

  @SubscribeMessage('join_game')
  async handleJoinGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId?: string; username?: string; token?: string },
  ): Promise<void> {
    if (data?.username) {
      client.data.username = data.username.slice(0, 20);
    }

    // Fetch active character from API — 500ms timeout so join is fast
    let bonuses: CharacterBonuses = NO_BONUSES;
    if (data?.token) {
      try {
        jwt.verify(data.token, process.env['JWT_SECRET'] ?? '');
        const timeout = new Promise<CharacterBonuses>(res =>
          setTimeout(() => res(NO_BONUSES), 500),
        );
        bonuses = await Promise.race([fetchActiveCharacter(data.token), timeout]);
      } catch {
        this.logger.warn(`join_game: invalid token for ${client.id}`);
      }
    }

    // Find or create room
    const room = data?.roomId
      ? (this.rooms.getRoom(data.roomId) ?? this.rooms.getAvailableRoom())
      : this.rooms.getAvailableRoom();

    if (!this.gameStateService.getRoomState(room.id)) {
      this.gameStateService.createRoomState(room.id, room.config.mapWidth, room.config.mapHeight);
    }

    this.gameStateService.addHumanPlayer(room.id, client.id, client.data.username as string, bonuses);
    this.rooms.addPlayer(room.id, {
      id: client.id,
      userId: client.id,
      username: client.data.username as string,
      x: 0, y: 0, rotation: 0,
      hp: 1, maxHp: 1, isDead: false, ammo: 0,
      score: 0, isLeader: false, skinId: bonuses.characterId,
    });

    client.data.roomId = room.id;
    client.join(room.id);

    const state = this.gameStateService.getRoomState(room.id)!;
    const snapshot = this.gameStateService.buildSnapshot(state);
    const obstacles: StaticObstacleSnapshot[] = this.gameStateService.buildObstacleSnapshot(state);

    client.emit('room_joined', {
      roomId: room.id,
      playerId: client.id,
      config: room.config,
      initialState: snapshot,
      obstacles,
    });

    client.to(room.id).emit('player_joined', {
      playerId: client.id,
      username: client.data.username,
    });
  }

  // ─── player_input ─────────────────────────────────────────────────────────

  @SubscribeMessage('player_input')
  handleInput(
    @ConnectedSocket() client: Socket,
    @MessageBody() input: Record<string, unknown>,
  ): void {
    const roomId = client.data.roomId as string | undefined;
    if (!roomId) return;

    const typed = input as unknown as ClientInput;
    const rawSpeed = typeof typed.speedFactor === 'number' ? typed.speedFactor : 0;

    // Reject suspiciously fast inputs — legitimate clients never exceed 1.0
    if (rawSpeed > 1.1) {
      client.data.violations = ((client.data.violations as number) ?? 0) + 1;
      this.logger.warn(
        `Anti-cheat: ${client.id} speedFactor=${rawSpeed.toFixed(3)} violations=${client.data.violations}`,
      );
      if ((client.data.violations as number) >= 10) {
        client.disconnect(true);
        return;
      }
      return;
    }

    this.gameStateService.queueInput(roomId, client.id, {
      mouseAngle:   typeof typed.mouseAngle  === 'number' ? typed.mouseAngle  : 0,
      speedFactor:  rawSpeed,
      aimAngle:     typeof typed.aimAngle    === 'number' ? typed.aimAngle    : 0,
      mace:         Boolean(typed.mace),
      toggleLight:  Boolean(typed.toggleLight),
      pulse:        Boolean(typed.pulse),
      clientTick:   typeof typed.clientTick  === 'number' ? typed.clientTick  : 0,
    });
  }

  // ─── use_pulse ────────────────────────────────────────────────────────────

  @SubscribeMessage('use_pulse')
  handleUsePulse(@ConnectedSocket() client: Socket): void {
    const roomId = client.data.roomId as string | undefined;
    if (!roomId) return;

    const state = this.gameStateService.getRoomState(roomId);
    if (!state) return;
    const player = state.players.get(client.id);
    if (!player || player.level < 6) return;

    this.server.to(roomId).emit('pulse_activated', {
      playerId: client.id,
      x: player.x,
      y: player.y,
      radius: 500,
    });
  }

  // ─── respawn_request ──────────────────────────────────────────────────────

  @SubscribeMessage('respawn_request')
  handleRespawnRequest(@ConnectedSocket() client: Socket): void {
    const roomId = client.data.roomId as string | undefined;
    if (!roomId) return;
    this.gameLoop.requestHumanRespawn(roomId, client.id);
  }

  // ─── leave_game ───────────────────────────────────────────────────────────

  @SubscribeMessage('leave_game')
  handleLeaveGame(@ConnectedSocket() client: Socket): void {
    const roomId = client.data.roomId as string | undefined;
    if (!roomId) return;

    this.rooms.removePlayer(roomId, client.id);
    this.gameStateService.removeHumanPlayer(roomId, client.id);
    client.leave(roomId);
    client.data.roomId = undefined;

    this.server.to(roomId).emit('player_left', {
      playerId: client.id,
      reason: 'leave',
    });
  }

  // ─── rooms_list ───────────────────────────────────────────────────────────

  @SubscribeMessage('rooms_list')
  handleRoomsList(): object[] {
    return this.rooms.listRooms();
  }
}
