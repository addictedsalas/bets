import { Game, BettingLine } from './oddsService';
export interface BetOpportunity {
    gameId: string;
    homeTeam: string;
    awayTeam: string;
    currentScore: {
        home: number;
        away: number;
        total: number;
    };
    calculatedTotal: number;
    timeRemaining: string;
    period: number;
    fanDuelLines: BettingLine[];
    recommendations: BetRecommendation[];
    confidence: number;
    metadata: {
        scoringPace: 'high' | 'average' | 'low';
        edge: number;
        timestamp: string;
    };
}
export interface BetRecommendation {
    action: 'OVER' | 'UNDER';
    line: number;
    edge: number;
    price: number;
    confidence: number;
    reasoning: string;
}
export declare class BetAnalyzer {
    calculateProjectedTotal(homeScore: number, awayScore: number): number;
    analyzeGame(game: Game, fanDuelLines: BettingLine[]): BetOpportunity | null;
    private calculateConfidence;
    private calculateScoringPace;
    private parseTimeRemaining;
}
//# sourceMappingURL=betAnalyzer.d.ts.map