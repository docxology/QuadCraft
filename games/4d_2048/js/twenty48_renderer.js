/**
 * twenty48_renderer.js — 4D 2048 Renderer
 * @module Twenty48Renderer
 */
if (typeof BaseRenderer === 'undefined' && typeof require !== 'undefined') { const _br = require('../../4d_generic/base_renderer.js'); globalThis.BaseRenderer = _br.BaseRenderer; }

class Twenty48Renderer extends BaseRenderer {
    constructor(canvas, board) {
        super(canvas, board);
        this.tileColors = { 0:'#1e293b', 2:'#fef3c7', 4:'#fde68a', 8:'#fdba74', 16:'#fb923c', 32:'#f87171', 64:'#ef4444', 128:'#fbbf24', 256:'#f59e0b', 512:'#d97706', 1024:'#b45309', 2048:'#92400e' };
        this.textColors = { 0:'transparent', 2:'#1e293b', 4:'#1e293b', 8:'#fff', 16:'#fff', 32:'#fff', 64:'#fff', 128:'#fff', 256:'#fff', 512:'#fff', 1024:'#fff', 2048:'#fff' };
    }
    render(ctx, camera) {
        const W = ctx.canvas.width, H = ctx.canvas.height;
        ctx.clearRect(0, 0, W, H);
        const bg = ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,W*0.7);
        bg.addColorStop(0,'#1a1a2e'); bg.addColorStop(1,'#0a0a14');
        ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);
        if (!this.board) return;
        const projected = this._projectAll(this.board.cells, camera);
        projected.sort((a,b) => a.pScale - b.pScale);
        for (const p of projected) {
            const val = this.board.getCell(p) || 0;
            const r = Math.max(6, 14 * p.pScale);
            ctx.fillStyle = this.tileColors[val] || this.tileColors[2048];
            ctx.beginPath();
            ctx.roundRect ? ctx.roundRect(p.px-r, p.py-r, r*2, r*2, 3) : ctx.rect(p.px-r, p.py-r, r*2, r*2);
            ctx.fill();
            if (val > 0) {
                ctx.fillStyle = this.textColors[val] || '#fff';
                ctx.font = Math.max(8, 10*p.pScale) + 'px sans-serif';
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(val, p.px, p.py);
            }
        }
        this.drawAxes(ctx, W, H, camera);
    }
    _projectAll(cells, camera) {
        if (typeof projectQuadray !== 'function') return [];
        const W = this.canvas.width, H = this.canvas.height;
        return cells.map(c => { const p = projectQuadray(c.a,c.b,c.c,c.d,W,H,camera); return {...c, px:p.x, py:p.y, pScale:p.scale}; });
    }
}
if (typeof module !== 'undefined' && module.exports) { module.exports = { Twenty48Renderer }; }
