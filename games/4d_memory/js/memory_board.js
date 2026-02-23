/** memory_board.js — 4D Memory on IVM Grid. Match pairs on tetrahedral layout. */
if (typeof Quadray === 'undefined' && typeof require !== 'undefined') { const _q = require('../../4d_generic/quadray.js'); globalThis.Quadray = _q.Quadray; }
if (typeof GridUtils === 'undefined' && typeof require !== 'undefined') { const _g = require('../../4d_generic/grid_utils.js'); globalThis.GridUtils = _g.GridUtils; }
if (typeof BaseBoard === 'undefined' && typeof require !== 'undefined') { const _bb = require('../../4d_generic/base_board.js'); globalThis.BaseBoard = _bb.BaseBoard; }
if (typeof SYNERGETICS === 'undefined' && typeof require !== 'undefined') { const _s = require('../../4d_generic/synergetics.js'); globalThis.SYNERGETICS = _s.SYNERGETICS; globalThis.verifyRoundTrip = _s.verifyRoundTrip; globalThis.verifyGeometricIdentities = _s.verifyGeometricIdentities; }
if (typeof TurnManager === 'undefined' && typeof require !== 'undefined') { const _t = require('../../4d_generic/turn_manager.js'); globalThis.TurnManager = _t.TurnManager; }

class MemoryBoard extends BaseBoard {
    constructor(size = 3) {
        super(size, { name:'MemoryBoard', verify:true });
        this.turns = new TurnManager(['player1','player2']);
        this.cells = GridUtils.generateGrid(size);
        this.values = new Map(); this.revealed = new Set(); this.matched = new Set();
        this.selected = []; this.scores = { player1:0, player2:0 };
        this.moveCount = 0;
        this._dealCards();
    }
    _dealCards() {
        this.values.clear(); this.revealed.clear(); this.matched.clear(); this.selected = [];
        // Create pairs
        const numPairs = Math.floor(this.cells.length / 2);
        const symbols = [];
        for (let i = 0; i < numPairs; i++) { symbols.push(i+1, i+1); }
        while (symbols.length < this.cells.length) symbols.push(0); // extra unpaired
        GridUtils.shuffle(symbols);
        for (let i = 0; i < this.cells.length; i++) {
            this.values.set(this.key(this.cells[i].a,this.cells[i].b,this.cells[i].c,this.cells[i].d), symbols[i]);
        }
    }
    flip(pos) {
        const k = this.key(pos.a,pos.b,pos.c,pos.d);
        if (this.matched.has(k) || this.revealed.has(k) || this.values.get(k) === 0) return false;
        this.revealed.add(k);
        this.selected.push({pos, key:k});
        if (this.selected.length === 2) {
            this.moveCount++;
            const [a,b] = this.selected;
            if (this.values.get(a.key) === this.values.get(b.key) && a.key !== b.key) {
                this.matched.add(a.key); this.matched.add(b.key);
                this.scores[this.turns.currentPlayer]++;
            }
            // Note: in browser, we'd add a delay before hiding. For logic, we mark tentatively.
            this.turns.nextTurn();
        }
        if (this.selected.length > 2) { // Auto-clear previous pair if not matched
            for (const s of this.selected.slice(0,-1)) { if (!this.matched.has(s.key)) this.revealed.delete(s.key); }
            this.selected = [this.selected[this.selected.length-1]];
        }
        if (this.matched.size >= (Math.floor(this.cells.length/2))*2) this.gameOver = true;
        return true;
    }
    getValue(pos) { return this.values.get(this.key(pos.a,pos.b,pos.c,pos.d)) || 0; }
    isRevealed(pos) { return this.revealed.has(this.key(pos.a,pos.b,pos.c,pos.d)); }
    isMatched(pos) { return this.matched.has(this.key(pos.a,pos.b,pos.c,pos.d)); }
    getMetadata() { return { ...this._baseMetadata(), scores:this.scores, currentPlayer:this.turns.currentPlayer, matched:this.matched.size/2, totalPairs:Math.floor(this.cells.length/2), moveCount:this.moveCount }; }
    reset() { this.scores={player1:0,player2:0}; this.moveCount=0; this.gameOver=false; this.turns=new TurnManager(['player1','player2']); this._dealCards(); }
}
if (typeof module !== 'undefined' && module.exports) { module.exports = { MemoryBoard }; }