import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';
import { UserProfile } from '../users/entities/user-profile.entity';
import { EconomyService } from './economy.service';
import { EconomyController } from './economy.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, UserProfile])],
  providers: [EconomyService],
  controllers: [EconomyController],
  exports: [EconomyService],
})
export class EconomyModule {}
