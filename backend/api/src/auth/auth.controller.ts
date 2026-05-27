import {
  Controller, Post, Body, UseGuards, Req, HttpCode, Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { ttl: 900000, limit: 5 } })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(200)
  refresh(@Body('refreshToken') token: string) {
    if (!token) throw new Error('refreshToken required');
    return this.authService.refresh(token);
  }

  @Post('logout')
  @HttpCode(204)
  @UseGuards(AuthGuard('jwt'))
  async logout(@Req() req: any, @Body('refreshToken') token: string) {
    await this.authService.logout(req.user.id, token ?? '');
  }

  @Post('forgot-password')
  @HttpCode(200)
  @Throttle({ default: { ttl: 3600000, limit: 3 } })
  async forgotPassword(@Body('email') email: string) {
    // Always 200 to prevent email enumeration
    await this.authService.forgotPassword(email ?? '').catch(() => {});
    return { message: 'If the email exists, instructions were sent.' };
  }

  @Post('reset-password')
  @HttpCode(200)
  @Throttle({ default: { ttl: 3600000, limit: 5 } })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.newPassword);
    return { message: 'Password updated successfully.' };
  }
}
