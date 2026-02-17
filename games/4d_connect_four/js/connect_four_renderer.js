/**
 * connect_four_renderer.js — 4D Connect Four Canvas Renderer
 *
 * Extends BaseRenderer to project Quadray positions to 2D,
 * draw tetrahedral/octahedral cell shapes with parity coloring,
 * ghost-piece previews, win-line glow, and IVM grid wireframe.
 *
 * Uses all BaseRenderer methods:
 *   _project(), _drawAxes(), _clearCanvas(), _drawHUD(),
 *   _drawCircle(), _drawDiamond()
 * Plus: GridUtils.depthSort(), Quadray.cellType(), Quadray.toString()
 *
 * @module ConnectFourRenderer
 */

class ConnectFourRenderer extends BaseRenderer {
    constructor(canvas, board) {
        super(canvas, board, {
            scale: 45,
            cameraDist: 600,
            rotX: 0.4,
            rotY: 0.6,
            bgColor: '#070725',
        });
        this.cellRadius = 12;
        this.projectedColumns = [];
        this.hoverColumn = null;        // { b, c, d } for ghost preview
        this.animationTime = 0;
        this.glowPhase = 0;

        console.log('[ConnectFourRenderer] Initialized with BaseRenderer + full quadray methods');
    }

    /**
     * Main render loop — uses BaseRenderer infrastructure.
     */
    render() {
        this._clearCanvas();
        this._drawAxes();

        this.animationTime += 0.03;
        this.glowPhase = (Math.sin(this.animationTime * 3) + 1) / 2;

        this._drawGridWireframe();
        this._drawColumnSlots();
        this._drawGhostPiece();
        this._drawPlacedPieces();
        this._drawBoardHUD();
    }

    /**
     * Draw IVM grid wireframe connecting empty slot positions.
     * Shows the tetrahedral structure of the playing field.
     */
    _drawGridWireframe() {
        const { ctx } = this;
        ctx.strokeStyle = 'rgba(71, 85, 105, 0.08)';
        ctx.lineWidth = 0.5;

        for (let b = 0; b < this.board.width; b++) {
            for (let c = 0; c < this.board.depthC; c++) {
                for (let d = 0; d < this.board.depthD; d++) {
                    for (let a = 0; a < this.board.height; a++) {
                        const p1 = this._project(a, b, c, d);
                        // Connect to neighbors along each axis
                        if (b + 1 < this.board.width) {
                            const p2 = this._project(a, b + 1, c, d);
                            ctx.beginPath();
                            ctx.moveTo(p1.x, p1.y);
                            ctx.lineTo(p2.x, p2.y);
                            ctx.stroke();
                        }
                        if (a + 1 < this.board.height) {
                            const p2 = this._project(a + 1, b, c, d);
                            ctx.beginPath();
                            ctx.moveTo(p1.x, p1.y);
                            ctx.lineTo(p2.x, p2.y);
                            ctx.stroke();
                        }
                    }
                }
            }
        }
    }

    /**
     * Draw column slot indicators (empty positions).
     * Uses _drawDiamond() for tetra cells, _drawCircle() for octa cells.
     */
    _drawColumnSlots() {
        this.projectedColumns = [];
        const cols = this.board.getColumns();

        for (const col of cols) {
            for (let a = 0; a < this.board.height; a++) {
                const p = this._project(a, col.b, col.c, col.d);
                const r = this.cellRadius * (p.scale || 1);
                const parity = Quadray.cellType(a, col.b, col.c, col.d);

                if (parity === 'tetra') {
                    this._drawDiamond(p.x, p.y, r * 0.8,
                        'rgba(30, 41, 59, 0.25)', 'rgba(71, 85, 105, 0.2)');
                } else {
                    this.ctx.fillStyle = 'rgba(30, 41, 59, 0.2)';
                    this.ctx.strokeStyle = 'rgba(71, 85, 105, 0.15)';
                    this.ctx.lineWidth = 0.5;
                    this.ctx.beginPath();
                    this.ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.stroke();
                }
            }
            // Store top position for hit testing
            const topP = this._project(this.board.height - 1, col.b, col.c, col.d);
            this.projectedColumns.push({
                ...col, px: topP.x, py: topP.y, pScale: topP.scale
            });
        }
    }

