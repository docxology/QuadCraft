/** hex_board.js — 4D Hex on IVM Grid. Connect opposite faces via IVM neighbors. */
if (typeof Quadray === 'undefined' && typeof require !== 'undefined') { const _q = require('../../4d_generic/quadray.js'); globalThis.Quadray = _q.Quadray; }
if (typeof GridUtils === 'undefined' && typeof require !== 'undefined') { const _g = require('../../4d_generic/grid_utils.js'); globalThis.GridUtils = _g.GridUtils; }
if (typeof BaseBoard === 'undefined' && typeof require !== 'undefined') { const _bb = require('../../4d_generic/base_board.js'); globalThis.BaseBoard = _bb.BaseBoard; }
if (typeof SYNERGETICS === 'undefined' && typeof require !== 'undefined') { const _s = require('../../4d_generic/synergetics.js'); globalThis.SYNERGETICS = _s.SYNERGETICS; globalThis.verifyRoundTrip = _s.verifyRoundTrip; globalThis.verifyGeometricIdentities = _s.verifyGeometricIdentities; }
if (typeof TurnManager === 'undefined' && typeof require !== 'undefined') { const _t = require('../../4d_generic/turn_manager.js'); globalThis.TurnManager = _t.TurnManager; }

const HEX = { EMPTY: 0, RED: 1, BLUE: 2 };
class HexBoard extends BaseBoard {
    constructor(size = 5) {
        super(size, { name: 'HexBoard', verify: true });
        this.turns = new TurnManager(['red', 'blue']);
        // Canonicalize to min-component==0 representatives only: GridUtils.generateGrid()
        // enumerates every raw (a,b,c,d) in [0,size)^4, but many of those tuples are the
        // SAME physical IVM lattice point re-offset by a uniform (k,k,k,k) shift (e.g.
        // (1,1,1,1) is the same point as (0,0,0,0)). Without this filter, ~41% of the
        // board at size=5 is degenerate duplicate cells that are unreachable by
        // GridUtils.boundedNeighbors() and can silently hold independent state.
        this.cells = GridUtils.generateGrid(size).filter(c => Math.min(c.a, c.b, c.c, c.d) === 0);
        this.moveCount = 0; this.winner = null;
        for (const c of this.cells) this.setCell(c, HEX.EMPTY);
    }
    place(pos) {
        if (this.winner || this.getCell(pos) !== HEX.EMPTY) return false;
        const color = this.turns.currentPlayer === 'red' ? HEX.RED : HEX.BLUE;
        this.setCell(pos, color);
        this.moveCount++; this.turns.nextTurn();
        if (this._checkWin(color)) { this.winner = color === HEX.RED ? 'red' : 'blue'; this.gameOver = true; }
        return true;
    }
    _checkWin(color) {
        // Red connects a=0 to a=size-1; Blue connects b=0 to b=size-1
        const startCells = this.cells.filter(c => this.getCell(c) === color && (color === HEX.RED ? c.a === 0 : c.b === 0));
        const visited = new Set();
        const stack = [...startCells];
        while (stack.length > 0) {
            const cur = stack.pop(); const k = this.key(cur.a, cur.b, cur.c, cur.d);
            if (visited.has(k)) continue; visited.add(k);
            if (color === HEX.RED && cur.a === this.size - 1) return true;
            if (color === HEX.BLUE && cur.b === this.size - 1) return true;
            const nbrs = GridUtils.boundedNeighbors(cur.a, cur.b, cur.c, cur.d, this.size);
            for (const n of nbrs) { if (this.getCell(n) === color) stack.push(n); }
        }
        return false;
    }
    getMetadata() { return { ...this._baseMetadata(), currentPlayer: this.turns.currentPlayer, winner: this.winner, moveCount: this.moveCount }; }
    reset() { for (const c of this.cells) this.setCell(c, HEX.EMPTY); this.turns = new TurnManager(['red', 'blue']); this.moveCount = 0; this.winner = null; this.gameOver = false; }
}
if (typeof module !== 'undefined' && module.exports) { module.exports = { HexBoard, HEX }; }