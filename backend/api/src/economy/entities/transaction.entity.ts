import { randomUUID } from 'crypto';
import {
  Entity, PrimaryColumn, Column, CreateDateColumn, Index,
} from 'typeorm';

export type TransactionType = 'earn_game' | 'earn_daily' | 'earn_mission' | 'spend_shop' | 'earn_premium';

@Entity('transactions')
export class Transaction {
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id: string = randomUUID();

  @Index()
  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar' })
  type: TransactionType;

  @Column()
  amount: number;

  @Column({ name: 'balance_after' })
  balanceAfter: number;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
