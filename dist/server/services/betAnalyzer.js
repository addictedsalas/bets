"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BetAnalyzer = void 0;
class BetAnalyzer {
    calculateProjectedTotal(homeScore, awayScore) {
        const currentTotal = homeScore + awayScore;
        // Your formula: divide by 0.75 to project final total
        return currentTotal / 0.75;
    }
    analyzeGame(game, fanDuelLines) {
        if (!game.scores || !fanDuelLines.length)
            return null;
        const { home_score, away_score, period, time_remaining } = game.scores;
        const currentTotal = home_score + away_score;
        const calculatedTotal = this.calculateProjectedTotal(home_score, away_score);
        const recommendations = [];
        // Analyze each FanDuel line
        fanDuelLines.forEach(line => {
            const edge = calculatedTotal - line.total;
            // Only recommend if edge is 10+ points as per your requirement
            if (Math.abs(edge) >= 10) {
                if (edge > 0) {
                    // Calculated total is higher, bet OVER
                    recommendations.push({
                        action: 'OVER',
                        line: line.total,
                        edge: edge,
                        price: line.over_price,
                        confidence: this.calculateConfidence(edge, game, 'over'),
                        reasoning: `Calculated total: ${calculatedTotal.toFixed(1)} vs Line: ${line.total} (+${edge.toFixed(1)} edge)`
                    });
                }
                else {
                    // Calculated total is lower, bet UNDER
                    recommendations.push({
                        action: 'UNDER',
                        line: line.total,
                        edge: Math.abs(edge),
                        price: line.under_price,
                        confidence: this.calculateConfidence(Math.abs(edge), game, 'under'),
                        reasoning: `Calculated total: ${calculatedTotal.toFixed(1)} vs Line: ${line.total} (${edge.toFixed(1)} edge)`
                    });
                }
            }
        });
        if (recommendations.length === 0)
            return null;
        // Calculate overall confidence
        const avgConfidence = recommendations.reduce((sum, rec) => sum + rec.confidence, 0) / recommendations.length;
        return {
            gameId: game.id,
            homeTeam: game.home_team,
            awayTeam: game.away_team,
            currentScore: {
                home: home_score,
                away: away_score,
                total: currentTotal
            },
            calculatedTotal,
            timeRemaining: time_remaining || '',
            period,
            fanDuelLines,
            recommendations,
            confidence: avgConfidence,
            metadata: {
                scoringPace: this.calculateScoringPace(currentTotal, period, time_remaining),
                edge: Math.max(...recommendations.map(r => r.edge)),
                timestamp: new Date().toISOString()
            }
        };
    }
    calculateConfidence(edge, game, betType) {
        let confidence = 60; // Base confidence for 10+ edge
        // Increase confidence based on edge size
        if (edge >= 15)
            confidence += 15;
        else if (edge >= 12)
            confidence += 10;
        else if (edge >= 10)
            confidence += 5;
        // Scoring pace factor
        const pace = this.calculateScoringPace(game.scores.home_score + game.scores.away_score, game.scores.period, game.scores.time_remaining);
        if (betType === 'over' && pace === 'high')
            confidence += 10;
        if (betType === 'under' && pace === 'low')
            confidence += 10;
        if (pace === 'average')
            confidence += 5;
        // Time remaining factor - more confidence with more time left
        const timeRemaining = this.parseTimeRemaining(game.scores.time_remaining);
        if (timeRemaining > 6.5 * 60)
            confidence += 5; // More than 6:30 left
        return Math.min(confidence, 95); // Cap at 95%
    }
    calculateScoringPace(currentTotal, period, timeRemaining) {
        if (!timeRemaining)
            return 'average';
        // Calculate how much game time has elapsed
        const timeRemainingSeconds = this.parseTimeRemaining(timeRemaining);
        const quarterLength = 12 * 60; // 12 minutes per quarter
        const totalGameTime = 4 * quarterLength; // 48 minutes total
        // Time elapsed = completed quarters + time elapsed in current quarter
        const timeElapsed = ((period - 1) * quarterLength) + (quarterLength - timeRemainingSeconds);
        // Calculate points per minute pace
        const currentPace = currentTotal / (timeElapsed / 60);
        // NBA average is roughly 2.2 points per minute (105-110 total points)
        if (currentPace > 2.4)
            return 'high';
        if (currentPace < 2.0)
            return 'low';
        return 'average';
    }
    parseTimeRemaining(timeRemaining) {
        if (!timeRemaining)
            return 0;
        const timeMatch = timeRemaining.match(/(\d+):(\d+)/);
        if (!timeMatch)
            return 0;
        const minutes = parseInt(timeMatch[1]);
        const seconds = parseInt(timeMatch[2]);
        return minutes * 60 + seconds;
    }
}
exports.BetAnalyzer = BetAnalyzer;
//# sourceMappingURL=betAnalyzer.js.map