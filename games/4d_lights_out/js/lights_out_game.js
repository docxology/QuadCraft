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
 *   - BaseGame: init, start, pause, reset, newGame
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
        super(canvas, board, renderer, hudEl, { name: 'LightsOutGame' });

        // Score tracking via ScoreManager
        this.scoring = new ScoreManager({
            key: 'quadcraft_lights_out',
            highScoreMode: 'low', // Lower moves = better
        });

        console.log('[LightsOutGame] Initialized — click cells to toggle');
    }

    /** Override: handle click to toggle a cell. */
    _handleClick(e) {
        if (this.board.won) return;

        const rect = this.canvas.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;

        const cell = this.renderer.hitTest(sx, sy, this.camera);
        if (cell) {
            this.board.toggle(cell);
            this._render();

            if (this.board.won) {
                this.scoring.addScore(this.board.moveCount);
                console.log(`[LightsOutGame] 🎉 Solved in ${this.board.moveCount} moves! ${JSON.stringify(this.scoring.toJSON())}`);
            }
        }
    }

    /** Reset to a new puzzle. */
    _resetState() {
        this.board.reset();
        this.scoring.reset();
    }

    /** New game (preserve high score). */
    newGame() {
        this.board.reset();
        this._render();
    }

    /** Build HUD state string. */
    _getHUDState() {
        const meta = this.board.getMetadata();
        const hiLabel = this.scoring.highScore > 0 ? ` | Best: ${this.scoring.highScore}` : '';

        if (meta.won) {
            return `🎉 SOLVED in ${meta.moveCount} moves!${hiLabel}`;
        }

        return `Lit: ${meta.litCount}/${meta.totalCells} | Moves: ${meta.moveCount}${hiLabel}`;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LightsOutGame };
}
