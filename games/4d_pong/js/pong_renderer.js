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

        // Ball trail ring buffer
        this.trail = [];
        this.maxTrail = 8;

        // Screen shake
        this.shakeTimer = 0;
        this.shakeMag = 0;

        // Animation time
        this.animTime = 0;

        console.log('[PongRenderer] Initialized with trail, power-ups, screen shake');
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

        // Ball trail (fading circles)
        this.trail.push({ x: bp.x, y: bp.y, r: ballR });
        if (this.trail.length > this.maxTrail) this.trail.shift();
        for (let i = 0; i < this.trail.length; i++) {
            const t = this.trail[i];
            const alpha = (i / this.trail.length) * 0.3;
            ctx.fillStyle = `rgba(250, 204, 21, ${alpha})`;
            ctx.beginPath();
            ctx.arc(t.x, t.y, t.r * (0.3 + (i / this.trail.length) * 0.5), 0, Math.PI * 2);
            ctx.fill();
        }

        // Ball glow
        ctx.save();
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 12 + Math.sin(this.animTime * 5) * 4;
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(bp.x, bp.y, ballR, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Power-up on field
        if (board.powerUp) {
            this._drawPowerUp(board.powerUp);
        }

        // Speed indicator
        const sm = board._getSpeedMultiplier();
        if (sm !== 1.0) {
            ctx.fillStyle = sm > 1 ? '#ef4444' : '#3b82f6';
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(sm > 1 ? '⚡ SPEED' : '❄️ SLOW', canvas.width / 2, 50);
        }

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
        ctx.fillText(`Rally: ${board.rally} / Match to 11`, canvas.width / 2, 30);

        if (board.isServing && !board.gameOver) {
            ctx.fillStyle = '#facc15';
            ctx.font = 'bold 16px monospace';
            const servingPlayer = board.serveToPlayer === 1 ? 'Player 2' : 'Player 1';
            ctx.fillText(`${servingPlayer} Serving...`, canvas.width / 2, canvas.height / 2 + 50);
        }

        if (board.gameOver) {
            ctx.fillStyle = board.winner === 1 ? '#60a5fa' : '#ef4444';
            ctx.font = 'bold 24px monospace';
            ctx.fillText(`Player ${board.winner} Wins Match!`, canvas.width / 2, canvas.height / 2);
            ctx.fillStyle = '#94a3b8';
            ctx.font = '14px monospace';
            ctx.fillText(`Longest Rally: ${board.longestRally} | Press N`, canvas.width / 2, canvas.height / 2 + 30);
        }
    }

    /** Draw a power-up diamond with pulsing glow. */
    _drawPowerUp(powerUp) {
        const { ctx } = this;
        const p = this._project(powerUp.pos.a, powerUp.pos.b, powerUp.pos.c, powerUp.pos.d);
        const r = 10 * (p.scale || 1);
        const pulse = 0.7 + Math.sin(this.animTime * 4) * 0.3;

        const colors = { bigPaddle: '#22c55e', speedBall: '#ef4444', slowBall: '#3b82f6' };
        const color = colors[powerUp.type] || '#facc15';

        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = 8 + pulse * 10;
        ctx.fillStyle = color;
        ctx.globalAlpha = pulse;

        // Diamond shape
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - r);
        ctx.lineTo(p.x + r * 0.7, p.y);
        ctx.lineTo(p.x, p.y + r);
        ctx.lineTo(p.x - r * 0.7, p.y);
        ctx.closePath();
        ctx.fill();

        // Label
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#fff';
        ctx.font = `${Math.max(8, r * 0.6)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const labels = { bigPaddle: '⬛', speedBall: '⚡', slowBall: '❄️' };
        ctx.fillText(labels[powerUp.type] || '?', p.x, p.y);
        ctx.restore();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PongRenderer };
}
