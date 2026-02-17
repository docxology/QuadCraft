/**
 * breakout_game.js — 4D Breakout Game Controller
 *
 * Extends BaseGame for lifecycle, camera sync, input, and HUD management.
 * Integrates HUD, ScoreManager, and real-time ball physics with paddle control.
 *
 * Uses:
 *   - BaseGame: init, togglePause, reset, _syncCamera, _updateHUD, _setupBaseInput
 *   - HUD: set, gameOver, paused, playing, warning, livesString
 *   - ScoreManager: addScore, loseLife, reset, toJSON
 *   - verifyGeometricIdentities: startup integrity check
 *   - GridUtils: manhattan, euclidean, key, parseKey
 *   - Quadray: distance, distanceTo, toKey, cellType, cellVolume
 *
 * Controls:
 *   ←/→ or A/D  : Move paddle on B axis
 *   ↑/↓ or W/S  : Move paddle on C axis
 *   Q/E         : Move paddle on D axis
 *   N           : New game
 *   P           : Pause
 *   R           : Reset
 *
 * @module BreakoutGame
 */

class BreakoutGame extends BaseGame {
    constructor(canvas, hudElement) {
        const board = new BreakoutBoard();
        const renderer = new BreakoutRenderer(canvas, board);
        super(canvas, hudElement, board, renderer, {
            name: 'BreakoutGame',
            tickRate: 20,           // ~50fps physics
            zoomOpts: { min: 15, max: 80 },
            cameraMode: 'shift-drag',
        });

        // Score tracking via ScoreManager
        this.scoring = new ScoreManager({
            lives: 3,
            levelThreshold: 500,
            storageKey: 'breakout4D_highScore',
        });

        // Startup integrity check
        this._runGeometricVerification();
    }

    /** Run verifyGeometricIdentities() on startup and log results. */
    _runGeometricVerification() {
        if (typeof verifyGeometricIdentities !== 'function') return;
        const results = verifyGeometricIdentities();
        const passCount = results.checks.filter(c => c.passed).length;
        const totalCount = results.checks.length;
        if (results.allPassed) {
            console.log(`[BreakoutGame] Geometric verification: ${passCount}/${totalCount} checks passed`);
        } else {
            console.warn(`[BreakoutGame] Geometric verification: ${passCount}/${totalCount} checks passed`);
            results.checks.filter(c => !c.passed).forEach(c =>
                console.warn(`  ${c.name}: expected ${c.expected}, got ${JSON.stringify(c.actual)}`)
            );
        }
    }

    /**
     * Override BaseGame._setupGameInput() — bind game-specific keys.
     * Continuous paddle movement is handled in update() via isDown polling.
     */
    _setupGameInput() {
        this.input.bind(['n'], () => this.newGame());
    }

    /** Start a new game, preserving high score. */
    newGame() {
        this.board.reset();
        this.scoring.reset();
        console.log('[BreakoutGame] New game started');
    }

    /** Override BaseGame.reset() — also reset scoring. */
    reset() {
        this.scoring.reset();
        super.reset();
    }

    /**
     * Override BaseGame.update() — poll paddle movement + step physics.
     * Syncs board score/lives changes into ScoreManager.
     */
    update() {
        if (this.board.gameOver) return;

        // Poll continuous paddle movement
        const speed = 0.5;
        let db = 0, dc = 0, dd = 0;
        if (this.input.isDown('ArrowLeft') || this.input.isDown('a')) db = -speed;
        if (this.input.isDown('ArrowRight') || this.input.isDown('d')) db = speed;
        if (this.input.isDown('ArrowUp') || this.input.isDown('w')) dc = speed;
        if (this.input.isDown('ArrowDown') || this.input.isDown('s')) dc = -speed;
        if (this.input.isDown('q')) dd = -speed;
        if (this.input.isDown('e')) dd = speed;
        if (db || dc || dd) this.board.movePaddle(db, dc, dd);

        const prevScore = this.board.score;
        const prevLives = this.board.lives;
        const result = this.board.step();

        // Sync score changes into ScoreManager
        const scoreDelta = this.board.score - prevScore;
        if (scoreDelta > 0) {
            this.scoring.addScore(scoreDelta);
        }

        // Sync life loss into ScoreManager
        if (this.board.lives < prevLives) {
            this.scoring.loseLife();
        }

        // Sync level into ScoreManager on level clear
        if (result === 'level_clear') {
            this.scoring.nextLevel();
        }
    }

    /**
     * Override BaseGame._getHUDState() — rich status with lives, score, level.
     * @returns {{ text: string, color: string }}
     */
    _getHUDState() {
        const b = this.board;
        const meta = b.getMetadata();
        const hearts = typeof HUD !== 'undefined'
            ? HUD.livesString(b.lives)
            : '❤️'.repeat(b.lives);
        const hiLabel = this.scoring.highScore > 0
            ? ` | Hi: ${this.scoring.highScore}`
            : '';

        if (b.gameOver) {
            const msg = b.won ? 'LEVEL CLEAR!' : 'GAME OVER';
            return {
                text: `${msg} | Score: ${b.score}${hiLabel} | Press R to restart`,
                color: b.won ? '#4ade80' : '#f87171',
            };
        }

        return {
            text: `${hearts} | Score: ${b.score} | Level: ${b.level} | Bricks: ${meta.brickCount}${hiLabel}`,
            color: '#94a3b8',
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BreakoutGame };
}
