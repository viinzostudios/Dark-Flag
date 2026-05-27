import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mission } from './entities/mission.entity';
import { PlayerMission } from './entities/player-mission.entity';
import { MissionsService } from './missions.service';
import { MissionsController } from './missions.controller';
import { EconomyModule } from '../economy/economy.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Mission, PlayerMission]),
    EconomyModule,
  ],
  providers: [MissionsService],
  controllers: [MissionsController],
  exports: [MissionsService],
})
export class MissionsModule {}
