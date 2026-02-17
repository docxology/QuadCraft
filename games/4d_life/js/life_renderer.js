/**
 * life_renderer.js — 4D Conway's Life Canvas Renderer
 *
 * Extends BaseRenderer to project Quadray positions to 2D,
 * draw alive cells with glow effects, quadray axes, hover tooltips,
 * and IVM cell-type parity (tetra=diamond, octa=circle).
 *
 * Uses all BaseRenderer methods:
 *   _project(), _drawAxes(), _clearCanvas(), _drawHUD(),
 *   _drawCircle(), _drawDiamond()
 * Plus: GridUtils.depthSort(), Quadray.cellType(), Quadray.toString()
 *
 * @module LifeRenderer
 */

class LifeRenderer extends BaseRenderer {
    constructor(canvas, board) {
        super(canvas, board, {
            scale: 25,
            cameraDist: 5,
            rotX: 0.4,
            rotY: 0.6,
            bgColor: '#050510',
        });

        this.mouseX = 0;
        this.mouseY = 0;
        this.isDragging = false;

        // Track mouse position for hover tooltips
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        });

        console.log('[LifeRenderer] Initialized with BaseRenderer + full quadray projection');
    }

    /**
     * Main render loop — uses BaseRenderer infrastructure.
     */
    render() {
        this._clearCanvas();
        this._drawAxes();

        const cells = this.board.getAliveCells();

        this._drawGlow(cells);
        this._drawCells(cells);
        this._drawHoverTooltip(cells);
        this._drawBoardHUD(cells);
    }

    /**
     * Draw soft glow effect behind alive cells.
     * @param {Array} cells — Alive cell objects from board.getAliveCells()
     */
    _drawGlow(cells) {
        const ctx = this.ctx;
        for (const cell of cells) {
            const p = this._project(cell.a, cell.b, cell.c, cell.d);
            const r = 6 * (p.scale || 1);
            const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3);
            g.addColorStop(0, 'rgba(0,255,180,0.3)');
            g.addColorStop(1, 'rgba(0,255,180,0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(p.x, p.y, r * 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /**
     * Draw alive cells with depth sorting and parity-based shapes.
     * Tetra cells are drawn as diamonds, octa cells as circles.
     * Uses GridUtils.depthSort() for proper back-to-front rendering.
     * @param {Array} cells — Alive cell objects from board.getAliveCells()
     */
    _drawCells(cells) {
        if (cells.length === 0) return;

        // Use GridUtils.depthSort() for rendering order
        const sorted = GridUtils.depthSort(cells, (a, b, c, d) => this._project(a, b, c, d));

        for (const cell of sorted) {
            const r = 4 * (cell.pScale || 1);
            if (r < 0.5) continue;

            if (cell.cellType === 'octa') {
                // Octahedral cells as circles (slightly different color)
                this._drawCircle(cell.px, cell.py, r, '#00dda0');
                // Subtle outline
                this.ctx.strokeStyle = 'rgba(0,255,180,0.4)';
                this.ctx.lineWidth = 0.5;
                this.ctx.beginPath();
                this.ctx.arc(cell.px, cell.py, r, 0, Math.PI * 2);
                this.ctx.stroke();
            } else {
                // Tetrahedral cells as diamonds
                this._drawDiamond(cell.px, cell.py, r, '#00ffb4', 'rgba(0,255,180,0.4)');
            }
        }
    }

    /**
     * Draw hover tooltip showing Quadray coordinates of nearest cell.
     * @param {Array} cells — Alive cell objects
     */
    _drawHoverTooltip(cells) {
        const ctx = this.ctx;
        let closestDist = 20, hoveredCell = null;

        for (const cell of cells) {
            const p = this._project(cell.a, cell.b, cell.c, cell.d);
            const dx = this.mouseX - p.x, dy = this.mouseY - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < closestDist) {
                closestDist = dist;
                hoveredCell = { cell, p };
            }
        }

        if (hoveredCell) {
            const { cell, p } = hoveredCell;
            const label = `Q(${cell.a},${cell.b},${cell.c},${cell.d}) [${cell.cellType}]`;
            ctx.font = '12px monospace';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'bottom';
            const tw = ctx.measureText(label).width;
            const tx = this.mouseX + 14, ty = this.mouseY - 10;

            ctx.fillStyle = 'rgba(0,0,0,0.75)';
            ctx.beginPath();
            ctx.roundRect(tx - 4, ty - 16, tw + 8, 20, 4);
            ctx.fill();

            ctx.fillStyle = '#00ffb4';
            ctx.fillText(label, tx, ty);
        }
    }

    /**
     * Draw board HUD overlay on the canvas using BaseRenderer._drawHUD().
     * @param {Array} cells — Alive cell objects
     */
    _drawBoardHUD(cells) {
        const meta = this.board.getMetadata();
        const lines = [
            `Gen: ${meta.generation} | Cells: ${meta.livingCells} | Peak: ${meta.peakPopulation}`,
            `Tetra: ${meta.tetraCount} | Octa: ${meta.octaCount} | TV: ${meta.populationTV.toFixed(1)}`,
            `Vol T:O:C=${meta.volumeRatios.tetra}:${meta.volumeRatios.octa}:${meta.volumeRatios.cubo}`,
        ];
        this._drawHUD(lines, { color: 'rgba(0,255,180,0.5)', fontSize: 11 });
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LifeRenderer };
}
