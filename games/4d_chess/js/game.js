/**
 * game.js — 4D Quadray Chess Game Controller
 *
 * Extends BaseGame for lifecycle, camera sync, input, and HUD management.
 * Integrates HUD, ScoreManager, and geometric verification with Quadray-native evaluation.
 *
 * Uses:
 *   - BaseGame: init, togglePause, reset, _syncCamera, _updateHUD, _setupBaseInput
 *   - HUD: set, gameOver, paused, playing, warning
 *   - ScoreManager: addScore, reset, toJSON
 *   - verifyGeometricIdentities: startup integrity check
 *   - angleBetweenQuadrays: analysis
 *   - GridUtils: manhattan, euclidean, shuffle
 *   - Quadray: distance, distanceTo, toKey, normalized, clone
 *
 * Controls:
 *   Click       : Select piece / make move
 *   1-9         : Select numbered move
 *   Escape      : Deselect piece
 *   N           : New game / Reset
 *   R           : Reset
 *   P           : Pause
 *   Space/M     : Random move
 *   A           : Toggle auto-play
 *   S           : Save game
 *   L           : Load game
 *   +/-         : Zoom
 *   Drag        : Rotate camera
 *
 * @module ChessGame
 */

/**
 * Game version constant
 * @constant {string}
 */
const GAME_VERSION = '1.0.0';

class Game extends BaseGame {
    /**
     * @param {HTMLCanvasElement} canvas - Main game canvas
     * @param {HTMLElement} hudElement - HUD display element
     */
    constructor(canvas, hudElement) {
        const board = new Board(4);
        const renderer = new Renderer(canvas, board);
        super(canvas, hudElement, board, renderer, {
            name: 'ChessGame',
            tickRate: 1000 / 30,
            zoomOpts: { min: 20, max: 120 },
            cameraMode: 'shift-drag',
        });

        // Score tracking via ScoreManager
        this.scoring = new ScoreManager({
            lives: 0,    // unlimited -- turn-based game
            levelThreshold: 5,  // level up every 5 wins
            storageKey: 'chess4D_highScore',
        });

        // Chess-specific state
        this.turnManager = new TurnManager([PlayerColor.WHITE, PlayerColor.BLACK], { maxHistory: 1000 });
        this.selectedPiece = null;
        this.gameOver = false;
        this.autoPlayInterval = null;
        this.autoPlaySpeed = 1000; // ms between moves

        // First-person view renderer (optional -- set up after init if fpvCanvas exists)
        this.fpvRenderer = null;

        // Startup integrity check
        this._runGeometricVerification();
    }

    get currentPlayer() { return this.turnManager.currentPlayer; }
    get moveHistory() { return this.turnManager.moveHistory; }

    /** Run verifyGeometricIdentities() on startup and log results. */
    _runGeometricVerification() {
        if (typeof verifyGeometricIdentities !== 'function') return;
        const results = verifyGeometricIdentities();
        const passCount = results.checks.filter(c => c.passed).length;
        const totalCount = results.checks.length;
        if (results.allPassed) {
            console.log(`[ChessGame] Geometric verification: ${passCount}/${totalCount} checks passed`);
        } else {
            console.warn(`[ChessGame] Geometric verification: ${passCount}/${totalCount} checks passed`);
            results.checks.filter(c => !c.passed).forEach(c =>
                console.warn(`  FAIL ${c.name}: expected ${c.expected}, got ${JSON.stringify(c.actual)}`)
            );
        }
    }

