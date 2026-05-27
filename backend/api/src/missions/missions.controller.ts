import { Controller, Get, Post, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MissionsService } from './missions.service';

@UseGuards(AuthGuard('jwt'))
@Controller('missions')
export class MissionsController {
  constructor(private readonly missions: MissionsService) {}

  @Get('me')
  getMyMissions(@Request() req: { user: { id: string } }) {
    return this.missions.getActiveMissions(req.user.id);
  }

  @Post(':id/claim')
  claimReward(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
  ) {
    return this.missions.claimReward(req.user.id, id);
  }
}
