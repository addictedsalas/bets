import { GameSchedule } from './gameCache';
export interface Game {
    id: string;
    sport_key: string;
    sport_title: string;
    commence_time: string;
    home_team: string;
    away_team: string;
    scores?: {
        home_score: number;
        away_score: number;
        period: number;
        time_remaining?: string;
    };
    bookmakers: {
        key: string;
        title: string;
        markets: {
            key: string;
            outcomes: {
                name: string;
                price: number;
                point?: number;
            }[];
        }[];
    }[];
}
export interface BettingLine {
    bookmaker: string;
    total: number;
    over_price: number;
    under_price: number;
}
export declare class OddsService {
    private apiKey;
    private baseUrl;
    private gameCache;
    private requestCount;
    private basketballSports;
    constructor(apiKey: string);
    getAllBasketballSports(): Promise<string[]>;
    initializeTodaysGames(): Promise<void>;
    getActiveGames(): Promise<Game[]>;
    getLiveBasketballGames(): Promise<Game[]>;
    getFanDuelLines(gameId: string): Promise<BettingLine[]>;
    isThirdQuarterSevenMinutes(game: Game): boolean;
    getRequestCount(): number;
    getCacheStats(): {
        totalGames: number;
        activeGames: number;
        scheduledGames: number;
        lastScheduleFetch: Date | null;
    };
    cleanupCache(): void;
    getUpcomingGames(): Promise<GameSchedule[]>;
}
//# sourceMappingURL=oddsService.d.ts.map