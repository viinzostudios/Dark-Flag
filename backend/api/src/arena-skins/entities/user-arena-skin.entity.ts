import { randomUUID } from 'crypto';
import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('user_arenas')
export class UserArena {
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id: string = randomUUID();

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'arena_id' })
  arenaId: string;

  @CreateDateColumn({ name: 'unlocked_at' })
  unlockedAt: Date;
}
