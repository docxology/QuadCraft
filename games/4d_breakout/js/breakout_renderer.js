/**
 * breakout_renderer.js — 4D Breakout Canvas Renderer
 *
 * Extends BaseRenderer for shared projection, axis drawing, and canvas clearing.
 * Draws bricks, ball, and paddle projected from Quadray space.
 * Multi-hit bricks show damage state via color change.
 *
 * @module BreakoutRenderer
 */

class BreakoutRenderer extends BaseRenderer {
    constructor(canvas, board) {
        super(canvas, board, {
            scale: 38,
            cameraDist: 600,
            rotX: 0.3,
            rotY: 0.5,
            bgColor: '#0f172a',
        });
        this.cellSize = 10;
    }

    /**
     * Project a Quadray object to 2D screen space.
     * Convenience helper that delegates to BaseRenderer._project().
     * @param {{a:number,b:number,c:number,d:number}} q
     * @returns {{ x: number, y: number, scale: number }}
     */
    _projectQ(q) {
        return this._project(q.a, q.b, q.c, q.d);
    }

    render() {
        const { ctx, canvas, board } = this;
        this._clearCanvas();
        this._drawAxes();

        // Bricks
        const brickEntries = Object.entries(board.bricks);
        const projected = brickEntries.map(([k, brick]) => {
            const [a, b, c, d] = board.parseKey(k);
            const p = this._project(a, b, c, d);
            return { a, b, c, d, ...brick, px: p.x, py: p.y, pScale: p.scale };
        }).sort((a, b) => a.pScale - b.pScale);

        for (const brick of projected) {
            const r = this.cellSize * (brick.pScale || 1);
            if (r < 1) continue;
            ctx.save();
            ctx.fillStyle = brick.color;
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.lineWidth = 0.5;
            // Draw diamond shape for bricks
            ctx.beginPath();
            ctx.moveTo(brick.px, brick.py - r);
            ctx.lineTo(brick.px + r, brick.py);
            ctx.lineTo(brick.px, brick.py + r);
            ctx.lineTo(brick.px - r, brick.py);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            // Show hits remaining for multi-hit bricks
            if (brick.maxHits > 1 && r > 5) {
                ctx.fillStyle = 'rgba(255,255,255,0.8)';
                ctx.font = `${Math.max(7, r * 0.8)}px monospace`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(String(brick.hits), brick.px, brick.py);
            }
            ctx.restore();
        }

        // Paddle
        const pp = this._project(0.5, board.paddle.b, board.paddle.c, board.paddle.d);
        const pSize = board.paddle.size * this.cellSize * 0.8;
        ctx.fillStyle = 'rgba(96, 165, 250, 0.6)';
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(pp.x, pp.y, pSize, pSize * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Ball
        const bp = this._project(board.ball.a, board.ball.b, board.ball.c, board.ball.d);
        const ballR = 5 * (bp.scale || 1);
        ctx.save();
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(bp.x, bp.y, ballR, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // In-canvas HUD overlay (combo, game over text)
        this._drawInCanvasHUD();
    }

    /** Draw combo and game-over text overlays on the canvas. */
    _drawInCanvasHUD() {
        const { ctx, canvas, board } = this;

        // Lives as hearts
        ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
        ctx.font = '12px monospace';
        ctx.textAlign = 'left';
        let hearts = '';
        for (let i = 0; i < board.lives; i++) hearts += '❤️ ';
        ctx.fillText(`${hearts} | Score: ${board.score} | Level: ${board.level} | Bricks: ${board.getBrickCount()}`, 10, canvas.height - 10);

        if (board.combo > 1) {
            ctx.fillStyle = '#fbbf24';
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`Combo x${board.combo}!`, canvas.width / 2, 20);
        }
        if (board.gameOver) {
            ctx.font = 'bold 24px monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = board.won ? '#4ade80' : '#f87171';
            ctx.fillText(board.won ? 'LEVEL CLEAR!' : 'GAME OVER', canvas.width / 2, canvas.height / 2);
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BreakoutRenderer };
}
