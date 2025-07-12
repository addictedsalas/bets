import { useEffect, useState } from 'react';

interface Stats {
  apiRequests: number;
  cache: {
    totalGames: number;
    activeGames: number;
    scheduledGames: number;
    lastScheduleFetch: string | null;
  };
  uptime: number;
  timestamp: string;
}

export default function StatsPanel() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    if (showStats) {
      fetchStats();
      const interval = setInterval(fetchStats, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [showStats]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleTimeString();
  };

  if (!showStats) {
    return (
      <button
        onClick={() => setShowStats(true)}
        className="fixed bottom-4 right-4 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
      >
        📊 Show Stats
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 border border-gray-600 rounded-lg p-4 w-80 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold">System Stats</h3>
        <button
          onClick={() => setShowStats(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      {stats ? (
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div className="text-gray-400">API Requests:</div>
            <div className="text-white">{stats.apiRequests}</div>
            
            <div className="text-gray-400">Uptime:</div>
            <div className="text-white">{formatUptime(stats.uptime)}</div>
          </div>

          <div className="border-t border-gray-600 pt-2">
            <div className="text-gray-300 font-medium mb-1">Game Cache</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-gray-400">Scheduled:</div>
              <div className="text-white">{stats.cache.scheduledGames}</div>
              
              <div className="text-gray-400">Total:</div>
              <div className="text-white">{stats.cache.totalGames}</div>
              
              <div className="text-gray-400">Active:</div>
              <div className="text-green-400">{stats.cache.activeGames}</div>
              
              <div className="text-gray-400">Last Fetch:</div>
              <div className="text-white">{formatTime(stats.cache.lastScheduleFetch)}</div>
            </div>
          </div>

          <div className="text-xs text-gray-500 pt-2 border-t border-gray-600">
            Updated: {formatTime(stats.timestamp)}
          </div>
        </div>
      ) : (
        <div className="text-gray-400 text-center py-4">Loading...</div>
      )}
    </div>
  );
}