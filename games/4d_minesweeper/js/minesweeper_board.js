/**
 * minesweeper_board.js — 4D Minesweeper on IVM (Quadray) Lattice
 *
 * Cells live at integer Quadray positions (a,b,c,d).
 * IVM adjacency: each cell has up to 80 neighbors (all +/-1 offsets in 4 coords).
 * Mine counts reflect the true 4D neighbor count.
 *
 * Deeply integrated with all Quadray/IVM shared modules:
 *   - Quadray: toKey, normalized, add, subtract, equals, distance,
 *              distanceTo, length, scale, toIVM, cellType, cellVolume,
 *              toCartesian, fromCartesian, clone, IVM_DIRECTIONS, BASIS
 *   - GridUtils: key, parseKey, neighbors, boundedNeighbors, inBounds,
 *                manhattan, euclidean, generateGrid, depthSort, shuffle
 *   - SYNERGETICS: constants, volume ratios
 *   - verifyRoundTrip, verifyGeometricIdentities, angleBetweenQuadrays
 *
 * @module MinesweeperBoard
 */

// Node.js compatibility — load shared modules if not already in scope.
// IMPORTANT: Do NOT use `var` here. `var` hoisting creates a script-scope
// binding that shadows the global, which breaks browsers where globals
// are set by prior <script> tags.
if (typeof Quadray === 'undefined' && typeof require !== 'undefined') {
    /* eslint-disable no-global-assign */
    const _q = require('../../4d_generic/quadray.js');
    globalThis.Quadray = _q.Quadray;
}
if (typeof GridUtils === 'undefined' && typeof require !== 'undefined') {
    const _g = require('../../4d_generic/grid_utils.js');
    globalThis.GridUtils = _g.GridUtils;
}
if (typeof SYNERGETICS === 'undefined' && typeof require !== 'undefined') {
    const _s = require('../../4d_generic/synergetics.js');
    globalThis.SYNERGETICS = _s.SYNERGETICS;
    globalThis.angleBetweenQuadrays = _s.angleBetweenQuadrays;
    globalThis.verifyRoundTrip = _s.verifyRoundTrip;
    globalThis.verifyGeometricIdentities = _s.verifyGeometricIdentities;
}

class MinesweeperBoard {
    /**
     * @param {number} size  - Grid extent in each Quadray axis (0..size-1)
     * @param {number} mineRatio - Fraction of cells that are mines
     */
    constructor(size = 4, mineRatio = 0.15) {
        this.size = size;
        this.mineRatio = mineRatio;
        this.mines = new Set();      // Set of position keys
        this.revealed = new Set();   // Set of position keys
        this.flagged = new Set();    // Set of position keys
        /** @type {Map<string, number>} Cache of adjacent mine counts */
        this.neighborCache = new Map();
        this.totalCells = 0;
        this.totalMines = 0;
        this.gameOver = false;
        this.won = false;
        this.score = 0;
        this.level = 1;
        this.firstClick = true;

        // Synergetics metadata
        this.volumeRatios = {
            tetra: SYNERGETICS?.TETRA_VOL ?? 1,
            octa: SYNERGETICS?.OCTA_VOL ?? 4,
            cubo: SYNERGETICS?.CUBO_VOL ?? 20,
        };
        this.cellVolumeUnit = Quadray.cellVolume();
        this.s3Constant = SYNERGETICS?.S3 ?? 1.0607;

        // Integrity check — verify round-trip on corner positions
        this._verifyIntegrity();

        this.initBoard();

        console.log(`[MinesweeperBoard] ${this.totalCells} cells, ${this.totalMines} mines on ${this.size}^4 IVM grid`);
        console.log(`[MinesweeperBoard] Cell volume: ${this.cellVolumeUnit}, S3: ${this.s3Constant}`);
        console.log(`[MinesweeperBoard] Volume ratios T:O:C = ${this.volumeRatios.tetra}:${this.volumeRatios.octa}:${this.volumeRatios.cubo}`);
    }

