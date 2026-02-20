/**
 * checkers_game.js — 4D Checkers Game Controller
 *
 * Extends BaseGame for lifecycle, camera sync, input, and HUD management.
 * Integrates HUD, ScoreManager, and turn-based piece selection/movement.
 *
 * Uses:
 *   - BaseGame: init, togglePause, reset, _syncCamera, _updateHUD, _setupBaseInput
 *   - HUD: set, gameOver, paused, playing, warning
 *   - ScoreManager: addScore, reset, toJSON
 *   - verifyGeometricIdentities: startup integrity check
 *   - GridUtils: manhattan, euclidean, shuffle
 *   - Quadray: distance, distanceTo, toKey, normalized, clone, add, scale
 *
 * Controls:
 *   Click piece  : Select piece (shows valid moves)
 *   Click move   : Execute move/capture
 *   N            : New game
 *   R            : Reset
 *   P            : Pause
 *   M            : Random move
 *
 * @module CheckersGame
 */

class CheckersGame extends BaseGame {
    constructor(canvas, hudElement) {
        const board = new CheckersBoard(4);
        const renderer = new CheckersRenderer(canvas, board);
        super(canvas, hudElement, board, renderer, {
            name: 'CheckersGame',
            tickRate: 1000 / 30,
            zoomOpts: { min: 20, max: 120 },
            cameraMode: 'left-drag',
        });

        // Give renderer a reference to this game (for selection highlights, move indicators)
        this.renderer.game = this;

        // Game state
        this.turnManager = new TurnManager([PlayerColor.RED, PlayerColor.BLACK], { maxHistory: 1000 });
        this.selectedPiece = null;
        this.possibleMoves = [];
        this.gameOver = false;
        this.gameOverMessage = '';

        // Score tracking via ScoreManager
        this.scoring = new ScoreManager({
            lives: 0,    // unlimited — turn-based game
            levelThreshold: 5,  // level up every 5 wins
            storageKey: 'checkers4D_highScore',
        });

        // Startup integrity check
        this._runGeometricVerification();
    }

    get currentPlayer() { return this.turnManager.currentPlayer; }
    get moveLog() { return this.turnManager.moveHistory; }

    /** Run verifyGeometricIdentities() on startup and log results. */
    _runGeometricVerification() {
        if (typeof verifyGeometricIdentities !== 'function') return;
        const results = verifyGeometricIdentities();
        const passCount = results.checks.filter(c => c.passed).length;
        const totalCount = results.checks.length;
        if (results.allPassed) {
            console.log(`[CheckersGame] Geometric verification: ${passCount}/${totalCount} checks passed`);
        } else {
            console.warn(`[CheckersGame] Geometric verification: ${passCount}/${totalCount} checks passed`);
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

    /**
     * Override BaseGame.update() — no-op for turn-based game.
     * All game logic is driven by click handlers.
     */
    update() {
        // Turn-based: nothing to update on tick
    }

    /** Start a new game, preserving scores. */
    newGame() {
        this.board.reset();
        this.turnManager.reset();
        this.selectedPiece = null;
        this.possibleMoves = [];
        this.gameOver = false;
        this.gameOverMessage = '';
        this.renderer.gridPositions = this.renderer._computeGridPositions();
        console.log('[CheckersGame] New game started');
    }

    /** Override BaseGame.reset() — also reset scoring. */
    reset() {
        this.scoring.reset();
        this.newGame();
        console.log('[CheckersGame] Full reset with scoring');
    }

    /** Bind mouse click and move events. */
    _bindMouse() {
        // Track drag vs click
        let dragStart = null;

        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                dragStart = { x: e.clientX, y: e.clientY };
            }
        });

