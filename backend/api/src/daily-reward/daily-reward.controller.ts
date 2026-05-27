import { Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DailyRewardService } from './daily-reward.service';

@UseGuards(AuthGuard('jwt'))
@Controller('daily-reward')
export class DailyRewardController {
  constructor(private readonly service: DailyRewardService) {}

  @Get('status')
  getStatus(@Request() req: { user: { id: string } }) {
    return this.service.getStatus(req.user.id);
  }

  @Post('claim')
  claim(@Request() req: { user: { id: string } }) {
    return this.service.claim(req.user.id);
  }
}
