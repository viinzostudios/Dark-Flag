import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PlayerState } from '../game/models/player.model';

export interface RoomConfig {
  mapWidth: number;
  mapHeight: number;
  maxPlayers: number;
  tickRate: number;
  durationSeconds: number;
}

export interface Room {
  id: string;
  players: Map<string, PlayerState>;
  config: RoomConfig;
  status: 'waiting' | 'playing' | 'finished';
  createdAt: number;
}

const DEFAULT_CONFIG: RoomConfig = {
  mapWidth: 2800,
  mapHeight: 1867,
  maxPlayers: 20,
  tickRate: 30,
  durationSeconds: 300,
};

function mapSizeForPlayers(n: number): { mapWidth: number; mapHeight: number } {
  if (n <= 10) return { mapWidth: 2000, mapHeight: 1333 };
  if (n <= 20) return { mapWidth: 2800, mapHeight: 1867 };
  if (n <= 35) return { mapWidth: 3600, mapHeight: 2400 };
  return { mapWidth: 4500, mapHeight: 3000 };
}

@Injectable()
export class RoomsService {
  private readonly rooms = new Map<string, Room>();

  createRoom(config?: Partial<RoomConfig>): Room {
    const merged = { ...DEFAULT_CONFIG, ...config };
    if (!config?.mapWidth && !config?.mapHeight) {
      Object.assign(merged, mapSizeForPlayers(merged.maxPlayers));
    }
    const room: Room = {
      id: uuidv4().slice(0, 8),
      players: new Map(),
      config: merged,
      status: 'waiting',
      createdAt: Date.now(),
    };
    this.rooms.set(room.id, room);
    return room;
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  getAvailableRoom(): Room {
    for (const room of this.rooms.values()) {
      if (room.status !== 'finished' && room.players.size < room.config.maxPlayers) {
        return room;
      }
    }
    return this.createRoom();
  }

  listRooms() {
    return [...this.rooms.values()].map((r) => ({
      id: r.id,
      playerCount: r.players.size,
      maxPlayers: r.config.maxPlayers,
      status: r.status,
    }));
  }

  addPlayer(roomId: string, player: PlayerState): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    room.players.set(player.id, player);
    if (room.players.size >= 2) room.status = 'playing';
  }

  removePlayer(roomId: string, playerId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    room.players.delete(playerId);
    if (room.players.size === 0) this.rooms.delete(roomId);
  }

  getPlayerRoom(playerId: string): Room | undefined {
    for (const room of this.rooms.values()) {
      if (room.players.has(playerId)) return room;
    }
    return undefined;
  }

  updatePlayer(roomId: string, playerId: string, update: Partial<PlayerState>): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const player = room.players.get(playerId);
    if (!player) return;
    Object.assign(player, update);
  }
}
