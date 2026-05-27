import { randomUUID } from 'crypto';
import {
  Entity, PrimaryColumn, Column,
  CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';

@Entity('player_missions')
@Index(['userId', 'missionId'], { unique: true })
export class PlayerMission {
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id: string = randomUUID();

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'mission_id' })
  missionId: string;

  @Column({ default: 0 })
  progress: number;

  @Column({ name: 'is_completed', default: false })
  isCompleted: boolean;

  @Column({ name: 'is_claimed', default: false })
  isClaimed: boolean;

  @Column({ name: 'assigned_at' })
  assignedAt: Date;

  @Column({ name: 'expires_at', nullable: true })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
