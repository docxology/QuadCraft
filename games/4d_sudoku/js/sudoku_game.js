/** sudoku_game.js */
if (typeof BaseGame === 'undefined' && typeof require !== 'undefined') { const _bg = require('../../4d_generic/base_game.js'); globalThis.BaseGame = _bg.BaseGame; }
if (typeof ScoreManager === 'undefined' && typeof require !== 'undefined') { const _sm = require('../../4d_generic/score_manager.js'); globalThis.ScoreManager = _sm.ScoreManager; }
class SudokuGame extends BaseGame {
    constructor(canvas, hudEl) { const b=new SudokuBoard(4); const r=new SudokuRenderer(canvas,b); super(canvas,b,r,hudEl,{name:'SudokuGame'}); this.selectedVal=1; }
    _handleClick(e) { const rect=this.canvas.getBoundingClientRect(); const cell=this.renderer.hitTest(e.clientX-rect.left,e.clientY-rect.top,this.camera); if(cell){this.board.place(cell,this.selectedVal);this._render();} }
    _handleKey(e) { const n=parseInt(e.key); if(n>=1&&n<=9){this.selectedVal=n;this._render();} if(e.key==='0'){const cell=this.renderer.hitTest&&this._lastClick;} if(e.key==='r'){this.board.reset();this._render();} }
    _resetState() { this.board.reset(); } newGame() { this.board = new SudokuBoard(4); this.renderer.board = this.board; this._render(); }
    _getHUDState() { const m=this.board.getMetadata(); if(m.won) return '🎉 Solved!'; return 'Val: '+this.selectedVal+' | Filled: '+m.filled+'/'+m.total+' | Moves: '+m.moveCount+' | Errors: '+m.errors; }
}
if (typeof module !== 'undefined' && module.exports) { module.exports = { SudokuGame }; }