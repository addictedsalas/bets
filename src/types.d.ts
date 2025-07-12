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
export interface BettingLine {
    bookmaker: string;
    total: number;
    over_price: number;
    under_price: number;
}
export interface PlacedBet {
    id: string;
    gameId: string;
    gameTitle: string;
    betType: 'OVER' | 'UNDER';
    line: number;
    odds: number;
    amount: number;
    placedAt: string;
    status: 'PENDING' | 'WON' | 'LOST' | 'CANCELLED';
    finalScore?: {
        home: number;
        away: number;
        total: number;
    };
    payout?: number;
    profit?: number;
    settledAt?: string;
    notes?: string;
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
//# sourceMappingURL=types.d.ts.map