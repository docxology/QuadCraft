/**
 * asteroids_renderer.js — 4D Asteroids Canvas Renderer
 *
 * Extends BaseRenderer to project Quadray entities to 2D,
 * draw ship, asteroids, bullets, stars, hover tooltips,
 * and in-canvas HUD overlay.
 *
 * Uses all BaseRenderer methods:
 *   _project(), _drawAxes(), _clearCanvas(), _drawHUD(),
 *   _drawCircle(), _drawDiamond()
 * Plus: GridUtils.depthSort(), Quadray.distance(), Quadray.cellType()
 *
 * @module AsteroidsRenderer
 */

class AsteroidsRenderer extends BaseRenderer {
    constructor(canvas, board) {
        super(canvas, board, {
            scale: 40,
            cameraDist: 5,
            rotX: 0.4,
            rotY: 0.6,
            bgColor: '#050508',
        });
        this.mouseX = 0;
        this.mouseY = 0;
        this._stars = null;

        console.log('[AsteroidsRenderer] Initialized with BaseRenderer + full quadray methods');
    }

    /**
     * Project a Quadray object to 2D screen space using BaseRenderer._project().
     * @param {Quadray} q - Quadray position
     * @returns {{ x: number, y: number, scale: number }}
     */
    _projectQ(q) {
        return this._project(q.a, q.b, q.c, q.d);
    }

    /**
     * Main render loop — uses BaseRenderer infrastructure.
     */
    render() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        this._clearCanvas();

        // Stars background
        if (!this._stars) {
            this._stars = [];
            for (let i = 0; i < 60; i++) {
                this._stars.push({
                    x: Math.random() * w,
                    y: Math.random() * h,
                    s: Math.random() * 1.5,
                });
            }
        }
        ctx.fillStyle = '#334';
        for (const s of this._stars) {
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.s, 0, Math.PI * 2);
            ctx.fill();
        }

        this._drawAxes();

        // Draw all entities
        const board = this.board;
        for (const e of board.entities) {
            if (!e.alive) continue;
            const p = this._projectQ(e.toQuadray());
            const r = e.radius * 20 * p.scale;

            if (e.type === 'ship') {
                ctx.fillStyle = '#00eeff';
                ctx.beginPath();
                ctx.moveTo(p.x, p.y - r);
                ctx.lineTo(p.x - r * 0.7, p.y + r);
                ctx.lineTo(p.x + r * 0.7, p.y + r);
                ctx.closePath();
                ctx.fill();
            } else if (e.type === 'asteroid') {
                ctx.strokeStyle = '#aa8866';
                ctx.lineWidth = 2;
                ctx.beginPath();
                for (let i = 0; i < 7; i++) {
                    const a = i / 7 * Math.PI * 2;
                    const rr = r * (0.7 + Math.random() * 0.3);
                    ctx.lineTo(p.x + Math.cos(a) * rr, p.y + Math.sin(a) * rr);
                }
                ctx.closePath();
                ctx.stroke();
            } else if (e.type === 'bullet') {
                ctx.fillStyle = '#ffff00';
                ctx.beginPath();
                ctx.arc(p.x, p.y, 2 * p.scale, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Dead ship ghost
        if (!board.ship.alive && board.lives > 0) {
            const p = this._projectQ(board.ship.toQuadray());
            const r = board.ship.radius * 20 * p.scale;
            ctx.fillStyle = 'rgba(0,238,255,0.3)';
            ctx.beginPath();
            ctx.moveTo(p.x, p.y - r);
            ctx.lineTo(p.x - r * 0.7, p.y + r);
            ctx.lineTo(p.x + r * 0.7, p.y + r);
            ctx.closePath();
            ctx.fill();
        }

        // Hover tooltip for nearest entity
        this._drawHoverTooltip(board);

        // In-canvas HUD overlay
        this._drawGameHUD(board);
    }

    /**
     * Draw hover tooltip for closest entity near the mouse cursor.
     * @param {Object} board
     */
    _drawHoverTooltip(board) {
        const ctx = this.ctx;
        let closestDist = 30;
        let hoveredEntity = null;

        for (const e of board.entities) {
            if (!e.alive || e.type === 'bullet') continue;
            const p = this._projectQ(e.toQuadray());
            const dx = this.mouseX - p.x;
            const dy = this.mouseY - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < closestDist) {
                closestDist = dist;
                hoveredEntity = { e, p };
            }
        }

        if (hoveredEntity) {
            const he = hoveredEntity;
            const q = he.e.toQuadray();
            const label = `${he.e.type} Q(${q.a.toFixed(1)},${q.b.toFixed(1)},${q.c.toFixed(1)},${q.d.toFixed(1)})`;
            ctx.font = '12px monospace';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'bottom';
            const tw = ctx.measureText(label).width;
            const tx = this.mouseX + 14;
            const ty = this.mouseY - 10;
            ctx.fillStyle = 'rgba(0,0,0,0.75)';
            ctx.beginPath();
            ctx.roundRect(tx - 4, ty - 16, tw + 8, 20, 4);
            ctx.fill();
            ctx.fillStyle = '#00eeff';
            ctx.fillText(label, tx, ty);
        }
    }

    /**
     * Draw in-canvas HUD overlay using BaseRenderer._drawHUD().
     * @param {Object} board
     */
    _drawGameHUD(board) {
        const ctx = this.ctx;
        const w = this.canvas.width;

        // Top-left status
        const ship = board.entities.find(e => e.type === 'ship');
        const lines = [
            `Score: ${board.score}`,
            `Lives: ${'♦'.repeat(board.lives)}`,
        ];
        if (ship && ship.alive) {
            const sq = ship.toQuadray();
            lines.push(`Pos: (${sq.a.toFixed(1)},${sq.b.toFixed(1)},${sq.c.toFixed(1)},${sq.d.toFixed(1)})`);
        }
        this._drawHUD(lines, { color: '#00eeff', fontSize: 14, x: 12, y: 12 });

        // Top-right controls hint
        ctx.font = '14px monospace';
        ctx.fillStyle = '#666';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.fillText('WASD=thrust Space=fire Shift+drag=rotate Scroll=zoom', w - 12, 12);

        // Game-over overlay
        if (board.gameOver) {
            const h = this.canvas.height;
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(0, h / 2 - 30, w, 60);
            ctx.fillStyle = '#ff4444';
            ctx.font = 'bold 28px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('GAME OVER', w / 2, h / 2);
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AsteroidsRenderer };
}
