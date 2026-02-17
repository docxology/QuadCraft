/**
 * life_game.js — 4D Conway's Game of Life Controller
 *
 * Extends BaseGame for lifecycle, camera sync, input, and HUD management.
 * Integrates HUD, ScoreManager (tracking generation count), and
 * Quadray-native geometric verification.
 *
 * Uses:
 *   - BaseGame: init, togglePause, reset, _syncCamera, _updateHUD, _setupBaseInput
 *   - HUD: set, paused, playing, warning
 *   - ScoreManager: addScore (tracks generation count), reset, toJSON
 *   - verifyGeometricIdentities: startup integrity check
 *   - GridUtils: manhattan, euclidean, key, parseKey
 *   - Quadray: distance, distanceTo, toKey, cellType
 *
 * Controls:
 *   Space / P : Toggle run/pause
 *   R         : Reseed (reset)
 *   S         : Single step
 *   ArrowUp   : Speed up
 *   ArrowDown : Slow down
 *
 * @module LifeGame
 */

class LifeGame extends BaseGame {

    constructor(canvas, hudElement) {
        const board = new LifeBoard(8);
        const renderer = new LifeRenderer(canvas, board);
        super(canvas, hudElement, board, renderer, {
            name: 'LifeGame',
            tickRate: 500,               // Slow tick for cellular automata
            zoomOpts: { min: 10, max: 60 },
            cameraMode: 'shift-drag',
        });

        // Score tracking via ScoreManager — tracks generation count
        this.scoring = new ScoreManager({
            lives: 0,             // unlimited — automaton, no "death"
            levelThreshold: 100,  // level up every 100 generations
            storageKey: 'life4D_highGen',
        });

        // Speed control (ms between simulation steps)
        this.speed = 200;
        this.lastStep = 0;

        // Seed the board with initial random cells
        this.board.seedRandom(50);

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
            console.log(`[LifeGame] Geometric verification: ${passCount}/${totalCount} checks passed`);
        } else {
            console.warn(`[LifeGame] Geometric verification: ${passCount}/${totalCount} checks passed`);
            results.checks.filter(c => !c.passed).forEach(c =>
                console.warn(`  FAIL ${c.name}: expected ${c.expected}, got ${JSON.stringify(c.actual)}`)
            );
        }
    }

    /**
     * Override BaseGame._setupGameInput() — bind game-specific keys.
     */
    _setupGameInput() {
        this.input.bind([' '], () => this.togglePause());
        this.input.bind(['s'], () => this.singleStep());
        this.input.bind(['ArrowUp'], () => {
            this.speed = Math.max(50, this.speed - 50);
            console.log(`[LifeGame] Speed: ${this.speed}ms`);
        });
        this.input.bind(['ArrowDown'], () => {
            this.speed += 50;
            console.log(`[LifeGame] Speed: ${this.speed}ms`);
        });
    }

    /**
     * Override BaseGame.update() — step the simulation at the configured speed.
     * Uses performance.now() to throttle steps independently of the render loop.
     */
    update() {
        if (this.board.gameOver) return;
        const now = performance.now();
        if (now - this.lastStep > this.speed) {
            this.board.step();
            // Track generations in ScoreManager
            this.scoring.addScore(1);
            this.lastStep = now;
        }
    }

    /**
     * Single step the simulation (works even when paused).
     */
    singleStep() {
        this.board.step();
        this.scoring.addScore(1);
    }

    /**
     * Override BaseGame.reset() — reseed the board and reset scoring.
     */
    reset() {
        this.scoring.reset();
        this.lastStep = 0;
        super.reset();
    }

    /**
     * Override BaseGame._getHUDState() — rich status with generation info.
     * @returns {{ text: string, color: string }}
     */
    _getHUDState() {
        const meta = this.board.getMetadata();
        const speedLabel = `${this.speed}ms`;

        if (meta.livingCells === 0 && meta.generation > 0) {
            return {
                text: `Extinct at Gen ${meta.generation} | Peak: ${meta.peakPopulation} | Press R to reseed`,
                color: '#f87171',
            };
        }

        return {
            text: `Gen: ${meta.generation} | Cells: ${meta.livingCells} | Peak: ${meta.peakPopulation} | Speed: ${speedLabel}`,
            color: '#00ffb4',
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LifeGame };
}