    /** Verify geometric integrity on construction. */
    _verifyIntegrity() {
        if (typeof verifyRoundTrip !== 'function') return;
        const corners = [
            new Quadray(0, 0, 0, 0),
            new Quadray(this.size - 1, this.size - 1, this.size - 1, this.size - 1),
            new Quadray(this.size - 1, 0, 0, 0),
            new Quadray(0, this.size - 1, 0, 0),
        ];
        let allPassed = true;
        for (const corner of corners) {
            const result = verifyRoundTrip(corner);
            if (!result.passed) {
                console.warn(`[MinesweeperBoard] Round-trip failed for ${corner.toString()}: error=${result.error.toFixed(6)}`);
                allPassed = false;
            }
        }
        if (allPassed) console.log('[MinesweeperBoard] Round-trip integrity verified on corner positions');
    }

    /** Initialize the board: enumerate all cells, cache total count. */
    initBoard() {
        this.mines.clear();
        this.revealed.clear();
        this.flagged.clear();
        this.neighborCache.clear();
        this.gameOver = false;
        this.won = false;
        this.score = 0;
        this.firstClick = true;
        // Count total cells in the grid
        this.totalCells = 0;
        this._forEachCell(() => this.totalCells++);
        this.totalMines = Math.max(1, Math.floor(this.totalCells * this.mineRatio));
    }

    /** Iterate over all valid integer Quadray positions in the grid. */
    _forEachCell(fn) {
        for (let a = 0; a < this.size; a++)
            for (let b = 0; b < this.size; b++)
                for (let c = 0; c < this.size; c++)
                    for (let d = 0; d < this.size; d++)
                        fn(a, b, c, d);
    }

    /**
     * Position key — delegates to GridUtils.key().
     * @param {number} a
     * @param {number} b
     * @param {number} c
     * @param {number} d
     * @returns {string}
     */
    key(a, b, c, d) { return GridUtils.key(a, b, c, d); }

    /**
     * Parse key back to coords — delegates to GridUtils.parseKey().
     * @param {string} k
     * @returns {{a:number, b:number, c:number, d:number}}
     */
    parseKey(k) {
        const parsed = GridUtils.parseKey(k);
        return [parsed.a, parsed.b, parsed.c, parsed.d];
    }

    /**
     * Check if position is within bounds.
     * Delegates to GridUtils.inBounds().
     * @param {number} a
     * @param {number} b
     * @param {number} c
     * @param {number} d
     * @returns {boolean}
     */
    inBounds(a, b, c, d) {
        return GridUtils.inBounds(a, b, c, d, this.size);
    }

    /**
     * Get cell state at a Quadray position.
     * @param {Quadray} q
     * @returns {string} 'mine', 'revealed', 'flagged', or 'hidden'
     */
    getCell(q) {
        const k = this.key(q.a, q.b, q.c, q.d);
        if (this.revealed.has(k)) return this.mines.has(k) ? 'mine' : 'revealed';
        if (this.flagged.has(k)) return 'flagged';
        return 'hidden';
    }

    /**
     * Set cell data at a Quadray position (compatibility with scaffold tests).
     * @param {Quadray} q
     * @param {*} value
     */
    setCell(q, value) {
        if (!this._extraData) this._extraData = {};
        this._extraData[this.key(q.a, q.b, q.c, q.d)] = value;
    }

    /**
     * Get all IVM neighbors of a cell.
     * In 4D, each cell has up to 3^4 - 1 = 80 neighbors (all +/-1 offsets).
     * @param {number} a
     * @param {number} b
     * @param {number} c
     * @param {number} d
     * @returns {string[]} Array of neighbor keys
     */
    getNeighborKeys(a, b, c, d) {
        const neighbors = [];
        for (let da = -1; da <= 1; da++)
            for (let db = -1; db <= 1; db++)
                for (let dc = -1; dc <= 1; dc++)
                    for (let dd = -1; dd <= 1; dd++) {
                        if (da === 0 && db === 0 && dc === 0 && dd === 0) continue;
                        const na = a + da, nb = b + db, nc = c + dc, nd = d + dd;
                        if (this.inBounds(na, nb, nc, nd)) {
                            neighbors.push(this.key(na, nb, nc, nd));
                        }
                    }
        return neighbors;
    }

