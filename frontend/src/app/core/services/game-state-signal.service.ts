import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class GameStateSignalService {
  readonly isDead          = signal(false);
  readonly scoreGained     = signal(0);
  readonly leaderboardRank = signal(0);
  readonly deathTimestamp  = signal(0);   // Date.now() al morir — inicia countdown
  readonly totalScore  = signal(0);   // score acumulado de la sesión
  readonly totalDeaths = signal(0);   // muertes en la sesión
  readonly bestSurvivalSeconds = signal(0); // mejor racha de supervivencia en segundos
  readonly highLevelKills = signal(0);      // kills a enemigos nivel 10+
  readonly killerName      = signal<string | null>(null);

  sessionStartMs = 0;                 // Date.now() cuando empieza la sesión

  private scoreAtLifeStart = 0;
  private lifeStartMs = 0;           // Date.now() al iniciar cada vida

  onSessionStart(): void {
    this.sessionStartMs = Date.now();
    this.lifeStartMs = Date.now();
  }

  onPlayerDied(currentScore: number, rank: number, killerName?: string | null): void {
    const survivalSecs = this.lifeStartMs > 0
      ? Math.round((Date.now() - this.lifeStartMs) / 1000)
      : 0;
    if (survivalSecs > this.bestSurvivalSeconds()) {
      this.bestSurvivalSeconds.set(survivalSecs);
    }
    this.scoreGained.set(currentScore - this.scoreAtLifeStart);
    this.leaderboardRank.set(rank);
    this.deathTimestamp.set(Date.now());
    this.totalScore.set(currentScore);
    this.totalDeaths.update(d => d + 1);
    this.killerName.set(killerName ?? null);
    this.isDead.set(true);
  }

  onPlayerRespawned(currentScore: number): void {
    this.scoreAtLifeStart = currentScore;
    this.lifeStartMs = Date.now();
    this.isDead.set(false);
  }

  onScoreUpdate(score: number): void {
    this.totalScore.set(score);
  }

  onHighLevelKillsUpdate(kills: number): void {
    this.highLevelKills.set(kills);
  }

  reset(): void {
    this.isDead.set(false);
    this.scoreGained.set(0);
    this.leaderboardRank.set(0);
    this.deathTimestamp.set(0);
    this.totalScore.set(0);
    this.totalDeaths.set(0);
    this.bestSurvivalSeconds.set(0);
    this.highLevelKills.set(0);
    this.killerName.set(null);
    this.scoreAtLifeStart = 0;
    this.sessionStartMs = 0;
    this.lifeStartMs = 0;
  }
}
