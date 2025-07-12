import { useState } from 'react';
import { PlacedBet, BetStats } from '../types';

interface BetLedgerProps {
  bets: PlacedBet[];
  stats: BetStats;
  onUpdateBet: (betId: string, updates: Partial<PlacedBet>) => void;
}

export default function BetLedger({ bets, stats, onUpdateBet }: BetLedgerProps) {
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'WON' | 'LOST'>('ALL');

  const filteredBets = bets.filter(bet => {
    if (filter === 'ALL') return true;
    return bet.status === filter;
  }).sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime());

  const formatCurrency = (amount: number) => {
    const formatted = Math.abs(amount).toFixed(2);
    return amount >= 0 ? `+$${formatted}` : `-$${formatted}`;
  };

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : `${odds}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'WON': return 'text-green-400';
      case 'LOST': return 'text-red-400';
      case 'PENDING': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const handleSettleBet = (bet: PlacedBet, won: boolean, finalTotal?: number) => {
    const calculatePayout = (amount: number, odds: number): number => {
      if (odds > 0) {
        return amount * (odds / 100);
      } else {
        return amount / (Math.abs(odds) / 100);
      }
    };

    const updates: Partial<PlacedBet> = {
      status: won ? 'WON' : 'LOST',
      settledAt: new Date().toISOString()
    };

    if (finalTotal !== undefined) {
      updates.finalScore = {
        home: 0, // We don't track individual scores here
        away: 0,
        total: finalTotal
      };
    }

    if (won) {
      const payout = calculatePayout(bet.amount, bet.odds);
      updates.payout = bet.amount + payout;
      updates.profit = payout;
    } else {
      updates.payout = 0;
      updates.profit = -bet.amount;
    }

    onUpdateBet(bet.id, updates);
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg">
      {/* Header with Stats */}
      <div className="p-6 border-b border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">📊 Betting Ledger</h3>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-gray-700 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-white">{stats.totalBets}</div>
            <div className="text-xs text-gray-400">Total Bets</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-3 text-center">
            <div className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(stats.netProfit)}
            </div>
            <div className="text-xs text-gray-400">Net Profit</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-white">{stats.winPercentage.toFixed(1)}%</div>
            <div className="text-xs text-gray-400">Win Rate</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-3 text-center">
            <div className={`text-2xl font-bold ${stats.roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.roi.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-400">ROI</div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-white font-semibold">${stats.totalWagers.toFixed(2)}</div>
            <div className="text-gray-400">Total Wagered</div>
          </div>
          <div className="text-center">
            <div className="text-green-400 font-semibold">{stats.winCount}W</div>
            <div className="text-gray-400">Wins</div>
          </div>
          <div className="text-center">
            <div className="text-red-400 font-semibold">{stats.lossCount}L</div>
            <div className="text-gray-400">Losses</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-6 py-4 border-b border-gray-700">
        <div className="flex gap-2">
          {(['ALL', 'PENDING', 'WON', 'LOST'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {status} ({bets.filter(b => status === 'ALL' || b.status === status).length})
            </button>
          ))}
        </div>
      </div>

      {/* Bets List */}
      <div className="max-h-96 overflow-y-auto">
        {filteredBets.length === 0 ? (
          <div className="p-6 text-center text-gray-400">
            No bets found for the selected filter.
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {filteredBets.map((bet) => (
              <div key={bet.id} className="p-4 hover:bg-gray-750">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="text-white font-medium">{bet.gameTitle}</div>
                    <div className="text-sm text-gray-400">
                      {bet.betType} {bet.line} • {formatOdds(bet.odds)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold ${getStatusColor(bet.status)}`}>
                      {bet.status}
                    </div>
                    <div className="text-sm text-gray-400">
                      ${bet.amount.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="text-gray-400">
                    {new Date(bet.placedAt).toLocaleDateString()} {new Date(bet.placedAt).toLocaleTimeString()}
                  </div>
                  
                  {bet.status === 'PENDING' ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const finalTotal = prompt('Enter final total score:');
                          if (finalTotal) {
                            const total = parseInt(finalTotal);
                            const won = bet.betType === 'OVER' ? total > bet.line : total < bet.line;
                            handleSettleBet(bet, won, total);
                          }
                        }}
                        className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-500"
                      >
                        Settle
                      </button>
                    </div>
                  ) : (
                    <div className={`font-semibold ${bet.profit! >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(bet.profit!)}
                    </div>
                  )}
                </div>

                {bet.finalScore && (
                  <div className="mt-2 text-xs text-gray-500">
                    Final Total: {bet.finalScore.total} • 
                    {bet.betType === 'OVER' 
                      ? bet.finalScore.total > bet.line ? ' WON' : ' LOST'
                      : bet.finalScore.total < bet.line ? ' WON' : ' LOST'}
                  </div>
                )}

                {bet.notes && (
                  <div className="mt-2 text-xs text-gray-500 italic">
                    Note: {bet.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}