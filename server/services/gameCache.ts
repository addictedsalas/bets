import { Game } from './oddsService';

export interface CachedGame {
  game: Game;
  lastUpdated: Date;
  isMonitoring: boolean;
  nextCheck?: Date;
}

export interface GameSchedule {
  gameId: string;
  startTime: Date;
  teams: string;
  sport: string;
}

export class GameCache {
  private dailyGames: Map<string, CachedGame> = new Map();
  private todaysSchedule: GameSchedule[] = [];
  private lastScheduleFetch: Date | null = null;

  // Cache today's games for 6 hours, live games for 30 seconds
  private readonly SCHEDULE_CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours
  private readonly LIVE_GAME_CACHE_DURATION = 30 * 1000; // 30 seconds

  setTodaysSchedule(games: GameSchedule[]): void {
    this.todaysSchedule = games;
    this.lastScheduleFetch = new Date();
    console.log(`📅 Cached ${games.length} games for today`);
  }

  shouldRefreshSchedule(): boolean {
    if (!this.lastScheduleFetch) return true;
    
    const now = new Date();
    const timeSinceLastFetch = now.getTime() - this.lastScheduleFetch.getTime();
    
    return timeSinceLastFetch > this.SCHEDULE_CACHE_DURATION;
  }

  getTodaysSchedule(): GameSchedule[] {
    return this.todaysSchedule;
  }

  updateGame(gameId: string, game: Game): void {
    const cached = this.dailyGames.get(gameId);
    const now = new Date();

    this.dailyGames.set(gameId, {
      game,
      lastUpdated: now,
      isMonitoring: this.shouldMonitorGame(game),
      nextCheck: this.calculateNextCheck(game)
    });
  }

  getGame(gameId: string): CachedGame | undefined {
    return this.dailyGames.get(gameId);
  }

  shouldUpdateGame(gameId: string): boolean {
    const cached = this.dailyGames.get(gameId);
    if (!cached) return true;

    const now = new Date();
    const timeSinceUpdate = now.getTime() - cached.lastUpdated.getTime();

    // If game is being monitored (live), check more frequently
    if (cached.isMonitoring) {
      return timeSinceUpdate > this.LIVE_GAME_CACHE_DURATION;
    }

    // If game hasn't started or is finished, check less frequently
    return timeSinceUpdate > this.SCHEDULE_CACHE_DURATION;
  }

  getGamesToMonitor(): CachedGame[] {
    const now = new Date();
    return Array.from(this.dailyGames.values()).filter(cached => {
      // Only monitor games that are currently live
      if (!cached.isMonitoring) return false;
      
      // Check if it's time for the next update
      if (cached.nextCheck && now < cached.nextCheck) return false;
      
      return true;
    });
  }

  private shouldMonitorGame(game: Game): boolean {
    // Game has scores and is not completed
    if (!game.scores || game.scores.period === 0) return false;
    
    // Game is in progress (has scores but not completed)
    // We'll monitor any live game, not just 3rd quarter ones
    return true;
  }

  private calculateNextCheck(game: Game): Date {
    const now = new Date();
    
    if (!game.scores) {
      // Game hasn't started, check in 5 minutes
      return new Date(now.getTime() + 5 * 60 * 1000);
    }

    const { period } = game.scores;
    
    if (period === 3) {
      // 3rd quarter - check every 30 seconds
      return new Date(now.getTime() + 30 * 1000);
    } else if (period === 2 || period === 4) {
      // 2nd or 4th quarter - check every 2 minutes
      return new Date(now.getTime() + 2 * 60 * 1000);
    } else {
      // 1st quarter or overtime - check every minute
      return new Date(now.getTime() + 60 * 1000);
    }
  }

  getActiveGamesCount(): number {
    return Array.from(this.dailyGames.values()).filter(cached => cached.isMonitoring).length;
  }

  cleanupOldGames(): void {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    for (const [gameId, cached] of this.dailyGames.entries()) {
      if (cached.lastUpdated < oneDayAgo) {
        this.dailyGames.delete(gameId);
      }
    }
  }

  getStats(): {
    totalGames: number;
    activeGames: number;
    scheduledGames: number;
    lastScheduleFetch: Date | null;
  } {
    return {
      totalGames: this.dailyGames.size,
      activeGames: this.getActiveGamesCount(),
      scheduledGames: this.todaysSchedule.length,
      lastScheduleFetch: this.lastScheduleFetch
    };
  }
}