    /**
     * Get IVM neighbors of a position that are within board bounds.
     * Uses GridUtils.boundedNeighbors() for axis-aligned neighbors.
     * @param {Quadray} q
     * @returns {Array<Quadray>}
     */
    getIVMNeighbors(q) {
        const bounded = GridUtils.boundedNeighbors(q.a, q.b, q.c, q.d, this.size);
        return bounded.map(n => new Quadray(n.a, n.b, n.c, n.d));
    }

    /**
     * Calculate Manhattan distance between two positions on the board.
     * Uses GridUtils.manhattan().
     * @param {Quadray} q1
     * @param {Quadray} q2
     * @returns {number}
     */
    manhattanDistance(q1, q2) {
        return GridUtils.manhattan(
            { a: q1.a, b: q1.b, c: q1.c, d: q1.d },
            { a: q2.a, b: q2.b, c: q2.c, d: q2.d }
        );
    }

    /**
     * Calculate Euclidean distance between two positions on the board.
     * Uses GridUtils.euclidean().
     * @param {Quadray} q1
     * @param {Quadray} q2
     * @returns {number}
     */
    euclideanDistance(q1, q2) {
        return GridUtils.euclidean(
            { a: q1.a, b: q1.b, c: q1.c, d: q1.d },
            { a: q2.a, b: q2.b, c: q2.c, d: q2.d }
        );
    }

    /**
     * Calculate Quadray distance (proper IVM distance) between two positions.
     * Uses Quadray.distance() / Quadray.distanceTo().
     * @param {Quadray} q1
     * @param {Quadray} q2
     * @returns {number}
     */
    quadrayDistance(q1, q2) {
        return Quadray.distance(q1, q2);
    }

    /**
     * Get the angle between two direction vectors from a position.
     * Uses angleBetweenQuadrays() from synergetics.
     * @param {Quadray} from
     * @param {Quadray} to1
     * @param {Quadray} to2
     * @returns {number} Angle in degrees
     */
    angleBetween(from, to1, to2) {
        if (typeof angleBetweenQuadrays !== 'function') return 0;
        const v1 = to1.subtract(from);
        const v2 = to2.subtract(from);
        return angleBetweenQuadrays(v1, v2);
    }

    /**
     * Place mines randomly, excluding a safe zone around the first click.
     * Uses GridUtils.shuffle() for randomization.
     * @param {number} safeA - First-click a coordinate
     * @param {number} safeB - First-click b coordinate
     * @param {number} safeC - First-click c coordinate
     * @param {number} safeD - First-click d coordinate
     */
    placeMines(safeA, safeB, safeC, safeD) {
        const safeKey = this.key(safeA, safeB, safeC, safeD);
        const safeNeighbors = new Set(this.getNeighborKeys(safeA, safeB, safeC, safeD));
        safeNeighbors.add(safeKey);

        // Collect all candidate positions
        const candidates = [];
        this._forEachCell((a, b, c, d) => {
            const k = this.key(a, b, c, d);
            if (!safeNeighbors.has(k)) candidates.push(k);
        });

        // Shuffle using GridUtils.shuffle()
        GridUtils.shuffle(candidates);

        const count = Math.min(this.totalMines, candidates.length);
        for (let i = 0; i < count; i++) {
            this.mines.add(candidates[i]);
        }

        // Cache neighbor counts for all cells
        this._forEachCell((a, b, c, d) => {
            const k = this.key(a, b, c, d);
            let c2 = 0;
            for (const nk of this.getNeighborKeys(a, b, c, d)) {
                if (this.mines.has(nk)) c2++;
            }
            this.neighborCache.set(k, c2);
        });

        console.log(`[MinesweeperBoard] Placed ${count} mines (safe zone: ${safeNeighbors.size} cells)`);
    }

