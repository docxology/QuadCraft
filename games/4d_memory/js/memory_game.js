/** memory_game.js */
if (typeof BaseGame === 'undefined' && typeof require !== 'undefined') { const _bg = require('../../4d_generic/base_game.js'); globalThis.BaseGame = _bg.BaseGame; }
if (typeof ScoreManager === 'undefined' && typeof require !== 'undefined') { const _sm = require('../../4d_generic/score_manager.js'); globalThis.ScoreManager = _sm.ScoreManager; }
class MemoryGame extends BaseGame {
    constructor(canvas, hudEl) { const b=new MemoryBoard(3); const r=new MemoryRenderer(canvas,b); super(canvas,b,r,hudEl,{name:'MemoryGame'}); }
    _handleClick(e) { const rect=this.canvas.getBoundingClientRect(); const cell=this.renderer.hitTest(e.clientX-rect.left,e.clientY-rect.top,this.camera); if(cell){this.board.flip(cell);this._render();} }
    _handleKey(e) { if(e.key==='r'){this.board.reset();this._render();} }
    _resetState() { this.board.reset(); } newGame() { this.board.reset(); this._render(); }
    _getHUDState() { const m=this.board.getMetadata(); if(m.gameOver) return '🎉 Done! P1: '+m.scores.player1+' P2: '+m.scores.player2; return m.currentPlayer+' | Matched: '+m.matched+'/'+m.totalPairs+' | Moves: '+m.moveCount; }
}
if (typeof module !== 'undefined' && module.exports) { module.exports = { MemoryGame }; }