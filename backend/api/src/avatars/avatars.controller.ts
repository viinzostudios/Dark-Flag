import {
  Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request, Optional,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AvatarsService } from './avatars.service';

@Controller('avatars')
export class AvatarsController {
  constructor(private readonly avatars: AvatarsService) {}

  @Get()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  findAll(@Query('category') category?: string, @Request() req?: any) {
    const userId = req?.user?.id as string | undefined;
    return this.avatars.findAll(userId, category);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':slug/purchase')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  purchase(@Param('slug') slug: string, @Request() req: any) {
    return this.avatars.purchase(req.user.id as string, slug);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put('equip')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  equip(@Body('slug') slug: string, @Request() req: any) {
    return this.avatars.equip(req.user.id as string, slug);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me/active')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getActive(@Request() req: any) {
    return this.avatars.getActiveSlug(req.user.id as string);
  }
}
