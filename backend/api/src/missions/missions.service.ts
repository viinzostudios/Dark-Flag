import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mission } from './entities/mission.entity';
import { PlayerMission } from './entities/player-mission.entity';
import { EconomyService } from '../economy/economy.service';

@Injectable()
export class MissionsService {
  constructor(
    @InjectRepository(Mission)
    private readonly missionRepo: Repository<Mission>,
    @InjectRepository(PlayerMission)
    private readonly playerMissionRepo: Repository<PlayerMission>,
    private readonly economy: EconomyService,
  ) {}

  // ─── Init default missions ────────────────────────────────────────────────

  async seedDefaultMissions(): Promise<void> {
    const count = await this.missionRepo.count();
    if (count > 0) return;

    const defaults: Partial<Mission>[] = [
      // Permanent missions
      { title: 'Primera captura', description: 'Captura la bandera por primera vez', type: 'flag_captures', targetValue: 1, rewardCoins: 50, rewardXp: 100 },
      { title: 'Portador experto', description: 'Captura la bandera 5 veces', type: 'flag_captures', targetValue: 5, rewardCoins: 150, rewardXp: 300 },
      { title: 'Maestro de la maza', description: 'Aturde a 10 rivales con la maza', type: 'maces_landed', targetValue: 10, rewardCoins: 120, rewardXp: 200 },
      { title: 'Coleccionista de poder', description: 'Recoge 5 power-ups', type: 'powerups_collected', targetValue: 5, rewardCoins: 80, rewardXp: 120 },
      { title: 'Jugador dedicado', description: 'Juega 5 partidas', type: 'games_played', targetValue: 5, rewardCoins: 75, rewardXp: 150 },
      { title: 'Puntuador', description: 'Acumula 200 puntos en total', type: 'score', targetValue: 200, rewardCoins: 100, rewardXp: 180 },
      { title: 'Cazatrampa', description: 'Activa 3 trampas de rivales', type: 'traps_triggered', targetValue: 3, rewardCoins: 60, rewardXp: 90 },
      { title: 'Nivel 10', description: 'Alcanza el nivel 10 en una partida', type: 'level_reached', targetValue: 10, rewardCoins: 200, rewardXp: 400 },
      // Daily missions
      { title: 'Diaria: captura', description: 'Captura la bandera hoy', type: 'flag_captures', targetValue: 1, rewardCoins: 60, rewardXp: 100, isDaily: true },
      { title: 'Diaria: maza ×3', description: 'Aturde a 3 rivales hoy', type: 'maces_landed', targetValue: 3, rewardCoins: 50, rewardXp: 80, isDaily: true },
      { title: 'Diaria: jugar x2', description: 'Juega 2 partidas hoy', type: 'games_played', targetValue: 2, rewardCoins: 40, rewardXp: 60, isDaily: true },
    ];

    for (const m of defaults) {
      await this.missionRepo.save(this.missionRepo.create(m));
    }
  }

  // ─── Player missions ──────────────────────────────────────────────────────

  async getActiveMissions(userId: string): Promise<Array<PlayerMission & { mission: Mission }>> {
    const playerMissions = await this.playerMissionRepo.find({
      where: { userId, isClaimed: false },
    });

    // Assign default missions if none
    if (playerMissions.length === 0) {
      await this.assignDefaultMissions(userId);
      return this.getActiveMissions(userId);
    }

    // Attach mission details
    const result: Array<PlayerMission & { mission: Mission }> = [];
    for (const pm of playerMissions) {
      const mission = await this.missionRepo.findOne({ where: { id: pm.missionId } });
      if (mission) result.push(Object.assign(pm, { mission }));
    }
    return result;
  }

  private async assignDefaultMissions(userId: string): Promise<void> {
    const missions = await this.missionRepo.find({ where: { isActive: true } });
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    for (const mission of missions) {
      const existing = await this.playerMissionRepo.findOne({
        where: { userId, missionId: mission.id },
      });
      if (existing) continue;

      const pm = this.playerMissionRepo.create({
        userId,
        missionId: mission.id,
        progress: 0,
        isCompleted: false,
        isClaimed: false,
        assignedAt: now,
        expiresAt: mission.isDaily ? tomorrow : undefined,
      });
      await this.playerMissionRepo.save(pm);
    }
  }

  async updateProgress(
    userId: string,
    type: Mission['type'],
    amount: number,
  ): Promise<void> {
    const playerMissions = await this.playerMissionRepo.find({
      where: { userId, isCompleted: false },
    });

    for (const pm of playerMissions) {
      const mission = await this.missionRepo.findOne({ where: { id: pm.missionId } });
      if (!mission || mission.type !== type) continue;

      pm.progress = Math.min(pm.progress + amount, mission.targetValue);
      if (pm.progress >= mission.targetValue) {
        pm.isCompleted = true;
      }
      await this.playerMissionRepo.save(pm);
    }
  }

  async claimReward(userId: string, playerMissionId: string): Promise<{ coinsEarned: number; xpEarned: number }> {
    const pm = await this.playerMissionRepo.findOne({
      where: { id: playerMissionId, userId },
    });
    if (!pm) throw new NotFoundException('Mission not found');
    if (!pm.isCompleted) throw new BadRequestException('Mission not completed');
    if (pm.isClaimed) throw new BadRequestException('Already claimed');

    const mission = await this.missionRepo.findOne({ where: { id: pm.missionId } });
    if (!mission) throw new NotFoundException('Mission definition not found');

    pm.isClaimed = true;
    await this.playerMissionRepo.save(pm);

    await this.economy.addCoins(userId, mission.rewardCoins, 'earn_mission', `Mission: ${mission.title}`);

    return { coinsEarned: mission.rewardCoins, xpEarned: mission.rewardXp };
  }
}
