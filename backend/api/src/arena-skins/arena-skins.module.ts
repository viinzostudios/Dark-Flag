import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Arena } from './entities/arena-skin.entity';
import { UserArena } from './entities/user-arena-skin.entity';
import { UserProfile } from '../users/entities/user-profile.entity';
import { ArenaSkinsService } from './arena-skins.service';
import { ArenaSkinsController } from './arena-skins.controller';
import { EconomyModule } from '../economy/economy.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Arena, UserArena, UserProfile]),
    EconomyModule,
  ],
  providers: [ArenaSkinsService],
  controllers: [ArenaSkinsController],
  exports: [ArenaSkinsService],
})
export class ArenaSkinsModule {}
