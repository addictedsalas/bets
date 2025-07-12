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
  odds: number; // American odds (e.g., -110, +150)
  amount: number; // Bet amount in dollars
  placedAt: string; // ISO timestamp
  status: 'PENDING' | 'WON' | 'LOST' | 'CANCELLED';
  finalScore?: {
    home: number;
    away: number;
    total: number;
  };
  payout?: number; // Calculated payout if won
  profit?: number; // Net profit/loss
  settledAt?: string; // When bet was settled
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
  roi: number; // Return on investment percentage
}