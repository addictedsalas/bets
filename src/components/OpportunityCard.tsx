import { useState } from 'react';
import { BetOpportunity, PlacedBet } from '../types';
import BetPlacementModal from './BetPlacementModal';

interface OpportunityCardProps {
  opportunity: BetOpportunity;
  onPlaceBet: (bet: Omit<PlacedBet, 'id' | 'placedAt' | 'status'>) => void;
  placedBets: PlacedBet[];
}

export default function OpportunityCard({ opportunity, onPlaceBet, placedBets }: OpportunityCardProps) {
  const [showBetModal, setShowBetModal] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<any>(null);

  const bestRecommendation = opportunity.recommendations.reduce((best, current) => 
    current.confidence > best.confidence ? current : best
  );

  // Check if user has already placed a bet on this game
  const existingBet = placedBets.find(bet => bet.gameId === opportunity.gameId);

  const handlePlaceBet = (recommendation: any) => {
    setSelectedRecommendation(recommendation);
    setShowBetModal(true);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-400';
    if (confidence >= 65) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getPaceColor = (pace: string) => {
    switch (pace) {
      case 'high': return 'text-red-400';
      case 'low': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const formatPrice = (price: number) => {
    return price > 0 ? `+${price}` : `${price}`;
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
      {/* Game Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-white">
            {opportunity.awayTeam} @ {opportunity.homeTeam}
          </h3>
          <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
            <span>Q{opportunity.period}</span>
            <span>{opportunity.timeRemaining} remaining</span>
            <span className={getPaceColor(opportunity.metadata.scoringPace)}>
              {opportunity.metadata.scoringPace.toUpperCase()} pace
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">
            {opportunity.currentScore.away}-{opportunity.currentScore.home}
          </div>
          <div className="text-sm text-gray-400">
            Total: {opportunity.currentScore.total}
          </div>
        </div>
      </div>

      {/* Analysis Section */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-700 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-300 mb-2">📊 YOUR CALCULATION</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-lg">
              <span className="text-gray-300">Current Score:</span>
              <span className="text-white font-bold">{opportunity.currentScore.total}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-400">
              <span>({opportunity.currentScore.away}-{opportunity.currentScore.home})</span>
              <span>Q{opportunity.period} {opportunity.timeRemaining}</span>
            </div>
            <div className="border-t border-gray-600 pt-2">
              <div className="flex justify-between text-lg">
                <span className="text-gray-300">{opportunity.currentScore.total} ÷ 0.75 =</span>
                <span className="text-yellow-400 font-bold text-xl">
                  {opportunity.calculatedTotal.toFixed(1)}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Projected final total
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-700 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-300 mb-2">🎯 FANDUEL LINE</h4>
          <div className="space-y-1">
            {opportunity.fanDuelLines.map((line, index) => (
              <div key={index} className="flex justify-between">
                <span className="text-gray-400">O/U {line.total}:</span>
                <span className="text-white">
                  {formatPrice(line.over_price)} / {formatPrice(line.under_price)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-lg font-bold text-white">💰 RECOMMENDATION</h4>
          <div className={`text-lg font-bold ${getConfidenceColor(bestRecommendation.confidence)}`}>
            {bestRecommendation.confidence}% Confidence
          </div>
        </div>
        
        <div className="text-center mb-3">
          <div className="text-2xl font-bold text-white mb-1">
            {bestRecommendation.action} {bestRecommendation.line}
          </div>
          <div className="text-blue-200">
            {formatPrice(bestRecommendation.price)} • +{bestRecommendation.edge.toFixed(1)} point edge
          </div>
        </div>

        {/* Bet Action Button */}
        {existingBet ? (
          <div className="bg-green-700 rounded-lg p-3 text-center">
            <div className="text-green-200 text-sm">✅ Bet Placed</div>
            <div className="text-white font-semibold">
              {existingBet.betType} {existingBet.line} • ${existingBet.amount}
            </div>
            <div className="text-green-200 text-xs">
              Status: {existingBet.status}
            </div>
          </div>
        ) : (
          <button
            onClick={() => handlePlaceBet(bestRecommendation)}
            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            🎯 Place Bet on FanDuel
          </button>
        )}
      </div>

      {/* Reasoning */}
      <div className="bg-gray-700 rounded-lg p-3">
        <h5 className="text-sm font-semibold text-gray-300 mb-1">📈 Analysis</h5>
        <p className="text-sm text-gray-400">{bestRecommendation.reasoning}</p>
      </div>

      {/* Timestamp */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        Found: {new Date(opportunity.metadata.timestamp).toLocaleTimeString()}
      </div>

      {/* Bet Placement Modal */}
      {showBetModal && selectedRecommendation && (
        <BetPlacementModal
          opportunity={opportunity}
          recommendation={selectedRecommendation}
          isOpen={showBetModal}
          onClose={() => setShowBetModal(false)}
          onPlaceBet={onPlaceBet}
        />
      )}
    </div>
  );
}