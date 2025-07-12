import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { OddsService } from './services/oddsService';
import { GameMonitor } from './services/gameMonitor';
import { TelegramService } from './services/telegramService';
import { BetAnalyzer } from './services/betAnalyzer';
import { BetTracker } from './services/betTracker';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ["https://genbetstracker2.vercel.app"] 
      : ["http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Services
const oddsService = new OddsService(process.env.ODDS_API_KEY!);
const telegramService = new TelegramService(
  process.env.TELEGRAM_BOT_TOKEN!,
  process.env.TELEGRAM_CHAT_ID!
);
const betAnalyzer = new BetAnalyzer();
const betTracker = new BetTracker();
const gameMonitor = new GameMonitor(oddsService, telegramService, betAnalyzer, io);

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/opportunities', async (req, res) => {
  try {
    const opportunities = await gameMonitor.getCurrentOpportunities();
    res.json(opportunities);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch opportunities' });
  }
});

app.get('/api/stats', (req, res) => {
  try {
    const stats = {
      apiRequests: oddsService.getRequestCount(),
      cache: oddsService.getCacheStats(),
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

app.get('/api/upcoming', async (req, res) => {
  try {
    const upcomingGames = await oddsService.getUpcomingGames();
    res.json(upcomingGames);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch upcoming games' });
  }
});

// Bet tracking endpoints
app.post('/api/bets', (req, res) => {
  try {
    const bet = betTracker.addBet(req.body);
    res.json(bet);
  } catch (error) {
    res.status(500).json({ error: 'Failed to place bet' });
  }
});

app.get('/api/bets', (req, res) => {
  try {
    const bets = betTracker.getBets();
    res.json(bets);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bets' });
  }
});

app.put('/api/bets/:id', (req, res) => {
  try {
    const bet = betTracker.updateBet(req.params.id, req.body);
    if (!bet) {
      return res.status(404).json({ error: 'Bet not found' });
    }
    res.json(bet);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update bet' });
  }
});

app.get('/api/bets/stats', (req, res) => {
  try {
    const stats = betTracker.calculateStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch betting stats' });
  }
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('Client connected');
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Initialize today's games on startup
(async () => {
  console.log('🚀 Initializing basketball bet tracker...');
  await oddsService.initializeTodaysGames();
  console.log('✅ Initialization complete');
})();

// Smart scheduling based on game activity
cron.schedule('0 8 * * *', async () => {
  // Refresh today's schedule at 8 AM daily
  console.log('🔄 Daily schedule refresh...');
  await oddsService.initializeTodaysGames();
});

cron.schedule('*/30 * * * * *', async () => {
  const now = new Date();
  const hour = now.getHours();
  
  // Run during extended basketball hours to catch international games (12 PM - 3 AM EST)
  if (hour >= 12 || hour <= 3) {
    await gameMonitor.checkGames();
  }
});

// Cleanup cache every hour
cron.schedule('0 * * * *', () => {
  oddsService.cleanupCache();
  console.log('🧹 Cache cleanup completed');
});

server.listen(PORT, () => {
  console.log(`🏀 Basketball Bet Tracker running on port ${PORT}`);
  if (process.env.NODE_ENV === 'production') {
    console.log(`📊 Dashboard: https://genbetstracker2.vercel.app`);
  } else {
    console.log(`📊 Dashboard: http://localhost:5173`);
  }
});