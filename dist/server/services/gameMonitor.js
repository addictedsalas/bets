"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameMonitor = void 0;
class GameMonitor {
    oddsService;
    telegramService;
    betAnalyzer;
    io;
    processedGames = new Set();
    currentOpportunities = [];
    constructor(oddsService, telegramService, betAnalyzer, io) {
        this.oddsService = oddsService;
        this.telegramService = telegramService;
        this.betAnalyzer = betAnalyzer;
        this.io = io;
    }
    async checkGames() {
        try {
            console.log('🔍 Checking for basketball games...');
            const liveGames = await this.oddsService.getLiveBasketballGames();
            const targetGames = liveGames.filter(game => this.oddsService.isThirdQuarterSevenMinutes(game));
            console.log(`📊 Found ${liveGames.length} live games, ${targetGames.length} in 3rd Q ~7min`);
            this.currentOpportunities = [];
            for (const game of targetGames) {
                await this.analyzeGame(game);
            }
            // Emit updated opportunities to connected clients
            this.io.emit('opportunities-update', this.currentOpportunities);
        }
        catch (error) {
            console.error('Error checking games:', error);
        }
    }
    async analyzeGame(game) {
        try {
            // Skip if we've already processed this game at this time point
            const gameTimeKey = `${game.id}-${game.scores?.period}-${game.scores?.time_remaining}`;
            if (this.processedGames.has(gameTimeKey)) {
                return;
            }
            console.log(`🏀 Analyzing: ${game.away_team} @ ${game.home_team}`);
            console.log(`📍 Q${game.scores?.period} ${game.scores?.time_remaining} - Score: ${game.scores?.away_score}-${game.scores?.home_score}`);
            // Get FanDuel lines
            const fanDuelLines = await this.oddsService.getFanDuelLines(game.id);
            if (!fanDuelLines.length) {
                console.log('❌ No FanDuel lines available');
                return;
            }
            // Analyze betting opportunity
            const opportunity = this.betAnalyzer.analyzeGame(game, fanDuelLines);
            if (!opportunity) {
                console.log('❌ No betting opportunity (edge < 10 points)');
                return;
            }
            console.log(`✅ OPPORTUNITY FOUND!`);
            console.log(`📊 Calculated Total: ${opportunity.calculatedTotal.toFixed(1)}`);
            opportunity.recommendations.forEach(rec => {
                console.log(`🎯 ${rec.action} ${rec.line} | Edge: +${rec.edge.toFixed(1)} | Confidence: ${rec.confidence}%`);
            });
            // Add to current opportunities
            this.currentOpportunities.push(opportunity);
            // Send Telegram notification
            await this.sendTelegramNotification(opportunity);
            // Mark as processed
            this.processedGames.add(gameTimeKey);
            // Clean up old processed games (older than 2 hours)
            this.cleanupProcessedGames();
        }
        catch (error) {
            console.error(`Error analyzing game ${game.id}:`, error);
        }
    }
    async sendTelegramNotification(opportunity) {
        try {
            const bestRecommendation = opportunity.recommendations.reduce((best, current) => current.confidence > best.confidence ? current : best);
            const message = `
🏀 BASKETBALL BETTING ALERT 🎯

📌 ${opportunity.awayTeam} @ ${opportunity.homeTeam}
⏰ Q${opportunity.period} ${opportunity.timeRemaining} remaining

📊 Current Score: ${opportunity.currentScore.away}-${opportunity.currentScore.home} (${opportunity.currentScore.total} total)
🔢 Calculated Total: ${opportunity.calculatedTotal.toFixed(1)}

💰 RECOMMENDATION:
${bestRecommendation.action} ${bestRecommendation.line}
Edge: +${bestRecommendation.edge.toFixed(1)} points
Confidence: ${bestRecommendation.confidence}%
Price: ${bestRecommendation.price > 0 ? '+' : ''}${bestRecommendation.price}

📈 Analysis:
${bestRecommendation.reasoning}
Scoring Pace: ${opportunity.metadata.scoringPace.toUpperCase()}

🎲 Place this bet on FanDuel!
      `.trim();
            await this.telegramService.sendMessage(message);
            console.log('📱 Telegram notification sent');
        }
        catch (error) {
            console.error('Error sending Telegram notification:', error);
        }
    }
    cleanupProcessedGames() {
        // Keep only the last 100 processed games to prevent memory issues
        if (this.processedGames.size > 100) {
            const gameArray = Array.from(this.processedGames);
            this.processedGames = new Set(gameArray.slice(-50));
        }
    }
    getCurrentOpportunities() {
        return this.currentOpportunities;
    }
}
exports.GameMonitor = GameMonitor;
//# sourceMappingURL=gameMonitor.js.map