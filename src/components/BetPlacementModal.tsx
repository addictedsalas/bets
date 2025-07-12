import { useState } from 'react';
import { BetOpportunity, BetRecommendation, PlacedBet } from '../types';

interface BetPlacementModalProps {
  opportunity: BetOpportunity;
  recommendation: BetRecommendation;
  isOpen: boolean;
  onClose: () => void;
  onPlaceBet: (bet: Omit<PlacedBet, 'id' | 'placedAt' | 'status'>) => void;
}

export default function BetPlacementModal({ 
  opportunity, 
  recommendation, 
  isOpen, 
  onClose, 
  onPlaceBet 
}: BetPlacementModalProps) {
  const [amount, setAmount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  if (!isOpen) return null;

  const calculatePayout = (betAmount: number, odds: number): number => {
    if (odds > 0) {
      // Positive odds: payout = bet * (odds/100)
      return betAmount * (odds / 100);
    } else {
      // Negative odds: payout = bet / (abs(odds)/100)
      return betAmount / (Math.abs(odds) / 100);
    }
  };

  const betAmount = parseFloat(amount) || 0;
  const potentialPayout = betAmount > 0 ? calculatePayout(betAmount, recommendation.price) : 0;
  const totalReturn = betAmount + potentialPayout;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (betAmount <= 0) return;

    const bet: Omit<PlacedBet, 'id' | 'placedAt' | 'status'> = {
      gameId: opportunity.gameId,
      gameTitle: `${opportunity.awayTeam} @ ${opportunity.homeTeam}`,
      betType: recommendation.action,
      line: recommendation.line,
      odds: recommendation.price,
      amount: betAmount,
      notes: notes || undefined
    };

    onPlaceBet(bet);
    setAmount('');
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Place Bet</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Game Info */}
        <div className="bg-gray-700 rounded-lg p-4 mb-4">
          <div className="text-white font-medium mb-2">
            {opportunity.awayTeam} @ {opportunity.homeTeam}
          </div>
          <div className="text-gray-400 text-sm mb-2">
            Q{opportunity.period} {opportunity.timeRemaining} • Current: {opportunity.currentScore.total}
          </div>
          <div className="bg-blue-600 rounded p-2 text-white text-center">
            <div className="font-bold text-lg">
              {recommendation.action} {recommendation.line}
            </div>
            <div className="text-sm">
              {recommendation.price > 0 ? '+' : ''}{recommendation.price} • 
              {recommendation.confidence}% confidence
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Bet Amount */}
          <div className="mb-4">
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Bet Amount ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              placeholder="0.00"
              required
            />
          </div>

          {/* Payout Calculation */}
          {betAmount > 0 && (
            <div className="bg-gray-700 rounded-lg p-3 mb-4 text-sm">
              <div className="flex justify-between text-gray-300">
                <span>Bet Amount:</span>
                <span>${betAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Potential Profit:</span>
                <span className="text-green-400">+${potentialPayout.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-600 mt-2 pt-2 flex justify-between text-white font-medium">
                <span>Total Return:</span>
                <span>${totalReturn.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              rows={2}
              placeholder="Any notes about this bet..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={betAmount <= 0}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              Place Bet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}