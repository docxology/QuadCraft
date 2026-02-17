/**
 * backgammon_game.js — 4D Backgammon Game Controller
 *
 * Extends BaseGame for lifecycle, camera sync, input, and HUD management.
 * Integrates HUD, ScoreManager, and dice-driven turn-based gameplay.
 *
 * Uses:
 *   - BaseGame: init, togglePause, reset, _syncCamera, _updateHUD, _setupBaseInput
 *   - HUD: set, gameOver, paused, playing, warning
 *   - ScoreManager: addScore, reset, toJSON
 *   - verifyGeometricIdentities: startup integrity check
 *   - angleBetweenQuadrays: angular spread evaluation
 *   - GridUtils: manhattan, euclidean, shuffle
 *   - Quadray: distance, distanceTo, toKey, normalized, clone
 *
 * Controls:
 *   Click       : Roll dice / Select point to move
 *   N           : New game
 *   R           : Reset
 *   P           : Pause
 *
 * @module BackgammonGame
 */

class BackgammonGame extends BaseGame {

    constructor(canvas, hudElement) {
        const board = new BackgammonBoard();
        const renderer = new BackgammonRenderer(canvas, board);
        super(canvas, hudElement, board, renderer, {
            name: 'BackgammonGame',
            tickRate: 1000 / 30,        // Render-only loop; turn-based game
            zoomOpts: { min: 15, max: 80 },
            cameraMode: 'shift-drag',
        });

        // Score tracking via ScoreManager
        this.scoring = new ScoreManager({
            lives: 0,    // unlimited — turn-based game
            levelThreshold: 5,  // level up every 5 wins
            storageKey: 'backgammon4D_highScore',
        });

        this.selectedPoint = null;

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
            console.log(`[BackgammonGame] Geometric verification: ${passCount}/${totalCount} checks passed`);
        } else {
            console.warn(`[BackgammonGame] Geometric verification: ${passCount}/${totalCount} checks passed`);
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

    /** Start a new game, preserving scores. */
    newGame() {
        this.board.reset();
        this.selectedPoint = null;
        console.log('[BackgammonGame] New game started');
    }

    /** Override BaseGame.reset() — also reset scoring. */
    reset() {
        this.scoring.reset();
        this.selectedPoint = null;
        super.reset();
    }

    /** Bind mouse click events for dice rolling and piece movement. */
    _bindMouse() {
        this.canvas.addEventListener('mousedown', (e) => {
            // Only respond to left-click without shift (shift-drag is camera)
            if (e.shiftKey || e.button !== 0) return;
            if (this.loop.paused) return;

            this._handleClick(e);
        });
    }

    /**
     * Handle a click event: roll dice or move a piece.
     * @param {MouseEvent} e
     */
    _handleClick(e) {
        const board = this.board;

        if (board.isGameOver()) return;

        // If no dice rolled yet, roll
        if (board.dice[0] === 0) {
            board.rollDice();
            console.log(`[Backgammon] Rolled: ${board.dice}`);
            return;
        }

        // Otherwise, try to move from a clicked point
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        const hitPoint = this.renderer.hitTest(mx, my);
        if (hitPoint < 0) return;

        const moves = board.getValidMoves().filter(m => m.from === hitPoint);
        if (moves.length > 0) {
            const moveChoice = moves[0];
            board.move(moveChoice.from, moveChoice.to, moveChoice.die);

            const fromQ = moveChoice.from === 'bar' ? 'bar' : board.pointToQuadray(moveChoice.from).toString();
            const toQ = moveChoice.to === 'off' ? 'off' : board.pointToQuadray(moveChoice.to).toString();
            console.log(`[Backgammon] ${board.currentPlayer} moved ${fromQ} -> ${toQ} (die: ${moveChoice.die})`);

            // Check win
            if (board.isGameOver()) {
                const w = board.winner();
                this.scoring.addScore(1);
                console.log(`[BackgammonGame] ${w} wins! Score: ${JSON.stringify(this.scoring.toJSON())}`);
            }

            // End turn if no dice left
            if (board.dice.length === 0) {
                board.endTurn();
            }
        }
    }

    /**
     * Override BaseGame._getHUDState() — rich status with quadray info.
     * @returns {{ text: string, color: string }}
     */
    _getHUDState() {
        const b = this.board;
        const meta = b.getMetadata();
        const scoreLabel = ` | Wins: ${this.scoring.score}`;

        if (b.gameOver) {
            const w = b.winner();
            return {
                text: `${w} wins! | Moves: ${meta.moveCount}${scoreLabel} | Press N for new game`,
                color: w === 'white' ? '#eeeeee' : '#666666',
            };
        }

        const turnLabel = meta.currentPlayer === 'white' ? 'White' : 'Black';
        const diceLabel = meta.dice[0] ? `Dice: ${meta.dice.join(' ')}` : 'Click to roll';
        const barLabel = (meta.bar.white > 0 || meta.bar.black > 0)
            ? ` | Bar: W:${meta.bar.white} B:${meta.bar.black}`
            : '';
        const borneLabel = ` | Borne: W:${meta.borne.white} B:${meta.borne.black}`;

        return {
            text: `${turnLabel} | ${diceLabel}${barLabel}${borneLabel}${scoreLabel}`,
            color: '#cc8866',
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BackgammonGame };
}
