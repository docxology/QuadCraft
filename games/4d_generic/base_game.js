/**
 * base_game.js — Base Game Controller for QuadCraft 4D Games
 *
 * Provides the common game controller lifecycle shared by all games:
 *   - Canvas, board, renderer, camera, and zoom auto-setup
 *   - GameLoop integration with configurable tick rate
 *   - InputController integration with pause/reset bindings
 *   - HUD management via the HUD module
 *   - Camera-to-renderer synchronisation
 *
 * Subclass and override update(), _setupInput(), and _getHUDState().
 *
 * Usage:
 *   class MyGame extends BaseGame {
 *       constructor(canvas, hudElement) {
 *           const board = new MyBoard();
 *           const renderer = new MyRenderer(canvas, board);
 *           super(canvas, hudElement, board, renderer, { tickRate: 200 });
 *       }
 *       update() { this.board.step(); }
 *       _setupGameInput() {
 *           this.input.bind(['ArrowLeft', 'a'], () => this.board.move(-1, 0, 0, 0));
 *       }
 *       _getHUDState() {
 *           return { text: `Score: ${this.board.score}`, color: '#94a3b8' };
 *       }
 *   }
 *
 * @module BaseGame
 */

class BaseGame {
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {HTMLElement} hudElement
     * @param {Object} board — Board instance (must have gameOver property).
     * @param {Object} renderer — Renderer instance (must have rotX, rotY, render()).
     * @param {Object} [opts]
     * @param {number} [opts.tickRate=16] — Milliseconds per game tick.
     * @param {string} [opts.name='Game'] — Name for logging.
     * @param {Object} [opts.zoomOpts] — Zoom config { min, max }.
     * @param {string} [opts.cameraMode='shift-drag'] — Camera mode.
     */
    constructor(canvas, hudElement, board, renderer, opts = {}) {
        this.canvas = canvas;
        this.board = board;
        this.renderer = renderer;
        this.gameName = opts.name ?? 'Game';

        // HUD
        if (typeof HUD !== 'undefined') {
            this.hud = new HUD(hudElement);
        } else {
            this.hud = null;
            this.hudElement = hudElement;
        }

        // Input Controller
        this.input = new InputController();
        this._setupBaseInput();
        this._setupGameInput();

        // Game Loop
        this.loop = new GameLoop({
            update: () => this.update(),
            render: () => {
                this._syncCamera();
                this.renderer.render();
                this._updateHUD();
            },
            tickRate: opts.tickRate ?? 16,
        });

        // Camera
        const cameraMode = opts.cameraMode ?? 'shift-drag';
        if (typeof CameraController !== 'undefined') {
            this.camera = new CameraController(canvas, { mode: cameraMode });
        }

        // Zoom
        const zoomOpts = opts.zoomOpts ?? { min: 15, max: 80 };
        if (typeof setupZoom !== 'undefined') {
            setupZoom(canvas, this.renderer, zoomOpts);
        }
    }

    /**
     * Initialize game: attach input and start game loop.
     */
    init() {
        this.input.attach();
        this.loop.start();
        console.log(`[${this.gameName}] Initialized with modules`);
    }

    /**
     * Toggle pause state.
     */
    togglePause() {
        this.loop.togglePause();
        this._updateHUD();
    }

    /**
     * Reset game to initial state.
     * Override in subclass if board reset is more complex.
     */
    reset() {
        this.loop.stop();
        if (typeof this.board.reset === 'function') {
            this.board.reset();
        }
        this.loop.start();
    }

    /**
     * Override: Called every tick. Implement game-specific update logic.
     */
    update() {
        // Subclass implements
    }

    /**
     * Override: Bind game-specific keys.
     * Called during construction, after base input is configured.
     */
    _setupGameInput() {
        // Subclass implements
    }

    /**
     * Override: Return HUD display state based on current game state.
     * @returns {{ text: string, color: string }}
     */
    _getHUDState() {
        const b = this.board;
        if (b.gameOver) {
            return {
                text: `💀 GAME OVER | Score: ${b.score || 0} | Press R to restart`,
                color: '#f87171',
            };
        }
        return {
            text: `Score: ${b.score || 0}`,
            color: '#94a3b8',
        };
    }

    /** @private — Set up universal pause/reset bindings. */
    _setupBaseInput() {
        this.input.bind(['p'], () => this.togglePause());
        this.input.bind(['r'], () => this.reset());
    }

    /** @private — Sync camera rotation to renderer. */
    _syncCamera() {
        if (this.camera) {
            this.renderer.rotX = this.camera.rotX;
            this.renderer.rotY = this.camera.rotY;
        }
    }

    /** @private — Update HUD from _getHUDState(). */
    _updateHUD() {
        if (this.hud) {
            if (this.loop.paused) {
                this.hud.paused();
            } else {
                const state = this._getHUDState();
                this.hud.set(state.text, state.color);
            }
        } else if (this.hudElement) {
            if (this.loop.paused) {
                this.hudElement.textContent = '⏸ PAUSED — Press P to continue';
                this.hudElement.style.color = '#fbbf24';
            } else {
                const state = this._getHUDState();
                this.hudElement.textContent = state.text;
                this.hudElement.style.color = state.color;
            }
        }
    }
}

// Dual export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BaseGame };
}
