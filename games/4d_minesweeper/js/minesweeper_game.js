/**
 * minesweeper_game.js — 4D Minesweeper Game Controller
 *
 * Extends BaseGame for lifecycle, camera sync, input, and HUD management.
 * Integrates HUD, ScoreManager, and click-driven gameplay on Quadray IVM grid.
 *
 * Uses:
 *   - BaseGame: init, togglePause, reset, _syncCamera, _updateHUD, _setupBaseInput
 *   - HUD: set, gameOver, paused, playing, warning
 *   - ScoreManager: addScore, reset, toJSON
 *   - verifyGeometricIdentities: startup integrity check
 *   - angleBetweenQuadrays: geometric verification
 *   - GridUtils: manhattan, euclidean, shuffle, randomCoord
 *   - Quadray: distance, distanceTo, toKey, normalized, clone
 *
 * Controls:
 *   Left click  : Reveal cell
 *   Right click : Toggle flag
 *   N           : New game
 *   R           : Reset
 *   P           : Pause
 *
 * NOTE: Minesweeper is click-driven, not tick-driven.
 * Uses render-only loop (tickRate: 1000/30). Game logic stays in mouse handlers.
 *
 * @module MinesweeperGame
 */

class MinesweeperGame extends BaseGame {
    constructor(canvas, hudElement) {
        const board = new MinesweeperBoard(4, 0.12);
        const renderer = new MinesweeperRenderer(canvas, board);
        super(canvas, hudElement, board, renderer, {
            name: 'MinesweeperGame',
            tickRate: 1000 / 30,   // Render-only at 30fps; game is click-driven
            zoomOpts: { min: 15, max: 120 },
            cameraMode: 'shift-drag',
        });

        // Score tracking via ScoreManager
        this.scoring = new ScoreManager({
            lives: 0,    // unlimited — puzzle game
            levelThreshold: 100,  // level up every 100 points
            storageKey: 'minesweeper4D_highScore',
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
            console.log(`[MinesweeperGame] Geometric verification: ${passCount}/${totalCount} checks passed`);
        } else {
            console.warn(`[MinesweeperGame] Geometric verification: ${passCount}/${totalCount} checks passed`);
            results.checks.filter(c => !c.passed).forEach(c =>
                console.warn(`  FAIL ${c.name}: expected ${c.expected}, got ${JSON.stringify(c.actual)}`)
            );
        }
    }

    /**
     * Override BaseGame._setupGameInput() — bind game-specific keys.
     */
    _setupGameInput() {
        this.input.bind(['n'], () => this.newGame());
    }

    /**
     * Override BaseGame.init() — add mouse bindings.
     */
    init() {
        this._bindMouse();
        super.init();
    }

    /**
     * Override BaseGame.update() — no-op for click-driven game.
     * All game logic resides in the mouse click handlers.
     */
    update() {
        // No-op: Minesweeper is entirely click-driven.
    }

    /** Start a new game, preserving scores. */
    newGame() {
        this.board.reset();
        this.renderer.projectedCells = [];
        console.log('[MinesweeperGame] New game started');
    }

    /** Override BaseGame.reset() — also reset scoring. */
    reset() {
        this.scoring.reset();
        super.reset();
        this.renderer.projectedCells = [];
    }

    /** Bind mouse click and contextmenu handlers. */
    _bindMouse() {
        // Prevent context menu on right-click
        this.canvas.addEventListener('contextmenu', e => e.preventDefault());

        // Left click — reveal
        this.canvas.addEventListener('click', (e) => {
            if (this.board.gameOver || this.loop.paused) return;
            const rect = this.canvas.getBoundingClientRect();
            const sx = e.clientX - rect.left;
            const sy = e.clientY - rect.top;
            const cell = this.renderer.hitTest(sx, sy);
            if (cell) {
                const result = this.board.reveal(cell.a, cell.b, cell.c, cell.d);
                console.log(`[Reveal] (${cell.a},${cell.b},${cell.c},${cell.d}) -> ${result}`);

                if (result === 'mine') {
                    console.log(`[MinesweeperGame] Hit a mine! Score: ${this.board.score}`);
                } else if (this.board.won) {
                    this.scoring.addScore(this.board.score);
                    console.log(`[MinesweeperGame] WIN! Score: ${JSON.stringify(this.scoring.toJSON())}`);
                } else if (result === 'number' || result === 'flood') {
                    // Track reveal points via ScoreManager for running total
                    this.scoring.addScore(result === 'flood' ? 5 : 1);
                }
            }
        });

        // Right click — flag
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (this.board.gameOver || this.loop.paused) return;
            const rect = this.canvas.getBoundingClientRect();
            const sx = e.clientX - rect.left;
            const sy = e.clientY - rect.top;
            const cell = this.renderer.hitTest(sx, sy);
            if (cell) {
                this.board.toggleFlag(cell.a, cell.b, cell.c, cell.d);
            }
        });
    }

    /**
     * Override BaseGame._getHUDState() — rich status with quadray info.
     * @returns {{ text: string, color: string }}
     */
    _getHUDState() {
        const b = this.board;
        const meta = b.getMetadata();
        const scoreLabel = ` | Score: ${this.scoring.score} | Hi: ${this.scoring.highScore}`;

        if (b.gameOver) {
            if (b.won) {
                return {
                    text: `YOU WIN! All safe cells revealed!${scoreLabel} | Press N`,
                    color: '#4ade80',
                };
            }
            return {
                text: `GAME OVER! Hit a mine.${scoreLabel} | Press N`,
                color: '#f87171',
            };
        }

        if (b.firstClick) {
            return {
                text: `Click any cell to begin | Mines: ${meta.totalMines} | Grid: ${b.size}^4 IVM`,
                color: '#94a3b8',
            };
        }

        return {
            text: `Mines: ${meta.totalMines} | Flags: ${meta.flaggedCount} | ` +
                `Revealed: ${meta.revealedCount}/${meta.totalSafe}${scoreLabel}`,
            color: '#94a3b8',
        };
    }
}

// Dual export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MinesweeperGame };
}
