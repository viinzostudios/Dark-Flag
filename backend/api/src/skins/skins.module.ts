import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Character } from './entities/skin.entity';
import { UserCharacter } from './entities/user-skin.entity';
import { UserProfile } from '../users/entities/user-profile.entity';
import { PlayerStats } from '../stats/entities/player-stats.entity';
import { SkinsService } from './skins.service';
import { SkinsController } from './skins.controller';
import { EconomyModule } from '../economy/economy.module';

@Module({
  imports: [TypeOrmModule.forFeature([Character, UserCharacter, UserProfile, PlayerStats]), EconomyModule],
  providers: [SkinsService],
  controllers: [SkinsController],
  exports: [SkinsService],
})
export class SkinsModule {}
