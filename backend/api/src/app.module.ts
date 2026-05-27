import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { StatsModule } from './stats/stats.module';
import { EconomyModule } from './economy/economy.module';
import { MissionsModule } from './missions/missions.module';
import { DailyRewardModule } from './daily-reward/daily-reward.module';
import { SkinsModule } from './skins/skins.module';
import { StripeModule } from './stripe/stripe.module';
import { ArenaSkinsModule } from './arena-skins/arena-skins.module';
import { AvatarsModule } from './avatars/avatars.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isProd = config.get('NODE_ENV') === 'production';
        return {
          type: 'postgres',
          url: config.get<string>('DATABASE_URL'),
          autoLoadEntities: true,
          synchronize: !isProd,
          migrations: isProd ? [__dirname + '/database/migrations/*.js'] : [],
          migrationsRun: isProd,
          logging: false,
        };
      },
    }),

    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60000, limit: 100 },
    ]),

    AuthModule,
    UsersModule,
    StatsModule,
    EconomyModule,
    MissionsModule,
    DailyRewardModule,
    SkinsModule,
    StripeModule,
    ArenaSkinsModule,
    AvatarsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
