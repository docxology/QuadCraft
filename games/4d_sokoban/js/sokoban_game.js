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
        super(canvas, hudEl, board, renderer, { name: 'SokobanGame' });
        this.scoring = new ScoreManager({ key: 'quadcraft_sokoban', highScoreMode: 'low' });
        this.dirIndex = 0;
        console.log('[SokobanGame] Use keys 1-9,0,Q,W to move in an IVM direction');
    }
    /** Bind movement through BaseGame's InputController, not an unused key hook. */
    _setupGameInput() {
        this.input.bind(['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'q', 'Q', 'w', 'W'],
            e => this._handleKey(e));
        this.input.bind(['n'], () => this.newGame());
    }


    _handleKey(e) {
        if (this.loop.paused) return;
        const dirMap = {
            '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5,
            '7': 6, '8': 7, '9': 8, '0': 9, 'q': 10, 'w': 11
        };
        const key = e.key.toLowerCase();
        if (dirMap[key] !== undefined) {
            this.dirIndex = dirMap[key];
            this.board.move(this.dirIndex);
            if (this.board.won) {
                this.scoring.addScore(this.board.moveCount);
            }
        }
    }

    reset() { super.reset(); this.scoring.reset(); }
    newGame() { this.reset(); }

    _getHUDState() {
        const m = this.board.getMetadata();
        const hi = this.scoring.highScore > 0 ? ` | Best: ${this.scoring.highScore}` : '';
        if (m.won) return { text: `🎉 Solved! Moves: ${m.moveCount}, Pushes: ${m.pushCount}${hi}`, color: '#48bb78' };
        return { text: `Boxes: ${m.boxesOnGoals}/${m.totalBoxes} | Moves: ${m.moveCount} | Pushes: ${m.pushCount}${hi}`, color: '#94a3b8' };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SokobanGame };
}
