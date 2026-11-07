/**
 * lights_out_game.js — 4D Lights Out Game Controller
 *
 * Integrates HUD, ScoreManager, and the LightsOutBoard with IVM neighbor topology.
 * Click a cell to toggle it and its 12 IVM kissing-sphere neighbors.
 * Goal: turn all lights off in the fewest moves.
 *
 * Extends BaseGame for shared lifecycle, input, and camera management.
 *
 * API surface used:
 *   - BaseGame: init, togglePause, reset, _setupGameInput, _getHUDState
 *   - ScoreManager: addScore, reset, toJSON
 *   - HUD: livesString, set
 *
 * @module LightsOutGame
 */

// Node.js compatibility
if (typeof BaseGame === 'undefined' && typeof require !== 'undefined') {
    const _bg = require('../../4d_generic/base_game.js');
    globalThis.BaseGame = _bg.BaseGame;
}
if (typeof ScoreManager === 'undefined' && typeof require !== 'undefined') {
    const _sm = require('../../4d_generic/score_manager.js');
    globalThis.ScoreManager = _sm.ScoreManager;
}

class LightsOutGame extends BaseGame {
    constructor(canvas, hudEl) {
        const board = new LightsOutBoard(4);
        const renderer = new LightsOutRenderer(canvas, board);
        super(canvas, hudEl, board, renderer, { name: 'LightsOutGame' });

        // Score tracking via ScoreManager
        this.scoring = new ScoreManager({
            key: 'quadcraft_lights_out',
            highScoreMode: 'low', // Lower moves = better
        });

        console.log('[LightsOutGame] Initialized — click cells to toggle');
    }
    /** Register cell picking through the shared lifecycle. */
    _setupGameInput() {
        this.canvas.addEventListener('click', e => this._handleClick(e));
        this.input.bind(['n'], () => this.newGame());
    }


    /** Override: handle click to toggle a cell. */
    _handleClick(e) {
        if (this.board.won || this.loop.paused || e.shiftKey) return;

        const rect = this.canvas.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;

        const cell = this.renderer.hitTest(sx, sy, this.camera);
        if (cell) {
            this.board.toggle(cell);

            if (this.board.won) {
                this.scoring.addScore(this.board.moveCount);
                console.log(`[LightsOutGame] 🎉 Solved in ${this.board.moveCount} moves! ${JSON.stringify(this.scoring.toJSON())}`);
            }
        }
    }

    /** Reset to a new puzzle. */
    reset() {
        super.reset();
        this.scoring.reset();
    }

    /** New game (preserve high score). */
    newGame() {
        this.reset();
    }

    /** Return the shared HUD text/color contract. */
    _getHUDState() {
        const meta = this.board.getMetadata();
        const hiLabel = this.scoring.highScore > 0 ? ` | Best: ${this.scoring.highScore}` : '';

        if (meta.won) {
            return { text: `🎉 SOLVED in ${meta.moveCount} moves!${hiLabel}`, color: '#48bb78' };
        }

        return { text: `Lit: ${meta.litCount}/${meta.totalCells} | Moves: ${meta.moveCount}${hiLabel}`, color: '#94a3b8' };
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LightsOutGame };
}
