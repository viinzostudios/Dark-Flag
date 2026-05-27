import {
  Entity, PrimaryColumn, Column,
  UpdateDateColumn, OneToOne, JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_profiles')
export class UserProfile {
  @PrimaryColumn('uuid')
  id: string;

  @OneToOne(() => User, (user) => user.profile)
  @JoinColumn({ name: 'id' })
  user: User;

  @Column({ name: 'display_name', length: 50, nullable: true })
  displayName: string;

  @Column({ default: 1 })
  level: number;

  @Column({ default: 0 })
  xp: number;

  @Column({ default: 0 })
  coins: number;

  @Column({ name: 'premium_coins', default: 0 })
  premiumCoins: number;

  @Column({ name: 'active_character_id', nullable: true })
  activeCharacterId: string;

  @Column({ name: 'active_arena_slug', length: 64, default: 'space-station' })
  activeArenaSlug: string;

  @Column({ name: 'active_avatar_slug', length: 50, default: 'avatar-01' })
  activeAvatarSlug: string;

  @Column({ name: 'preferred_lang', length: 10, default: '' })
  preferredLang: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
