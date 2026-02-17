/**
 * checkers_renderer.js — 4D Checkers Canvas Renderer
 *
 * Extends BaseRenderer to visualize the 4D Checkers board on an HTML5 Canvas.
 *
 * Uses all BaseRenderer methods:
 *   _project(), _drawAxes(), _clearCanvas(), _drawHUD(),
 *   _drawCircle(), _drawDiamond()
 * Plus: GridUtils.depthSort(), Quadray.cellType(), Quadray.toCartesian()
 *
 * Features:
 *  - 3D projection of 4D Quadray positions via BaseRenderer._project()
 *  - Grid node visualization
 *  - Piece rendering (Man / King) with gradients and crowns
 *  - Valid move indicators (green dots, red halos for captures)
 *  - Selection highlight
 *  - Hover tooltip with Quadray coordinates
 *  - Canvas HUD overlay (current player, piece counts, controls hint)
 *  - Game-over overlay
 *
 * @module CheckersRenderer
 */

class CheckersRenderer extends BaseRenderer {
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {Object} board — CheckersBoard instance.
     */
    constructor(canvas, board) {
        super(canvas, board, {
            scale: 50,
            cameraDist: 600,
            rotX: 0.5,
            rotY: 0.7,
            bgColor: '#0a0a0f',
        });

        // Game reference (set by CheckersGame after construction)
        this.game = null;

        this.mouseX = 0;
        this.mouseY = 0;

        // Pre-compute grid positions for drawing
        this.gridPositions = this._computeGridPositions();

        console.log('[CheckersRenderer] Initialized with BaseRenderer + full Quadray projection');
    }

    /**
     * Project a Quadray coordinate to 2D screen space.
     * Convenience wrapper using BaseRenderer._project().
     * @param {Quadray} q
     * @returns {{ x: number, y: number, scale: number }}
     */
    _projectQ(q) {
        return this._project(q.a, q.b, q.c, q.d);
    }

    /**
     * Enumerate all valid grid positions for the board.
     * @returns {Quadray[]}
     */
    _computeGridPositions() {
        const positions = [];
        const size = this.board.size;
        for (let a = 0; a < size; a++) {
            for (let b = 0; b < size; b++) {
                for (let c = 0; c < size; c++) {
                    for (let d = 0; d < size; d++) {
                        positions.push(new Quadray(a, b, c, d));
                    }
                }
            }
        }
        return positions;
    }

    /**
     * Main render loop entry point — uses BaseRenderer infrastructure.
     */
    render() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Background
        this._clearCanvas();

        // Draw Axes
        this._drawAxes();

        // Draw Grid
        this._drawGrid(ctx);

        // Draw Valid Move Indicators (below pieces)
        this._drawMoveIndicators(ctx);

        // Draw Pieces
        this._drawPieces(ctx);