    /**
     * Override BaseGame._setupGameInput() -- bind game-specific keys.
     */
    _setupGameInput() {
        this.input.bind(['n'], () => this.resetGame());
        this.input.bind(['Escape'], () => this.deselectPiece());
        this.input.bind([' ', 'm'], () => this.randomMove());
        this.input.bind(['a'], () => this.toggleAutoPlay());
        this.input.bind(['s'], () => this.exportGame());
        this.input.bind(['l'], () => this.importGame());
        this.input.bind(['1'], () => this.selectMoveByNumber(1));
        this.input.bind(['2'], () => this.selectMoveByNumber(2));
        this.input.bind(['3'], () => this.selectMoveByNumber(3));
        this.input.bind(['4'], () => this.selectMoveByNumber(4));
        this.input.bind(['5'], () => this.selectMoveByNumber(5));
        this.input.bind(['6'], () => this.selectMoveByNumber(6));
        this.input.bind(['7'], () => this.selectMoveByNumber(7));
        this.input.bind(['8'], () => this.selectMoveByNumber(8));
        this.input.bind(['9'], () => this.selectMoveByNumber(9));
        this.input.bind(['+', '='], () => {
            this.renderer.scale = Math.min(120, this.renderer.scale * 1.08);
        });
        this.input.bind(['-', '_'], () => {
            this.renderer.scale = Math.max(20, this.renderer.scale * 0.92);
        });
    }

    /**
     * Override BaseGame.init() -- add mouse bindings and optional FPV.
     */
    init() {
        this._bindMouse();
        super.init();
    }

    /**
     * Set up the optional first-person view renderer.
     * @param {HTMLCanvasElement} fpvCanvas
     */
    setupFPV(fpvCanvas) {
        if (fpvCanvas && typeof FPVRenderer !== 'undefined') {
            this.fpvRenderer = new FPVRenderer(fpvCanvas, this.board);
        }
    }

    /**
     * Override: Called every tick via game loop.
     * Chess is turn-based, so we only render (no auto-stepping).
     * The render callback in BaseGame already calls renderer.render().
     */
    update() {
        // Sync current player to renderer for HUD display
        this.renderer.currentPlayer = this.currentPlayer;

        // Render FPV if available
        if (this.fpvRenderer) {
            this.fpvRenderer.render();
        }
    }

