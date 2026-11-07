/** go_game.js */
if (typeof BaseGame === 'undefined' && typeof require !== 'undefined') { const _bg = require('../../4d_generic/base_game.js'); globalThis.BaseGame = _bg.BaseGame; }
class GoGame extends BaseGame {
    constructor(canvas, hudEl) {
        const board = new GoBoard(5);
        super(canvas, hudEl, board, new GoRenderer(canvas, board), { name: 'GoGame' });
    }
    /** Bind board actions through the shared lifecycle; P passes a Go turn. */
    _setupGameInput() {
        this.canvas.addEventListener('click', e => this._handleClick(e));
        this.input.bind(['p'], () => { if (!this.loop.paused) this.board.pass(); });
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
        return { text: m.currentPlayer + ' to play | B captured: ' + m.captured.black +
            ' | W captured: ' + m.captured.white + ' | Move: ' + m.moveCount, color: '#94a3b8' };
    }
}
if (typeof module !== 'undefined' && module.exports) { module.exports = { GoGame }; }