    /**
     * Draw ghost piece preview at the hover column.
     */
    _drawGhostPiece() {
        if (!this.hoverColumn || this.board.gameOver) return;
        const { b, c, d } = this.hoverColumn;

        // Find the landing row
        let landingRow = -1;
        for (let a = 0; a < this.board.height; a++) {
            const pos = Quadray.toIVM(new Quadray(a, b, c, d));
            if (!this.board.grid.has(pos.toKey())) {
                landingRow = a;
                break;
            }
        }
        if (landingRow === -1) return;

        const p = this._project(landingRow, b, c, d);
        const r = this.cellRadius * (p.scale || 1);
        const color = this.board.currentPlayer === 1 ? 'rgba(239, 68, 68, 0.35)' : 'rgba(251, 191, 36, 0.35)';
        const parity = Quadray.cellType(landingRow, b, c, d);

        this.ctx.save();
        this.ctx.globalAlpha = 0.5 + this.glowPhase * 0.3;
        if (parity === 'tetra') {
            this._drawDiamond(p.x, p.y, r * 0.9, color);
        } else {
            this._drawCircle(p.x, p.y, r, color);
        }
        this.ctx.restore();

        // Draw coordinate label
        this.ctx.save();
        this.ctx.font = '10px monospace';
        this.ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`(${landingRow},${b},${c},${d})`, p.x, p.y + r + 14);
        this.ctx.restore();
    }

    /**
     * Draw all placed pieces with depth sorting.
     * Uses GridUtils.depthSort() for proper back-to-front order.
     * Tetra cells → diamond shape, Octa cells → circle shape.
     */
    _drawPlacedPieces() {
        const cells = this.board.getCells();
        if (cells.length === 0) return;

        // Use GridUtils.depthSort() for rendering order
        const sorted = GridUtils.depthSort(cells, (a, b, c, d) => this._project(a, b, c, d));

        for (const cell of sorted) {
            const r = this.cellRadius * (cell.pScale || 1);
            if (r < 1) continue;

            this.ctx.save();

            // Win glow animation
            if (cell.isWinCell) {
                this.ctx.shadowColor = cell.color;
                this.ctx.shadowBlur = 10 + this.glowPhase * 15;
                const pulseR = r * (1 + this.glowPhase * 0.15);
                this._drawPieceShape(cell.px, cell.py, pulseR, cell);
            } else {
                this._drawPieceShape(cell.px, cell.py, r, cell);
            }

            // Outline
            this.ctx.strokeStyle = 'rgba(255,255,255,0.25)';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
            this.ctx.restore();

            // Move number label (small, on piece)
            if (cell.moveNum && r > 6) {
                this.ctx.save();
                this.ctx.font = `${Math.max(7, r * 0.7)}px monospace`;
                this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(cell.moveNum, cell.px, cell.py);
                this.ctx.restore();
            }
        }
    }

    /**
     * Draw a piece with shape based on cellType parity.
     * @param {number} x
     * @param {number} y
     * @param {number} r
     * @param {Object} cell
     */
    _drawPieceShape(x, y, r, cell) {
        if (cell.cellType === 'tetra') {
            // Diamond shape for tetrahedral cells
            this._drawDiamond(x, y, r, cell.color);
        } else {
            // Circle for octahedral cells
            this._drawCircle(x, y, r, cell.color);
        }
    }

    /**
     * Draw HUD overlay on the canvas using BaseRenderer._drawHUD().
     */
    _drawBoardHUD() {
        const meta = this.board.getMetadata();
        const status = meta.gameOver
            ? (meta.winner > 0 ? `Player ${meta.winner} wins!` : 'Draw!')
            : `Player ${meta.currentPlayer}'s turn`;

        const lines = [
            `${status} | Move: ${meta.moveCount}`,
            `Tetra: ${meta.tetraCount} | Octa: ${meta.octaCount}`,
            `Vol T:O:C=${meta.volumeRatios.tetra}:${meta.volumeRatios.octa}:${meta.volumeRatios.cubo}`,
        ];
        this._drawHUD(lines, { color: 'rgba(148, 163, 184, 0.7)', fontSize: 11 });
    }

    /**
     * Hit-test a screen coordinate against projected columns.
     * @param {number} sx - Screen X
     * @param {number} sy - Screen Y
     * @returns {{ b: number, c: number, d: number }|null}
     */
    hitTest(sx, sy) {
        let closest = null;
        let minDist = Infinity;
        for (const col of this.projectedColumns) {
            if (col.full) continue;
            const dx = col.px - sx, dy = col.py - sy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const r = this.cellRadius * (col.pScale || 1) * 2.5;
            if (dist < r && dist < minDist) {
                minDist = dist;
                closest = { b: col.b, c: col.c, d: col.d };
            }
        }
        return closest;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ConnectFourRenderer };
}
