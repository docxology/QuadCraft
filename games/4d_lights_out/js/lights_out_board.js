/**
 * lights_out_board.js — 4D Lights Out Board on IVM Grid
 *
 * The classic Lights Out puzzle in 4D Quadray space.
 * Toggling a cell also toggles all its IVM neighbors (up to 12 — the
 * true "twelve around one" kissing-sphere topology).
 * Goal: turn all lights off.
 *
 * Shared modules: Quadray, GridUtils, SYNERGETICS, BaseBoard.
 *
 * @module LightsOutBoard
 */

// Node.js compatibility
if (typeof Quadray === 'undefined' && typeof require !== 'undefined') {
    const _q = require('../../4d_generic/quadray.js');
    globalThis.Quadray = _q.Quadray;
}
if (typeof GridUtils === 'undefined' && typeof require !== 'undefined') {
    const _g = require('../../4d_generic/grid_utils.js');
    globalThis.GridUtils = _g.GridUtils;
}
if (typeof BaseBoard === 'undefined' && typeof require !== 'undefined') {
    const _bb = require('../../4d_generic/base_board.js');
    globalThis.BaseBoard = _bb.BaseBoard;
}
if (typeof SYNERGETICS === 'undefined' && typeof require !== 'undefined') {
    const _s = require('../../4d_generic/synergetics.js');
    globalThis.SYNERGETICS = _s.SYNERGETICS;
    globalThis.verifyRoundTrip = _s.verifyRoundTrip;
    globalThis.verifyGeometricIdentities = _s.verifyGeometricIdentities;
}

/**
 * 4D Lights Out Board using Quadray coordinates.
 * Each cell is either ON (true) or OFF (false).
 * Toggling a cell flips it and all its 12 IVM neighbors
 * (permutations of 0,1,1,2 — the kissing-sphere topology).
 */
class LightsOutBoard extends BaseBoard {
    /**
     * @param {number} size — Grid dimension.
     */
    constructor(size = 4) {
        super(size, { name: 'LightsOutBoard', verify: true });
        this.moveCount = 0;
        this.won = false;
        this.cells = []; // All valid cell positions
        this._buildCells();
        this.randomize();
        console.log(`[LightsOutBoard] ${this.cells.length} cells on ${size}x grid, 12 IVM neighbors per cell`);
    }

    /** Build the set of valid cell positions. */
    _buildCells() {
        this.cells = GridUtils.generateGrid(this.size);
        for (const pos of this.cells) {
            this.setCell(pos, false); // Start all OFF
        }
    }

    /** Get whether a cell is ON. */
    isLit(pos) {
        return this.getCell(pos) === true;
    }

    /**
     * Toggle a cell and all its 12 IVM neighbors (twelve-around-one).
     * Returns the number of cells toggled.
     */
    toggle(pos) {
        if (this.won) return 0;

        const key = this.key(pos.a, pos.b, pos.c, pos.d);
        if (!this.grid.has(key)) return 0; // Not a valid cell

        // Collect self + IVM neighbors that are on the board
        const targets = [pos];
        const nbrs = GridUtils.boundedNeighbors(pos.a, pos.b, pos.c, pos.d, this.size);
        for (const n of nbrs) {
            targets.push(n);
        }

        // Flip each target
        for (const t of targets) {
            const tk = this.key(t.a, t.b, t.c, t.d);
            if (this.grid.has(tk)) {
                this.grid.set(tk, !this.grid.get(tk));
            }
        }

        this.moveCount++;
        this._checkWin();

        console.log(`[LightsOutBoard] Toggle (${pos.a},${pos.b},${pos.c},${pos.d}) → ${targets.length} cells flipped, move #${this.moveCount}`);
        return targets.length;
    }

    /** Check if all lights are off (win condition). */
    _checkWin() {
        for (const cell of this.cells) {
            if (this.isLit(cell)) {
                this.won = false;
                return;
            }
        }
        this.won = true;
        this.gameOver = true;
        console.log(`[LightsOutBoard] 🎉 YOU WIN in ${this.moveCount} moves!`);
    }

    /** Count how many cells are currently lit. */
    litCount() {
        let count = 0;
        for (const cell of this.cells) {
            if (this.isLit(cell)) count++;
        }
        return count;
    }

    /** Randomize the board by performing random toggles (ensures solvability). */
    randomize(numToggles) {
        // Reset all to OFF
        for (const cell of this.cells) {
            this.setCell(cell, false);
        }
        this.moveCount = 0;
        this.won = false;
        this.gameOver = false;

        // Perform random toggles to guarantee solvability
        const n = numToggles || Math.max(3, Math.floor(this.cells.length * 0.15));
        for (let i = 0; i < n; i++) {
            const idx = Math.floor(Math.random() * this.cells.length);
            this.toggle(this.cells[idx]);
        }
        this.moveCount = 0; // Reset move count after setup

        // If we randomly got all-off, toggle one more
        if (this.litCount() === 0) {
            this.toggle(this.cells[0]);
            this.moveCount = 0;
        }

        console.log(`[LightsOutBoard] Randomized with ${this.litCount()}/${this.cells.length} lit cells`);
    }

    /** Get board metadata for HUD display. */
    getMetadata() {
        return {
            ...this._baseMetadata(),
            litCount: this.litCount(),
            totalCells: this.cells.length,
            moveCount: this.moveCount,
            won: this.won,
        };
    }

    /** Reset to a fresh random puzzle. */
    reset() {
        this.moveCount = 0;
        this.won = false;
        this.gameOver = false;
        this.randomize();
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LightsOutBoard };
}
