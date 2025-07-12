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
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.NODE_ENV === 'production'
            ? ["https://genbetstracker2.vercel.app"]
            : ["http://localhost:5173", "http://localhost:3000"],
        methods: ["GET", "POST"]
    }
});
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const PORT = process.env.PORT || 3000;
// Services
const oddsService = new oddsService_1.OddsService(process.env.ODDS_API_KEY);
const telegramService = new telegramService_1.TelegramService(process.env.TELEGRAM_BOT_TOKEN, process.env.TELEGRAM_CHAT_ID);
const betAnalyzer = new betAnalyzer_1.BetAnalyzer();
const betTracker = new betTracker_1.BetTracker();
const gameMonitor = new gameMonitor_1.GameMonitor(oddsService, telegramService, betAnalyzer, io);
// API Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.get('/api/opportunities', async (req, res) => {
    try {
        const opportunities = await gameMonitor.getCurrentOpportunities();
        res.json(opportunities);
    }
    catch (error) {
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
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});
app.get('/api/upcoming', async (req, res) => {
    try {
        const upcomingGames = await oddsService.getUpcomingGames();
        res.json(upcomingGames);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch upcoming games' });
    }
});
// Bet tracking endpoints
app.post('/api/bets', (req, res) => {
    try {
        const bet = betTracker.addBet(req.body);
        res.json(bet);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to place bet' });
    }
});
app.get('/api/bets', (req, res) => {
    try {
        const bets = betTracker.getBets();
        res.json(bets);
    }
    catch (error) {
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
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update bet' });
    }
});
app.get('/api/bets/stats', (req, res) => {
    try {
        const stats = betTracker.calculateStats();
        res.json(stats);
    }
    catch (error) {
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
node_cron_1.default.schedule('0 8 * * *', async () => {
    // Refresh today's schedule at 8 AM daily
    console.log('🔄 Daily schedule refresh...');
    await oddsService.initializeTodaysGames();
});
node_cron_1.default.schedule('*/30 * * * * *', async () => {
    const now = new Date();
    const hour = now.getHours();
    // Run during extended basketball hours to catch international games (12 PM - 3 AM EST)
    if (hour >= 12 || hour <= 3) {
        await gameMonitor.checkGames();
    }
});
// Cleanup cache every hour
node_cron_1.default.schedule('0 * * * *', () => {
    oddsService.cleanupCache();
    console.log('🧹 Cache cleanup completed');
});
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