import { randomUUID } from 'crypto';
import {
  Entity, PrimaryColumn, Column, CreateDateColumn, Index,
} from 'typeorm';

@Entity('game_sessions')
export class GameSession {
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id: string = randomUUID();

  @Index()
  @Column({ name: 'user_id' })
  userId: string;

  @Column({ default: 0 })
  score: number;

  @Column({ name: 'duration_seconds', default: 0 })
  durationSeconds: number;

  @Column({ name: 'flag_captures', default: 0 })
  flagCaptures: number;

  @Column({ name: 'flag_pickups', default: 0 })
  flagPickups: number;

  @Column({ name: 'maces_landed', default: 0 })
  macesLanded: number;

  @Column({ name: 'level_15_reached', default: false })
  level15Reached: boolean;

  @Column({ name: 'best_level', default: 1 })
  bestLevel: number;

  @CreateDateColumn({ name: 'played_at' })
  playedAt: Date;
}
