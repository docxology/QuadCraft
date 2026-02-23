/**
 * twenty48_board.js — 4D 2048 Board on IVM Grid
 * Tile-merging puzzle on 4D Quadray lattice.
 * Tiles slide along IVM directions (twelve-around-one) and merge.
 * @module Twenty48Board
 */
if (typeof Quadray === 'undefined' && typeof require !== 'undefined') { const _q = require('../../4d_generic/quadray.js'); globalThis.Quadray = _q.Quadray; }
if (typeof GridUtils === 'undefined' && typeof require !== 'undefined') { const _g = require('../../4d_generic/grid_utils.js'); globalThis.GridUtils = _g.GridUtils; }
if (typeof BaseBoard === 'undefined' && typeof require !== 'undefined') { const _bb = require('../../4d_generic/base_board.js'); globalThis.BaseBoard = _bb.BaseBoard; }
if (typeof SYNERGETICS === 'undefined' && typeof require !== 'undefined') { const _s = require('../../4d_generic/synergetics.js'); globalThis.SYNERGETICS = _s.SYNERGETICS; globalThis.verifyRoundTrip = _s.verifyRoundTrip; globalThis.verifyGeometricIdentities = _s.verifyGeometricIdentities; }

class Twenty48Board extends BaseBoard {
    constructor(size = 3) {
        super(size, { name: 'Twenty48Board', verify: true });
        this.cells = GridUtils.generateGrid(size);
        this.score = 0;
        this.won = false;
        this.moveCount = 0;
        for (const c of this.cells) this.setCell(c, 0);
        this._spawnTile();
        this._spawnTile();
        console.log('[Twenty48Board] ' + this.cells.length + ' cells, 12 IVM slide directions');
    }

    _spawnTile() {
        const empty = this.cells.filter(c => this.getCell(c) === 0);
        if (empty.length === 0) return false;
        const pos = empty[Math.floor(Math.random() * empty.length)];
        this.setCell(pos, Math.random() < 0.9 ? 2 : 4);
        return true;
    }

    /**
     * Slide all tiles in a given IVM direction.
     * @param {number} dirIndex — 0..11 index into DIRECTIONS_12
     * @returns {boolean} Whether any tile moved
     */
    slide(dirIndex) {
        if (this.gameOver || dirIndex < 0 || dirIndex >= 12) return false;
        const d = GridUtils.DIRECTIONS[dirIndex];
        let moved = false;
        const merged = new Set();

        // Sort cells so we process in the direction of movement
        const sorted = [...this.cells].sort((a, b) => {
            const da = a.a * d[0] + a.b * d[1] + a.c * d[2] + a.d * d[3];
            const db = b.a * d[0] + b.b * d[1] + b.c * d[2] + b.d * d[3];
            return db - da; // Process furthest-in-direction first
        });

        for (const cell of sorted) {
            const val = this.getCell(cell);
            if (val === 0) continue;

            let cur = cell;
            let next = { a: cur.a + d[0], b: cur.b + d[1], c: cur.c + d[2], d: cur.d + d[3] };

            while (GridUtils.inBounds(next.a, next.b, next.c, next.d, this.size) && this.getCell(next) === 0) {
                this.setCell(cur, 0);
                this.setCell(next, val);
                cur = next;
                next = { a: cur.a + d[0], b: cur.b + d[1], c: cur.c + d[2], d: cur.d + d[3] };
                moved = true;
            }

            // Merge check
            const nk = this.key(next.a, next.b, next.c, next.d);
            if (GridUtils.inBounds(next.a, next.b, next.c, next.d, this.size) &&
                this.getCell(next) === val && !merged.has(nk)) {
                this.setCell(cur, 0);
                this.setCell(next, val * 2);
                this.score += val * 2;
                merged.add(nk);
                moved = true;
                if (val * 2 >= 2048) this.won = true;
            }
        }

        if (moved) {
            this._spawnTile();
            this.moveCount++;
            if (!this._canMove()) this.gameOver = true;
        }
        return moved;
    }

    _canMove() {
        for (const c of this.cells) {
            if (this.getCell(c) === 0) return true;
            const val = this.getCell(c);
            for (let i = 0; i < 12; i++) { const d = GridUtils.DIRECTIONS[i]; const n = { a: c.a + d[0], b: c.b + d[1], c: c.c + d[2], d: c.d + d[3] }; if (!GridUtils.inBounds(n.a, n.b, n.c, n.d, this.size)) continue; if (this.getCell(n) === val) return true; }
        }
        return false;
    }

    getMetadata() {
        const maxTile = Math.max(...this.cells.map(c => this.getCell(c) || 0));
        return { ...this._baseMetadata(), score: this.score, maxTile, moveCount: this.moveCount, won: this.won };
    }

    reset() {
        for (const c of this.cells) this.setCell(c, 0);
        this.score = 0; this.won = false; this.gameOver = false; this.moveCount = 0;
        this._spawnTile(); this._spawnTile();
    }
}

if (typeof module !== 'undefined' && module.exports) { module.exports = { Twenty48Board }; }
