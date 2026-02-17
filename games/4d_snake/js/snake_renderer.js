/**
 * snake_renderer.js — 4D Snake Canvas Renderer
 *
 * Extends BaseRenderer for Quadray projection, axis drawing, and canvas clearing.
 * Projects snake body segments and food to 2D canvas using Quadray projection.
 * Head is rendered larger and brighter with a glow effect.
 * Body segments have gradient fading, trail particles, and depth-sorted rendering.
 *
 * @module SnakeRenderer
 */

class SnakeRenderer extends BaseRenderer {
    constructor(canvas, board) {
        super(canvas, board, {
            scale: 40,
            cameraDist: 5,
            rotX: 0.4,
            rotY: 0.7,
            bgColor: '#050f05',
        });

        // Particle system for eating effects
        this.particles = [];
        this.foodPulse = 0;
        this.frameCount = 0;
    }

    /**
     * Project a Quadray object to 2D screen space.
     * BaseRenderer._project() takes (a,b,c,d) numbers; this helper
     * accepts a Quadray instance for convenience.
     * @param {Quadray} q
     * @returns {{ x: number, y: number, scale: number }}
     */
    _projectQ(q) {
        return this._project(q.a, q.b, q.c, q.d);
    }

    render() {
        const { ctx, canvas } = this;
        this.frameCount++;
        this.foodPulse = (Math.sin(this.frameCount * 0.08) + 1) / 2;

        // Clear with subtle fade for trail effect
        ctx.fillStyle = 'rgba(5, 15, 5, 0.92)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Background grid dots (starfield look)
        this._drawStarfield();

        // Draw Quadray axes via BaseRenderer
        this._drawAxes();

        // Draw grid boundary wireframe
        this._drawGridBounds();

        // Collect & depth-sort all renderable items
        const items = [];

        // Food
        const food = this.board.getFood();
        if (food && food.quadray) {
            const fp = this._projectQ(food.quadray);
            items.push({ type: 'food', x: fp.x, y: fp.y, scale: fp.scale, data: food });
        }

        // Snake body
        const cells = this.board.getSnakeCells();
        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            if (!cell.quadray) continue;
            const p = this._projectQ(cell.quadray);
            items.push({
                type: 'snake', x: p.x, y: p.y, scale: p.scale,
                index: i, total: cells.length, isHead: cell.isHead, data: cell
            });
        }

        // Sort by depth (back to front)
        items.sort((a, b) => a.scale - b.scale);

        // Render items
        for (const item of items) {
            if (item.type === 'food') this._drawFood(item);
            else if (item.type === 'snake') this._drawSnakeSegment(item);
        }

        // Update & draw particles
        this._updateParticles();
        this._drawParticles();

