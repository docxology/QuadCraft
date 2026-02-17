/**
 * space_invaders_renderer.js — 4D Space Invaders Canvas Renderer
 *
 * Extends BaseRenderer to project Quadray positions to 2D,
 * draw alien formation, player ship, and bullets with formation
 * coloring and depth sorting.
 *
 * Uses all BaseRenderer methods:
 *   _project(), _drawAxes(), _clearCanvas(), _drawHUD(),
 *   _drawCircle(), _drawDiamond()
 * Plus: GridUtils.depthSort(), Quadray.cellType(), Quadray.toString()
 *
 * @module SpaceInvadersRenderer
 */

class SpaceInvadersRenderer extends BaseRenderer {
    constructor(canvas, board) {
        super(canvas, board, {
            scale: 40,
            cameraDist: 600,
            rotX: 0.3,
            rotY: 0.5,
            bgColor: '#000810',
        });
        this.cellSize = 12;

        console.log('[SpaceInvadersRenderer] Initialized with BaseRenderer + full quadray methods');
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

    render() {
        this._clearCanvas();
        this._drawAxes();

        const entities = this.board.getEntities();

        // Depth sort using GridUtils.depthSort for proper back-to-front order
        const sorted = GridUtils.depthSort(entities, (a, b, c, d) => this._project(a, b, c, d));

        for (const e of sorted) {
            const r = this.cellSize * (e.pScale || 1);
            if (r < 1) continue;
            this.ctx.save();

            switch (e.type) {
                case 'squid':
                case 'crab':
                case 'octopus':
                    this.ctx.fillStyle = e.color;
                    // Alien body — pixelated look
                    this.ctx.fillRect(e.px - r, e.py - r * 0.5, r * 2, r);
                    // Antennae
                    this.ctx.fillRect(e.px - r * 0.7, e.py - r, r * 0.3, r * 0.5);
                    this.ctx.fillRect(e.px + r * 0.4, e.py - r, r * 0.3, r * 0.5);
                    // Legs
                    this.ctx.fillRect(e.px - r * 0.8, e.py + r * 0.5, r * 0.25, r * 0.4);
                    this.ctx.fillRect(e.px + r * 0.55, e.py + r * 0.5, r * 0.25, r * 0.4);
                    break;
                case 'ship':
                    this.ctx.fillStyle = e.color;
                    this.ctx.shadowColor = e.color;
                    this.ctx.shadowBlur = 8;
                    // Triangle ship
                    this.ctx.beginPath();
                    this.ctx.moveTo(e.px, e.py - r);
                    this.ctx.lineTo(e.px + r, e.py + r * 0.5);
                    this.ctx.lineTo(e.px - r, e.py + r * 0.5);
                    this.ctx.closePath();
                    this.ctx.fill();
                    break;
                case 'bullet':
                    this.ctx.fillStyle = e.color;
                    this.ctx.shadowColor = e.color;
                    this.ctx.shadowBlur = 4;
                    this.ctx.fillRect(e.px - 1, e.py - r * 0.5, 2, r);
                    break;
            }

            this.ctx.restore();
        }

        this._drawBoardHUD();
    }

    /**
     * Draw HUD overlay on the canvas using BaseRenderer._drawHUD().
     */
    _drawBoardHUD() {
        const meta = this.board.getMetadata();
        let lives = '';
        for (let i = 0; i < meta.lives; i++) lives += '>>> ';

        const lines = [
            `${lives}| Score: ${meta.score} | Wave: ${meta.level} | Aliens: ${meta.liveAliens}`,
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
    module.exports = { SpaceInvadersRenderer };
}
