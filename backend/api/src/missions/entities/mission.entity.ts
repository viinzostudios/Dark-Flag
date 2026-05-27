import { randomUUID } from 'crypto';
import {
  Entity, PrimaryColumn, Column, CreateDateColumn,
} from 'typeorm';

export type MissionType =
  | 'flag_captures'
  | 'maces_landed'
  | 'powerups_collected'
  | 'games_played'
  | 'score'
  | 'level_reached'
  | 'traps_triggered';

@Entity('missions')
export class Mission {
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id: string = randomUUID();

  @Column({ length: 100 })
  title: string;

  @Column({ length: 255 })
  description: string;

  @Column({ type: 'varchar' })
  type: MissionType;

  @Column({ name: 'target_value' })
  targetValue: number;

  @Column({ name: 'reward_coins', default: 50 })
  rewardCoins: number;

  @Column({ name: 'reward_xp', default: 100 })
  rewardXp: number;

  @Column({ name: 'is_daily', default: false })
  isDaily: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
