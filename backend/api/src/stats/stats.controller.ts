import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { GameSessionResult } from './stats.service';
import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getMyStats(@Request() req: any) {
    return this.stats.getStats(req.user.id as string);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('sessions')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getMySessions(@Request() req: any) {
    return this.stats.getSessionHistory(req.user.id as string);
  }

  @Get('rankings/global')
  getGlobalRankings() {
    return this.stats.getGlobalRanking(100);
  }

  @Get('rankings/flag-captures')
  getRankingFlagCaptures(@Query('search') search?: string) {
    return this.stats.getRankingFlagCaptures(search);
  }

  @Get('rankings/best-score')
  getRankingBestScore(@Query('search') search?: string) {
    return this.stats.getRankingBestScore(search);
  }

  @Get('rankings/maces')
  getRankingMaces(@Query('search') search?: string) {
    return this.stats.getRankingMaces(search);
  }

  @Get('rankings/games-played')
  getRankingGamesPlayed(@Query('search') search?: string) {
    return this.stats.getRankingGamesPlayed(search);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('session')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recordSession(@Request() req: any, @Body() result: any) {
    return this.stats.recordGameSession({ ...result, userId: req.user.id } as GameSessionResult);
  }
}
