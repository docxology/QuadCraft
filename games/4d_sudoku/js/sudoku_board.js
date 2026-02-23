/** sudoku_board.js — 4D Sudoku on IVM Grid. Constraint regions by cell type. */
if (typeof Quadray === 'undefined' && typeof require !== 'undefined') { const _q = require('../../4d_generic/quadray.js'); globalThis.Quadray = _q.Quadray; }
if (typeof GridUtils === 'undefined' && typeof require !== 'undefined') { const _g = require('../../4d_generic/grid_utils.js'); globalThis.GridUtils = _g.GridUtils; }
if (typeof BaseBoard === 'undefined' && typeof require !== 'undefined') { const _bb = require('../../4d_generic/base_board.js'); globalThis.BaseBoard = _bb.BaseBoard; }
if (typeof SYNERGETICS === 'undefined' && typeof require !== 'undefined') { const _s = require('../../4d_generic/synergetics.js'); globalThis.SYNERGETICS = _s.SYNERGETICS; globalThis.verifyRoundTrip = _s.verifyRoundTrip; globalThis.verifyGeometricIdentities = _s.verifyGeometricIdentities; }

class SudokuBoard extends BaseBoard {
    constructor(size = 4) {
        super(size, { name: 'SudokuBoard', verify: true });
        this.cells = GridUtils.generateGrid(size);
        this.solution = new Map(); this.given = new Set();
        this.moveCount = 0; this.errors = 0; this.won = false;
        this._generatePuzzle();
    }
    _generatePuzzle() {
        // Fill with a valid solution using random placement
        for (const c of this.cells) { this.setCell(c, 0); this.solution.set(this.key(c.a, c.b, c.c, c.d), 0); }
        this.given.clear();
        // Simple approach: assign values 1..size to each cell s.t. no two IVM neighbors share a value
        const maxVal = Math.min(this.size, 12); // Max neighbors is 12
        const order = [...this.cells]; GridUtils.shuffle(order);
        for (const c of order) {
            const nbrs = GridUtils.boundedNeighbors(c.a, c.b, c.c, c.d, this.size);
            const used = new Set();
            for (const n of nbrs) { const v = this.solution.get(this.key(n.a, n.b, n.c, n.d)); if (v > 0) used.add(v); }
            let val = 1; while (used.has(val) && val <= maxVal) val++;
            if (val > maxVal) val = 1; // Fallback
            this.solution.set(this.key(c.a, c.b, c.c, c.d), val);
        }
        // Reveal ~40% as givens
        for (const c of order) {
            if (Math.random() < 0.4) {
                const k = this.key(c.a, c.b, c.c, c.d);
                this.setCell(c, this.solution.get(k));
                this.given.add(k);
            }
        }
    }
    place(pos, value) {
        const k = this.key(pos.a, pos.b, pos.c, pos.d);
        if (this.given.has(k) || this.won) return false;
        this.setCell(pos, value);
        this.moveCount++;
        // Check conflicts with IVM neighbors
        if (value > 0) {
            const nbrs = GridUtils.boundedNeighbors(pos.a, pos.b, pos.c, pos.d, this.size);
            for (const n of nbrs) { if (this.getCell(n) === value) { this.errors++; return true; } }
        }
        this._checkWin();
        return true;
    }
    _checkWin() {
        for (const c of this.cells) { if ((this.getCell(c) || 0) === 0) return; }
        // Check all constraints
        for (const c of this.cells) {
            const v = this.getCell(c);
            const nbrs = GridUtils.boundedNeighbors(c.a, c.b, c.c, c.d, this.size);
            for (const n of nbrs) { if (this.getCell(n) === v) return; }
        }
        this.won = true; this.gameOver = true;
    }
    isGiven(pos) { return this.given.has(this.key(pos.a, pos.b, pos.c, pos.d)); }
    getMetadata() { const filled = this.cells.filter(c => (this.getCell(c) || 0) > 0).length; return { ...this._baseMetadata(), filled, total: this.cells.length, moveCount: this.moveCount, errors: this.errors, won: this.won }; }
    reset() { for (const c of this.cells) { const k = this.key(c.a, c.b, c.c, c.d); if (!this.given.has(k)) this.setCell(c, 0); } this.moveCount = 0; this.errors = 0; this.won = false; this.gameOver = false; }
}
if (typeof module !== 'undefined' && module.exports) { module.exports = { SudokuBoard }; }