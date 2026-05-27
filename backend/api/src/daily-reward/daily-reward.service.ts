import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyReward } from './entities/daily-reward.entity';
import { EconomyService } from '../economy/economy.service';

const BASE_COINS = 50;
const BASE_XP = 100;
const STREAK_7_BONUS_COINS = 200;
const STREAK_RESET_AFTER_HOURS = 48;

@Injectable()
export class DailyRewardService {
  constructor(
    @InjectRepository(DailyReward)
    private readonly repo: Repository<DailyReward>,
    private readonly economy: EconomyService,
  ) {}

  private async findOrCreate(userId: string): Promise<DailyReward> {
    let record = await this.repo.findOne({ where: { userId } });
    if (!record) {
      record = this.repo.create({ userId, streakDays: 0, totalClaimed: 0 });
      record = await this.repo.save(record);
    }
    return record;
  }

  async getStatus(userId: string): Promise<{
    canClaim: boolean;
    streakDays: number;
    nextResetAt: Date | null;
    coinsToEarn: number;
  }> {
    const record = await this.findOrCreate(userId);
    const now = new Date();

    if (!record.lastClaimedAt) {
      return { canClaim: true, streakDays: record.streakDays, nextResetAt: null, coinsToEarn: this.calcCoins(record.streakDays + 1) };
    }

    const hoursSince = (now.getTime() - record.lastClaimedAt.getTime()) / 3600000;
    const canClaim = hoursSince >= 20; // 20 hours minimum (not exactly midnight-based)

    let nextResetAt: Date | null = null;
    if (!canClaim) {
      nextResetAt = new Date(record.lastClaimedAt.getTime() + 20 * 3600000);
    }

    // Streak breaks if > 48h since last claim
    const effectiveStreak = hoursSince > STREAK_RESET_AFTER_HOURS ? 0 : record.streakDays;
    return {
      canClaim,
      streakDays: effectiveStreak,
      nextResetAt,
      coinsToEarn: this.calcCoins(effectiveStreak + 1),
    };
  }

  async claim(userId: string): Promise<{ coinsEarned: number; xpEarned: number; newStreak: number }> {
    const status = await this.getStatus(userId);
    if (!status.canClaim) throw new BadRequestException('Daily reward already claimed today');

    const record = await this.findOrCreate(userId);
    const now = new Date();
    const hoursSince = record.lastClaimedAt
      ? (now.getTime() - record.lastClaimedAt.getTime()) / 3600000
      : Infinity;

    // Reset streak if gap > 48h
    if (hoursSince > STREAK_RESET_AFTER_HOURS) {
      record.streakDays = 0;
    }

    record.streakDays += 1;
    record.lastClaimedAt = now;
    record.totalClaimed += 1;
    await this.repo.save(record);

    const coins = this.calcCoins(record.streakDays);
    const xp = BASE_XP + (record.streakDays === 7 ? 300 : 0);

    await this.economy.addCoins(userId, coins, 'earn_daily', `Daily reward — día ${record.streakDays}`);

    return { coinsEarned: coins, xpEarned: xp, newStreak: record.streakDays };
  }

  private calcCoins(day: number): number {
    if (day >= 7) return BASE_COINS * 2 + STREAK_7_BONUS_COINS;
    return BASE_COINS + (day - 1) * 10;
  }
}
