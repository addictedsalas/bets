import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import Dashboard from './components/Dashboard';
import BetLedger from './components/BetLedger';
import { BetOpportunity, PlacedBet, BetStats } from './types';

function App() {
  const [, setSocket] = useState<Socket | null>(null);
  const [opportunities, setOpportunities] = useState<BetOpportunity[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [currentView, setCurrentView] = useState<'dashboard' | 'ledger'>('dashboard');
  const [bets, setBets] = useState<PlacedBet[]>([]);
  const [betStats, setBetStats] = useState<BetStats>({
    totalBets: 0,
    totalWagers: 0,
    totalPayout: 0,
    netProfit: 0,
    winCount: 0,
    lossCount: 0,
    pendingCount: 0,
    winPercentage: 0,
    averageBetSize: 0,
    biggestWin: 0,
    biggestLoss: 0,
    roi: 0
  });

  useEffect(() => {
    // Only use Socket.io in development, not in production
    // Check for localhost to determine if we're in development
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isDevelopment) {
      const socketUrl = 'http://localhost:3000';
      const newSocket = io(socketUrl);
      setSocket(newSocket);

      newSocket.on('connect', () => {
        setConnectionStatus('connected');
        console.log('Connected to server');
      });

      newSocket.on('disconnect', () => {
        setConnectionStatus('disconnected');
        console.log('Disconnected from server');
      });

      newSocket.on('opportunities-update', (data: BetOpportunity[]) => {
        setOpportunities(data);
        console.log('Opportunities updated:', data);
      });

      return () => {
        newSocket.close();
      };
    } else {
      // In production, use polling instead of WebSocket
      setConnectionStatus('connected');
      
      // Set up polling for opportunities
      const pollOpportunities = () => {
        fetch('/api/opportunities')
          .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
          })
          .then(data => setOpportunities(data))
          .catch(err => console.error('Error polling opportunities:', err));
      };

      // Poll every 30 seconds
      const interval = setInterval(pollOpportunities, 30000);
      
      return () => clearInterval(interval);
    }
  }, []);

  useEffect(() => {
    // Fetch initial data
    Promise.all([
      fetch('/api/opportunities').then(res => res.ok ? res.json() : []),
      fetch('/api/bets').then(res => res.ok ? res.json() : []),
      fetch('/api/bets/stats').then(res => res.ok ? res.json() : {
        totalBets: 0, totalWagers: 0, totalPayout: 0, netProfit: 0,
        winCount: 0, lossCount: 0, pendingCount: 0, winPercentage: 0,
        averageBetSize: 0, biggestWin: 0, biggestLoss: 0, roi: 0
      })
    ]).then(([opportunitiesData, betsData, statsData]) => {
      setOpportunities(opportunitiesData);
      setBets(betsData);
      setBetStats(statsData);
    }).catch(err => console.error('Error fetching initial data:', err));
  }, []);

  const handlePlaceBet = async (betData: Omit<PlacedBet, 'id' | 'placedAt' | 'status'>) => {
    try {
      const response = await fetch('/api/bets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(betData)
      });
      
      if (response.ok) {
        const newBet = await response.json();
        setBets(prev => [newBet, ...prev]);
        
        // Refresh stats
        const statsResponse = await fetch('/api/bets/stats');
        const newStats = await statsResponse.json();
        setBetStats(newStats);
      }
    } catch (error) {
      console.error('Error placing bet:', error);
    }
  };

  const handleUpdateBet = async (betId: string, updates: Partial<PlacedBet>) => {
    try {
      const response = await fetch(`/api/bets/${betId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      if (response.ok) {
        const updatedBet = await response.json();
        setBets(prev => prev.map(bet => bet.id === betId ? updatedBet : bet));
        
        // Refresh stats
        const statsResponse = await fetch('/api/bets/stats');
        const newStats = await statsResponse.json();
        setBetStats(newStats);
      }
    } catch (error) {
      console.error('Error updating bet:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation */}
      <nav className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">🏀 Basketball Bet Tracker</h1>
          <div className="flex gap-4">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentView === 'dashboard'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              🎯 Opportunities
            </button>
            <button
              onClick={() => setCurrentView('ledger')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentView === 'ledger'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              📊 Bet Ledger
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="p-6">
        {currentView === 'dashboard' ? (
          <Dashboard 
            opportunities={opportunities}
            connectionStatus={connectionStatus}
            onPlaceBet={handlePlaceBet}
            placedBets={bets}
          />
        ) : (
          <BetLedger 
            bets={bets}
            stats={betStats}
            onUpdateBet={handleUpdateBet}
          />
        )}
      </div>
    </div>
  );
}

export default App;