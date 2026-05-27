import { randomUUID } from 'crypto';
import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('user_characters')
@Index(['userId', 'characterId'], { unique: true })
export class UserCharacter {
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id: string = randomUUID();

  @Index()
  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'character_id' })
  characterId: string;

  @UpdateDateColumn({ name: 'equipped_at', nullable: true })
  equippedAt: Date | null;

  @CreateDateColumn({ name: 'unlocked_at' })
  unlockedAt: Date;
}
