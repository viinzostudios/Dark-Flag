import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Avatar } from './entities/avatar.entity';
import { UserAvatar } from './entities/user-avatar.entity';
import { UserProfile } from '../users/entities/user-profile.entity';
import { AvatarsService } from './avatars.service';
import { AvatarsController } from './avatars.controller';
import { EconomyModule } from '../economy/economy.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Avatar, UserAvatar, UserProfile]),
    EconomyModule,
  ],
  providers: [AvatarsService],
  controllers: [AvatarsController],
  exports: [AvatarsService],
})
export class AvatarsModule {}
