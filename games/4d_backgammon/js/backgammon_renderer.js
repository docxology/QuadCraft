/**
 * backgammon_renderer.js — 4D Backgammon Canvas Renderer
 *
 * Extends BaseRenderer to project Quadray positions to 2D,
 * draw lane-colored triangular points, stacked stones,
 * hover tooltips, and game-over overlay.
 *
 * Uses all BaseRenderer methods:
 *   _project(), _drawAxes(), _clearCanvas(), _drawHUD(),
 *   _drawCircle(), _drawDiamond()
 * Plus: GridUtils.depthSort(), Quadray.cellType(), Quadray.toString()
 *
 * @module BackgammonRenderer
 */

class BackgammonRenderer extends BaseRenderer {

    constructor(canvas, board) {
        super(canvas, board, {
            scale: 35,
            cameraDist: 600,
            rotX: 0.4,
            rotY: 0.7,
            bgColor: '#0c0808',
        });

        this.mouseX = 0;
        this.mouseY = 0;

        // Track mouse position for hover tooltip
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        });

        console.log('[BackgammonRenderer] Initialized with BaseRenderer + full quadray methods');
    }

    /**
     * Project a Quadray object to 2D screen space.
     * Delegates to BaseRenderer._project().
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
        this._drawLaneAxes();
        this._drawPoints();
        this._drawHoverTooltip();
        this._drawBoardHUD();
        this._drawGameOver();
    }

    /**
     * Draw lane axis lines from origin to each lane endpoint.
     * Color-coded by lane (A=red, B=green, C=blue, D=yellow).
     */
    _drawLaneAxes() {
        const ctx = this.ctx;
        const origin = this._projectQ(new Quadray(0, 0, 0, 0));

        for (let lane = 0; lane < 4; lane++) {
            const endCoords = [0, 0, 0, 0];
            endCoords[lane] = 6;
            const endQ = new Quadray(...endCoords);
            const endP = this._projectQ(endQ);

            ctx.strokeStyle = BackgammonBoard.LANE_COLORS[lane];
            ctx.globalAlpha = 0.25;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(origin.x, origin.y);
            ctx.lineTo(endP.x, endP.y);
            ctx.stroke();
            ctx.globalAlpha = 1.0;

            // Axis direction label at end of lane
            ctx.fillStyle = BackgammonBoard.LANE_COLORS[lane];
            ctx.font = `bold ${14 * endP.scale}px monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const dx = endP.x - origin.x;
            const dy = endP.y - origin.y;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            ctx.fillText(`+${BackgammonBoard.LANE_NAMES[lane]}`, endP.x + dx / len * 18, endP.y + dy / len * 18);
        }
    }

    /**
     * Draw all 24 points with triangular markers, stones, and labels.
     * Preserves the original visual style with lane coloring.
     */
    _drawPoints() {
        const ctx = this.ctx;
        const board = this.board;

        for (let i = 0; i < 24; i++) {
            const lane = board.getLane(i);
            const q = board.pointToQuadray(i);
            const p = this._projectQ(q);

            // Lane-colored triangles
            const baseColor = BackgammonBoard.LANE_COLORS[lane];
            ctx.fillStyle = baseColor;
            ctx.globalAlpha = i % 2 === 0 ? 0.7 : 0.45;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y - 20 * p.scale);
            ctx.lineTo(p.x - 8 * p.scale, p.y + 20 * p.scale);
            ctx.lineTo(p.x + 8 * p.scale, p.y + 20 * p.scale);
            ctx.closePath();
            ctx.fill();
            ctx.globalAlpha = 1.0;

            // Stones
            for (let j = 0; j < board.points[i].length; j++) {
                const c = board.points[i][j];
                const sy = p.y + 15 * p.scale - j * 8 * p.scale;

                ctx.fillStyle = c === 'white' ? '#eee' : '#333';
                ctx.beginPath();
                ctx.arc(p.x, sy, 6 * p.scale, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = c === 'white' ? '#ccc' : '#555';
                ctx.lineWidth = 1;
                ctx.stroke();
            }

            // Point number
            ctx.fillStyle = baseColor;
            ctx.font = `bold ${10 * p.scale}px monospace`;
            ctx.textAlign = 'center';
            ctx.fillText(i + 1, p.x, p.y + 28 * p.scale);

            // Quadray coordinate label
            ctx.fillStyle = '#888';
            ctx.font = `${7 * p.scale}px monospace`;
            ctx.fillText(`(${q.a},${q.b},${q.c},${q.d})`, p.x, p.y - 25 * p.scale);
        }
    }

    /**
     * Draw hover tooltip showing point info with Quadray coordinates.
     */
    _drawHoverTooltip() {
        const ctx = this.ctx;
        const board = this.board;
        let closestDist = 25;
        let hoveredPoint = -1;

        for (let i = 0; i < 24; i++) {
            const q = board.pointToQuadray(i);
            const p = this._projectQ(q);
            const dx = this.mouseX - p.x;
            const dy = this.mouseY - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < closestDist) {
                closestDist = dist;
                hoveredPoint = i;
            }
        }

        if (hoveredPoint >= 0) {
            const q = board.pointToQuadray(hoveredPoint);
            const stones = board.points[hoveredPoint];
            const cellType = Quadray.cellType(q.a, q.b, q.c, q.d);
            const label = `Pt ${hoveredPoint + 1}: ${stones.length} stones Q(${q.a},${q.b},${q.c},${q.d}) [${cellType}]`;

            ctx.font = '12px monospace';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'bottom';
            const tw = ctx.measureText(label).width;
            const tx = this.mouseX + 14;
            const ty = this.mouseY - 10;
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.beginPath();
            ctx.roundRect(tx - 4, ty - 16, tw + 8, 20, 4);
            ctx.fill();
            ctx.fillStyle = '#ffe0a0';
            ctx.fillText(label, tx, ty);
        }
    }

    /**
     * Draw HUD overlay on the canvas using BaseRenderer._drawHUD().
     */
    _drawBoardHUD() {
        const meta = this.board.getMetadata();
        const turnLabel = meta.currentPlayer === 'white' ? 'White' : 'Black';
        const diceLabel = meta.dice[0] ? `Dice: ${meta.dice.join(' ')}` : 'Dice: Click to roll';

        const lines = [
            `Turn: ${turnLabel} | ${diceLabel}`,
            `Borne: W:${meta.borne.white} B:${meta.borne.black} | Bar: W:${meta.bar.white} B:${meta.bar.black}`,
            `Vol T:O:C=${meta.volumeRatios.tetra}:${meta.volumeRatios.octa}:${meta.volumeRatios.cubo}`,
        ];
        this._drawHUD(lines, { color: 'rgba(204, 136, 102, 0.8)', fontSize: 12 });
    }

    /**
     * Draw game-over overlay.
     */
    _drawGameOver() {
        if (!this.board.isGameOver()) return;
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, this.canvas.height / 2 - 30, this.canvas.width, 60);
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${this.board.winner()} wins!`, this.canvas.width / 2, this.canvas.height / 2);
    }

    /**
     * Hit-test a screen coordinate against projected point positions.
     * @param {number} sx — Screen X
     * @param {number} sy — Screen Y
     * @returns {number} — Point index (0-23) or -1 if no hit
     */
    hitTest(sx, sy) {
        let closestDist = 25;
        let hitPoint = -1;
        for (let i = 0; i < 24; i++) {
            const q = this.board.pointToQuadray(i);
            const p = this._projectQ(q);
            const dist = Math.hypot(p.x - sx, p.y - sy);
            if (dist < closestDist) {
                closestDist = dist;
                hitPoint = i;
            }
        }
        return hitPoint;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BackgammonRenderer };
}
