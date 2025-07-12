# 🏀 Basketball Bet Tracker

Automated basketball betting opportunity tracker that monitors live games and alerts you when profitable betting opportunities arise during the 3rd quarter with ~7 minutes remaining.

## 🎯 How It Works

1. **Monitors Live Games**: Tracks NBA, NCAA, WNBA, and EuroLeague games
2. **3rd Quarter Detection**: Identifies games in 3rd quarter with ~7 minutes left
3. **Calculation**: Uses your formula: `(Current Total Score) ÷ 0.75 = Projected Final Total`
4. **Edge Analysis**: Compares projected total vs FanDuel betting lines
5. **Alerts**: Sends Telegram notifications for opportunities with 10+ point edges

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+
- The Odds API key (free tier available)
- Telegram bot token

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and add your API keys:

```bash
cp .env.example .env
```

Edit `.env` and add:
- Your Odds API key
- Your Telegram chat ID (the bot token is already included)

```bash
# Get your chat ID by messaging the bot and visiting:
# https://api.telegram.org/bot7813559228:AAEJpW7SLwEc2wjPuuH-lztCEIsEqVfcdFc/getUpdates
```

### 3. Get API Keys

#### The Odds API
1. Visit [the-odds-api.com](https://the-odds-api.com/)
2. Sign up for free account (500 requests/month)
3. Copy your API key

#### Telegram Setup
1. Start a chat with `@diabolical_wealth_bot`
2. Send any message to the bot
3. Visit the getUpdates URL above to find your chat ID in the response
4. Add your chat ID to the `.env` file

### 4. Run the Application
```bash
npm run dev
```

- **Dashboard**: http://localhost:3000
- **API Server**: http://localhost:3001

## 📊 Features

### Real-time Dashboard
- Live opportunity tracking
- Confidence scoring
- Game analysis breakdown
- Visual betting recommendations

### Telegram Notifications
- Instant alerts for opportunities
- Detailed betting information
- Confidence percentages
- FanDuel line pricing

### Smart Analysis
- Scoring pace evaluation
- Edge calculation
- Historical pattern recognition
- Risk assessment

## 🎲 Betting Logic

**Your Formula**: `(Current Score) ÷ 0.75 = Projected Total`

**Opportunity Criteria**:
- Game must be in 3rd quarter
- ~7 minutes remaining (6:30-7:30 buffer)
- Projected total vs line edge ≥ 10 points
- FanDuel lines available

**Confidence Factors**:
- Edge size (larger = higher confidence)
- Scoring pace vs season average
- Team over/under trends
- Time remaining in quarter

## 🔧 Commands

```bash
npm run dev          # Start development servers
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # Check TypeScript
```

## 📈 Monitoring & API Optimization

**Smart API Usage**:
- Fetches today's schedule once at startup + daily at 8 AM (4-8 API calls)
- Only monitors games during basketball hours (6 PM - 1 AM EST)
- Caches live games for 30 seconds, scheduled games for 6 hours
- Only checks games that are near start time or currently live
- Estimated usage: 50-100 API calls per day (well within 500/month limit)

**System Stats**: Click "📊 Show Stats" in dashboard to monitor API usage and cache performance.

## ⚠️ Disclaimer

This tool is for educational and entertainment purposes. Gambling involves risk. Please bet responsibly.