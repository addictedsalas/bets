import { Telegraf } from 'telegraf';

export class TelegramService {
  private bot: Telegraf;
  private chatId: string;

  constructor(botToken: string, chatId: string) {
    this.bot = new Telegraf(botToken);
    this.chatId = chatId;
    this.setupBot();
  }

  private setupBot(): void {
    this.bot.start((ctx) => {
      ctx.reply('🏀 Basketball Bet Tracker is now active!\nYou will receive notifications when betting opportunities are found.');
    });

    this.bot.command('status', (ctx) => {
      ctx.reply('✅ Bot is running and monitoring basketball games for betting opportunities.');
    });

    this.bot.command('help', (ctx) => {
      const helpMessage = `
🏀 Basketball Bet Tracker Commands:

/start - Activate notifications
/status - Check bot status
/help - Show this help message

The bot automatically monitors basketball games and alerts you when:
• Game is in 3rd quarter with ~7 minutes remaining
• Calculated total vs FanDuel line has 10+ point edge
• High confidence betting opportunities arise

Your formula: (Current Score Total) ÷ 0.75 = Projected Final Total
      `.trim();
      
      ctx.reply(helpMessage);
    });

    this.bot.launch();
    console.log('🤖 Telegram bot launched');
  }

  async sendMessage(message: string): Promise<void> {
    try {
      await this.bot.telegram.sendMessage(this.chatId, message);
    } catch (error) {
      console.error('Error sending Telegram message:', error);
      throw error;
    }
  }

  async sendFormattedAlert(
    gameInfo: string,
    currentScore: string,
    calculation: string,
    recommendation: string,
    confidence: number
  ): Promise<void> {
    const message = `
🚨 BETTING ALERT 🚨

🏀 ${gameInfo}
📊 ${currentScore}
🔢 ${calculation}

💰 ${recommendation}
📈 Confidence: ${confidence}%

🎯 Act quickly - this opportunity won't last!
    `.trim();

    await this.sendMessage(message);
  }

  stop(): void {
    this.bot.stop();
    console.log('🛑 Telegram bot stopped');
  }
}