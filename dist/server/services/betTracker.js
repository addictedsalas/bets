"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.BetTracker = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class BetTracker {
    betsFile;
    bets = [];
    isReadOnly;
    constructor() {
        this.betsFile = path.join(process.cwd(), 'data', 'bets.json');
        this.isReadOnly = process.env.NODE_ENV === 'production';
        if (!this.isReadOnly) {
            this.ensureDataDirectory();
            this.loadBets();
        }
        else {
            console.log('📝 BetTracker running in read-only mode (production environment)');
        }
    }
    ensureDataDirectory() {
        try {
            const dataDir = path.dirname(this.betsFile);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
        }
        catch (error) {
            console.warn('⚠️ Could not create data directory:', error);
        }
    }
    loadBets() {
        try {
            if (fs.existsSync(this.betsFile)) {
                const data = fs.readFileSync(this.betsFile, 'utf8');
                this.bets = JSON.parse(data);
            }
        }
        catch (error) {
            console.error('Error loading bets:', error);
            this.bets = [];
        }
    }
    saveBets() {
        if (this.isReadOnly) {
            console.warn('⚠️ Cannot save bets in read-only mode');
            return;
        }
        try {
            fs.writeFileSync(this.betsFile, JSON.stringify(this.bets, null, 2));
        }
        catch (error) {
            console.error('Error saving bets:', error);
        }
    }
    addBet(betData) {
        const bet = {
            ...betData,
            id: this.generateId(),
            placedAt: new Date().toISOString(),
            status: 'pending'
        };
        this.bets.push(bet);
        this.saveBets();
        console.log(`📝 Bet placed: ${bet.homeTeam} vs ${bet.awayTeam} - ${bet.betType} ${bet.currentTotal} for $${bet.betAmount}`);
        return bet;
    }
    updateBet(betId, updates) {
        const betIndex = this.bets.findIndex(bet => bet.id === betId);
        if (betIndex === -1)
            return null;
        this.bets[betIndex] = { ...this.bets[betIndex], ...updates };
        this.saveBets();
        console.log(`📊 Bet updated: ${this.bets[betIndex].homeTeam} vs ${this.bets[betIndex].awayTeam} - Status: ${this.bets[betIndex].status}`);
        return this.bets[betIndex];
    }
    getBets() {
        return [...this.bets];
    }
    getBetsByGameId(gameId) {
        return this.bets.filter(bet => bet.gameId === gameId);
    }
    calculateStats() {
        const totalBets = this.bets.length;
        const settledBets = this.bets.filter(bet => bet.status === 'won' || bet.status === 'lost');
        const winCount = this.bets.filter(bet => bet.status === 'won').length;
        const lossCount = this.bets.filter(bet => bet.status === 'lost').length;
        const pendingCount = this.bets.filter(bet => bet.status === 'pending').length;
        const totalWagers = this.bets.reduce((sum, bet) => sum + bet.betAmount, 0);
        const totalPayout = this.bets.reduce((sum, bet) => sum + (bet.potentialPayout || 0), 0);
        const netProfit = settledBets.reduce((sum, bet) => sum + (bet.netProfit || 0), 0);
        const winPercentage = settledBets.length > 0 ? (winCount / settledBets.length) * 100 : 0;
        const averageBetSize = totalBets > 0 ? totalWagers / totalBets : 0;
        const roi = totalWagers > 0 ? (netProfit / totalWagers) * 100 : 0;
        const profits = settledBets.map(bet => bet.netProfit || 0);
        const biggestWin = profits.length > 0 ? Math.max(...profits) : 0;
        const biggestLoss = profits.length > 0 ? Math.min(...profits) : 0;
        return {
            totalBets,
            totalWagers,
            totalPayout,
            netProfit,
            winCount,
            lossCount,
            pendingCount,
            winPercentage,
            averageBetSize,
            biggestWin,
            biggestLoss,
            roi
        };
    }
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    // Auto-settle bets based on completed games
    async autoSettleBets(completedGames) {
        const pendingBets = this.bets.filter(bet => bet.status === 'pending');
        let settledCount = 0;
        for (const game of completedGames) {
            const gameBets = pendingBets.filter(bet => bet.gameId === game.gameId);
            for (const bet of gameBets) {
                const won = this.determineBetOutcome(bet, game.finalScore.total);
                const updates = this.calculateBetResult(bet, won, game.finalScore);
                this.updateBet(bet.id, updates);
                settledCount++;
            }
        }
        if (settledCount > 0) {
            console.log(`🎯 Auto-settled ${settledCount} bets`);
        }
    }
    determineBetOutcome(bet, finalTotal) {
        if (bet.betType === 'over') {
            return finalTotal > bet.currentTotal;
        }
        else {
            return finalTotal < bet.currentTotal;
        }
    }
    calculateBetResult(bet, won, finalScore) {
        const calculatePayout = (amount, odds) => {
            if (odds > 0) {
                return amount * (odds / 100);
            }
            else {
                return amount / (Math.abs(odds) / 100);
            }
        };
        const updates = {
            status: won ? 'won' : 'lost',
            settledAt: new Date().toISOString(),
            actualTotal: finalScore.total
        };
        if (won) {
            const payout = calculatePayout(bet.betAmount, bet.odds);
            updates.potentialPayout = bet.betAmount + payout;
            updates.netProfit = payout;
        }
        else {
            updates.potentialPayout = 0;
            updates.netProfit = -bet.betAmount;
        }
        return updates;
    }
}
exports.BetTracker = BetTracker;
//# sourceMappingURL=betTracker.js.map