import { randomUUID } from 'crypto';
import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

export type CharacterRarity = 'common' | 'rare' | 'epic' | 'legendary';

// Table is named 'characters' in dark_flag DB
@Entity('characters')
export class Character {
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id: string = randomUUID();

  @Column({ length: 60, unique: true })
  slug: string;

  @Column({ length: 60 })
  name: string;

  @Column({ length: 200, default: '' })
  description: string;

  @Column({ type: 'varchar' })
  rarity: CharacterRarity;

  @Column({ name: 'body_color', length: 20 })
  bodyColor: string;

  @Column({ name: 'price_coins', default: 0 })
  priceCoins: number;

  @Column({ name: 'gem_price', default: 0 })
  gemPrice: number;

  @Column({ name: 'matches_unlock', nullable: true, type: 'int' })
  matchesUnlock: number | null;

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

  @Column({ name: 'is_available', default: true })
  isAvailable: boolean;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
