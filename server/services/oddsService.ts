import axios from 'axios';
import { GameCache, GameSchedule } from './gameCache';

export interface Game {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  scores?: {
    home_score: number;
    away_score: number;
    period: number;
    time_remaining?: string;
  };
  bookmakers: {
    key: string;
    title: string;
    markets: {
      key: string;
      outcomes: {
        name: string;
        price: number;
        point?: number;
      }[];
    }[];
  }[];
}

export interface BettingLine {
  bookmaker: string;
  total: number;
  over_price: number;
  under_price: number;
}

export class OddsService {
  private apiKey: string;
  private baseUrl = 'https://api.the-odds-api.com/v4';
  private gameCache: GameCache;
  private requestCount = 0;
  private basketballSports: string[] = [];

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.gameCache = new GameCache();
  }

  async getAllBasketballSports(): Promise<string[]> {
    if (this.basketballSports.length > 0) {
      return this.basketballSports;
    }

    try {
      console.log('🔍 Fetching ALL available basketball sports...');
      const response = await axios.get(`${this.baseUrl}/sports`, {
        params: {
          apiKey: this.apiKey,
          all: true // Get all sports, even out of season
        }
      });

      // This endpoint doesn't count against quota
      console.log('📊 Sports API call (quota-free)');

      // Filter for basketball sports only
      this.basketballSports = response.data
        .filter((sport: any) => sport.group === 'Basketball')
        .map((sport: any) => sport.key);

      console.log(`🏀 Found ${this.basketballSports.length} basketball leagues:`, this.basketballSports);
      return this.basketballSports;
    } catch (error) {
      console.error('Error fetching sports:', error);
      // Fallback to known basketball sports
      this.basketballSports = [
        'basketball_nba', 'basketball_ncaab', 'basketball_wnba', 
        'basketball_euroleague', 'basketball_nbl'
      ];
      return this.basketballSports;
    }
  }

  async initializeTodaysGames(): Promise<void> {
    if (!this.gameCache.shouldRefreshSchedule()) {
      console.log('📅 Using cached schedule');
      return;
    }

    try {
      // Get all basketball sports dynamically
      const sports = await this.getAllBasketballSports();
      console.log(`🔄 Fetching today's games from ${sports.length} basketball leagues...`);
      const allSchedules: GameSchedule[] = [];

      // Get today's date range (from start of today to end of today)
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      for (const sport of sports) {
        try {
          // Get upcoming games for today
          const oddsResponse = await axios.get(`${this.baseUrl}/sports/${sport}/odds`, {
            params: {
              apiKey: this.apiKey,
              regions: 'us',
              markets: 'totals',
              bookmakers: 'fanduel',
              oddsFormat: 'american',
              commenceTimeFrom: startOfToday.toISOString().slice(0, -5) + 'Z',
              commenceTimeTo: endOfToday.toISOString().slice(0, -5) + 'Z'
            }
          });

          this.requestCount++;
          console.log(`📊 API Request #${this.requestCount} - ${sport} odds`);

          // Try to get live scores - some leagues don't support this endpoint
          let scoresResponse = null;
          try {
            scoresResponse = await axios.get(`${this.baseUrl}/sports/${sport}/scores`, {
              params: {
                apiKey: this.apiKey
                // Remove daysFrom/daysTo as some leagues don't support it
              }
            });
            this.requestCount++;
            console.log(`📊 API Request #${this.requestCount} - ${sport} scores`);
          } catch (scoreError: any) {
            // Some leagues don't support scores endpoint
            if (scoreError.response?.status === 422) {
              console.log(`⚠️  ${sport} doesn't support live scores - using odds only`);
            } else {
              throw scoreError;
            }
          }

          // Process scheduled games - only include those with FanDuel lines
          const scheduledWithFanDuel = oddsResponse.data
            .filter((game: any) => game.bookmakers.some((book: any) => book.key === 'fanduel'))
            .map((game: any) => ({
              gameId: game.id,
              startTime: new Date(game.commence_time),
              teams: `${game.away_team} @ ${game.home_team}`,
              sport: sport.replace('basketball_', '').toUpperCase()
            }));

          // Process live games if scores are available
          let liveGames: any[] = [];
          if (scoresResponse) {
            liveGames = scoresResponse.data
              .filter((game: any) => !game.completed && game.scores) // Only live, non-completed games
              .map((game: any) => ({
                gameId: game.id,
                startTime: new Date(game.commence_time),
                teams: `${game.away_team} @ ${game.home_team}`,
                sport: sport.replace('basketball_', '').toUpperCase()
              }));
          }

          // Merge and deduplicate
          const allGames = [...scheduledWithFanDuel, ...liveGames];
          const uniqueGames = allGames.filter((game, index, self) => 
            index === self.findIndex(g => g.gameId === game.gameId)
          );

          allSchedules.push(...uniqueGames);
          console.log(`🏀 Found ${scheduledWithFanDuel.length} FanDuel scheduled + ${liveGames.length} live ${sport} games`);
        } catch (error: any) {
          if (error.response?.status === 422) {
            console.log(`⚠️  ${sport} not supported or no games available - skipping`);
          } else {
            console.error(`Error fetching ${sport} games:`, error.message);
          }
        }
      }

      this.gameCache.setTodaysSchedule(allSchedules);
      console.log(`📅 Initialized ${allSchedules.length} total games for today`);
    } catch (error) {
      console.error('Error initializing today\'s games:', error);
    }
  }

  async getActiveGames(): Promise<Game[]> {
    const schedule = this.gameCache.getTodaysSchedule();
    const activeGames: Game[] = [];

    // Check ALL scheduled games for today, prioritizing live games
    const now = new Date();
    const todaysGames = schedule.filter(scheduled => {
      const timeDiff = scheduled.startTime.getTime() - now.getTime();
      // Include games that started up to 4 hours ago or starting within next 2 hours
      return timeDiff <= 2 * 60 * 60 * 1000 && timeDiff >= -4 * 60 * 60 * 1000;
    });

    console.log(`🎯 Monitoring ${todaysGames.length} games from today's schedule`);

    for (const scheduled of todaysGames) {
      // Check if we need to update this game's data
      if (!this.gameCache.shouldUpdateGame(scheduled.gameId)) {
        const cached = this.gameCache.getGame(scheduled.gameId);
        if (cached?.game.scores && !cached.game.scores) {
          activeGames.push(cached.game);
        }
        continue;
      }

      try {
        // Get live score for this specific game
        const sport = `basketball_${scheduled.sport.toLowerCase()}`;
        
        // Try to get live scores for this sport
        let scoresResponse;
        try {
          scoresResponse = await axios.get(`${this.baseUrl}/sports/${sport}/scores`, {
            params: {
              apiKey: this.apiKey
              // Don't use daysFrom/daysTo as some leagues don't support it
            }
          });
          this.requestCount++;
          console.log(`📊 API Request #${this.requestCount} - Live scores for ${sport}`);
        } catch (scoreError: any) {
          if (scoreError.response?.status === 422) {
            console.log(`⚠️  ${sport} doesn't support live scores - skipping`);
            continue; // Skip this sport if it doesn't support scores
          }
          throw scoreError;
        }

        // Find this specific game in the response
        const gameData = scoresResponse.data.find((game: any) => game.id === scheduled.gameId);
        
        if (gameData && gameData.scores && !gameData.completed) {
          console.log(`🏀 LIVE GAME: ${gameData.away_team} @ ${gameData.home_team} - Q${gameData.scores.period} ${gameData.scores.time_remaining}`);
          
          // Get odds for this live game - ONLY proceed if FanDuel has lines
          const oddsResponse = await axios.get(`${this.baseUrl}/sports/${sport}/odds`, {
            params: {
              apiKey: this.apiKey,
              regions: 'us',
              markets: 'totals',
              bookmakers: 'fanduel',
              oddsFormat: 'american',
              eventIds: scheduled.gameId
            }
          });

          this.requestCount++;
          console.log(`📊 API Request #${this.requestCount} - FanDuel odds check for live game`);

          // Only include games that have FanDuel lines
          const gameOdds = oddsResponse.data[0];
          const hasFanDuelLines = gameOdds && gameOdds.bookmakers.some((book: any) => book.key === 'fanduel');

          if (hasFanDuelLines) {
            const game: Game = {
              ...gameData,
              bookmakers: gameOdds.bookmakers || []
            };

            this.gameCache.updateGame(scheduled.gameId, game);
            activeGames.push(game);
            
            console.log(`✅ FANDUEL GAME: ${game.away_team} @ ${game.home_team} - ${scheduled.sport}`);
            
            // Log 3rd quarter detection
            if (this.isThirdQuarterSevenMinutes(game)) {
              console.log(`🎯 3RD QUARTER TARGET: ${game.away_team} @ ${game.home_team} at Q${game.scores?.period} ${game.scores?.time_remaining}!`);
            }
          } else {
            console.log(`❌ No FanDuel lines: ${gameData.away_team} @ ${gameData.home_team}`);
          }
        }
      } catch (error: any) {
        if (error.response?.status === 422) {
          console.log(`⚠️  ${scheduled.sport} doesn't support live monitoring - skipping ${scheduled.teams}`);
        } else {
          console.error(`Error checking game ${scheduled.gameId}:`, error.message);
        }
      }
    }

    console.log(`🏀 Found ${activeGames.length} live games | ${activeGames.filter(g => this.isThirdQuarterSevenMinutes(g)).length} in 3rd Q target window`);
    return activeGames;
  }

  async getLiveBasketballGames(): Promise<Game[]> {
    return this.getActiveGames();
  }

  async getFanDuelLines(gameId: string): Promise<BettingLine[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/sports/basketball_nba/odds`, {
        params: {
          apiKey: this.apiKey,
          regions: 'us',
          markets: 'totals',
          bookmakers: 'fanduel',
          oddsFormat: 'american',
          eventIds: gameId
        }
      });

      const game = response.data[0];
      if (!game || !game.bookmakers.length) return [];

      const fanduel = game.bookmakers.find((book: any) => book.key === 'fanduel');
      if (!fanduel) return [];

      const totalsMarket = fanduel.markets.find((market: any) => market.key === 'totals');
      if (!totalsMarket) return [];

      const over = totalsMarket.outcomes.find((outcome: any) => outcome.name === 'Over');
      const under = totalsMarket.outcomes.find((outcome: any) => outcome.name === 'Under');

      if (!over || !under) return [];

      return [{
        bookmaker: 'FanDuel',
        total: over.point,
        over_price: over.price,
        under_price: under.price
      }];
    } catch (error) {
      console.error('Error fetching FanDuel lines:', error);
      return [];
    }
  }

  isThirdQuarterSevenMinutes(game: Game): boolean {
    if (!game.scores) return false;
    
    const { period, time_remaining } = game.scores;
    
    // Period 3 = 3rd quarter
    if (period !== 3) return false;
    
    if (!time_remaining) return false;
    
    // Parse time remaining (format: "MM:SS" or "M:SS")
    const timeMatch = time_remaining.match(/(\d+):(\d+)/);
    if (!timeMatch) return false;
    
    const minutes = parseInt(timeMatch[1]);
    const seconds = parseInt(timeMatch[2]);
    
    // Check if exactly 7 minutes remaining (6:30 - 7:30 range for buffer)
    const totalSeconds = minutes * 60 + seconds;
    const sevenMinutes = 7 * 60;
    
    return totalSeconds >= (sevenMinutes - 30) && totalSeconds <= (sevenMinutes + 30);
  }

  getRequestCount(): number {
    return this.requestCount;
  }

  getCacheStats() {
    return this.gameCache.getStats();
  }

  cleanupCache(): void {
    this.gameCache.cleanupOldGames();
  }

  async getUpcomingGames(): Promise<GameSchedule[]> {
    return this.gameCache.getTodaysSchedule();
  }
}