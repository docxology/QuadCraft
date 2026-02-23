/**
 * twenty48_game.js — 4D 2048 Game Controller
 * @module Twenty48Game
 */
if (typeof BaseGame === 'undefined' && typeof require !== 'undefined') { const _bg = require('../../4d_generic/base_game.js'); globalThis.BaseGame = _bg.BaseGame; }
if (typeof ScoreManager === 'undefined' && typeof require !== 'undefined') { const _sm = require('../../4d_generic/score_manager.js'); globalThis.ScoreManager = _sm.ScoreManager; }

class Twenty48Game extends BaseGame {
    constructor(canvas, hudEl) {
        const board = new Twenty48Board(3);
        const renderer = new Twenty48Renderer(canvas, board);
        super(canvas, hudEl, board, renderer, { name: 'Twenty48Game' });
        this.scoring = new ScoreManager({ key: 'quadcraft_2048' });
    }
    _handleKey(e) {
        const map = { '1':0,'2':1,'3':2,'4':3,'5':4,'6':5,'7':6,'8':7,'9':8,'0':9,'q':10,'w':11 };
        if (map[e.key] !== undefined) { this.board.slide(map[e.key]); this.scoring.addScore(this.board.score - (this.scoring.score||0)); this._render(); }
        if (e.key === 'r') { this.board.reset(); this._render(); }
    }
    _resetState() { this.board.reset(); this.scoring.reset(); }
    newGame() { this.board.reset(); this._render(); }
    _getHUDState() {
        const m = this.board.getMetadata();
        const hi = this.scoring.highScore > 0 ? ' | Best: ' + this.scoring.highScore : '';
        if (m.won) return '🎉 2048! Score: ' + m.score + hi;
        if (m.gameOver) return '💀 Game Over! Score: ' + m.score + hi;
        return 'Score: ' + m.score + ' | Max: ' + m.maxTile + ' | Moves: ' + m.moveCount + hi;
    }
}
if (typeof module !== 'undefined' && module.exports) { module.exports = { Twenty48Game }; }
