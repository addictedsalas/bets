import { Server } from 'socket.io';
import { OddsService } from './oddsService';
import { TelegramService } from './telegramService';
import { BetAnalyzer, BetOpportunity } from './betAnalyzer';
export declare class GameMonitor {
    private oddsService;
    private telegramService;
    private betAnalyzer;
    private io;
    private processedGames;
    private currentOpportunities;
    constructor(oddsService: OddsService, telegramService: TelegramService, betAnalyzer: BetAnalyzer, io: Server);
    checkGames(): Promise<void>;
    private analyzeGame;
    private sendTelegramNotification;
    private cleanupProcessedGames;
    getCurrentOpportunities(): BetOpportunity[];
}
//# sourceMappingURL=gameMonitor.d.ts.map