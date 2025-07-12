export interface PlacedBet {
    id: string;
    gameId: string;
    homeTeam: string;
    awayTeam: string;
    betType: 'over' | 'under';
    currentTotal: number;
    projectedTotal: number;
    edge: number;
    betAmount: number;
    odds: number;
    potentialPayout: number;
    placedAt: string;
    status: 'pending' | 'won' | 'lost';
    actualTotal?: number;
    settledAt?: string;
    netProfit?: number;
}
export interface BetStats {
    totalBets: number;
    totalWagers: number;
    totalPayout: number;
    netProfit: number;
    winCount: number;
    lossCount: number;
    pendingCount: number;
    winPercentage: number;
    averageBetSize: number;
    biggestWin: number;
    biggestLoss: number;
    roi: number;
}
export interface BetOpportunity {
    gameId: string;
    homeTeam: string;
    awayTeam: string;
    status: string;
    quarter: number;
    timeRemaining: string;
    currentTotal: number;
    fanDuelTotal: number;
    projectedTotal: number;
    edge: number;
    confidence: number;
    odds: {
        over: number;
        under: number;
    };
    recommendation: {
        side: 'over' | 'under';
        reasoning: string;
    };
}
export interface Game {
    id: string;
    sport_key: string;
    sport_title: string;
    commence_time: string;
    home_team: string;
    away_team: string;
    scores?: {
        period: number;
        time_remaining: string;
        home_score: number;
        away_score: number;
    };
    bookmakers?: Array<{
        key: string;
        title: string;
        markets: Array<{
            key: string;
            outcomes: Array<{
                name: string;
                price: number;
                point?: number;
            }>;
        }>;
    }>;
    completed?: boolean;
    last_update?: string;
}
//# sourceMappingURL=types.d.ts.map