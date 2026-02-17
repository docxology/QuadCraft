/**
 * score_manager.js — Score, Level, and Lives Tracker
 *
 * Reusable mixin for game boards that tracks score, level,
 * lives, and high-score across sessions (via localStorage).
 *
 * Usage:
 *   // In a board constructor:
 *   this.scoring = new ScoreManager({ lives: 3, levelThreshold: 1000 });
 *   this.scoring.addScore(100);
 *   if (this.scoring.loseLife()) { this.gameOver = true; }
 *   this.scoring.reset();
 *
 * @module ScoreManager
 */

class ScoreManager {
    /**
     * @param {Object} opts
     * @param {number} [opts.lives=3] — Starting lives (0 = unlimited).
     * @param {number} [opts.level=1] — Starting level.
     * @param {number} [opts.levelThreshold=500] — Score needed per level-up.
     * @param {string} [opts.storageKey=null] — localStorage key for high score.
     */
    constructor(opts = {}) {
        this.initialLives = opts.lives ?? 3;
        this.levelThreshold = opts.levelThreshold ?? 500;
        this.storageKey = opts.storageKey || null;

        this.score = 0;
        this.level = opts.level ?? 1;
        this.lives = this.initialLives;
        this.linesCleared = 0;
        this.highScore = this._loadHighScore();
    }

    /**
     * Add points. Automatically checks for level-up.
     * @param {number} points
     * @returns {{ leveled: boolean }} — Whether a level-up occurred.
     */
    addScore(points) {
        this.score += points;
        const newLevel = Math.floor(this.score / this.levelThreshold) + 1;
        const leveled = newLevel > this.level;
        if (leveled) this.level = newLevel;
        this._saveHighScore();
        return { leveled };
    }

    /**
     * Manually advance to next level.
     */
    nextLevel() {
        this.level++;
    }

    /**
     * Lose a life.
     * @returns {boolean} — True if all lives are gone (game over).
     */
    loseLife() {
        if (this.initialLives === 0) return false; // Unlimited lives
        this.lives--;
        return this.lives <= 0;
    }

    /**
     * Add a life (e.g. bonus).
     */
    addLife() {
        this.lives++;
    }

    /**
     * Reset to initial state.
     */
    reset() {
        this.score = 0;
        this.level = 1;
        this.lives = this.initialLives;
        this.linesCleared = 0;
    }

    /**
     * Serializable state snapshot.
     * @returns {Object}
     */
    toJSON() {
        return {
            score: this.score,
            level: this.level,
            lives: this.lives,
            highScore: this.highScore,
            linesCleared: this.linesCleared,
        };
    }

    /** @private */
    _loadHighScore() {
        if (!this.storageKey) return 0;
        try {
            return parseInt(localStorage.getItem(this.storageKey) || '0', 10);
        } catch { return 0; }
    }

    /** @private */
    _saveHighScore() {
        if (!this.storageKey) return;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            try { localStorage.setItem(this.storageKey, String(this.highScore)); }
            catch { /* localStorage unavailable */ }
        }
    }
}

// Dual export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ScoreManager };
}
