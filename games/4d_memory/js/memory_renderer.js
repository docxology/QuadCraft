/** memory_renderer.js */
if (typeof BaseRenderer === 'undefined' && typeof require !== 'undefined') { const _br = require('../../4d_generic/base_renderer.js'); globalThis.BaseRenderer = _br.BaseRenderer; }
class MemoryRenderer extends BaseRenderer {
    constructor(canvas, board) { super(canvas, board); this.pairColors=['#e74c3c','#3498db','#2ecc71','#f39c12','#9b59b6','#1abc9c','#e67e22','#e91e63','#00bcd4','#ff5722','#607d8b','#795548','#cddc39','#ff9800','#4caf50','#2196f3','#673ab7','#f44336','#009688','#ffc107']; }
    render(ctx, camera) {
        const W=ctx.canvas.width,H=ctx.canvas.height;ctx.clearRect(0,0,W,H);ctx.fillStyle='#0a0a1a';ctx.fillRect(0,0,W,H);
        if(!this.board)return;
        const proj=this._proj(this.board.cells,camera);proj.sort((a,b)=>a.pScale-b.pScale);
        for(const p of proj){const r=Math.max(4,10*p.pScale);const v=this.board.getValue(p);const rev=this.board.isRevealed(p);const mat=this.board.isMatched(p);
            if(v===0){continue;}
            if(mat){ctx.fillStyle='rgba(100,255,100,0.15)';ctx.beginPath();ctx.arc(p.px,p.py,r,0,Math.PI*2);ctx.fill();}
            else if(rev){ctx.fillStyle=this.pairColors[v%this.pairColors.length];ctx.beginPath();ctx.arc(p.px,p.py,r,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.font=Math.max(8,10*p.pScale)+'px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(v,p.px,p.py);}
            else{ctx.fillStyle='#2c3e50';ctx.beginPath();ctx.arc(p.px,p.py,r,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#7f8c8d';ctx.lineWidth=1;ctx.stroke();}
        }
        this.drawAxes(ctx,W,H,camera);
    }
    _proj(cells,camera){if(typeof projectQuadray!=='function')return[];const W=this.canvas.width,H=this.canvas.height;return cells.map(c=>{const p=projectQuadray(c.a,c.b,c.c,c.d,W,H,camera);return{...c,px:p.x,py:p.y,pScale:p.scale};});}
    hitTest(sx,sy,camera){const proj=this._proj(this.board.cells,camera);let best=null,bd=25;for(const p of proj){const d=Math.hypot(p.px-sx,p.py-sy);if(d<bd){bd=d;best={a:p.a,b:p.b,c:p.c,d:p.d};}}return best;}
}
if (typeof module !== 'undefined' && module.exports) { module.exports = { MemoryRenderer }; }