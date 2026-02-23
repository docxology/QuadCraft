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

        let color = e.color;
        let shadow = e.color;

        // Flashing logic if power timer is running out (handled in game state ideally, but we'll do simple timing here)
        // Check game state from board for power timer
        const isFrightened = e.state === 'frightened';
        const isEaten = e.state === 'eaten';
        const powerTimer = this.board.powerTimer;

        if (isFrightened) {
            // Flash white/blue when timer < 10
            if (powerTimer < 10 && Math.floor(time / 200) % 2 === 0) {
                color = '#ffffff';
                shadow = '#ffffff';
            } else {
                color = '#3b82f6'; // Blue
                shadow = '#60a5fa';
            }
        }

        if (!isEaten) {
            ctx.fillStyle = color;
            ctx.shadowColor = shadow;
            ctx.shadowBlur = isFrightened ? 10 : 8;

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
        }

        // Eyes
        const eyeOffsetX = r * 0.35;
        const eyeOffsetY = isEaten ? 0 : -r * 0.4;
        const eyeSize = r * 0.3;

        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 0; // Clear blur for eyes
        ctx.beginPath();
        ctx.arc(e.px - eyeOffsetX, e.py + eyeOffsetY, eyeSize, 0, Math.PI * 2);
        ctx.arc(e.px + eyeOffsetX, e.py + eyeOffsetY, eyeSize, 0, Math.PI * 2);
        ctx.fill();

        // Pupils (scared ghosts have special pupils)
        ctx.fillStyle = '#000';
        const pupilSize = eyeSize * 0.5;

        if (isFrightened) {
            // Little frightened face lines instead of normal pupils
            ctx.beginPath();
            const w = pupilSize * 0.8;
            ctx.rect((e.px - eyeOffsetX) - w / 2, (e.py + eyeOffsetY), w, w / 2);
            ctx.rect((e.px + eyeOffsetX) - w / 2, (e.py + eyeOffsetY), w, w / 2);
            ctx.fill();

            // Wavy mouth
            ctx.strokeStyle = '#f87171'; // Red mouth
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(e.px - r * 0.5, e.py + r * 0.2);
            ctx.lineTo(e.px - r * 0.25, e.py + r * 0.1);
            ctx.lineTo(e.px, e.py + r * 0.2);
            ctx.lineTo(e.px + r * 0.25, e.py + r * 0.1);
            ctx.lineTo(e.px + r * 0.5, e.py + r * 0.2);
            ctx.stroke();
        } else {
            // Normal drifting eyes
            let lx = 0; let ly = 0;
            if (!isEaten) {
                // Determine direction ghost is moving roughly by drifting eyes
                lx = Math.sin(time * 0.002) * 2;
                ly = Math.cos(time * 0.002) * 2;
            } else {
                // Eaten eyes head straight for home
                const dx = (this.board.ghostHouse.a + this.board.ghostHouse.b) - (e.a + e.b); // extremely rough proxy
                lx = dx > 0 ? 1 : (dx < 0 ? -1 : 0);
            }

            ctx.beginPath();
            ctx.arc(e.px - eyeOffsetX + lx, e.py + eyeOffsetY + ly, pupilSize, 0, Math.PI * 2);
            ctx.arc(e.px + eyeOffsetX + lx, e.py + eyeOffsetY + ly, pupilSize, 0, Math.PI * 2);
            ctx.fill();
        }
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
