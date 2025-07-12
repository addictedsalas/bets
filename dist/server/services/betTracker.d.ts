import { PlacedBet, BetStats } from '../types';
export declare class BetTracker {
    private betsFile;
    private bets;
    private readonly isReadOnly;
    constructor();
    private ensureDataDirectory;
    private loadBets;
    private saveBets;
    addBet(betData: Omit<PlacedBet, 'id' | 'placedAt' | 'status'>): PlacedBet;
    updateBet(betId: string, updates: Partial<PlacedBet>): PlacedBet | null;
    getBets(): PlacedBet[];
    getBetsByGameId(gameId: string): PlacedBet[];
    calculateStats(): BetStats;
    private generateId;
    autoSettleBets(completedGames: Array<{
        gameId: string;
        finalScore: {
            home: number;
            away: number;
            total: number;
        };
    }>): Promise<void>;
    private determineBetOutcome;
    private calculateBetResult;
}
//# sourceMappingURL=betTracker.d.ts.map