    /** Bind mouse click and move events. */
    _bindMouse() {
        // Click handler
        this.canvas.addEventListener('click', (e) => {
            if (this.gameOver) return;
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const clickedPos = this.renderer.getPositionAtScreen(x, y);
            if (clickedPos) {
                this.handleClick(clickedPos);
            }
        });

        // Hover
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.renderer.hoveredPosition = this.renderer.getPositionAtScreen(x, y);
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.renderer.hoveredPosition = null;
        });
    }

    /**
     * Select a move by number (1-9).
     * @param {number} num
     */
    selectMoveByNumber(num) {
        if (!this.selectedPiece || this.renderer.validMoves.length === 0) {
            console.log('Select a piece first, then press 1-9 to choose a move.');
            return;
        }

        const index = num - 1;
        if (index >= 0 && index < this.renderer.validMoves.length) {
            const move = this.renderer.validMoves[index];
            this.makeMove(this.selectedPiece.position, move);
            console.log(`Move ${num} executed!`);
        } else {
            console.log(`Move ${num} not available. Only ${this.renderer.validMoves.length} moves.`);
        }
    }

    /**
     * Handle a click on the board.
     * @param {Quadray} position
     */
    handleClick(position) {
        if (this.gameOver) return;

        const clickedPiece = this.board.getPieceAt(position);

        if (this.selectedPiece) {
            // Check if clicking on a valid move
            const isValidMove = this.renderer.validMoves.some(m => m.equals(position));

            if (isValidMove) {
                this.makeMove(this.selectedPiece.position, position);
            } else if (clickedPiece && clickedPiece.color === this.currentPlayer) {
                // Select a different piece
                this.selectPiece(clickedPiece);
            } else {
                // Deselect
                this.deselectPiece();
            }
        } else if (clickedPiece && clickedPiece.color === this.currentPlayer) {
            // Select this piece
            this.selectPiece(clickedPiece);
        }
    }

    /**
     * Select a piece and show its valid moves.
     * @param {Piece} piece
     */
    selectPiece(piece) {
        this.selectedPiece = piece;
        this.renderer.selectedPiece = piece;
        this.renderer.validMoves = piece.getValidMoves(this.board);

        // Update FPV renderer
        if (this.fpvRenderer) {
            this.fpvRenderer.setPiece(piece);
            this.fpvRenderer.setValidMoves(this.renderer.validMoves);
        }

        console.log(`Selected ${piece.color} ${piece.type} at ${piece.position.toString()}`);
        console.log(`Valid moves: ${this.renderer.validMoves.length}`);

        // Update move buttons UI
        this.updateMoveButtons();
    }

    /**
     * Deselect the current piece.
     */
    deselectPiece() {
        this.selectedPiece = null;
        this.renderer.selectedPiece = null;
        this.renderer.validMoves = [];

        // Clear FPV renderer
        if (this.fpvRenderer) {
            this.fpvRenderer.setPiece(null);
            this.fpvRenderer.setValidMoves([]);
        }

        this.updateMoveButtons();
    }

    /**
     * Update the move buttons UI based on available moves.
     */
    updateMoveButtons() {
        const moveHint = document.getElementById('move-hint');

        for (let i = 1; i <= 9; i++) {
            const btn = document.getElementById(`move-btn-${i}`);
            if (!btn) continue;

            if (i <= this.renderer.validMoves.length) {
                btn.disabled = false;
                const move = this.renderer.validMoves[i - 1].normalized();
                btn.title = `Move to (${move.a},${move.b},${move.c},${move.d})`;
            } else {
                btn.disabled = true;
                btn.title = '';
            }
        }

        if (moveHint) {
            if (this.renderer.validMoves.length > 0) {
                moveHint.textContent = `${this.renderer.validMoves.length} move${this.renderer.validMoves.length !== 1 ? 's' : ''} available`;
                moveHint.style.color = '#9966ff';
            } else if (this.selectedPiece) {
                moveHint.textContent = 'No valid moves for this piece';
                moveHint.style.color = '#ff6666';
            } else {
                moveHint.textContent = 'Select a piece to see moves';
                moveHint.style.color = '#666';
            }
        }
    }

    /**
     * Make a move from one position to another.
     * @param {Quadray} from
     * @param {Quadray} to
     */
    makeMove(from, to) {
        const captured = this.board.movePiece(from, to);

        // Log detailed math for the move
        this.logMoveMath(from, to, captured);

        // Record the move and advance the turn
        this.turnManager.recordAndAdvance({ from, to, captured });

        // Track score for captures
        if (captured) {
            this.scoring.addScore(1);
        }

        // Check for checkmate or stalemate
        const nextPlayer = this.currentPlayer; // already advanced
        const isCheck = this.board.isInCheck(nextPlayer);
        const hasLegalMoves = this.hasLegalMoves(nextPlayer);

        if (!hasLegalMoves) {
            if (isCheck) {
                this.gameOver = true;
                this.board.gameOver = true;
                setTimeout(() => {
                    alert(`Checkmate! ${this.turnManager.opponent.toUpperCase()} wins!`);
                }, 100);
            } else {
                this.gameOver = true;
                this.board.gameOver = true;
                setTimeout(() => {
                    alert('Stalemate! The game is a draw.');
                }, 100);
            }
        } else if (captured && captured.type === PieceType.KING) {
            this.gameOver = true;
            this.board.gameOver = true;
            setTimeout(() => {
                alert(`${this.turnManager.opponent.toUpperCase()} wins by capturing the King!`);
            }, 100);
        }

        this.deselectPiece();
    }

    /**
     * Log detailed math for a move.
     */
    logMoveMath(from, to, captured) {
        const fromNorm = from.normalized();
        const toNorm = to.normalized();
        const fromCart = from.toCartesian();
        const toCart = to.toCartesian();
        const distance = Quadray.distance(from, to);

        console.group('QUADRAY MOVE');
        console.log(`From: (a=${fromNorm.a.toFixed(2)}, b=${fromNorm.b.toFixed(2)}, c=${fromNorm.c.toFixed(2)}, d=${fromNorm.d.toFixed(2)})`);
        console.log(`  To: (a=${toNorm.a.toFixed(2)}, b=${toNorm.b.toFixed(2)}, c=${toNorm.c.toFixed(2)}, d=${toNorm.d.toFixed(2)})`);
        console.log(`Cartesian: (${fromCart.x.toFixed(2)}, ${fromCart.y.toFixed(2)}, ${fromCart.z.toFixed(2)}) -> (${toCart.x.toFixed(2)}, ${toCart.y.toFixed(2)}, ${toCart.z.toFixed(2)})`);
        console.log(`Distance traveled: ${distance.toFixed(3)} units`);
        if (captured) {
            console.log(`Captured: ${captured.color} ${captured.type}`);
        }
        console.groupEnd();

        // Update HTML math panel if it exists
        this.updateMathPanel(from, to, distance, captured);
    }

    /**
     * Update the HTML math panel with move details.
     */
    updateMathPanel(from, to, distance, captured) {
        const panel = document.getElementById('move-history-content');
        if (!panel) return;

        const fromNorm = from.normalized();
        const toNorm = to.normalized();

        const moveHtml = `
            <div class="move-entry">
                <div class="move-coords">
                    (${fromNorm.a.toFixed(0)},${fromNorm.b.toFixed(0)},${fromNorm.c.toFixed(0)},${fromNorm.d.toFixed(0)}) ->
                    (${toNorm.a.toFixed(0)},${toNorm.b.toFixed(0)},${toNorm.c.toFixed(0)},${toNorm.d.toFixed(0)})
                </div>
                <div class="move-distance">d = ${distance.toFixed(2)}</div>
                ${captured ? `<div class="move-capture">x ${captured.getSymbol()}</div>` : ''}
            </div>
        `;

        panel.innerHTML = moveHtml + panel.innerHTML;

        // Keep only last 5 moves
        const entries = panel.querySelectorAll('.move-entry');
        if (entries.length > 5) {
            entries[entries.length - 1].remove();
        }
    }

    /**
     * Check if a player has any legal moves.
     * @param {string} color
     * @returns {boolean}
     */
    hasLegalMoves(color) {
        const pieces = this.board.getPiecesByColor(color);
        for (const piece of pieces) {
            if (piece.getValidMoves(this.board).length > 0) {
                return true;
            }
        }
        return false;
    }

    /**
     * Override BaseGame.reset() -- reset game to initial state.
     */
    reset() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
        this.scoring.reset();
        this.board.reset();
        this.renderer.board = this.board;

        // Sync FPV renderer with new board
        if (this.fpvRenderer) {
            this.fpvRenderer.board = this.board;
        }

        this.turnManager.reset();
        this.selectedPiece = null;
        this.gameOver = false;
        this.board.gameOver = false;
        this.deselectPiece();
        console.log('[ChessGame] Game reset');
    }

    /**
     * Alias for reset (backward compat with UI buttons).
     */
    resetGame() {
        this.reset();
    }

    /**
     * Override BaseGame._getHUDState() -- rich status with chess info.
     * @returns {{ text: string, color: string }}
     */
    _getHUDState() {
        const meta = this.board.getMetadata();
        const scoreLabel = ` | Wins: ${this.scoring.score}`;
        const isCheck = this.board.isInCheck(this.currentPlayer);

        if (this.gameOver) {
            return {
                text: `GAME OVER | ${this.currentPlayer === PlayerColor.WHITE ? 'Black' : 'White'} wins!${scoreLabel} | Press N`,
                color: '#f87171',
            };
        }

        if (isCheck) {
            return {
                text: `CHECK! ${this.currentPlayer.toUpperCase()}'s Turn | Move: ${this.moveHistory.length}${scoreLabel}`,
                color: '#ff4444',
            };
        }

        return {
            text: `${this.currentPlayer.toUpperCase()}'s Turn | Move: ${this.moveHistory.length} | W:${meta.whitePieces} B:${meta.blackPieces}${scoreLabel}`,
            color: '#94a3b8',
        };
    }

    // =====================================================================
    // RANDOM MOVE & AUTOPLAY
    // =====================================================================

    /**
     * Make a random valid move for the current player.
     * @returns {boolean} Whether a move was made
     */
    randomMove() {
        if (this.gameOver) {
            console.log('Game is over - no moves available');
            return false;
        }

        // Get all pieces that have valid moves
        const pieces = this.board.getPiecesByColor(this.currentPlayer);
        const piecesWithMoves = pieces.filter(p => p.getValidMoves(this.board).length > 0);

        if (piecesWithMoves.length === 0) {
            console.log('No valid moves available');
            return false;
        }

        // Pick a random piece
        const randomPiece = piecesWithMoves[Math.floor(Math.random() * piecesWithMoves.length)];
        const validMoves = randomPiece.getValidMoves(this.board);

        // Pick a random move
        const randomMovePos = validMoves[Math.floor(Math.random() * validMoves.length)];

        console.log(`Random move: ${randomPiece.type} from ${randomPiece.position.toString()} to ${randomMovePos.toString()}`);
        this.makeMove(randomPiece.position, randomMovePos);
        return true;
    }

    /**
     * Toggle automatic random play mode.
     */
    toggleAutoPlay() {
        if (this.autoPlayInterval) {
            // Stop autoplay
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
            console.log('Auto-play stopped');
            this.updateAutoPlayButton(false);
        } else {
            // Start autoplay
            console.log('Auto-play started');
            this.updateAutoPlayButton(true);
            this.autoPlayInterval = setInterval(() => {
                if (!this.randomMove()) {
                    this.toggleAutoPlay(); // Stop if no moves
                }
            }, this.autoPlaySpeed);
        }
    }

    /**
     * Update autoplay button state in UI.
     * @param {boolean} isPlaying
     */
    updateAutoPlayButton(isPlaying) {
        const btn = document.getElementById('autoplay-btn');
        if (btn) {
            btn.textContent = isPlaying ? 'Stop' : 'Auto';
            btn.classList.toggle('active', isPlaying);
        }
    }

    // =====================================================================
    // SAVE / LOAD
    // =====================================================================

    /**
     * Serialize game state to JSON.
     * @returns {object} Serialized game state
     */
    toJSON() {
        return exportGameState(this);
    }

    /**
     * Restore game state from JSON.
     * @param {object} data - Serialized game state
     * @returns {boolean} Success status
     */
    fromJSON(data) {
        const success = importGameState(data, this);
        if (success) {
            this.renderer.board = this.board;
        }
        return success;
    }

    /**
     * Export game state to downloadable JSON file.
     */
    exportGame() {
        const data = this.toJSON();
        const filename = generateSaveFilename();
        downloadJSON(data, filename);
        console.log(`Game saved: ${filename}`);
    }

    /**
     * Import game state from file picker.
     */
    importGame() {
        // Create hidden file input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            handleFileUpload(file, (data, error) => {
                if (error) {
                    console.error('Failed to load game:', error);
                    alert('Failed to load game file');
                    return;
                }

                if (this.fromJSON(data)) {
                    console.log(`Game loaded: ${data.moveHistory?.length || 0} moves`);
                    // Clear move history display
                    const panel = document.getElementById('move-history-content');
                    if (panel) {
                        panel.innerHTML = '<p style="color: #66ff66; font-style: italic;">Game loaded!</p>';
                    }
                } else {
                    alert('Invalid save file format');
                }
            });
        };

        input.click();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Game };
}
