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
export declare class GameCache {
    private dailyGames;
    private todaysSchedule;
    private lastScheduleFetch;
    private readonly SCHEDULE_CACHE_DURATION;
    private readonly LIVE_GAME_CACHE_DURATION;
    setTodaysSchedule(games: GameSchedule[]): void;
    shouldRefreshSchedule(): boolean;
    getTodaysSchedule(): GameSchedule[];
    updateGame(gameId: string, game: Game): void;
    getGame(gameId: string): CachedGame | undefined;
    shouldUpdateGame(gameId: string): boolean;
    getGamesToMonitor(): CachedGame[];
    private shouldMonitorGame;
    private calculateNextCheck;
    getActiveGamesCount(): number;
    cleanupOldGames(): void;
    getStats(): {
        totalGames: number;
        activeGames: number;
        scheduledGames: number;
        lastScheduleFetch: Date | null;
    };
}
//# sourceMappingURL=gameCache.d.ts.map