/**
 * snake_game.js — 4D Snake Game Controller
 *
 * Extends BaseGame for lifecycle, camera sync, input, and HUD management.
 * Integrates HUD, ScoreManager, and tick-driven snake movement.
 *
 * Uses:
 *   - BaseGame: init, togglePause, reset, _syncCamera, _updateHUD, _setupBaseInput
 *   - HUD: set, gameOver, paused, playing, warning
 *   - ScoreManager: addScore, reset, toJSON
 *   - verifyGeometricIdentities: startup integrity check
 *   - GridUtils: key, parseKey, DIRECTIONS_8
 *   - Quadray: distance, distanceTo, toKey, normalized, clone
 *
 * Controls:
 *   ArrowUp/Down    : +A/-A
 *   ArrowRight/Left : +B/-B
 *   W/S             : +C/-C
 *   Q/E             : +D/-D
 *   N               : New game
 *   R               : Reset
 *   P               : Pause
 *
 * @module SnakeGame
 */

class SnakeGame extends BaseGame {
    constructor(canvas, hudElement) {
        const board = new SnakeBoard(6);
        const renderer = new SnakeRenderer(canvas, board);
        super(canvas, hudElement, board, renderer, {
            name: 'SnakeGame',
            tickRate: board.tickInterval,
            zoomOpts: { min: 15, max: 100 },
            cameraMode: 'shift-drag',
        });

        // Score tracking via ScoreManager
        this.scoring = new ScoreManager({
            lives: 1,
            levelThreshold: 50,
            storageKey: 'snake4D_highScore',
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
            console.log(`[SnakeGame] ✅ Geometric verification: ${passCount}/${totalCount} checks passed`);
        } else {
            console.warn(`[SnakeGame] ⚠️ Geometric verification: ${passCount}/${totalCount} checks passed`);
            results.checks.filter(c => !c.passed).forEach(c =>
                console.warn(`  ❌ ${c.name}: expected ${c.expected}, got ${JSON.stringify(c.actual)}`)
            );
        }
    }

    /**
     * Override BaseGame._setupGameInput() — bind direction keys and game controls.
     */
    _setupGameInput() {
        const D = SnakeBoard.DIRECTIONS;
        const b = this.board;

        const move = (dirIdx) => {
            if (!b.gameOver && !this.loop.paused) b.setDirection(D[dirIdx]);
        };

        this.input.bind(['ArrowUp'], () => move(0));
        this.input.bind(['ArrowDown'], () => move(1));
        this.input.bind(['ArrowRight'], () => move(2));
        this.input.bind(['ArrowLeft'], () => move(3));
        this.input.bind(['w', 'W'], () => move(4));
        this.input.bind(['s', 'S'], () => move(5));
        this.input.bind(['q', 'Q'], () => move(6));
        this.input.bind(['e', 'E'], () => move(7));

        this.input.bind(['n', 'N'], () => this.newGame());
    }

    /** Start a new game, preserving scores. */
    newGame() {
        this.board.init();
        this.loop.tickRate = this.board.tickInterval;
        console.log('[SnakeGame] New game started');
    }

    /** Override BaseGame.reset() — also reset scoring. */
    reset() {
        this.scoring.reset();
        super.reset();
        this.loop.tickRate = this.board.tickInterval;
    }

    /**
     * Override BaseGame.update() — advance snake one step per tick.
     */
    update() {
        if (!this.board.gameOver) {
            const result = this.board.step();

            // Sync loop tick rate if level changed speed
            if (this.loop.tickRate !== this.board.tickInterval) {
                this.loop.tickRate = this.board.tickInterval;
            }

            // Track score via ScoreManager when food is eaten
            if (result === 'eat') {
                this.scoring.addScore(10);
            }
        }
    }

    /**
     * Override BaseGame._getHUDState() — rich status with snake info.
     * @returns {{ text: string, color: string }}
     */
    _getHUDState() {
        const b = this.board;
        if (b.gameOver) {
            return {
                text: `💀 Game Over! Score: ${b.score} | Level: ${b.level} | Press R`,
                color: '#f87171',
            };
        }
        return {
            text: `🐍 Score: ${b.score} | Level: ${b.level} | Length: ${b.snake.length} | Dir: ${b.direction.name} | Grid: ${b.size}⁴ IVM`,
            color: '#94a3b8',
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SnakeGame };
}
