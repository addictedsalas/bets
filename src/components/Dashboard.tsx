import { BetOpportunity, PlacedBet } from '../types';
import OpportunityCard from './OpportunityCard';
import StatusBar from './StatusBar';
import EmptyState from './EmptyState';
import StatsPanel from './StatsPanel';
import GamesPanel from './UpcomingGames';

interface DashboardProps {
  opportunities: BetOpportunity[];
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  onPlaceBet: (bet: Omit<PlacedBet, 'id' | 'placedAt' | 'status'>) => void;
  placedBets: PlacedBet[];
}

export default function Dashboard({ opportunities, connectionStatus, onPlaceBet, placedBets }: DashboardProps) {
  return (
    <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 rounded-lg">
      <div className="container mx-auto px-4 py-6">

        {/* Status Bar */}
        <StatusBar 
          connectionStatus={connectionStatus}
          opportunityCount={opportunities.length}
        />

        {/* Main Content */}
        <div className="mt-8">
          <div className="grid xl:grid-cols-4 lg:grid-cols-3 gap-6">
            {/* Left Sidebar - Games Panel */}
            <div className="xl:col-span-1 lg:col-span-1">
              <GamesPanel />
            </div>

            {/* Main Content Area - Opportunities */}
            <div className="xl:col-span-3 lg:col-span-2">
              {opportunities.length > 0 ? (
                <div className="space-y-6">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-6 text-white">
                    <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
                      🎯 3rd Quarter Betting Opportunities
                    </h2>
                    <p className="text-green-100">
                      {opportunities.length} active opportunity{opportunities.length !== 1 ? 's' : ''} found • 
                      Q3 @ ~7 minutes remaining
                    </p>
                  </div>

                  {/* Opportunities List */}
                  <div className="space-y-6">
                    {opportunities.map((opportunity) => (
                      <OpportunityCard 
                        key={opportunity.gameId} 
                        opportunity={opportunity}
                        onPlaceBet={onPlaceBet}
                        placedBets={placedBets}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Header for No Opportunities */}
                  <div className="bg-gradient-to-r from-gray-700 to-gray-800 rounded-lg p-6 text-white border border-gray-600">
                    <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
                      👀 Monitoring Basketball Games
                    </h2>
                    <p className="text-gray-300">
                      Watching for 3rd quarter opportunities with 10+ point edges
                    </p>
                  </div>
                  
                  <EmptyState connectionStatus={connectionStatus} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Formula: (Current Total) ÷ 0.75 = Projected Final Total</p>
          <p className="mt-1">Only opportunities with 10+ point edges are shown</p>
        </div>

        {/* Stats Panel */}
        <StatsPanel />
      </div>
    </div>
  );
}