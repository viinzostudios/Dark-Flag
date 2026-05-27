import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Transaction, TransactionType } from './entities/transaction.entity';
import { UserProfile } from '../users/entities/user-profile.entity';

@Injectable()
export class EconomyService {
  constructor(
    @InjectRepository(Transaction)
    private readonly txRepo: Repository<Transaction>,
    @InjectRepository(UserProfile)
    private readonly profileRepo: Repository<UserProfile>,
    private readonly dataSource: DataSource,
  ) {}

  async getWallet(userId: string): Promise<{ coins: number; premiumCoins: number }> {
    const profile = await this.profileRepo.findOne({ where: { id: userId } });
    return {
      coins: profile?.coins ?? 0,
      premiumCoins: profile?.premiumCoins ?? 0,
    };
  }

  async addCoins(
    userId: string,
    amount: number,
    type: TransactionType,
    description: string,
  ): Promise<{ newBalance: number }> {
    return this.dataSource.transaction(async manager => {
      const profile = await manager.findOne(UserProfile, { where: { id: userId } });
      if (!profile) throw new BadRequestException('User profile not found');

      profile.coins += amount;
      await manager.save(profile);

      const tx = manager.create(Transaction, {
        userId,
        type,
        amount,
        balanceAfter: profile.coins,
        description,
      });
      await manager.save(tx);

      return { newBalance: profile.coins };
    });
  }

  async spendCoins(
    userId: string,
    amount: number,
    description: string,
  ): Promise<{ newBalance: number }> {
    return this.dataSource.transaction(async manager => {
      const profile = await manager.findOne(UserProfile, { where: { id: userId } });
      if (!profile) throw new BadRequestException('User profile not found');
      if (profile.coins < amount) throw new BadRequestException('Insufficient coins');

      profile.coins -= amount;
      await manager.save(profile);

      const tx = manager.create(Transaction, {
        userId,
        type: 'spend_shop' as TransactionType,
        amount: -amount,
        balanceAfter: profile.coins,
        description,
      });
      await manager.save(tx);

      return { newBalance: profile.coins };
    });
  }

  async addPremiumCoins(
    userId: string,
    amount: number,
    description: string,
  ): Promise<{ newBalance: number }> {
    return this.dataSource.transaction(async manager => {
      const profile = await manager.findOne(UserProfile, { where: { id: userId } });
      if (!profile) throw new BadRequestException('User profile not found');

      profile.premiumCoins += amount;
      await manager.save(profile);

      const tx = manager.create(Transaction, {
        userId,
        type: 'earn_premium' as TransactionType,
        amount,
        balanceAfter: profile.premiumCoins,
        description,
      });
      await manager.save(tx);

      return { newBalance: profile.premiumCoins };
    });
  }

  async spendPremiumCoins(
    userId: string,
    amount: number,
    description: string,
  ): Promise<{ newBalance: number }> {
    return this.dataSource.transaction(async manager => {
      const profile = await manager.findOne(UserProfile, { where: { id: userId } });
      if (!profile) throw new BadRequestException('User profile not found');
      if (profile.premiumCoins < amount) throw new BadRequestException('Insufficient gems');

      profile.premiumCoins -= amount;
      await manager.save(profile);

      const tx = manager.create(Transaction, {
        userId,
        type: 'spend_shop' as TransactionType,
        amount: -amount,
        balanceAfter: profile.premiumCoins,
        description,
      });
      await manager.save(tx);

      return { newBalance: profile.premiumCoins };
    });
  }

  async rewardGameSession(
    userId: string,
    kills: number,
    durationSeconds: number,
  ): Promise<{ coinsEarned: number }> {
    const base = 10;
    const killBonus = kills * 5;
    const timeBonus = Math.floor(durationSeconds / 60) * 3;
    const total = base + killBonus + timeBonus;

    await this.addCoins(userId, total, 'earn_game', `Game session: ${kills} kills, ${durationSeconds}s`);
    return { coinsEarned: total };
  }

  async getHistory(userId: string, limit = 20): Promise<Transaction[]> {
    return this.txRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
