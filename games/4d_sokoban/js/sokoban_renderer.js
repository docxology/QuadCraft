/**
 * sokoban_renderer.js — 4D Sokoban Renderer
 * Renders the IVM grid with player, boxes, goals, and walls.
 * Extends BaseRenderer for shared projection and camera.
 * @module SokobanRenderer
 */
if (typeof BaseRenderer === 'undefined' && typeof require !== 'undefined') {
    const _br = require('../../4d_generic/base_renderer.js');
    globalThis.BaseRenderer = _br.BaseRenderer;
}

class SokobanRenderer extends BaseRenderer {
    constructor(canvas, board) {
        super(canvas, board);
        this.colors = {
            wall: '#4a5568',
            empty: '#1a202c',
            player: '#48bb78',
            box: '#ed8936',
            boxOnGoal: '#38b2ac',
            goal: 'rgba(56, 178, 172, 0.3)',
        };
    }

    render(ctx, camera) {
        const W = ctx.canvas.width, H = ctx.canvas.height;
        ctx.clearRect(0, 0, W, H);

        const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.7);
        bg.addColorStop(0, '#1a202c');
        bg.addColorStop(1, '#0a0e14');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);

        if (!this.board) return;

        const cells = GridUtils.generateGrid(this.board.size);
        const projected = this._projectAll(cells, camera);
        projected.sort((a, b) => a.pScale - b.pScale);

        for (const p of projected) {
            const cell = this.board.getCell(p);
            const r = Math.max(3, 8 * p.pScale);
            const isGoal = this.board.isGoal(p);
            const isPlayer = this.board.player && p.a === this.board.player.a && p.b === this.board.player.b && p.c === this.board.player.c && p.d === this.board.player.d;

            if (this.board.walls.has(GridUtils.key(p.a, p.b, p.c, p.d))) {
                ctx.fillStyle = this.colors.wall;
                this._drawDiamond(ctx, p.px, p.py, r);
            } else if (isPlayer) {
                ctx.fillStyle = this.colors.player;
                ctx.beginPath(); ctx.arc(p.px, p.py, r * 1.2, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = '#68d391'; ctx.lineWidth = 2; ctx.stroke();
            } else if (this.board.hasBox(p)) {
                ctx.fillStyle = isGoal ? this.colors.boxOnGoal : this.colors.box;
                ctx.fillRect(p.px - r, p.py - r, r * 2, r * 2);
                ctx.strokeStyle = isGoal ? '#81e6d9' : '#fbd38d'; ctx.lineWidth = 1.5;
                ctx.strokeRect(p.px - r, p.py - r, r * 2, r * 2);
            } else if (isGoal) {
                ctx.fillStyle = this.colors.goal;
                ctx.beginPath(); ctx.arc(p.px, p.py, r, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = 'rgba(56, 178, 172, 0.5)'; ctx.lineWidth = 1; ctx.stroke();
            } else {
                ctx.fillStyle = 'rgba(255,255,255,0.03)';
                ctx.beginPath(); ctx.arc(p.px, p.py, r * 0.4, 0, Math.PI * 2); ctx.fill();
            }
        }

        this.drawAxes(ctx, W, H, camera);
    }

    _drawDiamond(ctx, x, y, r) {
        ctx.beginPath();
        ctx.moveTo(x, y - r); ctx.lineTo(x + r, y);
        ctx.lineTo(x, y + r); ctx.lineTo(x - r, y);
        ctx.closePath(); ctx.fill();
    }

    _projectAll(cells, camera) {
        if (typeof projectQuadray !== 'function') return [];
        const W = this.canvas.width, H = this.canvas.height;
        return cells.map(c => {
            const p = projectQuadray(c.a, c.b, c.c, c.d, W, H, camera);
            return { ...c, px: p.x, py: p.y, pScale: p.scale };
        });
    }

    hitTest(sx, sy, camera) {
        const cells = GridUtils.generateGrid(this.board.size);
        const projected = this._projectAll(cells, camera);
        let best = null, bestDist = 30;
        for (const p of projected) {
            const d = Math.hypot(p.px - sx, p.py - sy);
            if (d < bestDist) { bestDist = d; best = { a: p.a, b: p.b, c: p.c, d: p.d }; }
        }
        return best;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SokobanRenderer };
}
