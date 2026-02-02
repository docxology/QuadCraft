/**
 * Game.js - Main Game Controller for 4D Quadray Chess
 * 
 * Handles game logic, turn management, and user interaction.
 * @version 1.0.0
 */

/**
 * Game version constant
 * @constant {string}
 */
const GAME_VERSION = '1.0.0';

/**
 * Default game configuration
 * @constant {Object}
 */
const DEFAULT_CONFIG = {
    boardSize: 4,
    autoPlaySpeed: 1000,  // ms between auto-play moves
    cameraDistance: { min: 200, max: 1000 },
    zoomSpeed: 0.1
};

class Game {
    /**
     * @param {HTMLCanvasElement} canvas
     */
    constructor(canvas) {
        this.board = new Board(4);
        this.renderer = new Renderer(canvas, this.board);
        this.canvas = canvas;

        this.currentPlayer = PlayerColor.WHITE;
        this.selectedPiece = null;
        this.gameOver = false;
        this.moveHistory = [];
        this.autoPlayInterval = null;
        this.autoPlaySpeed = 1000; // ms between moves

        // Camera drag state
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;

        this.setupEventListeners();
        this.startGameLoop();
    }

    /**
     * Set up mouse/touch event listeners.
     */
    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('mouseleave', () => this.isDragging = false);

