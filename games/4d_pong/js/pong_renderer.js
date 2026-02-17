/**
 * pong_renderer.js — 4D Pong Canvas Renderer
 *
 * Extends BaseRenderer to project Quadray positions to 2D,
 * draw the court, paddles, ball, trail, and in-canvas HUD.
 *
 * Uses all BaseRenderer methods:
 *   _project(), _drawAxes(), _clearCanvas(), _drawHUD(),
 *   _drawCircle(), _drawDiamond()
 *
 * @module PongRenderer
 */

class PongRenderer extends BaseRenderer {
    constructor(canvas, board) {
        super(canvas, board, {
            scale: 35,
            cameraDist: 600,
            rotX: 0.3,
            rotY: 0.5,
            bgColor: '#0f172a',
        });

        console.log('[PongRenderer] Initialized with BaseRenderer + full quadray methods');
    }

    /**
     * Project a Quadray object to 2D screen space.
     * @param {Quadray} q
     * @returns {{ x: number, y: number, scale: number }}
     */
    _projectQ(q) {
        return this._project(q.a, q.b, q.c, q.d);
    }

    render() {
        const { ctx, canvas, board } = this;
        this._clearCanvas();
        this._drawAxes();

        // Court outline
        const corners = [
            [0, 0, 0, 0], [0, board.courtSize, 0, 0],
            [0, board.courtSize, board.courtSize, 0], [0, 0, board.courtSize, 0]
        ];
        ctx.strokeStyle = 'rgba(71, 85, 105, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < corners.length; i++) {
            const p = this._project(...corners[i]);
            i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.stroke();

        // Center line
        const mid = board.courtSize / 2;
        ctx.strokeStyle = 'rgba(71, 85, 105, 0.2)';
        ctx.setLineDash([4, 4]);
        const c1 = this._project(mid, 0, 0, 0);
        const c2 = this._project(mid, board.courtSize, 0, 0);
        ctx.beginPath();
        ctx.moveTo(c1.x, c1.y);
        ctx.lineTo(c2.x, c2.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Paddle 1 (blue, at A=0)
        this._drawPaddle(board.paddle1, 0.5, '#3b82f6');

        // Paddle 2 (red, at A=courtSize)
        this._drawPaddle(board.paddle2, board.courtSize - 0.5, '#ef4444');

        // Ball
        const bp = this._project(board.ball.a, board.ball.b, board.ball.c, board.ball.d);
        const ballR = 6 * (bp.scale || 1);
        ctx.save();
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(bp.x, bp.y, ballR, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Ball trail
        ctx.fillStyle = 'rgba(250, 204, 21, 0.15)';
        const tb = this._project(
            board.ball.a - board.ballVel.a * 3,
            board.ball.b - board.ballVel.b * 3,
            board.ball.c - board.ballVel.c * 3,
            board.ball.d - board.ballVel.d * 3
        );
        ctx.beginPath();
        ctx.arc(tb.x, tb.y, ballR * 0.6, 0, Math.PI * 2);
        ctx.fill();

        this._drawScoreOverlay();
    }

    _drawPaddle(paddle, aPos, color) {
        const { ctx } = this;
        const size = paddle.size;
        const corners = [
            [aPos, paddle.b - size, paddle.c - size, paddle.d],
            [aPos, paddle.b + size, paddle.c - size, paddle.d],
            [aPos, paddle.b + size, paddle.c + size, paddle.d],
            [aPos, paddle.b - size, paddle.c + size, paddle.d],
        ];
        ctx.fillStyle = color + '80';
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < corners.length; i++) {
            const p = this._project(...corners[i]);
            i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    _drawScoreOverlay() {
        const { ctx, canvas, board } = this;
        ctx.fillStyle = '#60a5fa';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(String(board.score1), canvas.width / 2 - 60, 30);
        ctx.fillStyle = '#ef4444';
        ctx.fillText(String(board.score2), canvas.width / 2 + 60, 30);
        ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
        ctx.font = '12px monospace';
        ctx.fillText(`Rally: ${board.rally}`, canvas.width / 2, 30);
        if (board.gameOver) {
            ctx.fillStyle = board.winner === 1 ? '#60a5fa' : '#ef4444';
            ctx.font = 'bold 24px monospace';
            ctx.fillText(`Player ${board.winner} Wins!`, canvas.width / 2, canvas.height / 2);
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PongRenderer };
}
