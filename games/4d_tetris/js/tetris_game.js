/**
 * tetris_game.js — 4D Tetris Game Controller
 *
 * Extends BaseGame for lifecycle, camera sync, input, and HUD management.
 * Integrates HUD, ScoreManager, and gravity-driven piece falling.
 *
 * Uses:
 *   - BaseGame: init, togglePause, reset, _syncCamera, _updateHUD, _setupBaseInput
 *   - HUD: set, gameOver, paused, playing, warning
 *   - ScoreManager: addScore, reset, toJSON
 *   - verifyGeometricIdentities: startup integrity check
 *   - GridUtils: manhattan, euclidean, shuffle
 *   - Quadray: distance, distanceTo, toKey, normalized, clone
 *
 * Controls:
 *   Left/Right or A/D : Move piece along B axis
 *   Up/Down or W/S    : Move piece along C axis
 *   Q/E               : Move piece along D axis
 *   Space              : Hard drop
 *   Z/X               : Rotate
 *   P                 : Pause
 *   R                 : Reset
 *
 * @module TetrisGame
 */

class TetrisGame extends BaseGame {
    constructor(canvas, hudElement) {
        const board = new TetrisBoard();
        const renderer = new TetrisRenderer(canvas, board);
        super(canvas, hudElement, board, renderer, {
            name: 'TetrisGame',
            tickRate: 16,           // ~60fps render
            zoomOpts: { min: 15, max: 100 },
            cameraMode: 'shift-drag',
        });

        // Score tracking via ScoreManager
        this.scoring = new ScoreManager({
            lives: 0,               // unlimited — arcade game
            levelThreshold: 500,
            storageKey: 'tetris4D_highScore',
        });

        // Gravity timing
        this.lastGravityTick = 0;

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
            console.log(`[TetrisGame] Geometric verification: ${passCount}/${totalCount} checks passed`);
        } else {
            console.warn(`[TetrisGame] Geometric verification: ${passCount}/${totalCount} checks passed`);
            results.checks.filter(c => !c.passed).forEach(c =>
                console.warn(`  ${c.name}: expected ${c.expected}, got ${JSON.stringify(c.actual)}`)
            );
        }
    }

    /**
     * Override BaseGame._setupGameInput() — bind game-specific keys.
     */
    _setupGameInput() {
        // B-axis movement (left/right)
        this.input.bind(['ArrowLeft', 'a'], () => !this.board.gameOver && this.board.movePiece(0, -1, 0, 0));
        this.input.bind(['ArrowRight', 'd'], () => !this.board.gameOver && this.board.movePiece(0, 1, 0, 0));

        // C-axis movement (up/down in 4D)
        this.input.bind(['ArrowUp', 'w'], () => !this.board.gameOver && this.board.movePiece(0, 0, 1, 0));
        this.input.bind(['ArrowDown', 's'], () => !this.board.gameOver && this.board.movePiece(0, 0, -1, 0));

        // D-axis movement
        this.input.bind(['q'], () => !this.board.gameOver && this.board.movePiece(0, 0, 0, -1));
        this.input.bind(['e'], () => !this.board.gameOver && this.board.movePiece(0, 0, 0, 1));

        // Hard drop
        this.input.bind([' '], () => {
            if (!this.board.gameOver) this.board.hardDrop();
        });

        // Rotate
        this.input.bind(['z', 'x'], () => !this.board.gameOver && this.board.rotatePiece());
    }

    /**
     * Override BaseGame.init() — spawn first piece and record gravity start.
     */
    init() {
        this.board.spawnPiece();
        this.lastGravityTick = performance.now();
        super.init();
    }

    /**
     * Override BaseGame.togglePause() — reset gravity tick on unpause.
     */
    togglePause() {
        const wasPaused = this.loop.paused;
        super.togglePause();
        if (wasPaused) this.lastGravityTick = performance.now();
    }

    /** Start a new game, preserving high score. */
    newGame() {
        this.board.reset();
        this.scoring.reset();
        this.board.spawnPiece();
        this.lastGravityTick = performance.now();
        console.log('[TetrisGame] New game started');
    }

    /** Override BaseGame.reset() — also reset scoring. */
    reset() {
        this.scoring.reset();
        this.loop.stop();
        this.board.reset();
        this.board.spawnPiece();
        this.lastGravityTick = performance.now();
        this.loop.start();
    }

    /**
     * Override BaseGame.update() — apply gravity on tick interval.
     */
    update() {
        if (this.board.gameOver) return;

        // Gravity tick — uses board.tickInterval which speeds up with level
        const now = performance.now();
        if (now - this.lastGravityTick >= this.board.tickInterval) {
            const result = this.board.gravity();
            this.lastGravityTick = now;

            // Sync scoring with board score
            if (this.board.score > this.scoring.score) {
                const diff = this.board.score - this.scoring.score;
                this.scoring.addScore(diff);
            }
        }
    }

    /**
     * Override BaseGame._getHUDState() — rich status with score, level, controls hint.
     * @returns {{ text: string, color: string }}
     */
    _getHUDState() {
        const b = this.board;
        const highScore = this.scoring.highScore;
        const hiLabel = highScore > 0 ? ` | Hi: ${highScore}` : '';

        if (b.gameOver) {
            return {
                text: `GAME OVER | Score: ${b.score} | Lines: ${b.linesCleared} | Level: ${b.level}${hiLabel} | Press R`,
                color: '#f87171',
            };
        }

        return {
            text: `Score: ${b.score} | Lines: ${b.linesCleared} | Level: ${b.level}${hiLabel} | Arrows: Move | Z: Rotate | Space: Drop`,
            color: '#94a3b8',
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TetrisGame };
}
