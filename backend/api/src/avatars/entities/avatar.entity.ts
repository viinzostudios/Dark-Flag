import { randomUUID } from 'crypto';
import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('avatars')
export class Avatar {
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id: string = randomUUID();

  @Column({ length: 50, unique: true })
  slug: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 50 })
  category: string;

  @Column({ name: 'price_coins', default: 0 })
  priceCoins: number;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
