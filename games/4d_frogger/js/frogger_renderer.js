/**
 * frogger_renderer.js — 4D Frogger Canvas Renderer
 *
 * Extends BaseRenderer to project Quadray positions to 2D,
 * draw lanes, obstacles, frog, timer bar, and safe zones.
 *
 * Uses all BaseRenderer methods:
 *   _project(), _drawAxes(), _clearCanvas(), _drawHUD(),
 *   _drawCircle(), _drawDiamond()
 * Plus: GridUtils.depthSort(), Quadray.cellType(), Quadray.toString()
 *
 * @module FroggerRenderer
 */

class FroggerRenderer extends BaseRenderer {
    constructor(canvas, board) {
        super(canvas, board, {
            scale: 40,
            cameraDist: 600,
            rotX: 0.3,
            rotY: 0.5,
            bgColor: '#0a1a0a',
        });
        this.cellSize = 12;

        console.log('[FroggerRenderer] Initialized with BaseRenderer + full quadray methods');
    }

    /**
     * Helper: project a Quadray object to 2D screen space.
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
        this._drawLaneBackgrounds();
        this._drawEntities();
        this._drawTimerBar();
        this._drawBoardHUD();
    }

    /**
     * Draw lane backgrounds with safe-zone highlighting.
     */
    _drawLaneBackgrounds() {
        const { ctx, board } = this;
        for (let a = 0; a < board.lanes; a++) {
            const isSafe = a === 0 || a === board.lanes - 1 || a === Math.floor(board.lanes / 2);
            for (let b = 0; b < board.width; b++) {
                const p = this._project(a, b, 1, 1);
                const r = this.cellSize;
                ctx.fillStyle = isSafe ? 'rgba(34, 197, 94, 0.1)' : 'rgba(71, 85, 105, 0.1)';
                ctx.fillRect(p.x - r, p.y - r * 0.5, r * 2, r);
            }
        }
    }

    /**
     * Draw all entities (frog + obstacles) with depth sorting.
     * Uses GridUtils.depthSort() for proper back-to-front order.
     */
    _drawEntities() {
        const { ctx, board } = this;
        const entities = board.getEntities();

        // Use GridUtils.depthSort() for rendering order
        const sorted = GridUtils.depthSort(entities, (a, b, c, d) => this._project(a, b, c, d));

        for (const e of sorted) {
            const r = this.cellSize * (e.pScale || 1);
            if (r < 1) continue;
            ctx.save();

            if (e.type === 'frog') {
                // Frog body
                ctx.fillStyle = e.color;
                ctx.shadowColor = '#4ade80';
                ctx.shadowBlur = 10;

                // Use cellType parity for shape
                if (e.cellType === 'tetra') {
                    this._drawDiamond(e.px, e.py, r, e.color);
                } else {
                    ctx.beginPath();
                    ctx.arc(e.px, e.py, r, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Eyes
                ctx.shadowBlur = 0;
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(e.px - r * 0.4, e.py - r * 0.3, r * 0.15, 0, Math.PI * 2);
                ctx.arc(e.px + r * 0.4, e.py - r * 0.3, r * 0.15, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Obstacle — shape by cellType parity
                if (e.cellType === 'tetra') {
                    this._drawDiamond(e.px, e.py, r, e.color, 'rgba(0,0,0,0.3)');
                } else {
                    ctx.fillStyle = e.color;
                    ctx.fillRect(e.px - r, e.py - r * 0.4, r * 2, r * 0.8);
                    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
                    ctx.lineWidth = 0.5;
                    ctx.strokeRect(e.px - r, e.py - r * 0.4, r * 2, r * 0.8);
                }
            }

            ctx.restore();
        }
    }

    /**
     * Draw the timer bar at the top.
     */
    _drawTimerBar() {
        const { ctx, canvas, board } = this;
        const timerFrac = board.timeLeft / board.maxTime;
        const barW = canvas.width * 0.6;
        const barX = (canvas.width - barW) / 2;
        ctx.fillStyle = 'rgba(30, 41, 59, 0.5)';
        ctx.fillRect(barX, 8, barW, 8);
        ctx.fillStyle = timerFrac > 0.3 ? '#4ade80' : '#f87171';
        ctx.fillRect(barX, 8, barW * timerFrac, 8);
    }

    /**
     * Draw HUD overlay on the canvas using BaseRenderer._drawHUD().
     */
    _drawBoardHUD() {
        const meta = this.board.getMetadata();
        let lives = '';
        for (let i = 0; i < meta.lives; i++) lives += '* ';

        const frogQ = new Quadray(meta.frog.a, meta.frog.b, meta.frog.c, meta.frog.d);
        const frogParity = Quadray.cellType(meta.frog.a, meta.frog.b, meta.frog.c, meta.frog.d);

        const lines = [
            `${lives}| Score: ${meta.score} | Level: ${meta.level} | Goals: ${meta.goalsReached}`,
            `Frog: (${meta.frog.a},${meta.frog.b},${meta.frog.c},${meta.frog.d}) [${frogParity}]`,
            `Vol T:O:C=${meta.volumeRatios.tetra}:${meta.volumeRatios.octa}:${meta.volumeRatios.cubo}`,
        ];

        this._drawHUD(lines, { color: 'rgba(148, 163, 184, 0.7)', fontSize: 11 });

        if (this.board.gameOver) {
            const { ctx, canvas } = this;
            ctx.fillStyle = '#f87171';
            ctx.font = 'bold 24px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FroggerRenderer };
}
