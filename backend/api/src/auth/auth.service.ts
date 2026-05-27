import {
  Injectable, UnauthorizedException, BadRequestException, Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import Redis from 'ioredis';
import { UsersService } from '../users/users.service';
import { SkinsService } from '../skins/skins.service';
import { AvatarsService } from '../avatars/avatars.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '../users/entities/user.entity';

const FORGOT_PASSWORD_TTL = 3600; // 1 hour

@Injectable()
export class AuthService {
  private readonly redis: Redis;
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly skinsService: SkinsService,
    private readonly avatarsService: AvatarsService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {
    this.redis = new Redis(config.get<string>('REDIS_URL')!);
  }

  async register(dto: RegisterDto) {
    const user = await this.usersService.create(dto.email, dto.username, dto.password);
    await this.skinsService.ensureStarterCharacter(user.id).catch(() => {});
    await this.avatarsService.ensureDefaultAvatar(user.id).catch(() => {});
    return this.issueTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    await this.usersService.updateLastLogin(user.id);
    return this.issueTokens(user);
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string; tokenId: string };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const key = `auth:refresh:${payload.sub}:${payload.tokenId}`;
    const exists = await this.redis.exists(key);
    if (!exists) throw new UnauthorizedException('Refresh token revoked');

    const user = await this.usersService.findById(payload.sub);
    if (!user) throw new UnauthorizedException();

    const accessToken = this.signAccess(user);
    return { accessToken };
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) return; // silent: don't reveal if email exists

    const token = uuidv4();
    const key = `auth:forgot:${token}`;
    await this.redis.set(key, user.id, 'EX', FORGOT_PASSWORD_TTL);

    // In production, send an email with the reset link.
    // For now, log the token so it can be tested manually.
    this.logger.log(`[DEV] Password reset token for ${email}: ${token}`);
    this.logger.log(`[DEV] Reset link: /auth/reset-password?token=${token}`);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const key = `auth:forgot:${token}`;
    const userId = await this.redis.get(key);
    if (!userId) throw new BadRequestException('Invalid or expired token');

    await this.usersService.updatePassword(userId, newPassword);
    await this.redis.del(key);
  }

  async logout(userId: string, refreshToken: string) {
    try {
      const payload = this.jwtService.decode(refreshToken) as { tokenId?: string };
      if (payload?.tokenId) {
        await this.redis.del(`auth:refresh:${userId}:${payload.tokenId}`);
      }
    } catch {
      // ignore decode errors on logout
    }
  }

  private async issueTokens(user: User) {
    const tokenId = uuidv4();
    const refreshTtlSeconds = 7 * 24 * 3600;

    const accessToken = this.signAccess(user);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const refreshToken = this.jwtService.sign({ sub: user.id, username: user.username, tokenId } as any, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: (this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d') as any,
    });

    await this.redis.set(
      `auth:refresh:${user.id}:${tokenId}`,
      'valid',
      'EX',
      refreshTtlSeconds,
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        profile: user.profile,
      },
    };
  }

  private signAccess(user: User): string {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.jwtService.sign({ sub: user.id, username: user.username } as any, {
      expiresIn: (this.config.get<string>('JWT_EXPIRES_IN') ?? '15m') as any,
    });
  }
}
