/**
 * lights_out_renderer.js — 4D Lights Out Renderer
 *
 * Renders the IVM grid with lit/unlit cells as 3D-projected circles.
 * Lit cells glow in warm amber, unlit cells are dim blue-grey.
 * Shows IVM neighbor connections as faint lines.
 *
 * Extends BaseRenderer for shared projection and camera.
 *
 * @module LightsOutRenderer
 */

// Node.js compatibility
if (typeof BaseRenderer === 'undefined' && typeof require !== 'undefined') {
    const _br = require('../../4d_generic/base_renderer.js');
    globalThis.BaseRenderer = _br.BaseRenderer;
}

class LightsOutRenderer extends BaseRenderer {
    constructor(canvas, board) {
        super(canvas, board);
        this.litColor = '#ffb347';       // Warm amber for ON
        this.unlitColor = '#1e293b';     // Slate-dark for OFF
        this.litGlow = '#ff8c00';        // Glow halo
        this.lineColor = 'rgba(100, 150, 255, 0.08)'; // Faint IVM connections
        console.log('[LightsOutRenderer] Initialized');
    }

    /** Main render loop. */
    render(ctx, camera) {
        const W = ctx.canvas.width;
        const H = ctx.canvas.height;
        ctx.clearRect(0, 0, W, H);

        // --- Background gradient ---
        const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.7);
        bg.addColorStop(0, '#0d1b2a');
        bg.addColorStop(1, '#000a14');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);

        if (!this.board || !this.board.cells) return;

        // --- Project all cells ---
        const projected = this._projectCells(this.board.cells, camera);

        // --- Draw IVM neighbor connections (faint) ---
        ctx.strokeStyle = this.lineColor;
        ctx.lineWidth = 0.5;
        const posMap = new Map();
        for (const p of projected) {
            posMap.set(GridUtils.key(p.a, p.b, p.c, p.d), p);
        }
        for (const p of projected) {
            const neighbors = GridUtils.boundedNeighbors(p.a, p.b, p.c, p.d, this.board.size);
            for (const n of neighbors) {
                const nk = GridUtils.key(n.a, n.b, n.c, n.d);
                const np = posMap.get(nk);
                if (np && nk > GridUtils.key(p.a, p.b, p.c, p.d)) {
                    ctx.beginPath();
                    ctx.moveTo(p.px, p.py);
                    ctx.lineTo(np.px, np.py);
                    ctx.stroke();
                }
            }
        }

        // --- Draw cells (back-to-front via depth sort) ---
        projected.sort((a, b) => a.pScale - b.pScale);

        for (const p of projected) {
            const lit = this.board.isLit(p);
            const r = Math.max(4, 10 * p.pScale);

            if (lit) {
                // Glow effect
                const glow = ctx.createRadialGradient(p.px, p.py, 0, p.px, p.py, r * 2.5);
                glow.addColorStop(0, 'rgba(255, 140, 0, 0.4)');
                glow.addColorStop(1, 'rgba(255, 140, 0, 0)');
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(p.px, p.py, r * 2.5, 0, Math.PI * 2);
                ctx.fill();

                // Lit cell
                ctx.fillStyle = this.litColor;
                ctx.beginPath();
                ctx.arc(p.px, p.py, r, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = this.litGlow;
                ctx.lineWidth = 1.5;
                ctx.stroke();
            } else {
                // Unlit cell
                ctx.fillStyle = this.unlitColor;
                ctx.beginPath();
                ctx.arc(p.px, p.py, r * 0.7, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = 'rgba(100, 150, 255, 0.2)';
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
        }

        // --- Draw axes ---
        this.drawAxes(ctx, W, H, camera);
    }

    /** Project cells to screen coordinates. */
    _projectCells(cells, camera) {
        if (typeof projectQuadray !== 'function') return [];

        const W = this.canvas.width;
        const H = this.canvas.height;

        return cells.map(c => {
            const p = projectQuadray(c.a, c.b, c.c, c.d, W, H, camera);
            return { ...c, px: p.x, py: p.y, pScale: p.scale };
        });
    }

    /** Hit-test: find the cell closest to screen coordinates. */
    hitTest(sx, sy, camera) {
        if (!this.board || !this.board.cells) return null;

        const projected = this._projectCells(this.board.cells, camera);
        let best = null;
        let bestDist = 25; // Max click distance in pixels

        for (const p of projected) {
            const dx = p.px - sx;
            const dy = p.py - sy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < bestDist) {
                bestDist = dist;
                best = { a: p.a, b: p.b, c: p.c, d: p.d };
            }
        }

        return best;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LightsOutRenderer };
}
