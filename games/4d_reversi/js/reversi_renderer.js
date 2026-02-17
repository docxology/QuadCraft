/**
 * reversi_renderer.js — 4D Reversi Canvas Renderer
 *
 * Extends BaseRenderer to project Quadray positions to 2D,
 * draw disc pieces with gradient shading, valid-move indicators,
 * hover tooltips, and game-over overlay.
 *
 * Uses all BaseRenderer methods:
 *   _project(), _drawAxes(), _clearCanvas(), _drawHUD(),
 *   _drawCircle(), _drawDiamond()
 * Plus: GridUtils.depthSort(), Quadray.cellType(), Quadray.toString()
 *
 * @module ReversiRenderer
 */

class ReversiRenderer extends BaseRenderer {
    constructor(canvas, board) {
        super(canvas, board, {
            scale: 50,
            cameraDist: 600,
            rotX: 0.5,
            rotY: 0.7,
            bgColor: '#0a0a12',
        });
        this.mouseX = 0;
        this.mouseY = 0;
        this.isDragging = false;

        // These will be set externally by the game controller
        this.validMoves = [];
        this.currentPlayer = 'black';
        this.gameOver = false;
        this.gameOverMessage = '';

        console.log('[ReversiRenderer] Initialized with BaseRenderer + full quadray methods');
    }

    /**
     * Project a Quadray coordinate to 2D screen space.
     * Wraps BaseRenderer._project() for Quadray object input.
     * @param {Quadray} q
     * @returns {{ x: number, y: number, scale: number }}
     */
    _projectQ(q) {
        return this._project(q.a, q.b, q.c, q.d);
    }

    /**
     * Main render loop — uses BaseRenderer infrastructure.
     */
    render() {
        this._clearCanvas();
        this._drawAxes();

        this._drawGrid();
        this._drawValidMoves();
        this._drawDiscs();
        this._drawHoverTooltip();
        this._drawBoardHUD();
        this._drawGameOver();
    }

    /** Draw small dots for all grid positions. */
    _drawGrid() {
        const positions = this.board.allPositions();
        for (const q of positions) {
            const p = this._projectQ(q);
            this.ctx.fillStyle = 'rgba(50,50,70,0.3)';
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 2 * p.scale, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    /** Draw valid move indicators (green circles). */
    _drawValidMoves() {
        for (const m of this.validMoves) {
            const p = this._projectQ(m.pos);
            this.ctx.fillStyle = 'rgba(100,255,100,0.25)';
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 10 * p.scale, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.strokeStyle = 'rgba(100,255,100,0.5)';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        }
    }

    /** Draw all placed discs with depth sorting and gradient shading. */
    _drawDiscs() {
        const cells = this.board.getCells();
        if (cells.length === 0) return;

        // Use GridUtils.depthSort() for proper back-to-front rendering
        const sorted = GridUtils.depthSort(cells, (a, b, c, d) => this._project(a, b, c, d));

        for (const cell of sorted) {
            const r = 11 * (cell.pScale || 1);
            if (r < 1) continue;
            const isBlack = cell.player === 'black';
            const grad = this.ctx.createRadialGradient(
                cell.px - r * 0.3, cell.py - r * 0.3, 0,
                cell.px, cell.py, r
            );
            grad.addColorStop(0, isBlack ? '#666' : '#fff');
            grad.addColorStop(1, isBlack ? '#222' : '#ccc');
            this.ctx.fillStyle = grad;
            this.ctx.beginPath();
            this.ctx.arc(cell.px, cell.py, r, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.strokeStyle = isBlack ? '#444' : '#999';
            this.ctx.lineWidth = 1.5;
            this.ctx.stroke();
            // Coordinate label
            this.ctx.fillStyle = isBlack ? '#999' : '#444';
            this.ctx.font = `${7 * (cell.pScale || 1)}px monospace`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'top';
            this.ctx.fillText(`(${cell.a},${cell.b},${cell.c},${cell.d})`, cell.px, cell.py + r + 2);
        }
    }

    /** Draw hover tooltip for nearby disc. */
    _drawHoverTooltip() {
        if (this.isDragging) return;
        let closestDist = 25, hoveredDisc = null;
        for (const [key, color] of this.board.grid.entries()) {
            const coords = GridUtils.parseKey(key);
            const q = new Quadray(coords.a, coords.b, coords.c, coords.d);
            const p = this._projectQ(q);
            const dx = this.mouseX - p.x, dy = this.mouseY - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < closestDist) { closestDist = dist; hoveredDisc = { coords, p }; }
        }
        if (hoveredDisc) {
            const hd = hoveredDisc;
            const label = `Q(${hd.coords.a},${hd.coords.b},${hd.coords.c},${hd.coords.d})`;
            this.ctx.font = '12px monospace';
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'bottom';
            const tw = this.ctx.measureText(label).width;
            const tx = this.mouseX + 14, ty = this.mouseY - 10;
            this.ctx.fillStyle = 'rgba(0,0,0,0.75)';
            this.ctx.beginPath();
            this.ctx.roundRect(tx - 4, ty - 16, tw + 8, 20, 4);
            this.ctx.fill();
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText(label, tx, ty);
        }
    }

    /**
     * Draw HUD overlay on the canvas using BaseRenderer._drawHUD().
     */
    _drawBoardHUD() {
        const meta = this.board.getMetadata();
        const lines = [
            `Turn: ${this.currentPlayer === 'black' ? 'Black' : 'White'} | Move: ${meta.moveCount}`,
            `Black: ${meta.blackCount} | White: ${meta.whiteCount}`,
            `Vol T:O:C=${meta.volumeRatios.tetra}:${meta.volumeRatios.octa}:${meta.volumeRatios.cubo}`,
        ];
        this._drawHUD(lines, { color: 'rgba(148, 163, 184, 0.7)', fontSize: 11 });
    }

    /** Draw game-over overlay banner. */
    _drawGameOver() {
        if (!this.gameOver) return;
        this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
        this.ctx.fillRect(0, this.canvas.height / 2 - 30, this.canvas.width, 60);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 24px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(this.gameOverMessage, this.canvas.width / 2, this.canvas.height / 2);
    }

    /**
     * Hit-test a screen coordinate against valid move positions.
     * @param {number} sx - Screen X
     * @param {number} sy - Screen Y
     * @returns {{ pos: Quadray, flips: Array }|null}
     */
    hitTest(sx, sy) {
        for (const move of this.validMoves) {
            const p = this._projectQ(move.pos);
            if (Math.hypot(p.x - sx, p.y - sy) < 18) {
                return move;
            }
        }
        return null;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ReversiRenderer };
}
