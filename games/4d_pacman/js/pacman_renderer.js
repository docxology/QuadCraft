/**
 * pacman_renderer.js — 4D Pac-Man Canvas Renderer
 *
 * Extends BaseRenderer to project Quadray positions to 2D,
 * draw maze walls, pellets, Pac-Man, and ghosts with depth sorting.
 *
 * Uses all BaseRenderer methods:
 *   _project(), _drawAxes(), _clearCanvas(), _drawHUD(),
 *   _drawCircle(), _drawDiamond()
 * Plus: GridUtils.depthSort(), Quadray.cellType(), Quadray.toString()
 *
 * @module PacManRenderer
 */

class PacManRenderer extends BaseRenderer {
    constructor(canvas, board) {
        super(canvas, board, {
            scale: 45,
            cameraDist: 600,
            rotX: 0.4,
            rotY: 0.6,
            bgColor: '#0f172a',
        });
        this.cellSize = 10;

        console.log('[PacManRenderer] Initialized with BaseRenderer + full quadray methods');
    }

    /**
     * Project a Quadray object to 2D screen space.
     * Convenience helper that delegates to BaseRenderer._project().
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

        const entities = this.board.getEntities();

        // Use GridUtils.depthSort() for proper back-to-front rendering order
        const projected = GridUtils.depthSort(entities, (a, b, c, d) => this._project(a, b, c, d));

        const time = performance.now();

        for (const e of projected) {
            const r = this.cellSize * (e.pScale || 1);
            if (r < 1) continue;
            this.ctx.save();

            switch (e.type) {
                case 'wall':
                    this._drawWall(e, r);
                    break;

                case 'pellet':
                    this._drawPellet(e, r);
                    break;

                case 'power':
                    this._drawPowerPellet(e, r, time);
                    break;

                case 'pacman':
                    this._drawPacman(e, r, time);
                    break;

                case 'ghost':
                    this._drawGhost(e, r, time);
                    break;
            }

            this.ctx.restore();
        }

        this._drawBoardHUD();
    }

    /**
     * Draw a maze wall cell.
     * @param {Object} e — Projected entity.
     * @param {number} r — Scaled radius.
     */
    _drawWall(e, r) {
        const { ctx } = this;
        ctx.fillStyle = e.color;
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 5;
        ctx.fillRect(e.px - r, e.py - r, r * 2, r * 2);
        // Add wireframe edge for 4D feel
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(e.px - r, e.py - r, r * 2, r * 2);
    }

    /**
     * Draw a regular pellet.
     * @param {Object} e — Projected entity.
     * @param {number} r — Scaled radius.
     */
    _drawPellet(e, r) {
        this._drawCircle(e.px, e.py, r * 0.4, '#ffb7b2');
    }

    /**
     * Draw a power pellet with pulsing glow effect.
     * @param {Object} e — Projected entity.
     * @param {number} r — Scaled radius.
     * @param {number} time — Current animation time.
     */
    _drawPowerPellet(e, r, time) {
        const { ctx } = this;
        const pulse = 1 + Math.sin(time * 0.01) * 0.2;
        ctx.fillStyle = '#fef08a';
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 10 * pulse;
        ctx.beginPath();
        ctx.arc(e.px, e.py, r * 0.8 * pulse, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Draw Pac-Man with mouth animation and eye.
     * @param {Object} e — Projected entity.
     * @param {number} r — Scaled radius.
     * @param {number} time — Current animation time.
     */
    _drawPacman(e, r, time) {
        const { ctx } = this;
        const mouthSpeed = 0.015;
        const maxOpen = 0.5;
        const mouthOpen = Math.abs(Math.sin(time * mouthSpeed)) * maxOpen;

        let angle = 0;

        ctx.translate(e.px, e.py);
        ctx.rotate(angle);

        ctx.fillStyle = '#fbbf24';
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 15;

        ctx.beginPath();
        ctx.arc(0, 0, r * 1.2, mouthOpen, Math.PI * 2 - mouthOpen);
        ctx.lineTo(0, 0);
        ctx.fill();

        // Eye
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(0, -r * 0.6, r * 0.2, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Draw a ghost with body shape, eyes, and pupils.
     * @param {Object} e — Projected entity.
     * @param {number} r — Scaled radius.
     * @param {number} time — Current animation time.
     */
    _drawGhost(e, r, time) {
        const { ctx } = this;
        ctx.fillStyle = e.scared ? '#3b82f6' : e.color;
        if (e.scared) {
            ctx.shadowColor = '#60a5fa';
            ctx.shadowBlur = 10;
        } else {
            ctx.shadowColor = e.color;
            ctx.shadowBlur = 8;
        }

        // Ghost body shape
        ctx.beginPath();
        ctx.arc(e.px, e.py - r * 0.4, r, Math.PI, 0);
        ctx.lineTo(e.px + r, e.py + r);
        // Wavy bottom
        const waveSize = r / 3;
        for (let i = 1; i <= 6; i++) {
            ctx.lineTo(e.px + r - i * waveSize, e.py + r - (i % 2) * waveSize * 0.5);
        }
        ctx.lineTo(e.px - r, e.py + r);
        ctx.closePath();
        ctx.fill();

        // Eyes
        const eyeOffsetX = r * 0.35;
        const eyeOffsetY = -r * 0.4;
        const eyeSize = r * 0.3;

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(e.px - eyeOffsetX, e.py + eyeOffsetY, eyeSize, 0, Math.PI * 2);
        ctx.arc(e.px + eyeOffsetX, e.py + eyeOffsetY, eyeSize, 0, Math.PI * 2);
        ctx.fill();

        // Pupils
        ctx.fillStyle = '#000';
        const pupilSize = eyeSize * 0.5;
        const lx = Math.sin(time * 0.002) * 2;
        const ly = Math.cos(time * 0.002) * 2;

        ctx.beginPath();
        ctx.arc(e.px - eyeOffsetX + lx, e.py + eyeOffsetY + ly, pupilSize, 0, Math.PI * 2);
        ctx.arc(e.px + eyeOffsetX + lx, e.py + eyeOffsetY + ly, pupilSize, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Draw HUD overlay on the canvas using BaseRenderer._drawHUD().
     */
    _drawBoardHUD() {
        const b = this.board;
        const meta = b.getMetadata();
        let livesStr = '';
        for (let i = 0; i < b.lives; i++) livesStr += '* ';

        const lines = [
            `${livesStr}| Score: ${b.score} | Pellets: ${meta.pelletsRemaining}`,
        ];
        if (b.powerTimer > 0) {
            lines.push(`POWER: ${b.powerTimer}`);
        }
        if (b.gameOver) {
            lines.push(b.won ? 'YOU WIN!' : 'GAME OVER');
        }
        this._drawHUD(lines, { color: 'rgba(148, 163, 184, 0.7)', fontSize: 12 });
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PacManRenderer };
}
