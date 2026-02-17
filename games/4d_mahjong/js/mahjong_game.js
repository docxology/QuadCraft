/**
 * mahjong_game.js — 4D Mahjong Game Controller
 *
 * Extends BaseGame for lifecycle, camera sync, input, and HUD management.
 * Integrates HUD, ScoreManager for persistent scoring.
 *
 * Uses:
 *   - BaseGame: init, togglePause, reset, _syncCamera, _updateHUD, _setupBaseInput
 *   - HUD: set, gameOver, paused, playing, warning
 *   - ScoreManager: addScore, reset, toJSON
 *   - verifyGeometricIdentities: startup integrity check
 *   - Quadray: distance, toKey, cellType
 *   - GridUtils: shuffle
 *
 * Controls:
 *   Click       : Select tile
 *   H           : Show hint
 *   N           : New game
 *   R           : Reset / Reshuffle
 *   P           : Pause
 *   Shift+drag  : Rotate view
 *   Scroll      : Zoom
 *
 * @module MahjongGame
 */

class MahjongGame extends BaseGame {
    constructor(canvas, hudElement) {
        const board = new MahjongBoard();
        const renderer = new MahjongRenderer(canvas, board);
        super(canvas, hudElement, board, renderer, {
            name: 'MahjongGame',
            tickRate: 1000 / 30,
            zoomOpts: { min: 15, max: 90 },
            cameraMode: 'shift-drag',
        });

        // Score tracking via ScoreManager
        this.scoring = new ScoreManager({
            lives: 0,    // unlimited — puzzle game
            levelThreshold: 500,
            storageKey: 'mahjong4D_highScore',
        });

        // Hint state
        this.hintTiles = [];
        this.hintExpiry = 0;

        // Startup integrity check
        this._runGeometricVerification();

        console.log('[4D Mahjong] Initialized');
    }

    /** Run verifyGeometricIdentities() on startup and log results. */
    _runGeometricVerification() {
        if (typeof verifyGeometricIdentities !== 'function') return;
        const results = verifyGeometricIdentities();
        const passCount = results.checks.filter(c => c.passed).length;
        const totalCount = results.checks.length;
        if (results.allPassed) {
            console.log(`[MahjongGame] Geometric verification: ${passCount}/${totalCount} checks passed`);
        } else {
            console.warn(`[MahjongGame] Geometric verification: ${passCount}/${totalCount} checks passed`);
            results.checks.filter(c => !c.passed).forEach(c =>
                console.warn(`  ${c.name}: expected ${c.expected}, got ${JSON.stringify(c.actual)}`)
            );
        }
    }

    /**
     * Override BaseGame._setupGameInput() — bind game-specific keys.
     */
    _setupGameInput() {
        this.input.bind(['n'], () => this.newGame());
        this.input.bind(['h'], () => this.showHint());
    }

    /**
     * Override BaseGame.init() — add mouse bindings.
     */
    init() {
        this._bindMouse();
        super.init();
    }

    /** Start a new game, preserving scores. */
    newGame() {
        this.board.reset();
        this.hintTiles = [];
        this.hintExpiry = 0;
        this.renderer.hintTiles = [];
        this.renderer.hintExpiry = 0;
        console.log('[MahjongGame] New game started');
    }

    /** Override BaseGame.reset() — also reset scoring. */
    reset() {
        this.scoring.reset();
        this.hintTiles = [];
        this.hintExpiry = 0;
        this.renderer.hintTiles = [];
        this.renderer.hintExpiry = 0;
        super.reset();
    }

    /** Show hint — highlight a matching pair. */
    showHint() {
        const h = this.board.getHint();
        if (h) {
            this.hintTiles = h;
            this.hintExpiry = performance.now() + 2000;
            this.renderer.hintTiles = h;
            this.renderer.hintExpiry = this.hintExpiry;
            console.log('[Mahjong] Hint:', h[0].suit, h[0].value);
        } else {
            this.hintTiles = [];
            this.renderer.hintTiles = [];
        }
    }

    /** Bind mouse click and move events. */
    _bindMouse() {
        this.canvas.addEventListener('mousedown', (e) => {
            if (!e.shiftKey && e.button === 0) {
                this._handleClick(e);
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.renderer.mouseX = e.clientX - rect.left;
            this.renderer.mouseY = e.clientY - rect.top;
        });
    }

    /**
     * Handle a tile click — select or match.
     * @param {MouseEvent} e
     */
    _handleClick(e) {
        if (this.board.gameOver || this.loop.paused) return;
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        const tile = this.renderer.hitTest(mx, my);
        if (tile) {
            const prevScore = this.board.score;
            this.board.select(tile);
            console.log(`[Mahjong] Selected ${tile.suit}${tile.value} layer${tile.layer}`);

            // If score changed, a match was made
            if (this.board.score > prevScore) {
                const gained = this.board.score - prevScore;
                this.scoring.addScore(gained);
                console.log(`[MahjongGame] Score: ${JSON.stringify(this.scoring.toJSON())}`);
            }
        } else {
            this.board.selected = null;
        }
    }

    /**
     * Override BaseGame._getHUDState() — rich status with tile info.
     * @returns {{ text: string, color: string }}
     */
    _getHUDState() {
        const b = this.board;
        const meta = b.getMetadata();
        const scoreLabel = ` | Hi: ${this.scoring.highScore}`;

        if (meta.isComplete) {
            return {
                text: `YOU WIN! | Score: ${meta.score} | Moves: ${meta.moves}${scoreLabel} | Press N`,
                color: '#4ade80',
            };
        }

        if (meta.isStuck) {
            return {
                text: `No moves available | Tiles: ${meta.remainingTiles} | Press R to shuffle`,
                color: '#ff6644',
            };
        }

        const selLabel = b.selected
            ? ` | Sel: ${b.selected.suit[0].toUpperCase()}${b.selected.value}`
            : '';

        return {
            text: `Tiles: ${meta.remainingTiles} | Score: ${meta.score} | Moves: ${meta.moves}${selLabel}${scoreLabel}`,
            color: '#d4c088',
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MahjongGame };
}
