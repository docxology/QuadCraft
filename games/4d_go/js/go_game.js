/** go_game.js */
if (typeof BaseGame === 'undefined' && typeof require !== 'undefined') { const _bg = require('../../4d_generic/base_game.js'); globalThis.BaseGame = _bg.BaseGame; }
if (typeof ScoreManager === 'undefined' && typeof require !== 'undefined') { const _sm = require('../../4d_generic/score_manager.js'); globalThis.ScoreManager = _sm.ScoreManager; }
class GoGame extends BaseGame {
    constructor(canvas, hudEl) { const b=new GoBoard(5); const r=new GoRenderer(canvas,b); super(canvas,b,r,hudEl,{name:'GoGame'}); }
    _handleClick(e) { const rect=this.canvas.getBoundingClientRect(); const cell=this.renderer.hitTest(e.clientX-rect.left,e.clientY-rect.top,this.camera); if(cell) { this.board.place(cell); this._render(); } }
    _handleKey(e) { if(e.key==='p'){this.board.pass();this._render();} if(e.key==='r'){this.board.reset();this._render();} }
    _resetState() { this.board.reset(); } newGame() { this.board.reset(); this._render(); }
    _getHUDState() { const m=this.board.getMetadata(); return m.currentPlayer+' to play | B captured: '+m.captured.black+' | W captured: '+m.captured.white+' | Move: '+m.moveCount; }
}
if (typeof module !== 'undefined' && module.exports) { module.exports = { GoGame }; }