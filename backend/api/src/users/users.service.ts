import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { UserProfile } from './entities/user-profile.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly profiles: Repository<UserProfile>,
    private readonly dataSource: DataSource,
  ) {}

  async create(email: string, username: string, password: string): Promise<User> {
    const exists = await this.users.findOne({
      where: [{ email }, { username }],
    });
    if (exists) {
      throw new ConflictException(
        exists.email === email ? 'Email already in use' : 'Username already taken',
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    return this.dataSource.transaction(async (manager) => {
      const user = manager.create(User, { email, username, passwordHash });
      await manager.save(user);

      const profile = manager.create(UserProfile, {
        id: user.id,
        displayName: username,
      });
      await manager.save(profile);

      return manager.findOneOrFail(User, { where: { id: user.id } });
    });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.users.findOne({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.users.findOne({ where: { id } });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.users.update(id, { lastLogin: new Date() });
  }

  async updatePassword(id: string, newPassword: string): Promise<void> {
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.users.update(id, { passwordHash });
  }

  async getProfile(userId: string): Promise<UserProfile> {
    const profile = await this.profiles.findOne({ where: { id: userId } });
    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  async updatePreferredLang(userId: string, lang: string): Promise<void> {
    const profile = await this.profiles.findOne({ where: { id: userId } });
    if (!profile) throw new NotFoundException('Profile not found');
    await this.profiles.update(userId, { preferredLang: lang });
  }
}
