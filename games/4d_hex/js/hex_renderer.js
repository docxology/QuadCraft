/** hex_renderer.js */
if (typeof BaseRenderer === 'undefined' && typeof require !== 'undefined') { const _br = require('../../4d_generic/base_renderer.js'); globalThis.BaseRenderer = _br.BaseRenderer; }
class HexRenderer extends BaseRenderer {
    constructor(canvas, board) { super(canvas, board); }
    render(ctx, camera) {
        const W = ctx.canvas.width, H = ctx.canvas.height; ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#0a0a1e'; ctx.fillRect(0, 0, W, H);
        if (!this.board) return;
        const proj = this._proj(this.board.cells, camera); proj.sort((a, b) => a.pScale - b.pScale);
        const map = new Map(); for (const p of proj) map.set(GridUtils.key(p.a, p.b, p.c, p.d), p);
        ctx.strokeStyle = 'rgba(100,150,255,0.06)'; ctx.lineWidth = 0.5;
        for (const p of proj) { const nbrs = GridUtils.boundedNeighbors(p.a, p.b, p.c, p.d, this.board.size); for (const n of nbrs) { const np = map.get(GridUtils.key(n.a, n.b, n.c, n.d)); if (np && GridUtils.key(n.a, n.b, n.c, n.d) > GridUtils.key(p.a, p.b, p.c, p.d)) { ctx.beginPath(); ctx.moveTo(p.px, p.py); ctx.lineTo(np.px, np.py); ctx.stroke(); } } }
        for (const p of proj) {
            const s = this.board.getCell(p); const r = Math.max(3, 8 * p.pScale);
            if (s === 1) { ctx.fillStyle = '#e74c3c'; ctx.beginPath(); ctx.arc(p.px, p.py, r, 0, Math.PI * 2); ctx.fill(); }
            else if (s === 2) { ctx.fillStyle = '#3498db'; ctx.beginPath(); ctx.arc(p.px, p.py, r, 0, Math.PI * 2); ctx.fill(); }
            else { ctx.fillStyle = 'rgba(255,255,255,0.03)'; ctx.beginPath(); ctx.arc(p.px, p.py, r * 0.4, 0, Math.PI * 2); ctx.fill(); }
        }
        this.drawAxes(ctx, W, H, camera);
    }
    _proj(cells, camera) { if (typeof projectQuadray !== 'function') return []; const W = this.canvas.width, H = this.canvas.height; return cells.map(c => { const p = projectQuadray(c.a, c.b, c.c, c.d, W, H, camera); return { ...c, px: p.x, py: p.y, pScale: p.scale }; }); }
    hitTest(sx, sy, camera) { const proj = this._proj(this.board.cells, camera); let best = null, bd = 25; for (const p of proj) { const d = Math.hypot(p.px - sx, p.py - sy); if (d < bd) { bd = d; best = { a: p.a, b: p.b, c: p.c, d: p.d }; } } return best; }
}
if (typeof module !== 'undefined' && module.exports) { module.exports = { HexRenderer }; }