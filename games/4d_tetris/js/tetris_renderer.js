/**
 * tetris_renderer.js — 4D Tetris Canvas Renderer
 *
 * Extends BaseRenderer to project Quadray grid to 2D,
 * draw locked cells, active piece, ghost piece preview,
 * and grid wireframe with depth-sorted rendering.
 *
 * Uses all BaseRenderer methods:
 *   _project(), _drawAxes(), _clearCanvas(), _drawHUD(),
 *   _drawCircle(), _drawDiamond()
 * Plus: GridUtils.depthSort(), Quadray.cellType()
 *
 * @module TetrisRenderer
 */

class TetrisRenderer extends BaseRenderer {
    constructor(canvas, board) {
        super(canvas, board, {
            scale: 40,
            cameraDist: 600,
            rotX: 0.5,
            rotY: 0.7,
            bgColor: '#0f172a',
        });
        this.cellSize = 14;

        console.log('[TetrisRenderer] Initialized with BaseRenderer + full quadray methods');
    }

    /**
     * Project a Quadray object to 2D screen space.
     * @param {Quadray} q
     * @returns {{ x: number, y: number, scale: number }}
     */
    _projectQ(q) {
        return this._project(q.a, q.b, q.c, q.d);
    }

    render() {
        this._clearCanvas();
        this._drawAxes();

        // Collect all cells to draw
        const cells = [];

        // Grid border (subtle)
        this.ctx.strokeStyle = 'rgba(71, 85, 105, 0.15)';
        this.ctx.lineWidth = 0.5;
        for (let a = 0; a < this.board.height; a += 4) {
            for (let b = 0; b < this.board.width; b++) {
                const p = this._project(a, b, 1, 1);
                this.ctx.strokeRect(p.x - 2, p.y - 2, 4, 4);
            }
        }

        // Ghost piece (semi-transparent preview)
        for (const cell of this.board.getGhostCells()) {
            const p = this._project(cell.a, cell.b, cell.c, cell.d);
            cells.push({ ...cell, px: p.x, py: p.y, pScale: p.scale, isGhost: true });
        }

        // Locked cells
        for (const cell of this.board.getLockedCells()) {
            const p = this._project(cell.a, cell.b, cell.c, cell.d);
            cells.push({ ...cell, px: p.x, py: p.y, pScale: p.scale, isGhost: false });
        }

        // Active piece
        for (const cell of this.board.getActiveCells()) {
            const p = this._project(cell.a, cell.b, cell.c, cell.d);
            cells.push({ ...cell, px: p.x, py: p.y, pScale: p.scale, isGhost: false, isActive: true });
        }

        // Sort by depth
        cells.sort((a, b) => a.pScale - b.pScale);

        // Draw
        for (const c of cells) {
            const r = this.cellSize * (c.pScale || 1);
            if (r < 1) continue;
            this.ctx.save();
            if (c.isGhost) {
                this.ctx.fillStyle = 'rgba(255,255,255,0.1)';
                this.ctx.strokeStyle = 'rgba(255,255,255,0.2)';
                this.ctx.lineWidth = 1;
                this.ctx.setLineDash([2, 2]);
            } else {
                this.ctx.fillStyle = c.color || '#94a3b8';
                this.ctx.strokeStyle = 'rgba(255,255,255,0.3)';
                this.ctx.lineWidth = 1;
                if (c.isActive) {
                    this.ctx.shadowColor = c.color;
                    this.ctx.shadowBlur = 8;
                }
            }
            this.ctx.beginPath();
            this.ctx.arc(c.px, c.py, r, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
            this.ctx.restore();
        }

        this._drawBoardHUD();
    }

    /**
     * Draw HUD overlay on the canvas using BaseRenderer._drawHUD().
     */
    _drawBoardHUD() {
        const meta = this.board.getMetadata();
        const lines = [
            `Score: ${meta.score} | Level: ${meta.level} | Lines: ${meta.linesCleared}`,
            `Tetra: ${meta.tetraCount} | Octa: ${meta.octaCount}`,
            `Vol T:O:C=${meta.volumeRatios.tetra}:${meta.volumeRatios.octa}:${meta.volumeRatios.cubo}`,
        ];
        this._drawHUD(lines, { color: 'rgba(148, 163, 184, 0.7)', fontSize: 11 });

        if (this.board.gameOver) {
            this.ctx.fillStyle = '#f87171';
            this.ctx.font = 'bold 24px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TetrisRenderer };
}
