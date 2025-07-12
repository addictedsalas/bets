import { useEffect, useState } from 'react';

interface UpcomingGame {
  gameId: string;
  startTime: string;
  teams: string;
  sport: string;
}

interface GameSectionProps {
  games: UpcomingGame[];
  title: string;
  icon: string;
  emptyMessage: string;
  isLive?: boolean;
}

function GameSection({ games, title, icon, emptyMessage, isLive = false }: GameSectionProps) {
  const getSportColor = (sport: string) => {
    const colors: { [key: string]: string } = {
      'NBA': 'text-red-400',
      'NCAAB': 'text-blue-400', 
      'WNBA': 'text-purple-400',
      'EUROLEAGUE': 'text-yellow-400',
      'NBL': 'text-green-400',
    };
    return colors[sport] || 'text-gray-400';
  };

  const formatTime = (timeString: string) => {
    const time = new Date(timeString);
    const now = new Date();
    const diffMs = time.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (isLive || diffMs < 0) {
      return 'LIVE';
    } else if (diffHours === 0 && diffMinutes < 60) {
      return `${diffMinutes}m`;
    } else if (diffHours < 24) {
      return `${diffHours}h ${diffMinutes}m`;
    } else {
      return time.toLocaleDateString();
    }
  };

  return (
    <div className="mb-6">
      <h4 className="text-md font-semibold text-white mb-3 flex items-center gap-2">
        <span>{icon}</span>
        {title} ({games.length})
      </h4>
      
      {games.length === 0 ? (
        <div className="text-gray-400 text-center py-3 text-sm bg-gray-700 rounded-lg">
          {emptyMessage}
        </div>
      ) : (
        <div className="space-y-2">
          {games.map((game) => (
            <div 
              key={game.gameId} 
              className={`bg-gray-700 rounded-lg p-3 hover:bg-gray-600 transition-colors ${
                isLive ? 'border-l-4 border-green-400' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium text-sm truncate">
                    {game.teams}
                  </div>
                  <div className={`text-xs ${getSportColor(game.sport)} font-semibold`}>
                    {game.sport}
                  </div>
                </div>
                
                <div className="text-right ml-3">
                  <div className={`font-semibold text-sm ${
                    isLive ? 'text-green-400 animate-pulse' : 'text-white'
                  }`}>
                    {formatTime(game.startTime)}
                  </div>
                  {!isLive && (
                    <div className="text-gray-400 text-xs">
                      {new Date(game.startTime).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function GamesPanel() {
  const [allGames, setAllGames] = useState<UpcomingGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGames();
    const interval = setInterval(fetchGames, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchGames = async () => {
    try {
      const response = await fetch('/api/upcoming');
      const data = await response.json();
      setAllGames(data);
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">🏀 Basketball Games</h3>
        <div className="text-gray-400 text-center py-4">Loading games...</div>
      </div>
    );
  }

  const now = new Date();
  
  // Separate live and upcoming games
  const liveGames = allGames
    .filter(game => {
      const gameTime = new Date(game.startTime);
      const timeDiff = now.getTime() - gameTime.getTime();
      // Consider game live if it started within the last 3 hours
      return timeDiff > 0 && timeDiff < 3 * 60 * 60 * 1000;
    })
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  const upcomingGames = allGames
    .filter(game => new Date(game.startTime) > now)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 8); // Show next 8 games

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-6 border-b border-gray-600 pb-2">
        🏀 Basketball Games Today
      </h3>
      
      <div className="max-h-96 overflow-y-auto space-y-1">
        <GameSection 
          games={liveGames}
          title="Live Games"
          icon="🔴"
          emptyMessage="No live games right now"
          isLive={true}
        />
        
        <GameSection 
          games={upcomingGames}
          title="Upcoming Games"
          icon="📅"
          emptyMessage="No upcoming games today"
        />
      </div>
      
      <div className="mt-4 pt-3 border-t border-gray-600 text-xs text-gray-500 text-center">
        🎯 Monitoring for 3rd quarter opportunities (Q3 @ 7min)
      </div>
    </div>
  );
}