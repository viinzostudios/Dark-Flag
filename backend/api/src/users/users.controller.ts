import {
  Controller, Get, Patch, Body, UseGuards, Req, HttpCode,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsIn, IsString } from 'class-validator';
import { UsersService } from './users.service';

const SUPPORTED_LANGS = ['es', 'en', 'pt', 'fr', 'de', 'it', 'ru', 'zh', 'ja', 'ar'] as const;

class UpdateLangDto {
  @IsString()
  @IsIn(SUPPORTED_LANGS)
  lang: string;
}

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@Req() req: any) {
    const profile = await this.usersService.getProfile(req.user.id);
    return { preferredLang: profile.preferredLang ?? '' };
  }

  @Patch('me/language')
  @HttpCode(204)
  async updateLanguage(@Req() req: any, @Body() dto: UpdateLangDto) {
    await this.usersService.updatePreferredLang(req.user.id, dto.lang);
  }
}
