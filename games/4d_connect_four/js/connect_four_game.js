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
        this.input.bind(['u'], () => this.undo());
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

    /**
     * Undo the last move (or last 2 if AI is enabled).
     * Uses board.undoLastMove() for proper state reversal.
     */
    undo() {
        if (this.board.moveCount === 0 || this.aiThinking) return;
        this.board.undoLastMove();
        // If AI is enabled, also undo the AI's previous move
        if (this.aiEnabled && this.board.moveCount > 0) {
            this.board.undoLastMove();
        }
        console.log(`[ConnectFourGame] Undo — now at move ${this.board.moveCount}`);
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

        // Queue drop animation if piece was placed or won
        if ((result.result === 'placed' || result.result === 'win' || result.result === 'draw') && result.quadray) {
            const landingRow = result.quadray.a;
            const player = result.result === 'win' ? this.board.winner
                : (this.board.currentPlayer === 1 ? 2 : 1); // Previous player
            this.renderer.addDropAnimation(b, c, d, landingRow, player, result.cellType);
        }

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
            }, 400);
        }
    }

    /**
     * AI move selection based on difficulty.
     * All levels: check for immediate win or block first.
     * Easy: random valid move
     * Medium: 1-ply evaluation with centrality
     * Hard: 3-ply alpha-beta minimax
     */
    _aiMove() {
        if (this.board.gameOver) return;

        const validMoves = this.board.getValidMoves();
        if (validMoves.length === 0) return;

        // ALL difficulties: check for immediate win
        const winMove = this._findImmediateWin(validMoves, 2);
        if (winMove) {
            this._handleDrop(winMove.b, winMove.c, winMove.d);
            return;
        }

        // ALL difficulties: block opponent's immediate win
        const blockMove = this._findImmediateWin(validMoves, 1);
        if (blockMove) {
            this._handleDrop(blockMove.b, blockMove.c, blockMove.d);
            return;
        }

        const difficulty = ConnectFourGame.DIFFICULTIES[this.aiDifficulty];
        let bestMove;

        if (difficulty === 'easy') {
            bestMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        } else if (difficulty === 'medium') {
            bestMove = this._bestMoveByEval(validMoves, 1);
        } else {
            // Hard: 3-ply alpha-beta
            bestMove = this._alphaBetaRoot(validMoves, 3);
        }

        if (bestMove) {
            this._handleDrop(bestMove.b, bestMove.c, bestMove.d);
        }
    }

    /**
     * Check if any move results in an immediate win for `player`.
     * @param {Array} moves
     * @param {number} player
     * @returns {Object|null} Winning move { b, c, d } or null
     */
    _findImmediateWin(moves, player) {
        for (const move of moves) {
            const result = this.board.dropPiece(move.b, move.c, move.d);
            const isWin = result.result === 'win';
            this.board.undoLastMove();
            // Only valid if it's that player's turn when dropped
            if (isWin && this.board.currentPlayer === player) continue;
            if (isWin) return move;
        }
        // Try again properly — we need to check from current player perspective
        // If currentPlayer matches `player`, simulate directly
        if (this.board.currentPlayer === player) {
            for (const move of moves) {
                const result = this.board.dropPiece(move.b, move.c, move.d);
                const isWin = result.result === 'win';
                this.board.undoLastMove();
                if (isWin) return move;
            }
        }
        return null;
    }

    /**
     * Alpha-beta minimax from root position.
     * @param {Array} moves - Valid moves
     * @param {number} depth - Search depth
     * @returns {Object} Best move { b, c, d }
     */
    _alphaBetaRoot(moves, depth) {
        let bestScore = -Infinity;
        let bestMove = moves[0];

        for (const move of moves) {
            const result = this.board.dropPiece(move.b, move.c, move.d);
            let score;
            if (result.result === 'win') {
                score = 100000;
            } else if (result.result === 'draw') {
                score = 0;
            } else {
                score = -this._alphaBeta(depth - 1, -Infinity, Infinity, false);
            }
            this.board.undoLastMove();

            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        return bestMove;
    }

    /**
     * Alpha-beta minimax evaluation.
     * @param {number} depth
     * @param {number} alpha
     * @param {number} beta
     * @param {boolean} maximizing
     * @returns {number}
     */
    _alphaBeta(depth, alpha, beta, maximizing) {
        if (depth === 0 || this.board.gameOver) {
            return this.board.evaluatePosition(2);
        }

        const moves = this.board.getValidMoves();
        if (moves.length === 0) return 0;

        if (maximizing) {
            let maxEval = -Infinity;
            for (const move of moves) {
                const result = this.board.dropPiece(move.b, move.c, move.d);
                let score;
                if (result.result === 'win') {
                    score = 100000 + depth; // Prefer faster wins
                } else if (result.result === 'draw') {
                    score = 0;
                } else {
                    score = this._alphaBeta(depth - 1, alpha, beta, false);
                }
                this.board.undoLastMove();
                maxEval = Math.max(maxEval, score);
                alpha = Math.max(alpha, score);
                if (beta <= alpha) break;
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const move of moves) {
                const result = this.board.dropPiece(move.b, move.c, move.d);
                let score;
                if (result.result === 'win') {
                    score = -(100000 + depth);
                } else if (result.result === 'draw') {
                    score = 0;
                } else {
                    score = this._alphaBeta(depth - 1, alpha, beta, true);
                }
                this.board.undoLastMove();
                minEval = Math.min(minEval, score);
                beta = Math.min(beta, score);
                if (beta <= alpha) break;
            }
            return minEval;
        }
    }

    /**
     * Evaluate moves and pick the best one (for medium AI).
     * @param {Array} moves
     * @param {number} depth
     * @returns {Object} Best move { b, c, d }
     */
    _bestMoveByEval(moves, depth) {
        let bestScore = -Infinity;
        let bestMove = moves[0];

        for (const move of moves) {
            const result = this.board.dropPiece(move.b, move.c, move.d);
            let score = 0;

            if (result.result === 'win') {
                score = 10000;
            } else if (result.result === 'placed') {
                score = this.board.evaluatePosition(2);
            }

            this.board.undoLastMove();

            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }

        return bestMove;
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
