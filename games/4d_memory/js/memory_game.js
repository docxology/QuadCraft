/** memory_game.js */
if (typeof BaseGame === 'undefined' && typeof require !== 'undefined') { const _bg = require('../../4d_generic/base_game.js'); globalThis.BaseGame = _bg.BaseGame; }
class MemoryGame extends BaseGame {
    constructor(canvas, hudEl) {
        const board = new MemoryBoard(3);
        super(canvas, hudEl, board, new MemoryRenderer(canvas, board), { name: 'MemoryGame' });
    }
    /** Register picking with the shared loop and camera lifecycle. */
    _setupGameInput() {
        this.canvas.addEventListener('click', e => this._handleClick(e));
        this.input.bind(['n'], () => this.newGame());
    }
    _handleClick(e) {
        if (e.shiftKey || this.loop.paused) return;
        const rect = this.canvas.getBoundingClientRect();
        const cell = this.renderer.hitTest(e.clientX - rect.left, e.clientY - rect.top, this.camera);
        if (cell) this.board.flip(cell);
    }
    newGame() { this.reset(); }
    _getHUDState() {
        const m = this.board.getMetadata();
        return { text: m.gameOver ? '🎉 Done! P1: ' + m.scores.player1 + ' P2: ' + m.scores.player2 :
            m.currentPlayer + ' | Matched: ' + m.matched + '/' + m.totalPairs + ' | Moves: ' + m.moveCount,
            color: '#94a3b8' };
    }
}
if (typeof module !== 'undefined' && module.exports) { module.exports = { MemoryGame }; }