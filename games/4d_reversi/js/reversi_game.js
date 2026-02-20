/**
 * reversi_game.js — 4D Reversi Game Controller
 *
 * Extends BaseGame for lifecycle, camera sync, input, and HUD management.
 * Integrates HUD, ScoreManager, and turn-based disc placement in 4D Quadray space.
 *
 * Uses:
 *   - BaseGame: init, togglePause, reset, _syncCamera, _updateHUD, _setupBaseInput
 *   - HUD: set, gameOver, paused, playing, warning
 *   - ScoreManager: addScore, reset, toJSON
 *   - verifyGeometricIdentities: startup integrity check
 *   - angleBetweenQuadrays: angular spread evaluation
 *   - GridUtils: manhattan, euclidean, shuffle, randomCoord, depthSort
 *   - Quadray: distance, distanceTo, toKey, normalized, clone
 *
 * Controls:
 *   Click       : Place disc on valid position
 *   N           : New game
 *   R           : Reset
 *   P           : Pause
 *   M           : Random move
 *
 * @module ReversiGame
 */

class ReversiGame extends BaseGame {
    constructor(canvas, hudElement) {
        const board = new ReversiBoard(4);
        const renderer = new ReversiRenderer(canvas, board);
        super(canvas, hudElement, board, renderer, {
            name: 'ReversiGame',
            tickRate: 1000 / 30,     // Render-only, turn-based game
            zoomOpts: { min: 20, max: 120 },
            cameraMode: 'shift-drag',
        });

        // Turn state
        this.turnManager = new TurnManager([ReversiColor.BLACK, ReversiColor.WHITE], { maxHistory: 1000 });

        // Score tracking via ScoreManager
        this.scoring = new ScoreManager({
            lives: 0,    // unlimited — turn-based game
            levelThreshold: 3,  // level up every 3 wins
            storageKey: 'reversi4D_highScore',
        });

        // Sync board state to renderer
        this._syncRendererState();

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
            console.log(`[ReversiGame] Geometric verification: ${passCount}/${totalCount} checks passed`);
        } else {
            console.warn(`[ReversiGame] Geometric verification: ${passCount}/${totalCount} checks passed`);
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
        this.input.bind(['m'], () => this.randomMove());
    }

    /**
     * Override BaseGame.init() — add mouse bindings.
     */
    init() {
        this._bindMouse();
        super.init();
    }

    /** Sync current game state to renderer for display. */
    _syncRendererState() {
        this.renderer.validMoves = this.board.getValidMoves(this.turnManager.currentPlayer);
        this.renderer.currentPlayer = this.turnManager.currentPlayer;
        this.renderer.gameOver = this.board.gameOver;
        this.renderer.gameOverMessage = this.board.gameOverMessage;
    }

    /** Override BaseGame.update() — sync renderer state each tick. */
    update() {
        this._syncRendererState();
    }

    /** Start a new game, preserving scores. */
    newGame() {
        this.board.reset();
        this.turnManager.reset();
        this._syncRendererState();
        console.log('[ReversiGame] New game started');
    }

    /** Override BaseGame.reset() — also reset scoring. */
    reset() {
        this.scoring.reset();
        super.reset();
        this._syncRendererState();
    }

    /** Bind mouse click and move events for disc placement. */
    _bindMouse() {
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.shiftKey || e.button !== 0) return; // Shift+drag = camera
            if (this.board.gameOver || this.loop.paused) return;
            const rect = this.canvas.getBoundingClientRect();
            const sx = e.clientX - rect.left;
            const sy = e.clientY - rect.top;
            const move = this.renderer.hitTest(sx, sy);
            if (move) {
                this._handlePlace(move);
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.renderer.mouseX = e.clientX - rect.left;
            this.renderer.mouseY = e.clientY - rect.top;
        });
    }

    /**
     * Handle a disc placement.
     * @param {Object} move - { pos: Quadray, flips: Array }
     */
    _handlePlace(move) {
        const color = this.turnManager.currentPlayer;
        const success = this.board.place(move.pos, color);
        if (!success) return;

        console.log(`[ReversiGame] ${color} placed at ${move.pos} flipping ${move.flips.length}`);

        this.turnManager.recordMove({ pos: move.pos, flips: move.flips, player: color });

        // End turn — check for valid opponent or same-player moves
        this._endTurn();
    }

    /** Process end of turn: check opponent moves, check game over. */
    _endTurn() {
        const opp = this.turnManager.opponent;
        const oppMoves = this.board.getValidMoves(opp);

        if (oppMoves.length > 0) {
            this.turnManager.nextTurn();
        } else {
            const myMoves = this.board.getValidMoves(this.turnManager.currentPlayer);
            if (myMoves.length > 0) {
                console.log(`[ReversiGame] ${opp} has no moves, ${this.turnManager.currentPlayer} goes again`);
            } else {
                // Game over
                this.board.gameOver = true;
                const b = this.board.count(ReversiColor.BLACK);
                const w = this.board.count(ReversiColor.WHITE);
                if (b > w) {
                    this.board.gameOverMessage = `Black wins ${b}-${w}!`;
                } else if (w > b) {
                    this.board.gameOverMessage = `White wins ${w}-${b}!`;
                } else {
                    this.board.gameOverMessage = `Draw ${b}-${w}!`;
                }
                this.scoring.addScore(1);
                console.log(`[ReversiGame] Game Over: ${this.board.gameOverMessage}`);
                console.log(`[ReversiGame] Score: ${JSON.stringify(this.scoring.toJSON())}`);
            }
        }

        this._syncRendererState();
    }

    /**
     * Make a random valid move.
     * @returns {boolean} True if a move was made
     */
    randomMove() {
        if (this.board.gameOver || this.loop.paused) return false;
        const validMoves = this.board.getValidMoves(this.turnManager.currentPlayer);
        if (validMoves.length === 0) return false;
        const move = validMoves[Math.floor(Math.random() * validMoves.length)];
        this._handlePlace(move);
        return true;
    }

    /**
     * Override BaseGame._getHUDState() — rich status with quadray info.
     * @returns {{ text: string, color: string }}
     */
    _getHUDState() {
        const meta = this.board.getMetadata();
        const scoreLabel = ` | Wins: ${this.scoring.score}`;

        if (this.board.gameOver) {
            return {
                text: `${this.board.gameOverMessage}${scoreLabel} | Press N for new game`,
                color: '#f87171',
            };
        }

        const isBlack = this.turnManager.currentPlayer === ReversiColor.BLACK;
        const emoji = isBlack ? 'Black' : 'White';
        const validCount = this.renderer.validMoves.length;
        return {
            text: `${emoji}'s turn | B:${meta.blackCount} W:${meta.whiteCount} | Moves: ${validCount}${scoreLabel}`,
            color: '#94a3b8',
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ReversiGame };
}
