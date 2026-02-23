/**
 * simant_game.js — 4D SimAnt Game Controller — Enhanced
 *
 * Extends BaseGame for lifecycle, camera sync, input, and HUD management.
 * Integrates HUD, ScoreManager, and AI colony with Quadray-native evaluation.
 *
 * Features:
 * - 3 speed settings (Slow/Normal/Fast) via 1/2/3 keys
 * - Win condition — enemy queen dies
 * - Auto-assist toggle (A key)
 * - Colony management with real-time stats
 * - Particle effects on events
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
 *   E           : Buy scout
 *   T           : Toggle pheromone viz
 *   A           : Toggle auto-assist
 *   M           : Toggle minimap
 *   L           : Toggle coordinate labels
 *   G           : Toggle IVM grid/tunnels
 *   1/2/3       : Speed (Slow/Normal/Fast)
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
            tickRate: 150,          // Normal speed — 150ms per tick (~6.7 tps)
            zoomOpts: { min: 10, max: 60 },
            cameraMode: 'shift-drag',
        });

        // Speed settings
        this.speeds = {
            slow: 300,
            normal: 150,
            fast: 50,
        };
        this.currentSpeed = 'normal';

        // Score tracking via ScoreManager
        this.scoring = new ScoreManager({
            lives: 0,    // unlimited — simulation game
            levelThreshold: 100,  // level up every 100 food collected
            storageKey: 'simant4D_highScore',
        });

        // Track food collected for scoring
        this._lastFoodStored = this.board.foodStored[0];

        // Track events for particles
        this._lastYellowAnts = this.board.ants.filter(a => a.faction === 0 && a.alive).length;
        this._lastRedAnts = this.board.ants.filter(a => a.faction === 1 && a.alive).length;

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
        this.input.bind(['e'], () => this.buyUnit('scout'));
        this.input.bind(['t'], () => this.togglePheromones());
        this.input.bind(['a'], () => this.toggleAssist());
        this.input.bind(['m'], () => this.toggleMinimap());
        this.input.bind(['l'], () => this.toggleLabels());
        this.input.bind(['g'], () => this.toggleGrid());
        this.input.bind(['1'], () => this.setSpeed('slow'));
        this.input.bind(['2'], () => this.setSpeed('normal'));
        this.input.bind(['3'], () => this.setSpeed('fast'));
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

        // Spawn particles for combat events
        this._checkForEvents();
    }

    /** Check for events to generate particle effects */
    _checkForEvents() {
        const yAnts = this.board.ants.filter(a => a.faction === 0 && a.alive).length;
        const rAnts = this.board.ants.filter(a => a.faction === 1 && a.alive).length;

        // Ant died — emit particles
        if (yAnts < this._lastYellowAnts && this.renderer) {
            const cx = this.canvas.width / 2 + (Math.random() - 0.5) * 100;
            const cy = this.canvas.height / 2 + (Math.random() - 0.5) * 100;
            for (let i = 0; i < 5; i++) this.renderer.addParticle(cx, cy, '#ffaa44');
        }
        if (rAnts < this._lastRedAnts && this.renderer) {
            const cx = this.canvas.width / 2 + (Math.random() - 0.5) * 100;
            const cy = this.canvas.height / 2 + (Math.random() - 0.5) * 100;
            for (let i = 0; i < 5; i++) this.renderer.addParticle(cx, cy, '#ff4444');
        }

        this._lastYellowAnts = yAnts;
        this._lastRedAnts = rAnts;
    }

    /** Override BaseGame.reset() — also reset scoring and combat log. */
    reset() {
        this.scoring.reset();
        if (typeof CombatSystem !== 'undefined') {
            CombatSystem.log = [];
            CombatSystem.resetStats();
        }
        super.reset();
        this._lastFoodStored = this.board.foodStored[0];
        this._lastYellowAnts = this.board.ants.filter(a => a.faction === 0 && a.alive).length;
        this._lastRedAnts = this.board.ants.filter(a => a.faction === 1 && a.alive).length;
        this.currentSpeed = 'normal';
        this.loop.tickRate = this.speeds.normal;
    }

    // UI Commands
    buyUnit(type) {
        const q = this.board.queens[0]; // 0 = Yellow
        if (!q || !q.alive) {
            console.log("Queen is dead!");
            return;
        }

        let cost, caste;
        switch (type) {
            case 'soldier': cost = 50; caste = CASTE_SOLDIER; break;
            case 'scout': cost = 15; caste = CASTE_SCOUT; break;
            default: cost = 10; caste = CASTE_WORKER; break;
        }

        if (this.board.atPopCap(FACTION_YELLOW)) {
            console.log(`Population cap reached (${MAX_ANTS_PER_FACTION})!`);
            return;
        }

        if (this.board.foodStored[0] >= cost) {
            this.board.foodStored[0] -= cost;
            this.board.spawnAnt(q.a, q.b, q.c, q.d, FACTION_YELLOW, caste);
            console.log(`Bought ${type}`);
        } else {
            console.log("Not enough food!");
        }
    }

    /** Set simulation speed */
    setSpeed(speed) {
        if (this.speeds[speed]) {
            this.currentSpeed = speed;
            this.loop.tickRate = this.speeds[speed];
            console.log(`Speed: ${speed} (${this.speeds[speed]}ms/tick)`);
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

    /** Toggle Yellow assist AI */
    toggleAssist() {
        this.board.yellowAssistEnabled = !this.board.yellowAssistEnabled;
        console.log(`Yellow Assist AI: ${this.board.yellowAssistEnabled ? 'ON' : 'OFF'}`);
        const btn = document.getElementById('assistBtn');
        if (btn) {
            btn.classList.toggle('active', this.board.yellowAssistEnabled);
        }
    }

    /** Toggle minimap */
    toggleMinimap() {
        if (!this.renderer) return;
        this.renderer.showMinimap = !this.renderer.showMinimap;
    }

    /** Toggle coordinate labels on ants */
    toggleLabels() {
        if (!this.renderer) return;
        this.renderer.showLabels = !this.renderer.showLabels;
        console.log(`Labels: ${this.renderer.showLabels ? 'ON' : 'OFF'}`);
    }

    /** Toggle IVM grid and tunnel visualization */
    toggleGrid() {
        if (!this.renderer) return;
        this.renderer.showIVMGrid = !this.renderer.showIVMGrid;
        this.renderer.showTunnels = !this.renderer.showTunnels;
        console.log(`IVM Grid: ${this.renderer.showIVMGrid ? 'ON' : 'OFF'}`);
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
        const speedLabel = ` | ⚡${this.currentSpeed.toUpperCase()}`;

        if (b.gameOver) {
            if (b.winner === 0) {
                return {
                    text: `🏆 VICTORY! Enemy queen defeated! | Tick: ${meta.tick}${scoreLabel} | Press R to restart`,
                    color: '#4ade80',
                };
            }
            return {
                text: `💀 COLONY LOST! Queen is dead. | Tick: ${meta.tick}${scoreLabel} | Press R to restart`,
                color: '#f87171',
            };
        }

        const assistLabel = b.yellowAssistEnabled ? ' | 🤖AUTO' : '';
        const yQueenStatus = meta.yellowQueenAlive ? 'Alive' : 'DEAD';
        return {
            text: `Tick: ${meta.tick} | Y:${meta.yellowAnts} ants R:${meta.redAnts} | Food:${meta.yellowFood} | Queen:${yQueenStatus}${scoreLabel}${speedLabel}${assistLabel}`,
            color: '#ffaa44',
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SimAntGame };
}
