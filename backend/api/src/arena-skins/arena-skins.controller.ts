import { Controller, Get, Post, Put, Param, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ArenaSkinsService } from './arena-skins.service';

class EquipDto {
  slug!: string;
}

@Controller('arenas')
export class ArenaSkinsController {
  constructor(private readonly service: ArenaSkinsService) {}

  @Get()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  findAll(@Request() req: any) {
    return this.service.findAll(req.user?.id as string | undefined);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('my')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  findOwned(@Request() req: any) {
    return this.service.findOwned(req.user.id as string);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':slug/purchase')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  purchase(@Param('slug') slug: string, @Request() req: any) {
    return this.service.purchase(req.user.id as string, slug);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put('equip')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  equip(@Body() body: EquipDto, @Request() req: any) {
    return this.service.equip(req.user.id as string, body.slug);
  }
}
