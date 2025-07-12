export declare class TelegramService {
    private bot;
    private chatId;
    constructor(botToken: string, chatId: string);
    private setupBot;
    sendMessage(message: string): Promise<void>;
    sendFormattedAlert(gameInfo: string, currentScore: string, calculation: string, recommendation: string, confidence: number): Promise<void>;
    stop(): void;
}
//# sourceMappingURL=telegramService.d.ts.map