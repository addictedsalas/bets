"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const dotenv_1 = __importDefault(require("dotenv"));
const node_cron_1 = __importDefault(require("node-cron"));
const oddsService_1 = require("./services/oddsService");
const gameMonitor_1 = require("./services/gameMonitor");
const telegramService_1 = require("./services/telegramService");
const betAnalyzer_1 = require("./services/betAnalyzer");
const betTracker_1 = require("./services/betTracker");
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
// Only set up Socket.io in development
let io = null;
if (process.env.NODE_ENV !== 'production') {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: ["http://localhost:5173", "http://localhost:3000"],
            methods: ["GET", "POST"]
        }
    });
}
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const PORT = process.env.PORT || 3000;
// Environment variable validation
const requiredEnvVars = {
    ODDS_API_KEY: process.env.ODDS_API_KEY,
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID
};
const missingEnvVars = Object.entries(requiredEnvVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key);
let oddsService = null;
let telegramService = null;
let gameMonitor = null;
let betAnalyzer = null;
let betTracker = null;
// Initialize services only if environment variables are available
if (missingEnvVars.length === 0) {
    try {
        oddsService = new oddsService_1.OddsService(process.env.ODDS_API_KEY);
        telegramService = new telegramService_1.TelegramService(process.env.TELEGRAM_BOT_TOKEN, process.env.TELEGRAM_CHAT_ID);
        betAnalyzer = new betAnalyzer_1.BetAnalyzer();
        betTracker = new betTracker_1.BetTracker();
        gameMonitor = new gameMonitor_1.GameMonitor(oddsService, telegramService, betAnalyzer, io);
        console.log('✅ All services initialized successfully');
    }
    catch (error) {
        console.error('❌ Error initializing services:', error);
    }
}
else {
    console.warn('⚠️ Missing environment variables:', missingEnvVars.join(', '));
    console.warn('⚠️ Services will not be initialized. API endpoints will return mock data.');
}
// API Routes
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        servicesInitialized: missingEnvVars.length === 0,
        missingEnvVars: missingEnvVars
    });
});
app.get('/api/opportunities', async (req, res) => {
    try {
        if (!gameMonitor) {
            return res.json([]);
        }
        const opportunities = await gameMonitor.getCurrentOpportunities();
        res.json(opportunities);
    }
    catch (error) {
        console.error('Error in /api/opportunities:', error);
        res.status(500).json({ error: 'Failed to fetch opportunities' });
    }
});
app.get('/api/stats', (req, res) => {
    try {
        if (!oddsService) {
            return res.json({
                apiRequests: 0,
                cache: { size: 0, hits: 0, misses: 0 },
                uptime: process.uptime(),
                timestamp: new Date().toISOString(),
                servicesInitialized: false
            });
        }
        const stats = {
            apiRequests: oddsService.getRequestCount(),
            cache: oddsService.getCacheStats(),
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            servicesInitialized: true
        };
        res.json(stats);
    }
    catch (error) {
        console.error('Error in /api/stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});
app.get('/api/upcoming', async (req, res) => {
    try {
        if (!oddsService) {
            return res.json([]);
        }
        const upcomingGames = await oddsService.getUpcomingGames();
        res.json(upcomingGames);
    }
    catch (error) {
        console.error('Error in /api/upcoming:', error);
        res.status(500).json({ error: 'Failed to fetch upcoming games' });
    }
});
// Bet tracking endpoints
app.post('/api/bets', (req, res) => {
    try {
        if (!betTracker) {
            return res.status(503).json({ error: 'Bet tracking service not available' });
        }
        const bet = betTracker.addBet(req.body);
        res.json(bet);
    }
    catch (error) {
        console.error('Error in POST /api/bets:', error);
        res.status(500).json({ error: 'Failed to place bet' });
    }
});
app.get('/api/bets', (req, res) => {
    try {
        if (!betTracker) {
            return res.json([]);
        }
        const bets = betTracker.getBets();
        res.json(bets);
    }
    catch (error) {
        console.error('Error in GET /api/bets:', error);
        res.status(500).json({ error: 'Failed to fetch bets' });
    }
});
app.put('/api/bets/:id', (req, res) => {
    try {
        if (!betTracker) {
            return res.status(503).json({ error: 'Bet tracking service not available' });
        }
        const bet = betTracker.updateBet(req.params.id, req.body);
        if (!bet) {
            return res.status(404).json({ error: 'Bet not found' });
        }
        res.json(bet);
    }
    catch (error) {
        console.error('Error in PUT /api/bets/:id:', error);
        res.status(500).json({ error: 'Failed to update bet' });
    }
});
app.get('/api/bets/stats', (req, res) => {
    try {
        if (!betTracker) {
            return res.json({
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
        }
        const stats = betTracker.calculateStats();
        res.json(stats);
    }
    catch (error) {
        console.error('Error in /api/bets/stats:', error);
        res.status(500).json({ error: 'Failed to fetch betting stats' });
    }
});
// Socket.io connection (only in development)
if (io) {
    io.on('connection', (socket) => {
        console.log('Client connected');
        socket.on('disconnect', () => {
            console.log('Client disconnected');
        });
    });
}
// Initialize today's games on startup
if (oddsService && gameMonitor) {
    (async () => {
        try {
            console.log('🚀 Initializing basketball bet tracker...');
            await oddsService.initializeTodaysGames();
            console.log('✅ Initialization complete');
        }
        catch (error) {
            console.error('❌ Initialization failed:', error);
        }
    })();
    // Smart scheduling based on game activity
    node_cron_1.default.schedule('0 8 * * *', async () => {
        try {
            // Refresh today's schedule at 8 AM daily
            console.log('🔄 Daily schedule refresh...');
            await oddsService.initializeTodaysGames();
        }
        catch (error) {
            console.error('❌ Daily refresh failed:', error);
        }
    });
    node_cron_1.default.schedule('*/30 * * * * *', async () => {
        try {
            const now = new Date();
            const hour = now.getHours();
            // Run during extended basketball hours to catch international games (12 PM - 3 AM EST)
            if (hour >= 12 || hour <= 3) {
                await gameMonitor.checkGames();
            }
        }
        catch (error) {
            console.error('❌ Game monitoring failed:', error);
        }
    });
    // Cleanup cache every hour
    node_cron_1.default.schedule('0 * * * *', () => {
        try {
            oddsService.cleanupCache();
            console.log('🧹 Cache cleanup completed');
        }
        catch (error) {
            console.error('❌ Cache cleanup failed:', error);
        }
    });
}
else {
    console.log('⚠️ Skipping initialization and scheduling due to missing services');
}
server.listen(PORT, () => {
    console.log(`🏀 Basketball Bet Tracker running on port ${PORT}`);
    if (process.env.NODE_ENV === 'production') {
        console.log(`📊 Dashboard: https://genbetstracker2.vercel.app`);
    }
    else {
        console.log(`📊 Dashboard: http://localhost:5173`);
    }
});
//# sourceMappingURL=index.js.map