        // Hover tooltip
        if (this.game) {
            let closestDist = 25, hoveredPiece = null;
            for (const piece of this.board.pieces.values()) {
                const p = this._projectQ(piece.position);
                const dx = this.mouseX - p.x, dy = this.mouseY - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < closestDist) { closestDist = dist; hoveredPiece = { piece, p }; }
            }
            if (hoveredPiece) {
                const hp = hoveredPiece, coords = hp.piece.position;
                const label = `Q(${coords.a},${coords.b},${coords.c},${coords.d})`;
                ctx.font = '12px monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
                const tw = ctx.measureText(label).width;
                const tx = this.mouseX + 14, ty = this.mouseY - 10;
                ctx.fillStyle = 'rgba(0,0,0,0.75)';
                ctx.beginPath(); ctx.roundRect(tx - 4, ty - 16, tw + 8, 20, 4); ctx.fill();
                ctx.fillStyle = '#ffffff'; ctx.fillText(label, tx, ty);
            }
        }

        // Draw canvas HUD overlay
        this._drawBoardHUD(ctx, w, h);
    }

    /**
     * Draw grid node dots.
     */
    _drawGrid(ctx) {
        for (const q of this.gridPositions) {
            const p = this._projectQ(q);
            const r = 2 * p.scale;
            ctx.fillStyle = 'rgba(60, 60, 80, 0.4)';
            ctx.beginPath();
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /**
     * Draw each piece on the board.
     */
    _drawPieces(ctx) {
        for (const piece of this.board.pieces.values()) {
            const p = this._projectQ(piece.position);
            const radius = 12 * p.scale;

            // Color
            const isRed = piece.color === 'red';
            const baseColor = isRed ? '#ff4444' : '#5555dd';
            const lightColor = isRed ? '#ff8888' : '#8888ff';

            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.ellipse(p.x + 2, p.y + 3, radius, radius * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();

            // Body
            ctx.beginPath();
            ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
            const grad = ctx.createRadialGradient(p.x - radius * 0.3, p.y - radius * 0.3, 0, p.x, p.y, radius);
            grad.addColorStop(0, lightColor);
            grad.addColorStop(1, baseColor);
            ctx.fillStyle = grad;
            ctx.fill();

            // Outline
            ctx.strokeStyle = isRed ? '#cc2222' : '#3333aa';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // King crown marker
            if (piece.type === 'king') {
                ctx.fillStyle = 'gold';
                ctx.font = `${Math.max(10, radius)}px serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('\u265B', p.x, p.y);
            }

            // Selection highlight
            if (this.game && this.game.selectedPiece === piece) {
                ctx.strokeStyle = '#ffff00';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(p.x, p.y, radius + 4, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Coordinate label
            const coords = piece.position;
            ctx.font = `${8 * p.scale}px monospace`;
            ctx.fillStyle = 'rgba(200,200,255,0.7)';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(`(${coords.a},${coords.b},${coords.c},${coords.d})`, p.x, p.y + radius + 4);
        }
    }

    /**
     * Draw valid move target indicators.
     */
    _drawMoveIndicators(ctx) {
        if (!this.game) return;
        const moves = this.game.possibleMoves;
        if (!moves || moves.length === 0) return;

        for (const move of moves) {
            const p = this._projectQ(move.to);
            const r = 8 * p.scale;

            if (move.type === 'capture') {
                // Red pulse for captures
                ctx.fillStyle = 'rgba(255, 80, 80, 0.5)';
                ctx.beginPath();
                ctx.arc(p.x, p.y, r * 1.5, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.fillStyle = 'rgba(100, 255, 100, 0.5)';
            ctx.beginPath();
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            ctx.fill();

            // Ring
            ctx.strokeStyle = 'rgba(100, 255, 100, 0.8)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }

    /**
     * Draw heads-up display overlay on the canvas.
     */
    _drawBoardHUD(ctx, w, h) {
        if (!this.game) return;
        const game = this.game;
        const redCount = Array.from(game.board.pieces.values()).filter(p => p.color === 'red').length;
        const blackCount = Array.from(game.board.pieces.values()).filter(p => p.color === 'black').length;

        ctx.font = '14px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        // Current player
        const playerLabel = game.currentPlayer === 'red' ? 'Red' : 'Black';
        ctx.fillStyle = game.currentPlayer === 'red' ? '#ff6666' : '#6666ff';
        ctx.fillText(`Turn: ${playerLabel}`, 12, 12);

        // Piece counts
        ctx.fillStyle = '#ff6666';
        ctx.fillText(`Red: ${redCount}`, 12, 32);
        ctx.fillStyle = '#6666ff';
        ctx.fillText(`Black: ${blackCount}`, 12, 52);

        // Controls hint
        ctx.fillStyle = '#666';
        ctx.textAlign = 'right';
        ctx.fillText('Drag rotate | Scroll zoom | Click select', w - 12, 12);

        // Game over message
        if (game.gameOver) {
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(0, h / 2 - 30, w, 60);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 28px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(game.gameOverMessage, w / 2, h / 2);
        }
    }

    /**
     * Hit-test a screen coordinate against piece positions.
     * @param {number} sx - Screen X
     * @param {number} sy - Screen Y
     * @param {string} color - Only test pieces of this color (optional)
     * @returns {CheckersPiece|null}
     */
    hitTestPiece(sx, sy, color = null) {
        let closest = null;
        let bestDist = 20;
        for (const piece of this.board.pieces.values()) {
            if (color && piece.color !== color) continue;
            const p = this._projectQ(piece.position);
            const dist = Math.hypot(p.x - sx, p.y - sy);
            if (dist < bestDist) {
                bestDist = dist;
                closest = piece;
            }
        }
        return closest;
    }

    /**
     * Hit-test a screen coordinate against move targets.
     * @param {number} sx - Screen X
     * @param {number} sy - Screen Y
     * @param {Array} moves - Array of move objects with .to Quadray
     * @returns {Object|null} The matching move, or null
     */
    hitTestMove(sx, sy, moves) {
        if (!moves || moves.length === 0) return null;
        for (const move of moves) {
            const pos = this._projectQ(move.to);
            const dist = Math.hypot(pos.x - sx, pos.y - sy);
            if (dist < 20) return move;
        }
        return null;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CheckersRenderer };
}
