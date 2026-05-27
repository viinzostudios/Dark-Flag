import { randomUUID } from 'crypto';
import {
  Entity, PrimaryColumn, Column, CreateDateColumn, Unique,
} from 'typeorm';

@Entity('user_avatars')
@Unique(['userId', 'avatarId'])
export class UserAvatar {
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id: string = randomUUID();

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'avatar_id' })
  avatarId: string;

  @CreateDateColumn({ name: 'acquired_at' })
  acquiredAt: Date;
}
