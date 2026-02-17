/**
 * connect_four_game.js — 4D Connect Four Game Controller
 *
 * Extends BaseGame for lifecycle, camera sync, input, and HUD management.
 * Integrates HUD, ScoreManager, and AI opponent with Quadray-native evaluation.
 *
 * Uses:
 *   - BaseGame: init, togglePause, reset, _syncCamera, _updateHUD, _setupBaseInput
 *   - HUD: set, gameOver, paused, playing, warning
 *   - ScoreManager: addScore, reset, toJSON
 *   - verifyGeometricIdentities: startup integrity check
 *   - angleBetweenQuadrays: AI angular spread evaluation
 *   - GridUtils: manhattan, euclidean, shuffle, randomCoord
 *   - Quadray: distance, distanceTo, toKey, normalized, clone
 *
 * Controls:
 *   Click       : Drop piece in column
 *   N           : New game
 *   R           : Reset
 *   P           : Pause
 *   D           : Cycle AI difficulty
 *   A           : Toggle AI opponent
 *
 * @module ConnectFourGame
 */

class ConnectFourGame extends BaseGame {
    /** AI difficulty levels */
    static DIFFICULTIES = ['off', 'easy', 'medium', 'hard'];

    constructor(canvas, hudElement) {
        const board = new ConnectFourBoard();
        const renderer = new ConnectFourRenderer(canvas, board);
        super(canvas, hudElement, board, renderer, {
            name: 'ConnectFourGame',
            tickRate: 1000 / 30,
            zoomOpts: { min: 20, max: 100 },
            cameraMode: 'shift-drag',
        });

        // Score tracking via ScoreManager
        this.scoring = new ScoreManager({
            lives: 0,    // unlimited — turn-based game
            levelThreshold: 3,  // level up every 3 wins
            storageKey: 'connectFour4D_highScore',
        });

        // AI state
        this.aiEnabled = false;
        this.aiDifficulty = 0;   // index into DIFFICULTIES
        this.aiThinking = false;

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
            console.log(`[ConnectFourGame] ✅ Geometric verification: ${passCount}/${totalCount} checks passed`);
        } else {
            console.warn(`[ConnectFourGame] ⚠️ Geometric verification: ${passCount}/${totalCount} checks passed`);
            results.checks.filter(c => !c.passed).forEach(c =>
                console.warn(`  ❌ ${c.name}: expected ${c.expected}, got ${JSON.stringify(c.actual)}`)
            );
        }
    }

    /**
     * Override BaseGame._setupGameInput() — bind game-specific keys.
     */
    _setupGameInput() {
        this.input.bind(['n'], () => this.newGame());
        this.input.bind(['d'], () => this.cycleDifficulty());
        this.input.bind(['a'], () => this.toggleAI());
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
        this.aiThinking = false;
        console.log('[ConnectFourGame] New game started');
    }

    /** Override BaseGame.reset() — also reset scoring. */
    reset() {
        this.scoring.reset();
        super.reset();
        this.aiThinking = false;
    }

    /** Toggle AI opponent on/off. */
    toggleAI() {
        this.aiEnabled = !this.aiEnabled;
        if (this.aiEnabled && this.aiDifficulty === 0) this.aiDifficulty = 1;
        console.log(`[ConnectFourGame] AI: ${this.aiEnabled ? ConnectFourGame.DIFFICULTIES[this.aiDifficulty] : 'off'}`);
    }

    /** Cycle AI difficulty. */
    cycleDifficulty() {
        this.aiDifficulty = (this.aiDifficulty + 1) % ConnectFourGame.DIFFICULTIES.length;
        if (this.aiDifficulty === 0) this.aiEnabled = false;
        else this.aiEnabled = true;
        console.log(`[ConnectFourGame] Difficulty: ${ConnectFourGame.DIFFICULTIES[this.aiDifficulty]}`);
    }

    /** Bind mouse click and move events. */
    _bindMouse() {
        this.canvas.addEventListener('click', (e) => {
            if (this.board.gameOver || this.loop.paused || this.aiThinking) return;
            const rect = this.canvas.getBoundingClientRect();
            const sx = e.clientX - rect.left;
            const sy = e.clientY - rect.top;
            const col = this.renderer.hitTest(sx, sy);
            if (col) {
                this._handleDrop(col.b, col.c, col.d);
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const sx = e.clientX - rect.left;
            const sy = e.clientY - rect.top;
            this.renderer.hoverColumn = this.renderer.hitTest(sx, sy);
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.renderer.hoverColumn = null;
        });
    }

    /**
     * Handle a piece drop and trigger AI if enabled.
     * @param {number} b
     * @param {number} c
     * @param {number} d
     */
    _handleDrop(b, c, d) {
        const result = this.board.dropPiece(b, c, d);
        console.log(`[Drop] (${b},${c},${d}) → ${result.result}` +
            (result.quadray ? ` at ${result.quadray.toString()} [${result.cellType}]` : ''));

        if (result.result === 'win') {
            const winner = this.board.winner;
            this.scoring.addScore(1);
            console.log(`[ConnectFourGame] Score: ${JSON.stringify(this.scoring.toJSON())}`);
        }

        // Trigger AI move after short delay
        if (this.aiEnabled && !this.board.gameOver && this.board.currentPlayer === 2) {
            this.aiThinking = true;
            setTimeout(() => {
                this._aiMove();
                this.aiThinking = false;
            }, 300);
        }
    }

    /**
     * AI move selection based on difficulty.
     * Easy: random valid move
     * Medium: 1-ply evaluation with GridUtils.manhattan centrality
     * Hard: 2-ply minimax with Quadray.distance evaluation
     */
    _aiMove() {
        if (this.board.gameOver) return;

        const validMoves = this.board.getValidMoves();
        if (validMoves.length === 0) return;

        const difficulty = ConnectFourGame.DIFFICULTIES[this.aiDifficulty];
        let bestMove;

        if (difficulty === 'easy') {
            // Random move using GridUtils.shuffle concept
            bestMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        } else if (difficulty === 'medium') {
            // 1-ply: evaluate each move, pick best
            bestMove = this._bestMoveByEval(validMoves, 1);
        } else {
            // Hard: 2-ply minimax
            bestMove = this._bestMoveByEval(validMoves, 2);
        }

        if (bestMove) {
            this._handleDrop(bestMove.b, bestMove.c, bestMove.d);
        }
    }

    /**
     * Evaluate moves and pick the best one.
     * @param {Array} moves
     * @param {number} depth
     * @returns {Object} Best move { b, c, d }
     */
    _bestMoveByEval(moves, depth) {
        let bestScore = -Infinity;
        let bestMove = moves[0];

        for (const move of moves) {
            // Simulate the move
            const result = this.board.dropPiece(move.b, move.c, move.d);
            let score = 0;

            if (result.result === 'win') {
                score = 10000;
            } else if (result.result === 'placed') {
                score = this.board.evaluatePosition(2);

                // Look ahead if depth > 1
                if (depth > 1) {
                    const opponentMoves = this.board.getValidMoves();
                    let worstOpponentScore = Infinity;
                    for (const opMove of opponentMoves.slice(0, 8)) { // Limit branching
                        const opResult = this.board.dropPiece(opMove.b, opMove.c, opMove.d);
                        if (opResult.result === 'win') {
                            worstOpponentScore = -10000;
                        } else {
                            const opScore = this.board.evaluatePosition(2);
                            worstOpponentScore = Math.min(worstOpponentScore, opScore);
                        }
                        // Undo opponent move
                        this._undoLastMove();
                    }
                    if (worstOpponentScore !== Infinity) score = worstOpponentScore;
                }
            }

            // Undo our simulated move
            this._undoLastMove();

            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }

        return bestMove;
    }

    /**
     * Undo the last move (for AI simulation).
     */
    _undoLastMove() {
        if (this.board.moveHistory.length === 0) return;
        const last = this.board.moveHistory.pop();
        this.board.grid.delete(last.quadray.toKey());
        this.board.moveCount--;
        this.board.currentPlayer = last.player;
        this.board.winner = 0;
        this.board.gameOver = false;
        this.board.winLine = [];
    }

    /**
     * Override BaseGame._getHUDState() — rich status with quadray info.
     * @returns {{ text: string, color: string }}
     */
    _getHUDState() {
        const b = this.board;
        const meta = b.getMetadata();
        const aiLabel = this.aiEnabled ? ` | AI: ${ConnectFourGame.DIFFICULTIES[this.aiDifficulty]}` : '';
        const scoreLabel = ` | Wins: ${this.scoring.score}`;

        if (b.gameOver) {
            if (b.winner > 0) {
                const emoji = b.winner === 1 ? '🔴' : '🟡';
                return {
                    text: `🎉 ${emoji} Player ${b.winner} wins! | Move: ${meta.moveCount}${scoreLabel} | Press N`,
                    color: b.winner === 1 ? '#ef4444' : '#fbbf24',
                };
            }
            return {
                text: `🤝 Draw! | Move: ${meta.moveCount}${scoreLabel} | Press N`,
                color: '#94a3b8',
            };
        }

        if (this.aiThinking) {
            return { text: '🤔 AI thinking...', color: '#fbbf24' };
        }

        const emoji = b.currentPlayer === 1 ? '🔴' : '🟡';
        return {
            text: `${emoji} Player ${b.currentPlayer} | Move: ${meta.moveCount}${aiLabel}${scoreLabel}`,
            color: '#94a3b8',
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ConnectFourGame };
}
