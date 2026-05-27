import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlayerStats } from './entities/player-stats.entity';
import { GameSession } from './entities/game-session.entity';
import { User } from '../users/entities/user.entity';
import { UserProfile } from '../users/entities/user-profile.entity';

export interface GameSessionResult {
  userId: string;
  score: number;
  durationSeconds: number;
  flagCaptures: number;
  flagPickups: number;
  macesLanded: number;
  macesReceived: number;
  trapsTriggered: number;
  powerupsCollected: number;
  bestLevelReached: number;
  level15Reached: boolean;
}

export interface RankingEntry {
  rank: number;
  userId: string;
  username: string;
  avatarSlug: string;
  value: number;
}

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(PlayerStats)
    private readonly repo: Repository<PlayerStats>,
    @InjectRepository(GameSession)
    private readonly sessionRepo: Repository<GameSession>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly profileRepo: Repository<UserProfile>,
  ) {}

  async findOrCreate(userId: string): Promise<PlayerStats> {
    let stats = await this.repo.findOne({ where: { userId } });
    if (!stats) {
      stats = this.repo.create({ userId });
      stats = await this.repo.save(stats);
    }
    return stats;
  }

  async getStats(userId: string): Promise<PlayerStats> {
    return this.findOrCreate(userId);
  }

  async recordGameSession(result: GameSessionResult): Promise<void> {
    const stats = await this.findOrCreate(result.userId);

    stats.gamesPlayed += 1;
    stats.flagCaptures += result.flagCaptures;
    stats.flagPickups += result.flagPickups;
    stats.macesLanded += result.macesLanded;
    stats.macesReceived += result.macesReceived;
    stats.trapsTriggered += result.trapsTriggered;
    stats.powerupsCollected += result.powerupsCollected;
    stats.playSeconds += result.durationSeconds;
    stats.totalScore += result.score;

    if (result.score > stats.bestScoreSession) stats.bestScoreSession = result.score;
    if (result.bestLevelReached > stats.bestLevelReached) stats.bestLevelReached = result.bestLevelReached;
    if (result.level15Reached) stats.level15Reached = true;

    await this.repo.save(stats);

    const session = this.sessionRepo.create({
      userId: result.userId,
      score: result.score,
      durationSeconds: result.durationSeconds,
      flagCaptures: result.flagCaptures,
      flagPickups: result.flagPickups,
      macesLanded: result.macesLanded,
      level15Reached: result.level15Reached,
      bestLevel: result.bestLevelReached,
    });
    await this.sessionRepo.save(session);
  }

  async getSessionHistory(userId: string, limit = 50): Promise<GameSession[]> {
    return this.sessionRepo.find({
      where: { userId },
      order: { playedAt: 'DESC' },
      take: limit,
    });
  }

  async getGlobalRanking(limit = 100): Promise<PlayerStats[]> {
    return this.repo.find({
      order: { totalScore: 'DESC' },
      take: limit,
    });
  }

  async getRankingFlagCaptures(search?: string, limit = 200): Promise<RankingEntry[]> {
    return this.buildRanking('flagCaptures', search, limit);
  }

  async getRankingBestScore(search?: string, limit = 200): Promise<RankingEntry[]> {
    return this.buildRanking('bestScoreSession', search, limit);
  }

  async getRankingMaces(search?: string, limit = 200): Promise<RankingEntry[]> {
    return this.buildRanking('macesLanded', search, limit);
  }

  async getRankingGamesPlayed(search?: string, limit = 200): Promise<RankingEntry[]> {
    return this.buildRanking('gamesPlayed', search, limit);
  }

  private async buildRanking(
    field: keyof PlayerStats,
    search: string | undefined,
    limit: number,
  ): Promise<RankingEntry[]> {
    const rows = await this.repo.find({
      order: { [field]: 'DESC' },
      take: search ? undefined : limit,
    });

    const entries: RankingEntry[] = [];
    let rank = 0;
    for (const s of rows) {
      if ((s[field] as number) <= 0) continue;
      const user = await this.userRepo.findOne({ where: { id: s.userId } });
      if (!user) continue;
      if (search && !user.username.toLowerCase().includes(search.toLowerCase())) continue;
      const profile = await this.profileRepo.findOne({ where: { id: s.userId } });
      rank++;
      entries.push({
        rank,
        userId: s.userId,
        username: user.username,
        avatarSlug: profile?.activeAvatarSlug ?? 'avatar-01',
        value: s[field] as number,
      });
      if (!search && entries.length >= limit) break;
    }
    return entries;
  }
}