    /**
     * Reveal a cell. On first click, places mines avoiding this cell.
     * If the cell has 0 adjacent mines, flood-fill reveals neighbors.
     * @param {number} a
     * @param {number} b
     * @param {number} c
     * @param {number} d
     * @returns {string} Result: 'mine', 'number', 'flood', 'already', 'flagged'
     */
    reveal(a, b, c, d) {
        if (this.gameOver) return 'gameover';
        const k = this.key(a, b, c, d);

        if (this.flagged.has(k)) return 'flagged';
        if (this.revealed.has(k)) return 'already';

        // First click: place mines
        if (this.firstClick) {
            this.placeMines(a, b, c, d);
            this.firstClick = false;
        }

        // Hit a mine
        if (this.mines.has(k)) {
            this.gameOver = true;
            this.won = false;
            this.revealed.add(k);
            // Reveal all mines
            for (const mk of this.mines) this.revealed.add(mk);
            return 'mine';
        }

        // Flood-fill reveal for zero-count cells
        const stack = [k];
        let revealedCount = 0;
        while (stack.length > 0) {
            const ck = stack.pop();
            if (this.revealed.has(ck)) continue;
            this.revealed.add(ck);
            revealedCount++;

            const count = this.neighborCache.get(ck) || 0;
            if (count === 0) {
                // Expand to neighbors
                const [ca, cb, cc, cd] = this.parseKey(ck);
                for (const nk of this.getNeighborKeys(ca, cb, cc, cd)) {
                    if (!this.revealed.has(nk) && !this.mines.has(nk)) {
                        stack.push(nk);
                    }
                }
            }
        }

        this.score += revealedCount;
        this._checkWin();
        return revealedCount > 1 ? 'flood' : 'number';
    }

    /**
     * Toggle flag on a cell.
     * @param {number} a
     * @param {number} b
     * @param {number} c
     * @param {number} d
     */
    toggleFlag(a, b, c, d) {
        if (this.gameOver) return;
        const k = this.key(a, b, c, d);
        if (this.revealed.has(k)) return;
        if (this.flagged.has(k)) this.flagged.delete(k);
        else this.flagged.add(k);
    }

    /** Check if all non-mine cells are revealed. */
    _checkWin() {
        const totalSafe = this.totalCells - this.mines.size;
        if (this.revealed.size >= totalSafe) {
            this.gameOver = true;
            this.won = true;
        }
    }

    /**
     * Get all cells as renderable objects.
     * Each cell includes its Quadray, cellType, Cartesian coordinates,
     * distance from origin, and state info.
     * @returns {Array<Object>}
     */
    getCells() {
        const cells = [];
        this._forEachCell((a, b, c, d) => {
            const k = this.key(a, b, c, d);
            let state = 'hidden';
            if (this.revealed.has(k)) {
                state = this.mines.has(k) ? 'mine' : 'revealed';
            } else if (this.flagged.has(k)) {
                state = 'flagged';
            }
            const q = new Quadray(a, b, c, d);
            const cartesian = q.toCartesian();
            const distFromOrigin = q.distanceTo(Quadray.ORIGIN);
            const cellType = Quadray.cellType(a, b, c, d);

            cells.push({
                a, b, c, d, state,
                count: this.neighborCache.get(k) || 0,
                quadray: q,
                cartesian,
                distFromOrigin,
                cellType,
            });
        });
        return cells;
    }

    /**
     * Get board metadata for HUD display.
     * @returns {Object}
     */
    getMetadata() {
        let tetraRevealed = 0, octaRevealed = 0;
        for (const k of this.revealed) {
            const [a, b, c, d] = this.parseKey(k);
            const ct = Quadray.cellType(a, b, c, d);
            if (ct === 'tetra') tetraRevealed++;
            else octaRevealed++;
        }
        return {
            score: this.score,
            totalCells: this.totalCells,
            totalMines: this.totalMines,
            revealedCount: this.revealed.size,
            flaggedCount: this.flagged.size,
            totalSafe: this.totalCells - this.mines.size,
            gameOver: this.gameOver,
            won: this.won,
            firstClick: this.firstClick,
            tetraRevealed,
            octaRevealed,
            volumeRatios: this.volumeRatios,
            cellVolume: this.cellVolumeUnit,
            s3: this.s3Constant,
        };
    }

    /** Reset board to initial state. */
    reset() {
        this.initBoard();
    }
}

// Dual export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MinesweeperBoard };
}
