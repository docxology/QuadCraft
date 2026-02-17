/**
 * frogger_game.js — 4D Frogger Game Controller
 *
 * Extends BaseGame for lifecycle, camera sync, input, and HUD management.
 * Integrates HUD, ScoreManager, and Quadray-native board.
 *
 * Uses:
 *   - BaseGame: init, togglePause, reset, _syncCamera, _updateHUD, _setupBaseInput
 *   - HUD: set, gameOver, paused, playing, warning
 *   - ScoreManager: addScore, loseLife, reset, toJSON
 *   - verifyGeometricIdentities: startup integrity check
 *   - GridUtils: manhattan, euclidean, shuffle
 *   - Quadray: distance, distanceTo, toKey, normalized, clone
 *
 * Controls:
 *   Up/W       : Hop +A (forward)
 *   Down/S     : Hop -A (backward)
 *   Right/D    : Hop +B
 *   Left/A     : Hop -B
 *   E          : Hop +C
 *   Q          : Hop -C
 *   X          : Hop +D
 *   Z          : Hop -D
 *   P          : Pause
 *   R          : Reset
 *   N          : New Game
 *
 * @module FroggerGame
 */

class FroggerGame extends BaseGame {
    constructor(canvas, hudElement) {
        const board = new FroggerBoard();
        const renderer = new FroggerRenderer(canvas, board);
        super(canvas, hudElement, board, renderer, {
            name: 'FroggerGame',
            tickRate: 200,
            zoomOpts: { min: 15, max: 80 },
            cameraMode: 'shift-drag',
        });

        // Score tracking via ScoreManager
        this.scoring = new ScoreManager({
            lives: 3,
            levelThreshold: 500,
            storageKey: 'frogger4D_highScore',
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
            console.log(`[FroggerGame] Geometric verification: ${passCount}/${totalCount} checks passed`);
        } else {
            console.warn(`[FroggerGame] Geometric verification: ${passCount}/${totalCount} checks passed`);
            results.checks.filter(c => !c.passed).forEach(c =>
                console.warn(`  FAIL ${c.name}: expected ${c.expected}, got ${JSON.stringify(c.actual)}`)
            );
        }
    }

    /**
     * Override BaseGame._setupGameInput() — bind game-specific keys.
     * P and R are handled by BaseGame._setupBaseInput().
     */
    _setupGameInput() {
        const DIRS = FroggerBoard.DIRECTIONS;
        // Event-driven hop controls
        this.input.bind(['ArrowUp', 'w'], () => { if (!this.board.gameOver) this._handleHop(DIRS[0]); });
        this.input.bind(['ArrowDown', 's'], () => { if (!this.board.gameOver) this._handleHop(DIRS[1]); });
        this.input.bind(['ArrowRight', 'd'], () => { if (!this.board.gameOver) this._handleHop(DIRS[2]); });
        this.input.bind(['ArrowLeft', 'a'], () => { if (!this.board.gameOver) this._handleHop(DIRS[3]); });
        this.input.bind(['e'], () => { if (!this.board.gameOver) this._handleHop(DIRS[4]); });
        this.input.bind(['q'], () => { if (!this.board.gameOver) this._handleHop(DIRS[5]); });
        this.input.bind(['x'], () => { if (!this.board.gameOver) this._handleHop(DIRS[6]); });
        this.input.bind(['z'], () => { if (!this.board.gameOver) this._handleHop(DIRS[7]); });
        this.input.bind(['n'], () => this.newGame());
    }

    /**
     * Handle a hop and update scoring.
     * @param {Object} dir - Direction object { da, db, dc, dd, name }
     */
    _handleHop(dir) {
        const result = this.board.hop(dir);
        if (result === 'goal') {
            // Scored a goal — add score via ScoreManager
            this.scoring.addScore(100 + this.board.timeLeft);
            this.scoring.nextLevel();
            console.log(`[FroggerGame] Goal! Score: ${JSON.stringify(this.scoring.toJSON())}`);
        } else if (result === 'hop' && this.board.maxRow === this.board.frog.a) {
            // New furthest row
            this.scoring.addScore(10);
        }
    }

    /** Start a new game, preserving high score. */
    newGame() {
        this.board.reset();
        this.scoring.score = 0;
        this.scoring.level = 1;
        this.scoring.lives = this.scoring.initialLives;
        console.log('[FroggerGame] New game started');
    }

    /** Override BaseGame.reset() — also reset scoring. */
    reset() {
        this.scoring.reset();
        super.reset();
    }

    /**
     * Override BaseGame.update() — called every tick.
     * Steps the board (moves obstacles, checks collisions, timer).
     */
    update() {
        if (this.board.gameOver) return;
        const result = this.board.step();

        // Sync board lives/level to ScoreManager
        if (result === 'hit' || result === 'timeout') {
            this.scoring.loseLife();
            if (this.scoring.lives <= 0) {
                this.board.gameOver = true;
            }
            console.log(`[FroggerGame] ${result} — Lives: ${this.scoring.lives}`);
        }
    }

    /**
     * Override BaseGame._getHUDState() — rich status with quadray info.
     * @returns {{ text: string, color: string }}
     */
    _getHUDState() {
        const b = this.board;
        const meta = b.getMetadata();
        const highLabel = this.scoring.highScore > 0 ? ` | Hi: ${this.scoring.highScore}` : '';

        if (b.gameOver) {
            return {
                text: `GAME OVER -- Score: ${b.score} | Goals: ${b.goalsReached}${highLabel} | Press R`,
                color: '#f87171',
            };
        }

        const livesStr = HUD.livesString(b.lives, '*');
        const frogQ = new Quadray(meta.frog.a, meta.frog.b, meta.frog.c, meta.frog.d);
        const parity = Quadray.cellType(meta.frog.a, meta.frog.b, meta.frog.c, meta.frog.d);

        if (b.timeLeft < 30) {
            return {
                text: `${livesStr} | Score: ${b.score} | Lv${b.level} | T:${b.timeLeft} | ${parity}${highLabel}`,
                color: '#fb923c',
            };
        }

        return {
            text: `${livesStr} | Score: ${b.score} | Lv${b.level} | T:${b.timeLeft} | ${parity}${highLabel}`,
            color: '#94a3b8',
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FroggerGame };
}
