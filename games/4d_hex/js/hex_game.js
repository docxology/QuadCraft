/** hex_game.js */
if (typeof BaseGame === 'undefined' && typeof require !== 'undefined') { const _bg = require('../../4d_generic/base_game.js'); globalThis.BaseGame = _bg.BaseGame; }
class HexGame extends BaseGame {
    constructor(canvas, hudEl) {
        const board = new HexBoard(5);
        super(canvas, hudEl, board, new HexRenderer(canvas, board), { name: 'HexGame' });
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
        if (cell) this.board.place(cell);
    }
    newGame() { this.reset(); }
    _getHUDState() {
        const m = this.board.getMetadata();
        return { text: m.winner ? '🎉 ' + m.winner.toUpperCase() + ' wins!' :
            m.currentPlayer + ' to play | Move: ' + m.moveCount, color: '#94a3b8' };
    }
}
if (typeof module !== 'undefined' && module.exports) { module.exports = { HexGame }; }