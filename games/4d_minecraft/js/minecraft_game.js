/**
 * minecraft_game.js — 4D Minecraft Game Controller
 *
 * Extends BaseGame for lifecycle, camera sync, input, and HUD management.
 * Integrates HUD, ScoreManager, and Synergetics analysis with Quadray-native world.
 *
 * Uses:
 *   - BaseGame: init, togglePause, reset, _syncCamera, _updateHUD, _setupBaseInput
 *   - HUD: set, gameOver, paused, playing, warning
 *   - ScoreManager: addScore, reset, toJSON
 *   - verifyGeometricIdentities: startup integrity check
 *   - GridUtils: key, parseKey, neighbors, boundedNeighbors
 *   - Quadray: distance, distanceTo, toKey, normalized, clone, cellType
 *
 * Controls:
 *   1-8         : Select block type
 *   Click       : Place block on top of hovered block (+C axis)
 *   Alt+Click   : Remove hovered block
 *   Shift+drag  : Rotate camera
 *   Scroll      : Zoom
 *   N           : New world
 *   R           : Reset
 *   P           : Pause
 *
 * @module MinecraftGame
 */

class MinecraftGame extends BaseGame {

    constructor(canvas, hudElement) {
        const board = new MinecraftBoard(8);
        const renderer = new MinecraftRenderer(canvas, board);
        super(canvas, hudElement, board, renderer, {
            name: 'MinecraftGame',
            tickRate: 1000 / 30,  // Render-only at 30fps
            zoomOpts: { min: 12, max: 80 },
            cameraMode: 'shift-drag',
        });

        // Score tracking via ScoreManager
        this.scoring = new ScoreManager({
            lives: 0,    // unlimited — sandbox game
            levelThreshold: 50,  // level up every 50 blocks placed
            storageKey: 'minecraft4D_highScore',
        });

        // Analysis state (cached, recomputed on dirty)
        this.analysis = null;
        markAnalysisDirty();

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
            console.log(`[MinecraftGame] Geometric verification: ${passCount}/${totalCount} checks passed`);
        } else {
            console.warn(`[MinecraftGame] Geometric verification: ${passCount}/${totalCount} checks passed`);
            results.checks.filter(c => !c.passed).forEach(c =>
                console.warn(`  FAIL ${c.name}: expected ${c.expected}, got ${JSON.stringify(c.actual)}`)
            );
        }
    }

    /**
     * Override BaseGame._setupGameInput() — bind game-specific keys.
     */
    _setupGameInput() {
        // Block type selection (1-8)
        this.input.bind(['1'], () => this.board.selectedBlock = 1);
        this.input.bind(['2'], () => this.board.selectedBlock = 2);
        this.input.bind(['3'], () => this.board.selectedBlock = 3);
        this.input.bind(['4'], () => this.board.selectedBlock = 4);
        this.input.bind(['5'], () => this.board.selectedBlock = 5);
        this.input.bind(['6'], () => this.board.selectedBlock = 6);
        this.input.bind(['7'], () => this.board.selectedBlock = 7);
        this.input.bind(['8'], () => this.board.selectedBlock = 8);

        // New world
        this.input.bind(['n'], () => this.newWorld());
    }

    /**
     * Override BaseGame.init() — add mouse bindings.
     */
    init() {
        this._bindMouse();
        super.init();
        console.log('[MinecraftGame] World generated');
    }

    /**
     * Override: Called every tick by game loop.
     * Minecraft is click-driven, so update() just refreshes analysis.
     */
    update() {
        this.analysis = getAnalysis(this.board);
        this.renderer.analysis = this.analysis;
    }

    /** Generate a new world, preserving scores. */
    newWorld() {
        this.board.reset();
        markAnalysisDirty();
        console.log('[MinecraftGame] New world generated');
    }

    /** Override BaseGame.reset() — also reset scoring. */
    reset() {
        this.scoring.reset();
        markAnalysisDirty();
        super.reset();
    }

    /** Bind mouse click and move events. */
    _bindMouse() {
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.shiftKey || e.button !== 0) return; // Shift+drag handled by CameraController
            if (this.loop.paused) return;

            const rect = this.canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left, my = e.clientY - rect.top;
            const hit = this.renderer.hitTest(mx, my);

            if (hit) {
                if (e.altKey) {
                    // Alt+click to remove
                    if (this.board.removeBlock(hit.a, hit.b, hit.c, hit.d)) {
                        markAnalysisDirty();
                        console.log(`[Minecraft] Removed block at ${hit.a},${hit.b},${hit.c},${hit.d}`);
                    }
                } else {
                    // Click to place block on top (+C axis)
                    if (this.board.placeBlock(hit.a, hit.b, hit.c + 1, hit.d)) {
                        this.scoring.addScore(1);
                        markAnalysisDirty();
                        console.log(`[Minecraft] Placed ${BLOCK_NAMES[this.board.selectedBlock]} above`);
                    }
                }
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.renderer.mouseX = e.clientX - rect.left;
            this.renderer.mouseY = e.clientY - rect.top;
        });
    }

    /**
     * Override BaseGame._getHUDState() — rich status with block info.
     * @returns {{ text: string, color: string }}
     */
    _getHUDState() {
        const b = this.board;
        const meta = b.getMetadata();
        const scoreLabel = ` | Placed: ${meta.blocksPlaced}`;
        return {
            text: `${BLOCK_NAMES[meta.selectedBlock]} | ${meta.blockCount} blocks${scoreLabel}`,
            color: '#94a3b8',
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MinecraftGame };
}
