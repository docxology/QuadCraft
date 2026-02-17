/**
 * bomberman_renderer.js — 4D Bomberman Canvas Renderer
 *
 * Extends BaseRenderer to project Quadray positions to 2D,
 * draw walls, bombs, explosions, enemies, and player with
 * parity-aware cell shapes and depth-sorted rendering.
 *
 * Uses all BaseRenderer methods:
 *   _project(), _drawAxes(), _clearCanvas(), _drawHUD(),
 *   _drawCircle(), _drawDiamond()
 * Plus: GridUtils.depthSort(), Quadray.cellType(), Quadray.toString()
 *
 * @module BombermanRenderer
 */

class BombermanRenderer extends BaseRenderer {
    constructor(canvas, board) {
        super(canvas, board, {
            scale: 40,
            cameraDist: 600,
            rotX: 0.4,
            rotY: 0.6,
            bgColor: '#0f172a',
        });
        this.cellSize = 11;
        this.animationTime = 0;
        this.glowPhase = 0;

        console.log('[BombermanRenderer] Initialized with BaseRenderer + full quadray methods');
    }

    /**
     * Main render loop — uses BaseRenderer infrastructure.
     */
    render() {
        this._clearCanvas();
        this._drawAxes();

        this.animationTime += 0.03;
        this.glowPhase = (Math.sin(this.animationTime * 3) + 1) / 2;

        this._drawEntities();
        this._drawBoardHUD();
    }

    /**
     * Draw all game entities with depth sorting via GridUtils.depthSort().
     */
    _drawEntities() {
        const { ctx } = this;
        const entities = this.board.getEntities();

        // Use GridUtils.depthSort() for proper back-to-front rendering
        const sorted = GridUtils.depthSort(entities, (a, b, c, d) => this._project(a, b, c, d));

        for (const e of sorted) {
            const r = this.cellSize * (e.pScale || 1);
            if (r < 1) continue;
            ctx.save();

            switch (e.type) {
                case 'wall':
                    this._drawWall(e, r);
                    break;
                case 'destructible':
                    this._drawDestructible(e, r);
                    break;
                case 'powerup':
                    this._drawPowerup(e, r);
                    break;
                case 'explosion':
                    this._drawExplosion(e, r);
                    break;
                case 'bomb':
                    this._drawBomb(e, r);
                    break;
                case 'enemy':
                    this._drawEnemy(e, r);
                    break;
                case 'player':
                    this._drawPlayer(e, r);
                    break;
            }

            ctx.restore();
        }
    }

    /** Draw an indestructible wall. Tetra cells get diamond, octa get square. */
    _drawWall(e, r) {
        const { ctx } = this;
        if (e.cellType === 'tetra') {
            this._drawDiamond(e.px, e.py, r, e.color, 'rgba(0,0,0,0.3)');
        } else {
            ctx.fillStyle = e.color;
            ctx.fillRect(e.px - r, e.py - r, r * 2, r * 2);
            ctx.strokeStyle = 'rgba(0,0,0,0.3)';
            ctx.lineWidth = 1;
            ctx.strokeRect(e.px - r, e.py - r, r * 2, r * 2);
        }
    }

    /** Draw a destructible wall with crack pattern. */
    _drawDestructible(e, r) {
        const { ctx } = this;
        if (e.cellType === 'tetra') {
            this._drawDiamond(e.px, e.py, r, e.color, 'rgba(0,0,0,0.2)');
        } else {
            ctx.fillStyle = e.color;
            ctx.fillRect(e.px - r, e.py - r, r * 2, r * 2);
        }
        // Crack pattern
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(e.px - r * 0.5, e.py - r);
        ctx.lineTo(e.px + r * 0.3, e.py + r);
        ctx.stroke();
    }

    /** Draw a powerup with glow. */
    _drawPowerup(e, r) {
        const { ctx } = this;
        ctx.fillStyle = e.color;
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 8;
        if (e.cellType === 'tetra') {
            this._drawDiamond(e.px, e.py, r * 0.7, e.color);
        } else {
            this._drawCircle(e.px, e.py, r * 0.7, e.color);
        }
        if (r > 5) {
            ctx.fillStyle = '#000';
            ctx.font = `${r}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('*', e.px, e.py);
        }
    }

    /** Draw an explosion with radial gradient. */
    _drawExplosion(e, r) {
        const { ctx } = this;
        const grad = ctx.createRadialGradient(e.px, e.py, 0, e.px, e.py, r * 1.5);
        grad.addColorStop(0, 'rgba(255, 200, 50, 0.9)');
        grad.addColorStop(0.5, 'rgba(249, 115, 22, 0.6)');
        grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(e.px - r * 1.5, e.py - r * 1.5, r * 3, r * 3);
    }

    /** Draw a bomb with fuse and timer. */
    _drawBomb(e, r) {
        const { ctx } = this;
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.arc(e.px, e.py, r * 0.7, 0, Math.PI * 2);
        ctx.fill();
        // Fuse
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(e.px, e.py - r * 0.7);
        ctx.lineTo(e.px + r * 0.3, e.py - r);
        ctx.stroke();
        // Timer
        if (r > 5) {
            ctx.fillStyle = '#fff';
            ctx.font = `${r * 0.7}px monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(e.timer), e.px, e.py);
        }
    }

    /** Draw an enemy with angry eyes. */
    _drawEnemy(e, r) {
        const { ctx } = this;
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.arc(e.px, e.py, r * 0.8, 0, Math.PI * 2);
        ctx.fill();
        // Angry eyes
        if (r > 5) {
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(e.px - r * 0.3, e.py - r * 0.1, r * 0.15, 0, Math.PI * 2);
            ctx.arc(e.px + r * 0.3, e.py - r * 0.1, r * 0.15, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /** Draw the player with glow effect. */
    _drawPlayer(e, r) {
        const { ctx } = this;
        ctx.fillStyle = e.color;
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 10 + this.glowPhase * 5;
        ctx.beginPath();
        ctx.arc(e.px, e.py, r, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Draw HUD overlay on the canvas using BaseRenderer._drawHUD().
     */
    _drawBoardHUD() {
        const meta = this.board.getMetadata();
        const lives = HUD.livesString(meta.lives, '|');

        const lines = [
            `${lives} Score: ${meta.score} | Level: ${meta.level}`,
            `Enemies: ${meta.aliveEnemies} | Range: ${meta.bombRange}`,
            `Tetra: ${meta.tetraCount} | Octa: ${meta.octaCount}`,
            `Vol T:O:C=${meta.volumeRatios.tetra}:${meta.volumeRatios.octa}:${meta.volumeRatios.cubo}`,
        ];
        this._drawHUD(lines, { color: 'rgba(148, 163, 184, 0.7)', fontSize: 11 });

        if (meta.gameOver) {
            const { ctx, canvas } = this;
            ctx.fillStyle = '#f87171';
            ctx.font = 'bold 24px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BombermanRenderer };
}
