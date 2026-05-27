import { randomUUID } from 'crypto';
import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

// Table maps to 'arenas' in dark_flag DB
@Entity('arenas')
export class Arena {
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id: string = randomUUID();

  @Column({ length: 64, unique: true })
  slug: string;

  @Column({ length: 128 })
  name: string;

  @Column({ length: 300, default: '' })
  description: string;

  @Column({ name: 'price_coins', default: 0 })
  priceCoins: number;

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
