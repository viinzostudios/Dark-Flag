import { Controller, Get, Post, Put, Delete, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SkinsService } from './skins.service';
import type { CharacterRarity } from './entities/skin.entity';

@Controller('characters')
export class SkinsController {
  constructor(private readonly skins: SkinsService) {}

  @Get()
  list(@Query('rarity') rarity?: string) {
    return this.skins.listCharacters(rarity as CharacterRarity | undefined);
  }

  // ─── Auth-required specific routes (MUST come before :id wildcard) ────────

  @UseGuards(AuthGuard('jwt'))
  @Get('user/me')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getUserCharacters(@Request() req: any) {
    return this.skins.getUserCharacters(req.user.id as string);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('user/progression')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getProgression(@Request() req: any) {
    return this.skins.getProgression(req.user.id as string);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('user/active')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getActiveCharacter(@Request() req: any) {
    return this.skins.getActiveCharacter(req.user.id as string);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('user/me/active')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  unequip(@Request() req: any) {
    return this.skins.unequipCharacter(req.user.id as string);
  }

  // ─── Generic :id routes (AFTER specific routes) ───────────────────────────

  @Get(':id')
  find(@Param('id') id: string) {
    return this.skins.getCharacter(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/purchase')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  purchase(@Request() req: any, @Param('id') id: string) {
    return this.skins.purchase(req.user.id as string, id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/purchase-gems')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  purchaseWithGems(@Request() req: any, @Param('id') id: string) {
    return this.skins.purchaseWithGems(req.user.id as string, id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/claim-free')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  claimFree(@Request() req: any, @Param('id') id: string) {
    return this.skins.claimFree(req.user.id as string, id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put(':id/equip')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  equip(@Request() req: any, @Param('id') id: string) {
    return this.skins.setActiveCharacter(req.user.id as string, id);
  }
}
