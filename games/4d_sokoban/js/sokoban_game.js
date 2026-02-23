/**
 * sokoban_game.js — 4D Sokoban Game Controller
 * Keyboard-driven box pushing with 12 IVM directions.
 * @module SokobanGame
 */
if (typeof BaseGame === 'undefined' && typeof require !== 'undefined') {
    const _bg = require('../../4d_generic/base_game.js');
    globalThis.BaseGame = _bg.BaseGame;
}
if (typeof ScoreManager === 'undefined' && typeof require !== 'undefined') {
    const _sm = require('../../4d_generic/score_manager.js');
    globalThis.ScoreManager = _sm.ScoreManager;
}

class SokobanGame extends BaseGame {
    constructor(canvas, hudEl) {
        const board = new SokobanBoard(5);
        const renderer = new SokobanRenderer(canvas, board);
        super(canvas, board, renderer, hudEl, { name: 'SokobanGame' });
        this.scoring = new ScoreManager({ key: 'quadcraft_sokoban', highScoreMode: 'low' });
        this.dirIndex = 0;
        console.log('[SokobanGame] Use keys 1-9,0,Q,W to pick IVM direction, Enter to move');
    }

    _handleKey(e) {
        const dirMap = {
            '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5,
            '7': 6, '8': 7, '9': 8, '0': 9, 'q': 10, 'w': 11
        };
        if (dirMap[e.key] !== undefined) {
            this.dirIndex = dirMap[e.key];
            this.board.move(this.dirIndex);
            this._render();
            if (this.board.won) {
                this.scoring.addScore(this.board.moveCount);
            }
        }
        if (e.key === 'r') { this.board.reset(); this._render(); }
    }

    _resetState() { this.board.reset(); this.scoring.reset(); }
    newGame() { this.board.reset(); this._render(); }

    _getHUDState() {
        const m = this.board.getMetadata();
        const hi = this.scoring.highScore > 0 ? ` | Best: ${this.scoring.highScore}` : '';
        if (m.won) return `🎉 Solved! Moves: ${m.moveCount}, Pushes: ${m.pushCount}${hi}`;
        return `Boxes: ${m.boxesOnGoals}/${m.totalBoxes} | Moves: ${m.moveCount} | Pushes: ${m.pushCount}${hi}`;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SokobanGame };
}
