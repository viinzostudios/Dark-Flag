import { randomUUID } from 'crypto';
import {
  Entity, PrimaryColumn, Column,
  CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';

@Entity('player_stats')
export class PlayerStats {
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id: string = randomUUID();

  @Index({ unique: true })
  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'games_played', default: 0 })
  gamesPlayed: number;

  @Column({ name: 'flag_captures', default: 0 })
  flagCaptures: number;

  @Column({ name: 'flag_pickups', default: 0 })
  flagPickups: number;

  @Column({ name: 'maces_landed', default: 0 })
  macesLanded: number;

  @Column({ name: 'maces_received', default: 0 })
  macesReceived: number;

  @Column({ name: 'level_15_reached', default: false })
  level15Reached: boolean;

  @Column({ name: 'best_score_session', default: 0 })
  bestScoreSession: number;

  @Column({ name: 'best_level_reached', default: 1 })
  bestLevelReached: number;

  @Column({ name: 'traps_triggered', default: 0 })
  trapsTriggered: number;

  @Column({ name: 'powerups_collected', default: 0 })
  powerupsCollected: number;

  @Column({ name: 'play_seconds', default: 0 })
  playSeconds: number;

  @Column({ name: 'total_score', default: 0 })
  totalScore: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
