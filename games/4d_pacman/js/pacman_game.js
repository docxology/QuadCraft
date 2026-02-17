/**
 * pacman_game.js — 4D Pac-Man Game Controller
 *
 * Extends BaseGame for lifecycle, camera sync, input, and HUD management.
 * Integrates HUD, ScoreManager, and ghost AI with Quadray-native evaluation.
 *
 * Uses:
 *   - BaseGame: init, togglePause, reset, _syncCamera, _updateHUD, _setupBaseInput
 *   - HUD: set, gameOver, paused, playing, warning
 *   - ScoreManager: addScore, loseLife, reset, toJSON
 *   - verifyGeometricIdentities: startup integrity check
 *   - GridUtils: manhattan, euclidean, shuffle, randomCoord
 *   - Quadray: distance, distanceTo, toKey, normalized, clone
 *
 * Controls:
 *   Arrow/WASD  : Move along A/B axes
 *   Q/E         : Move along C axis
 *   Z/X         : Move along D axis
 *   N           : New game
 *   P           : Pause
 *   R           : Reset
 *
 * @module PacmanGame
 */

class PacmanGame extends BaseGame {
    constructor(canvas, hudElement) {
        const board = new PacManBoard();
        const renderer = new PacManRenderer(canvas, board);
        super(canvas, hudElement, board, renderer, {
            name: 'PacmanGame',
            tickRate: 150,   // Slow tick for grid movement
            zoomOpts: { min: 20, max: 100 },
            cameraMode: 'shift-drag',
        });

        // Score tracking via ScoreManager
        this.scoring = new ScoreManager({
            lives: 3,
            levelThreshold: 500,
            storageKey: 'pacman4D_highScore',
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
            console.log(`[PacmanGame] Geometric verification: ${passCount}/${totalCount} checks passed`);
        } else {
            console.warn(`[PacmanGame] Geometric verification: ${passCount}/${totalCount} checks passed`);
            results.checks.filter(c => !c.passed).forEach(c =>
                console.warn(`  ${c.name}: expected ${c.expected}, got ${JSON.stringify(c.actual)}`)
            );
        }
    }

    /**
     * Override BaseGame._setupGameInput() — bind game-specific keys.
     */
    _setupGameInput() {
        const DIRS = PacManBoard.DIRECTIONS;
        const b = this.board;

        // Movement along 8 IVM axis directions
        this.input.bind(['ArrowUp', 'w'], () => !b.gameOver && b.setDirection(DIRS[0]));    // +A
        this.input.bind(['ArrowDown', 's'], () => !b.gameOver && b.setDirection(DIRS[1]));   // -A
        this.input.bind(['ArrowRight', 'd'], () => !b.gameOver && b.setDirection(DIRS[2]));  // +B
        this.input.bind(['ArrowLeft', 'a'], () => !b.gameOver && b.setDirection(DIRS[3]));   // -B
        this.input.bind(['e'], () => !b.gameOver && b.setDirection(DIRS[4]));                 // +C
        this.input.bind(['q'], () => !b.gameOver && b.setDirection(DIRS[5]));                 // -C
        this.input.bind(['x'], () => !b.gameOver && b.setDirection(DIRS[6]));                 // +D
        this.input.bind(['z'], () => !b.gameOver && b.setDirection(DIRS[7]));                 // -D

        // New game
        this.input.bind(['n'], () => this.newGame());
    }

    /** Start a new game, preserving high score. */
    newGame() {
        this.board.reset();
        this.scoring.reset();
        console.log('[PacmanGame] New game started');
    }

    /** Override BaseGame.reset() — also reset scoring. */
    reset() {
        this.scoring.reset();
        super.reset();
    }

    /**
     * Override BaseGame.update() — step the board and sync ScoreManager.
     */
    update() {
        if (this.board.gameOver) return;

        const prevScore = this.board.score;
        const prevLives = this.board.lives;
        const result = this.board.step();

        // Sync score changes to ScoreManager
        const scoreDelta = this.board.score - prevScore;
        if (scoreDelta > 0) {
            const { leveled } = this.scoring.addScore(scoreDelta);
            if (leveled) {
                console.log(`[PacmanGame] Level up! Now level ${this.scoring.level}`);
            }
        }

        // Sync life loss to ScoreManager
        if (this.board.lives < prevLives) {
            this.scoring.loseLife();
        }

        if (result === 'win') {
            console.log(`[PacmanGame] YOU WIN! Score: ${this.scoring.score} | ${JSON.stringify(this.scoring.toJSON())}`);
        } else if (result === 'dead') {
            console.log(`[PacmanGame] GAME OVER! Score: ${this.scoring.score} | ${JSON.stringify(this.scoring.toJSON())}`);
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
            if (b.won) {
                return {
                    text: `YOU WIN! Score: ${b.score} | All pellets cleared!${highLabel} | Press N`,
                    color: '#4ade80',
                };
            }
            return {
                text: `GAME OVER -- Score: ${b.score}${highLabel} | Press N to restart`,
                color: '#f87171',
            };
        }

        let livesStr = HUD.livesString(b.lives, '*');
        const power = b.powerTimer > 0 ? ` | POWER: ${b.powerTimer}` : '';
        const levelLabel = ` | Lv: ${this.scoring.level}`;

        return {
            text: `${livesStr} | Score: ${b.score}${levelLabel} | Pellets: ${meta.pelletsRemaining}${power}${highLabel}`,
            color: b.powerTimer > 0 ? '#60a5fa' : '#94a3b8',
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PacmanGame };
}