        // Direction indicator
        this._drawDirectionIndicator();
    }

    _drawFood(item) {
        const { ctx } = this;
        const r = 8 * item.scale;
        const pulse = this.foodPulse;

        // Outer glow
        const glowR = r * (2.5 + pulse * 0.8);
        const grad = ctx.createRadialGradient(item.x, item.y, 0, item.x, item.y, glowR);
        grad.addColorStop(0, `rgba(250, 204, 21, ${0.4 + pulse * 0.3})`);
        grad.addColorStop(0.5, 'rgba(250, 180, 21, 0.1)');
        grad.addColorStop(1, 'rgba(250, 204, 21, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(item.x - glowR, item.y - glowR, glowR * 2, glowR * 2);

        // Core
        ctx.fillStyle = '#fbbf24';
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 12 + pulse * 8;
        ctx.beginPath();
        ctx.arc(item.x, item.y, r * (1 + pulse * 0.15), 0, Math.PI * 2);
        ctx.fill();

        // Diamond shape for 4D feel
        const dr = r * 0.6;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(item.x, item.y - dr);
        ctx.lineTo(item.x + dr, item.y);
        ctx.lineTo(item.x, item.y + dr);
        ctx.lineTo(item.x - dr, item.y);
        ctx.closePath();
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    _drawSnakeSegment(item) {
        const { ctx } = this;
        const progress = item.index / item.total; // 0=tail, 1=head

        if (item.isHead) {
            const r = 11 * item.scale;

            // Head glow
            ctx.shadowColor = '#4ade80';
            ctx.shadowBlur = 16;

            // Head body
            ctx.fillStyle = '#4ade80';
            ctx.beginPath();
            ctx.arc(item.x, item.y, r, 0, Math.PI * 2);
            ctx.fill();

            // Inner highlight
            const headGrad = ctx.createRadialGradient(
                item.x - r * 0.3, item.y - r * 0.3, 0,
                item.x, item.y, r
            );
            headGrad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
            headGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = headGrad;
            ctx.beginPath();
            ctx.arc(item.x, item.y, r, 0, Math.PI * 2);
            ctx.fill();

            // Border
            ctx.strokeStyle = '#16a34a';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(item.x, item.y, r, 0, Math.PI * 2);
            ctx.stroke();

            // Eyes
            const eyeOff = r * 0.35;
            ctx.fillStyle = '#0a2e0a';
            ctx.beginPath();
            ctx.arc(item.x - eyeOff, item.y - eyeOff * 0.5, r * 0.18, 0, Math.PI * 2);
            ctx.arc(item.x + eyeOff, item.y - eyeOff * 0.5, r * 0.18, 0, Math.PI * 2);
            ctx.fill();

            ctx.shadowBlur = 0;
        } else {
            const r = (5 + progress * 4) * item.scale;
            const hue = 130 + progress * 20;
            const sat = 60 + progress * 20;
            const light = 25 + progress * 20;
            const alpha = 0.35 + progress * 0.55;

            ctx.fillStyle = `hsla(${hue}, ${sat}%, ${light}%, ${alpha})`;
            ctx.beginPath();
            ctx.arc(item.x, item.y, r, 0, Math.PI * 2);
            ctx.fill();

            // Subtle border on near-head segments
            if (progress > 0.6) {
                ctx.strokeStyle = `rgba(74, 222, 128, ${(progress - 0.6) * 0.5})`;
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }
    }

    _drawStarfield() {
        const { ctx, canvas } = this;
        // Pseudo-random but deterministic starfield
        ctx.fillStyle = 'rgba(100, 200, 100, 0.08)';
        for (let i = 0; i < 60; i++) {
            const x = ((i * 137.508) % canvas.width);
            const y = ((i * 211.307) % canvas.height);
            ctx.fillRect(x, y, 1, 1);
        }
    }

    _drawDirectionIndicator() {
        const { ctx, canvas, board } = this;
        if (board.gameOver) return;

        const dir = board.direction;
        const headCells = board.getSnakeCells();
        if (headCells.length === 0) return;

        const head = headCells[headCells.length - 1];
        if (!head.quadray) return;

        const hp = this._projectQ(head.quadray);

        // Project the "ahead" position
        const aheadQ = new Quadray(
            head.a + dir.da * 1.5,
            head.b + dir.db * 1.5,
            head.c + dir.dc * 1.5,
            head.d + dir.dd * 1.5
        );
        const ap = this._projectQ(aheadQ);

        // Draw direction arrow
        const dx = ap.x - hp.x, dy = ap.y - hp.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 3) {
            const ux = dx / len, uy = dy / len;
            ctx.strokeStyle = 'rgba(74, 222, 128, 0.4)';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(hp.x + ux * 12, hp.y + uy * 12);
            ctx.lineTo(hp.x + ux * 25, hp.y + uy * 25);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    // ── Particle System ─────────────────────────────────────────────────

    spawnEatParticles(x, y) {
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12 + Math.random() * 0.3;
            const speed = 1.5 + Math.random() * 2.5;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                decay: 0.015 + Math.random() * 0.015,
                color: Math.random() > 0.5 ? '#fbbf24' : '#4ade80',
                size: 2 + Math.random() * 3,
            });
        }
    }

    _updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.96;
            p.vy *= 0.96;
            p.life -= p.decay;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    _drawParticles() {
        const { ctx } = this;
        for (const p of this.particles) {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    /** Draw faint grid boundary wireframe with connecting lines. */
    _drawGridBounds() {
        const { ctx } = this;
        const s = this.board.size - 1;

        // Key vertices of the 4D bounding box
        const corners = [
            [0, 0, 0, 0], [s, 0, 0, 0], [0, s, 0, 0], [0, 0, s, 0], [0, 0, 0, s],
            [s, s, 0, 0], [s, 0, s, 0], [s, 0, 0, s], [0, s, s, 0], [0, s, 0, s],
            [0, 0, s, s], [s, s, s, 0], [s, s, 0, s], [s, 0, s, s], [0, s, s, s],
            [s, s, s, s]
        ];

        const projected = corners.map(([a, b, c, d]) => this._project(a, b, c, d));

        // Draw corner dots
        ctx.fillStyle = 'rgba(74, 222, 128, 0.12)';
        for (const p of projected) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2.5 * p.scale, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw edges between corners that differ by exactly 1 axis
        ctx.strokeStyle = 'rgba(74, 222, 128, 0.06)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < corners.length; i++) {
            for (let j = i + 1; j < corners.length; j++) {
                let diffs = 0;
                for (let k = 0; k < 4; k++) {
                    if (corners[i][k] !== corners[j][k]) diffs++;
                }
                if (diffs === 1) {
                    ctx.beginPath();
                    ctx.moveTo(projected[i].x, projected[i].y);
                    ctx.lineTo(projected[j].x, projected[j].y);
                    ctx.stroke();
                }
            }
        }
    }
}

// Dual export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SnakeRenderer };
}
