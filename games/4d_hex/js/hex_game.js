/** hex_game.js */
if (typeof BaseGame === 'undefined' && typeof require !== 'undefined') { const _bg = require('../../4d_generic/base_game.js'); globalThis.BaseGame = _bg.BaseGame; }
if (typeof ScoreManager === 'undefined' && typeof require !== 'undefined') { const _sm = require('../../4d_generic/score_manager.js'); globalThis.ScoreManager = _sm.ScoreManager; }
class HexGame extends BaseGame {
    constructor(canvas, hudEl) { const b=new HexBoard(5); const r=new HexRenderer(canvas,b); super(canvas,b,r,hudEl,{name:'HexGame'}); }
    _handleClick(e) { const rect=this.canvas.getBoundingClientRect(); const cell=this.renderer.hitTest(e.clientX-rect.left,e.clientY-rect.top,this.camera); if(cell){this.board.place(cell);this._render();} }
    _handleKey(e) { if(e.key==='r'){this.board.reset();this._render();} }
    _resetState() { this.board.reset(); } newGame() { this.board.reset(); this._render(); }
    _getHUDState() { const m=this.board.getMetadata(); if(m.winner) return '🎉 '+m.winner.toUpperCase()+' wins!'; return m.currentPlayer+' to play | Move: '+m.moveCount; }
}
if (typeof module !== 'undefined' && module.exports) { module.exports = { HexGame }; }