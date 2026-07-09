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
        // Fill with a valid solution using backtracking IVM-neighbor graph coloring
        for (const c of this.cells) { this.setCell(c, 0); this.solution.set(this.key(c.a, c.b, c.c, c.d), 0); }
        this.given.clear();
        // Assign values 1..size to each cell s.t. no two IVM neighbors share a value.
        // A single-pass greedy assignment cannot guarantee this (a cell can have up to
        // 12 IVM neighbors, far more than `size` colors), so this backtracks instead of
        // silently falling back to a conflicting value.
        this._colorSolution(this.size);
        // Reveal ~40% as givens
        const order = [...this.cells]; GridUtils.shuffle(order);
        for (const c of order) {
            if (Math.random() < 0.4) {
                const k = this.key(c.a, c.b, c.c, c.d);
                this.setCell(c, this.solution.get(k));
                this.given.add(k);
            }
        }
    }
    _colorSolution(maxVal) {
        // GridUtils.boundedNeighbors() is not symmetric (A can list B as a neighbor
        // without B listing A back), so a coloring that only checks each cell's own
        // neighbor list can still leave conflicts visible from the other cell's side.
        // Build the symmetric closure once and backtrack over that — a solution that
        // is conflict-free under the symmetric relation is also conflict-free under
        // the (weaker) one-directional relation place()/_checkWin() enforce at runtime.
        const adj = new Map();
        for (const c of this.cells) adj.set(this.key(c.a, c.b, c.c, c.d), new Set());
        for (const c of this.cells) {
            const k = this.key(c.a, c.b, c.c, c.d);
            for (const n of GridUtils.boundedNeighbors(c.a, c.b, c.c, c.d, this.size)) {
                const nk = this.key(n.a, n.b, n.c, n.d);
                adj.get(k).add(nk); adj.get(nk).add(k);
            }
        }
        // Most-constrained-first ordering speeds up the backtracking search.
        const order = [...adj.keys()]; GridUtils.shuffle(order);
        order.sort((x, y) => adj.get(y).size - adj.get(x).size);
        const assign = (i) => {
            if (i === order.length) return true;
            const k = order[i];
            const used = new Set();
            for (const nk of adj.get(k)) { const v = this.solution.get(nk); if (v > 0) used.add(v); }
            const candidates = [];
            for (let v = 1; v <= maxVal; v++) if (!used.has(v)) candidates.push(v);
            GridUtils.shuffle(candidates);
            for (const v of candidates) {
                this.solution.set(k, v);
                if (assign(i + 1)) return true;
                this.solution.set(k, 0);
            }
            return false;
        };
        if (!assign(0)) throw new Error('SudokuBoard: failed to generate a conflict-free IVM coloring');
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