        this.canvas.addEventListener('mouseup', (e) => {
            if (e.button !== 0 || !dragStart) return;
            const dx = e.clientX - dragStart.x;
            const dy = e.clientY - dragStart.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 5) {
                this._handleClick(e);
            }
            dragStart = null;
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.renderer.mouseX = e.clientX - rect.left;
            this.renderer.mouseY = e.clientY - rect.top;
        });
    }

    /**
     * Handle a click event — select piece or execute move.
     * @param {MouseEvent} e
     */
    _handleClick(e) {
        if (this.gameOver || this.loop.paused) return;

        const rect = this.canvas.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;

        // 1. Check if we clicked a valid move target (higher priority when piece is selected)
        if (this.selectedPiece && this.possibleMoves.length > 0) {
            const move = this.renderer.hitTestMove(sx, sy, this.possibleMoves);
            if (move) {
                this._makeMove(move);
                return;
            }
        }

        // 2. Check if we clicked a piece belonging to current player
        const clickedPiece = this.renderer.hitTestPiece(sx, sy, this.currentPlayer);
        if (clickedPiece) {
            this._selectPiece(clickedPiece);
        } else {
            // Deselect
            this.selectedPiece = null;
            this.possibleMoves = [];
        }
    }

    /**
     * Select a piece and compute its valid moves.
     * @param {CheckersPiece} piece
     */
    _selectPiece(piece) {
        this.selectedPiece = piece;
        this.possibleMoves = this.board.getValidMoves(piece);
        console.log(`[CheckersGame] Selected ${piece.color} ${piece.type} at ${piece.position} — ${this.possibleMoves.length} moves`);
    }

    /**
     * Execute a move and end the turn.
     * @param {Object} move
     */
    _makeMove(move) {
        this.board.executeMove(move);

        const logEntry = {
            player: this.currentPlayer,
            from: move.from.toString(),
            to: move.to.toString(),
            type: move.type,
        };
        console.log(`[CheckersGame] ${this.currentPlayer} ${move.type}: ${move.from} -> ${move.to}`);

        // Track captures as score
        if (move.type === 'capture') {
            this.scoring.addScore(1);
        }

        this.turnManager.recordAndAdvance(logEntry);

        this._endTurn();
    }

    /** End current turn — switch player, check win condition. */
    _endTurn() {
        this.selectedPiece = null;
        this.possibleMoves = [];

        this._checkWinCondition();
    }

    /** Check if the game is over (no pieces or no moves for current player). */
    _checkWinCondition() {
        const currentPieces = Array.from(this.board.pieces.values())
            .filter(p => p.color === this.currentPlayer);

        // No pieces left
        if (currentPieces.length === 0) {
            const winner = this.currentPlayer === PlayerColor.RED ? 'Black' : 'Red';
            this.gameOver = true;
            this.board.gameOver = true;
            this.gameOverMessage = `${winner} wins! No pieces remain.`;
            console.log(`[CheckersGame] Game Over: ${this.gameOverMessage}`);
            return;
        }

        // No moves available
        const hasAnyMove = currentPieces.some(p => this.board.getValidMoves(p).length > 0);
        if (!hasAnyMove) {
            const winner = this.currentPlayer === PlayerColor.RED ? 'Black' : 'Red';
            this.gameOver = true;
            this.board.gameOver = true;
            this.gameOverMessage = `${winner} wins! No legal moves.`;
            console.log(`[CheckersGame] Game Over: ${this.gameOverMessage}`);
            return;
        }
    }

    /**
     * Make a random legal move for the current player.
     * @returns {boolean} true if a move was made
     */
    randomMove() {
        if (this.gameOver || this.loop.paused) return false;
        const pieces = Array.from(this.board.pieces.values()).filter(p => p.color === this.currentPlayer);
        const piecesWithMoves = pieces.filter(p => this.board.getValidMoves(p).length > 0);
        if (piecesWithMoves.length === 0) return false;
        const piece = piecesWithMoves[Math.floor(Math.random() * piecesWithMoves.length)];
        const moves = this.board.getValidMoves(piece);
        const move = moves[Math.floor(Math.random() * moves.length)];
        this._makeMove(move);
        return true;
    }

    /**
     * Override BaseGame._getHUDState() — rich status with piece info.
     * @returns {{ text: string, color: string }}
     */
    _getHUDState() {
        const meta = this.board.getMetadata();
        const scoreLabel = ` | Captures: ${this.scoring.score}`;

        if (this.gameOver) {
            return {
                text: `${this.gameOverMessage}${scoreLabel} | Press N for new game`,
                color: '#f87171',
            };
        }

        const isRed = this.currentPlayer === PlayerColor.RED;
        const playerName = isRed ? 'Red' : 'Black';
        return {
            text: `${playerName}'s turn | Red: ${meta.redCount} Black: ${meta.blackCount} | Move: ${meta.moveCount}${scoreLabel}`,
            color: isRed ? '#ff6666' : '#6666ff',
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CheckersGame };
}
