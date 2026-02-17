/**
 * minesweeper_renderer.js — 4D Minesweeper Canvas Renderer
 *
 * Extends BaseRenderer to project Quadray grid positions to 2D canvas
 * with perspective. Draws cells as colored circles: hidden (gray),
 * revealed (blue), mines (red), flags (yellow). Numbers show adjacent
 * mine count with classic Minesweeper color coding.
 *
 * Uses all BaseRenderer methods:
 *   _project(), _drawAxes(), _clearCanvas(), _drawHUD(),
 *   _drawCircle(), _drawDiamond()
 * Plus: GridUtils.depthSort(), Quadray.cellType(), Quadray.toString()
 *
 * @module MinesweeperRenderer
 */

class MinesweeperRenderer extends BaseRenderer {
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {MinesweeperBoard} board
     */
    constructor(canvas, board) {
        super(canvas, board, {
            scale: 50,
            cameraDist: 600,
            rotX: 0.4,
            rotY: 0.7,
            bgColor: '#0a0a12',
        });
        this.cellRadius = 12;
        this.projectedCells = []; // For click hit-testing

        console.log('[MinesweeperRenderer] Initialized with BaseRenderer + full quadray methods');
    }

    /** Number-color map (classic Minesweeper colors). */
    static NUMBER_COLORS = {
        0: 'transparent',
        1: '#60a5fa',  // blue
        2: '#4ade80',  // green
        3: '#f87171',  // red
        4: '#818cf8',  // indigo
        5: '#c084fc',  // purple
        6: '#2dd4bf',  // teal
        7: '#fbbf24',  // amber
        8: '#f472b6',  // pink
    };

    /**
     * Main render loop — uses BaseRenderer infrastructure.
     */
    render() {
        this._clearCanvas();
        this._drawAxes();

        // Project and sort cells by depth using GridUtils.depthSort()
        const cells = this.board.getCells();
        this.projectedCells = GridUtils.depthSort(
            cells,
            (a, b, c, d) => this._project(a, b, c, d)
        );

        // Draw each cell
        for (const cell of this.projectedCells) {
            this._drawCell(cell);
        }

        // On-canvas HUD overlay
        this._drawBoardHUD();
    }

    /** Draw a single cell. */
    _drawCell(cell) {
        const { ctx } = this;
        const r = this.cellRadius * (cell.pScale || 1);
        if (r < 1) return; // Too small to see

        ctx.save();

        switch (cell.state) {
            case 'hidden':
                if (cell.cellType === 'tetra') {
                    this._drawDiamond(cell.px, cell.py, r * 0.8,
                        'rgba(100, 116, 139, 0.6)', 'rgba(148, 163, 184, 0.4)');
                } else {
                    ctx.fillStyle = 'rgba(100, 116, 139, 0.6)';
                    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.arc(cell.px, cell.py, r, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                }
                break;

            case 'revealed': {
                const alpha = Math.min(0.8, 0.3 + (cell.pScale || 1) * 0.3);
                if (cell.count === 0) {
                    ctx.fillStyle = `rgba(30, 41, 59, ${alpha})`;
                } else {
                    ctx.fillStyle = `rgba(15, 23, 42, ${alpha})`;
                }
                ctx.strokeStyle = 'rgba(51, 65, 85, 0.5)';
                ctx.lineWidth = 0.5;

                if (cell.cellType === 'tetra') {
                    this._drawDiamond(cell.px, cell.py, r * 0.8,
                        ctx.fillStyle, ctx.strokeStyle);
                } else {
                    ctx.beginPath();
                    ctx.arc(cell.px, cell.py, r, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                }

                // Draw number
                if (cell.count > 0 && r > 4) {
                    const color = MinesweeperRenderer.NUMBER_COLORS[Math.min(cell.count, 8)] || '#fff';
                    ctx.fillStyle = color;
                    ctx.font = `bold ${Math.max(8, r * 1.1)}px monospace`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(cell.count > 9 ? '9+' : String(cell.count), cell.px, cell.py);
                }
                break;
            }

            case 'mine': {
                // Red glow
                const grad = ctx.createRadialGradient(cell.px, cell.py, 0, cell.px, cell.py, r * 1.5);
                grad.addColorStop(0, 'rgba(239, 68, 68, 0.9)');
                grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
                ctx.fillStyle = grad;
                ctx.fillRect(cell.px - r * 1.5, cell.py - r * 1.5, r * 3, r * 3);

                if (cell.cellType === 'tetra') {
                    this._drawDiamond(cell.px, cell.py, r, '#ef4444');
                } else {
                    this._drawCircle(cell.px, cell.py, r, '#ef4444');
                }

                // Mine symbol
                if (r > 5) {
                    ctx.fillStyle = '#000';
                    ctx.font = `bold ${r * 1.2}px sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('*', cell.px, cell.py);
                }
                break;
            }

            case 'flagged':
                if (cell.cellType === 'tetra') {
                    this._drawDiamond(cell.px, cell.py, r * 0.8,
                        'rgba(250, 204, 21, 0.7)', 'rgba(234, 179, 8, 0.8)');
                } else {
                    ctx.fillStyle = 'rgba(250, 204, 21, 0.7)';
                    ctx.strokeStyle = 'rgba(234, 179, 8, 0.8)';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.arc(cell.px, cell.py, r, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                }

                if (r > 5) {
                    ctx.fillStyle = '#000';
                    ctx.font = `${r * 1.1}px sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('F', cell.px, cell.py);
                }
                break;
        }

        ctx.restore();
    }

    /**
     * Draw HUD overlay on the canvas using BaseRenderer._drawHUD().
     */
    _drawBoardHUD() {
        const meta = this.board.getMetadata();
        const lines = [
            `Mines: ${meta.totalMines} | Flags: ${meta.flaggedCount} | Revealed: ${meta.revealedCount}/${meta.totalSafe}`,
            `Tetra: ${meta.tetraRevealed} | Octa: ${meta.octaRevealed}`,
            `Vol T:O:C=${meta.volumeRatios.tetra}:${meta.volumeRatios.octa}:${meta.volumeRatios.cubo}`,
        ];
        this._drawHUD(lines, { color: 'rgba(148, 163, 184, 0.7)', fontSize: 11 });
    }

    /**
     * Find the nearest cell to a screen point.
     * @param {number} sx - Screen X
     * @param {number} sy - Screen Y
     * @returns {{a,b,c,d}|null} Cell coordinates or null
     */
    hitTest(sx, sy) {
        let closest = null;
        let minDist = Infinity;
        for (const cell of this.projectedCells) {
            const r = this.cellRadius * (cell.pScale || 1);
            const dx = cell.px - sx, dy = cell.py - sy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < r * 1.5 && dist < minDist) {
                minDist = dist;
                closest = { a: cell.a, b: cell.b, c: cell.c, d: cell.d };
            }
        }
        return closest;
    }
}

// Dual export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MinesweeperRenderer };
}
