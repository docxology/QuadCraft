/**
 * simant_game.js — 4D SimAnt Game Controller
 *
 * Extends BaseGame for lifecycle, camera sync, input, and HUD management.
 * Integrates HUD, ScoreManager, and AI colony with Quadray-native evaluation.
 *
 * Uses:
 *   - BaseGame: init, togglePause, reset, _syncCamera, _updateHUD, _setupBaseInput
 *   - HUD: set, gameOver, paused, playing, warning
 *   - ScoreManager: addScore, reset, toJSON
 *   - verifyGeometricIdentities: startup integrity check
 *   - GridUtils: manhattan, euclidean, shuffle, randomCoord
 *   - Quadray: distance, distanceTo, toKey, normalized, clone
 *
 * Controls:
 *   P           : Pause
 *   R           : Reset
 *   W           : Buy worker
 *   S           : Buy soldier
 *   T           : Toggle pheromone viz
 *   Shift+drag  : Rotate camera
 *
 * @module SimAntGame
 */

class SimAntGame extends BaseGame {
    constructor(canvas, hudElement) {
        const board = new SimAntBoard(12);
        const renderer = new SimAntRenderer(canvas, board);
        super(canvas, hudElement, board, renderer, {
            name: 'SimAntGame',
            tickRate: 150,          // Simulation — 150ms per tick (~6.7 tps)
            zoomOpts: { min: 10, max: 60 },
            cameraMode: 'shift-drag',
        });

        // Score tracking via ScoreManager
        this.scoring = new ScoreManager({
            lives: 0,    // unlimited — simulation game
            levelThreshold: 100,  // level up every 100 food collected
            storageKey: 'simant4D_highScore',
        });

        // Track food collected for scoring
        this._lastFoodStored = this.board.foodStored[0];

        // Startup integrity check
        this._runGeometricVerification();

        console.log('[SimAntGame] Professional Edition Initialized');
        console.log('Grid Size:', this.board.size, 'Volume:', this.board.volume);
    }

    /** Run verifyGeometricIdentities() on startup and log results. */
    _runGeometricVerification() {
        if (typeof verifyGeometricIdentities !== 'function') return;
        const results = verifyGeometricIdentities();
        const passCount = results.checks.filter(c => c.passed).length;
        const totalCount = results.checks.length;
        if (results.allPassed) {
            console.log(`[SimAntGame] Geometric verification: ${passCount}/${totalCount} checks passed`);
        } else {
            console.warn(`[SimAntGame] Geometric verification: ${passCount}/${totalCount} checks passed`);
            results.checks.filter(c => !c.passed).forEach(c =>
                console.warn(`  ${c.name}: expected ${c.expected}, got ${JSON.stringify(c.actual)}`)
            );
        }
    }

    /**
     * Override BaseGame._setupGameInput() — bind game-specific keys.
     */
    _setupGameInput() {
        this.input.bind(['w'], () => this.buyUnit('worker'));
        this.input.bind(['s'], () => this.buyUnit('soldier'));
        this.input.bind(['t'], () => this.togglePheromones());
    }

    /**
     * Override BaseGame.init() — add mouse bindings for hover detection.
     */
    init() {
        this._bindMouse();
        super.init();
    }

    /**
     * Override BaseGame.update() — called every tick by GameLoop.
     * Runs the simulation step and tracks score.
     */
    update() {
        this.board.update();

        // Track food collection for scoring
        const currentFood = this.board.foodStored[0];
        if (currentFood > this._lastFoodStored) {
            const gained = currentFood - this._lastFoodStored;
            this.scoring.addScore(Math.floor(gained));
        }
        this._lastFoodStored = currentFood;
    }

    /** Override BaseGame.reset() — also reset scoring and combat log. */
    reset() {
        this.scoring.reset();
        // Clear combat log on reset
        if (typeof CombatSystem !== 'undefined') {
            CombatSystem.log = [];
        }
        super.reset();
        this._lastFoodStored = this.board.foodStored[0];
    }

    // UI Commands
    buyUnit(type) {
        // Find queen
        const q = this.board.queens[0]; // 0 = Yellow
        if (!q || !q.alive) {
            console.log("Queen is dead!");
            return;
        }

        const cost = (type === 'soldier') ? 50 : 10;
        if (this.board.foodStored[0] >= cost) {
            this.board.foodStored[0] -= cost;
            const caste = (type === 'soldier') ? CASTE_SOLDIER : CASTE_WORKER;
            this.board.spawnAnt(q.x, q.y, q.z, q.w, FACTION_YELLOW, caste);
            console.log(`Bought ${type}`);
        } else {
            console.log("Not enough food!");
        }
    }

    /** Toggle pheromone visualization. */
    togglePheromones() {
        if (!this.renderer || !this.renderer.pheromoneViz) return;
        const viz = this.renderer.pheromoneViz;
        viz.enabled = !viz.enabled;
        const btn = document.getElementById('pheroBtn');
        if (btn) {
            btn.classList.toggle('active', viz.enabled);
        }
    }

    /** Bind mouse move for hover detection in renderer. */
    _bindMouse() {
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.renderer.mouseX = e.clientX - rect.left;
            this.renderer.mouseY = e.clientY - rect.top;
        });
    }

    /**
     * Override BaseGame._getHUDState() — rich status with colony info.
     * @returns {{ text: string, color: string }}
     */
    _getHUDState() {
        const b = this.board;
        const meta = b.getMetadata();
        const scoreLabel = ` | Score: ${this.scoring.score}`;

        if (b.gameOver) {
            return {
                text: `COLONY LOST! Queen is dead. | Tick: ${meta.tick}${scoreLabel} | Press R to restart`,
                color: '#f87171',
            };
        }

        const yQueenStatus = meta.yellowQueenAlive ? 'Alive' : 'DEAD';
        return {
            text: `Tick: ${meta.tick} | Yellow: ${meta.yellowAnts} ants, ${meta.yellowFood} food | Red: ${meta.redAnts} ants | Queen: ${yQueenStatus}${scoreLabel}`,
            color: '#ffaa44',
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SimAntGame };
}
