import { randomUUID } from 'crypto';
import {
  Entity, PrimaryColumn, Column, Index,
} from 'typeorm';

@Entity('daily_rewards')
export class DailyReward {
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id: string = randomUUID();

  @Index({ unique: true })
  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'last_claimed_at', nullable: true })
  lastClaimedAt: Date;

  @Column({ name: 'streak_days', default: 0 })
  streakDays: number;

  @Column({ name: 'total_claimed', default: 0 })
  totalClaimed: number;
}