        // Mouse wheel zoom
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomSpeed = 0.1;
            const delta = e.deltaY > 0 ? 1 + zoomSpeed : 1 - zoomSpeed;
            this.renderer.cameraDistance = Math.max(200, Math.min(1000, this.renderer.cameraDistance * delta));
        }, { passive: false });

        // Touch support
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.onMouseDown({ clientX: touch.clientX, clientY: touch.clientY, button: 0 });
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.onMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
        });
        this.canvas.addEventListener('touchend', () => this.isDragging = false);

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.deselectPiece();
            } else if (e.key === 'r' || e.key === 'R') {
                this.resetGame();
            } else if (e.key >= '1' && e.key <= '9') {
                // Number keys select moves
                this.selectMoveByNumber(parseInt(e.key));
            } else if (e.key === '+' || e.key === '=') {
                // Zoom in
                this.renderer.cameraDistance = Math.max(200, this.renderer.cameraDistance * 0.9);
            } else if (e.key === '-' || e.key === '_') {
                // Zoom out
                this.renderer.cameraDistance = Math.min(1000, this.renderer.cameraDistance * 1.1);
            } else if (e.key === ' ' || e.key === 'm' || e.key === 'M') {
                // Random move
                e.preventDefault();
                this.randomMove();
            } else if (e.key === 'a' || e.key === 'A') {
                // Toggle autoplay
                this.toggleAutoPlay();
            } else if (e.key === 's' && !e.ctrlKey && !e.metaKey) {
                // Save game (plain 's', not Ctrl+S)
                this.exportGame();
            } else if (e.key === 'l' || e.key === 'L') {
                // Load game
                this.importGame();
            }
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
     * Handle mouse down event.
     */
    onMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (e.button === 0) { // Left click
            this.isDragging = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;

            // Check for piece selection or move
            const clickedPos = this.renderer.getPositionAtScreen(x, y);

            if (clickedPos) {
                this.handleClick(clickedPos);
            }
        }
    }

    /**
     * Handle mouse move event.
     */
    onMouseMove(e) {
        if (this.isDragging) {
            const deltaX = e.clientX - this.lastMouseX;
            const deltaY = e.clientY - this.lastMouseY;

            this.renderer.cameraAngleY += deltaX * 0.01;
            this.renderer.cameraAngleX += deltaY * 0.01;

            // Clamp vertical rotation
            this.renderer.cameraAngleX = Math.max(-1.5, Math.min(1.5, this.renderer.cameraAngleX));

            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        }

        // Update hover state
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        this.renderer.hoveredPosition = this.renderer.getPositionAtScreen(x, y);
    }

    /**
     * Handle mouse up event.
     */
    onMouseUp(e) {
        this.isDragging = false;
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

        this.moveHistory.push({ from, to, captured });

        // Check for checkmate or stalemate
        const nextPlayer = this.currentPlayer === PlayerColor.WHITE ? PlayerColor.BLACK : PlayerColor.WHITE;
        const isCheck = this.board.isInCheck(nextPlayer);
        const hasLegalMoves = this.hasLegalMoves(nextPlayer);

        if (!hasLegalMoves) {
            if (isCheck) {
                this.gameOver = true;
                setTimeout(() => {
                    alert(`Checkmate! ${this.currentPlayer.toUpperCase()} wins!`);
                }, 100);
            } else {
                this.gameOver = true;
                setTimeout(() => {
                    alert('Stalemate! The game is a draw.');
                }, 100);
            }
        } else if (captured && captured.type === PieceType.KING) {
            this.gameOver = true;
            setTimeout(() => {
                alert(`${this.currentPlayer.toUpperCase()} wins by capturing the King!`);
            }, 100);
        }

        // Switch turns
        this.currentPlayer = nextPlayer;
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

        console.group('📐 QUADRAY MOVE');
        console.log(`From: (a=${fromNorm.a.toFixed(2)}, b=${fromNorm.b.toFixed(2)}, c=${fromNorm.c.toFixed(2)}, d=${fromNorm.d.toFixed(2)})`);
        console.log(`  To: (a=${toNorm.a.toFixed(2)}, b=${toNorm.b.toFixed(2)}, c=${toNorm.c.toFixed(2)}, d=${toNorm.d.toFixed(2)})`);
        console.log(`Cartesian: (${fromCart.x.toFixed(2)}, ${fromCart.y.toFixed(2)}, ${fromCart.z.toFixed(2)}) → (${toCart.x.toFixed(2)}, ${toCart.y.toFixed(2)}, ${toCart.z.toFixed(2)})`);
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
                    (${fromNorm.a.toFixed(0)},${fromNorm.b.toFixed(0)},${fromNorm.c.toFixed(0)},${fromNorm.d.toFixed(0)}) → 
                    (${toNorm.a.toFixed(0)},${toNorm.b.toFixed(0)},${toNorm.c.toFixed(0)},${toNorm.d.toFixed(0)})
                </div>
                <div class="move-distance">Δ = ${distance.toFixed(2)}</div>
                ${captured ? `<div class="move-capture">✕ ${captured.getSymbol()}</div>` : ''}
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
     * Reset the game to initial state.
     */
    resetGame() {
        this.board = new Board(4);
        this.board.setupInitialPosition();
        this.renderer.board = this.board;
        this.currentPlayer = PlayerColor.WHITE;
        this.selectedPiece = null;
        this.gameOver = false;
        this.moveHistory = [];
        this.deselectPiece();
        console.log('Game reset!');
    }

    /**
     * Start the animation loop.
     */
    startGameLoop() {
        const loop = () => {
            this.renderer.render(this.currentPlayer);
            requestAnimationFrame(loop);
        };
        loop();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // RANDOM MOVE & AUTOPLAY
    // ═══════════════════════════════════════════════════════════════════════

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
        const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];

        console.log(`🎲 Random move: ${randomPiece.type} from ${randomPiece.position.toString()} to ${randomMove.toString()}`);
        this.makeMove(randomPiece.position, randomMove);
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
            console.log('⏹ Auto-play stopped');
            this.updateAutoPlayButton(false);
        } else {
            // Start autoplay
            console.log('▶ Auto-play started');
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
            btn.textContent = isPlaying ? '⏹ Stop' : '▶ Auto';
            btn.classList.toggle('active', isPlaying);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SAVE / LOAD
    // ═══════════════════════════════════════════════════════════════════════

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
        console.log(`💾 Game saved: ${filename}`);
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
                    console.log(`📂 Game loaded: ${data.moveHistory?.length || 0} moves`);
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

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Game };
}
