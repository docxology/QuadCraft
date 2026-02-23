/** go_board.js — 4D Go on IVM Grid. Liberties counted via 12 IVM neighbors. */
if (typeof Quadray === 'undefined' && typeof require !== 'undefined') { const _q = require('../../4d_generic/quadray.js'); globalThis.Quadray = _q.Quadray; }
if (typeof GridUtils === 'undefined' && typeof require !== 'undefined') { const _g = require('../../4d_generic/grid_utils.js'); globalThis.GridUtils = _g.GridUtils; }
if (typeof BaseBoard === 'undefined' && typeof require !== 'undefined') { const _bb = require('../../4d_generic/base_board.js'); globalThis.BaseBoard = _bb.BaseBoard; }
if (typeof SYNERGETICS === 'undefined' && typeof require !== 'undefined') { const _s = require('../../4d_generic/synergetics.js'); globalThis.SYNERGETICS = _s.SYNERGETICS; globalThis.verifyRoundTrip = _s.verifyRoundTrip; globalThis.verifyGeometricIdentities = _s.verifyGeometricIdentities; }
if (typeof TurnManager === 'undefined' && typeof require !== 'undefined') { const _t = require('../../4d_generic/turn_manager.js'); globalThis.TurnManager = _t.TurnManager; }

const STONE = { EMPTY: 0, BLACK: 1, WHITE: 2 };
class GoBoard extends BaseBoard {
    constructor(size = 5) {
        super(size, { name: 'GoBoard', verify: true });
        this.turns = new TurnManager(['black', 'white']);
        this.cells = GridUtils.generateGrid(size);
        this.captured = { black: 0, white: 0 };
        this.moveCount = 0;
        for (const c of this.cells) this.setCell(c, STONE.EMPTY);
    }
    place(pos) {
        if (this.getCell(pos) !== STONE.EMPTY) return false;
        const color = this.turns.currentPlayer === 'black' ? STONE.BLACK : STONE.WHITE;
        const enemy = color === STONE.BLACK ? STONE.WHITE : STONE.BLACK;
        this.setCell(pos, color);
        // Capture enemy groups with 0 liberties (IVM neighbors)
        const ivmNbrs = GridUtils.boundedNeighbors(pos.a, pos.b, pos.c, pos.d, this.size);
        for (const n of ivmNbrs) {
            if (this.getCell(n) === enemy) {
                const group = this._getGroup(n);
                if (this._liberties(group) === 0) {
                    for (const g of group) { this.setCell(g, STONE.EMPTY); }
                    this.captured[this.turns.currentPlayer] += group.length;
                }
            }
        }
        // Suicide check
        const myGroup = this._getGroup(pos);
        if (this._liberties(myGroup) === 0) { this.setCell(pos, STONE.EMPTY); return false; }
        this.moveCount++; this.turns.nextTurn(); return true;
    }
    _getGroup(pos) {
        const color = this.getCell(pos); const visited = new Set(); const group = [];
        const stack = [pos];
        while (stack.length > 0) {
            const cur = stack.pop(); const k = this.key(cur.a, cur.b, cur.c, cur.d);
            if (visited.has(k)) continue; visited.add(k);
            if (this.getCell(cur) !== color) continue;
            group.push(cur);
            const nbrs = GridUtils.boundedNeighbors(cur.a, cur.b, cur.c, cur.d, this.size);
            for (const n of nbrs) stack.push(n);
        }
        return group;
    }
    _liberties(group) {
        const libs = new Set();
        for (const g of group) {
            const nbrs = GridUtils.boundedNeighbors(g.a, g.b, g.c, g.d, this.size);
            for (const n of nbrs) { if (this.getCell(n) === STONE.EMPTY) libs.add(this.key(n.a, n.b, n.c, n.d)); }
        }
        return libs.size;
    }
    pass() { this.turns.nextTurn(); this.moveCount++; }
    getMetadata() { return { ...this._baseMetadata(), currentPlayer: this.turns.currentPlayer, captured: this.captured, moveCount: this.moveCount }; }
    reset() { for (const c of this.cells) this.setCell(c, STONE.EMPTY); this.captured = { black: 0, white: 0 }; this.moveCount = 0; this.gameOver = false; this.turns = new TurnManager(['black', 'white']); }
}
if (typeof module !== 'undefined' && module.exports) { module.exports = { GoBoard, STONE }; }