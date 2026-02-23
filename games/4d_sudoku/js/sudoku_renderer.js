/** sudoku_renderer.js */
if (typeof BaseRenderer === 'undefined' && typeof require !== 'undefined') { const _br = require('../../4d_generic/base_renderer.js'); globalThis.BaseRenderer = _br.BaseRenderer; }
class SudokuRenderer extends BaseRenderer {
    constructor(canvas, board) { super(canvas, board); }
    render(ctx, camera) {
        const W=ctx.canvas.width,H=ctx.canvas.height;ctx.clearRect(0,0,W,H);ctx.fillStyle='#0a1a1a';ctx.fillRect(0,0,W,H);
        if(!this.board)return;
        const proj=this._proj(this.board.cells,camera);proj.sort((a,b)=>a.pScale-b.pScale);
        for(const p of proj){const v=this.board.getCell(p)||0;const r=Math.max(5,12*p.pScale);const given=this.board.isGiven(p);
            ctx.fillStyle=given?'rgba(26,188,156,0.2)':'rgba(255,255,255,0.05)';
            ctx.beginPath();ctx.arc(p.px,p.py,r,0,Math.PI*2);ctx.fill();
            ctx.strokeStyle=given?'#1abc9c':'rgba(255,255,255,0.1)';ctx.lineWidth=given?1.5:0.5;ctx.stroke();
            if(v>0){ctx.fillStyle=given?'#1abc9c':'#ecf0f1';ctx.font=(given?'bold ':'')+Math.max(8,12*p.pScale)+'px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(v,p.px,p.py);}
        }
        this.drawAxes(ctx,W,H,camera);
    }
    _proj(cells,camera){if(typeof projectQuadray!=='function')return[];const W=this.canvas.width,H=this.canvas.height;return cells.map(c=>{const p=projectQuadray(c.a,c.b,c.c,c.d,W,H,camera);return{...c,px:p.x,py:p.y,pScale:p.scale};});}
    hitTest(sx,sy,camera){const proj=this._proj(this.board.cells,camera);let best=null,bd=20;for(const p of proj){const d=Math.hypot(p.px-sx,p.py-sy);if(d<bd){bd=d;best={a:p.a,b:p.b,c:p.c,d:p.d};}}return best;}
}
if (typeof module !== 'undefined' && module.exports) { module.exports = { SudokuRenderer }; }