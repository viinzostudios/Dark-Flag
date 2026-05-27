import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyReward } from './entities/daily-reward.entity';
import { DailyRewardService } from './daily-reward.service';
import { DailyRewardController } from './daily-reward.controller';
import { EconomyModule } from '../economy/economy.module';

@Module({
  imports: [TypeOrmModule.forFeature([DailyReward]), EconomyModule],
  providers: [DailyRewardService],
  controllers: [DailyRewardController],
})
export class DailyRewardModule {}
