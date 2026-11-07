/** sudoku_game.js */
if (typeof BaseGame === 'undefined' && typeof require !== 'undefined') { const _bg = require('../../4d_generic/base_game.js'); globalThis.BaseGame = _bg.BaseGame; }
class SudokuGame extends BaseGame {
    constructor(canvas, hudEl) {
        const board = new SudokuBoard(4);
        super(canvas, hudEl, board, new SudokuRenderer(canvas, board), { name: 'SudokuGame' });
        this.selectedVal = 1;
    }
    /** Bind value selection and picking through the shared input lifecycle. */
    _setupGameInput() {
        this.canvas.addEventListener('click', e => this._handleClick(e));
        this.input.bind(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'], e => this._handleKey(e));
        this.input.bind(['n'], () => this.newGame());
    }
    _handleClick(e) {
        if (e.shiftKey || this.loop.paused) return;
        const rect = this.canvas.getBoundingClientRect();
        const cell = this.renderer.hitTest(e.clientX - rect.left, e.clientY - rect.top, this.camera);
        if (cell) {
            this._lastClick = cell;
            this.board.place(cell, this.selectedVal);
        }
    }
    _handleKey(e) {
        if (this.loop.paused) return;
        const value = Number(e.key);
        if (value >= 1 && value <= this.board.size) this.selectedVal = value;
        if (value === 0 && this._lastClick) this.board.place(this._lastClick, 0);
    }
    newGame() {
        this.board = new SudokuBoard(4);
        this.renderer.board = this.board;
        this._lastClick = null;
    }
    _getHUDState() {
        const m = this.board.getMetadata();
        return { text: m.won ? '🎉 Solved!' : 'Val: ' + this.selectedVal + ' | Filled: ' + m.filled +
            '/' + m.total + ' | Moves: ' + m.moveCount + ' | Errors: ' + m.errors, color: '#94a3b8' };
    }
}
if (typeof module !== 'undefined' && module.exports) { module.exports = { SudokuGame }; }