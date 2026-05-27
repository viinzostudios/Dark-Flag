import { Controller, Get, Post, Body, UseGuards, Request, HttpException, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EconomyService } from './economy.service';

const SURVIVAL_REWARD_GEMS = 10;
const SURVIVAL_REWARD_COOLDOWN_MS = 15 * 60 * 1000;

@UseGuards(AuthGuard('jwt'))
@Controller('economy')
export class EconomyController {
  private readonly survivalRewardCooldown = new Map<string, number>();

  constructor(private readonly economy: EconomyService) {}

  @Get('wallet')
  getWallet(@Request() req: { user: { id: string } }) {
    return this.economy.getWallet(req.user.id);
  }

  @Get('history')
  getHistory(@Request() req: { user: { id: string } }) {
    return this.economy.getHistory(req.user.id);
  }

  @Post('ad-reward')
  adReward(@Request() req: { user: { id: string } }) {
    return this.economy.addCoins(req.user.id, 50, 'earn_game', 'Rewarded ad');
  }

  @Post('survival-reward')
  survivalReward(@Request() req: { user: { id: string } }) {
    const userId = req.user.id;
    const lastClaim = this.survivalRewardCooldown.get(userId) ?? 0;
    if (Date.now() - lastClaim < SURVIVAL_REWARD_COOLDOWN_MS) {
      throw new HttpException('Survival reward already claimed recently', HttpStatus.TOO_MANY_REQUESTS);
    }
    this.survivalRewardCooldown.set(userId, Date.now());
    return this.economy.addPremiumCoins(userId, SURVIVAL_REWARD_GEMS, 'Recompensa: 15 min de supervivencia');
  }

  @Post('session-reward')
  sessionReward(
    @Request() req: { user: { id: string } },
    @Body() body: { kills?: number; durationSeconds?: number },
  ) {
    return this.economy.rewardGameSession(
      req.user.id,
      body.kills ?? 0,
      body.durationSeconds ?? 0,
    );
  }
}
