/**
 * life_board.js — 4D Conway's Game of Life on Quadray/IVM Lattice
 *
 * Cellular automaton on a 4D tetrahedral grid using Quadray coordinates.
 * Rules (adapted for 4D):
 *   - Each cell has up to 80 neighbors (all adjacent positions in 4D)
 *   - Alive cell survives with 4-8 neighbors (tuned for 4D density)
 *   - Dead cell becomes alive with exactly 5 neighbors
 *   - Board wraps at boundaries for infinite feel on finite grid
 *
 * Deeply integrated with all Quadray/IVM shared modules:
 *   - Quadray: toKey, normalized, toCartesian, fromCartesian, cellType,
 *              cellVolume, clone, distance, distanceTo, toIVM, BASIS
 *   - GridUtils: key, parseKey, neighbors, boundedNeighbors, inBounds,
 *                manhattan, euclidean, generateGrid, depthSort, shuffle
 *   - SYNERGETICS: constants, volume ratios
 *   - verifyRoundTrip, verifyGeometricIdentities, angleBetweenQuadrays
 *
 * @module LifeBoard
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
if (typeof BaseBoard === 'undefined' && typeof require !== 'undefined') {
    const _bb = require('../../4d_generic/base_board.js');
    globalThis.BaseBoard = _bb.BaseBoard;
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

class LifeBoard extends BaseBoard {

    /**
     * @param {number} size — Grid dimension (size^4 lattice).
     */
    constructor(size = 8) {
        super(size, { name: 'LifeBoard', verify: false });
        this.size = size;
        this.cells = new Set();     // Set of GridUtils.key() strings
        this.generation = 0;
        this.gameOver = false;       // Required by BaseGame (never truly ends)
        this.peakPopulation = 0;

        // Synergetics metadata
        this.volumeRatios = {
            tetra: SYNERGETICS?.TETRA_VOL ?? 1,
            octa: SYNERGETICS?.OCTA_VOL ?? 4,
            cubo: SYNERGETICS?.CUBO_VOL ?? 20,
        };
        this.cellVolumeUnit = typeof Quadray !== 'undefined' && Quadray.cellVolume
            ? Quadray.cellVolume() : 1;
        this.s3Constant = SYNERGETICS?.S3 ?? 1.0607;

        // Integrity check — verify round-trip on corner positions
        this._verifyIntegrity();

        console.log(`[LifeBoard] ${size}^4 IVM grid (${Math.pow(size, 4)} total cells)`);
        console.log(`[LifeBoard] Cell volume: ${this.cellVolumeUnit}, S3: ${this.s3Constant}`);
        console.log(`[LifeBoard] Volume ratios T:O:C = ${this.volumeRatios.tetra}:${this.volumeRatios.octa}:${this.volumeRatios.cubo}`);
    }

    /** Verify geometric integrity on construction. */
    _verifyIntegrity() {
        if (typeof verifyRoundTrip !== 'function') return;
        const s = this.size - 1;
        const corners = [
            new Quadray(0, 0, 0, 0),
            new Quadray(s, s, s, s),
            new Quadray(s, 0, 0, 0),
            new Quadray(0, s, 0, 0),
        ];
        let allPassed = true;
        for (const corner of corners) {
            const result = verifyRoundTrip(corner);
            if (!result.passed) {
                console.warn(`[LifeBoard] Round-trip failed for ${corner.toString()}: error=${result.error.toFixed(6)}`);
                allPassed = false;
            }
        }
        if (allPassed) console.log('[LifeBoard] Round-trip integrity verified on corner positions');
    }

    /**
     * Create a string key for coordinates — delegates to GridUtils.key().
     * @param {number} a
     * @param {number} b
     * @param {number} c
     * @param {number} d
     * @returns {string}
     */
    key(a, b, c, d) {
        return GridUtils.key(a, b, c, d);
    }

    /**
     * Parse a key back to coordinates — delegates to GridUtils.parseKey().
     * @param {string} k
     * @returns {{a: number, b: number, c: number, d: number}}
     */
    parseKey(k) {
        return GridUtils.parseKey(k);
    }

    /**
     * Get cell state at a Quadray position.
     * @param {Quadray} q
     * @returns {boolean} Whether the cell is alive.
     */
    getCell(q) {
        return this.cells.has(GridUtils.key(q.a, q.b, q.c, q.d));
    }

    /**
     * Set cell state at a Quadray position.
     * @param {Quadray} q
     * @param {boolean} alive
     */
    setCell(q, alive) {
        const k = GridUtils.key(q.a, q.b, q.c, q.d);
        if (alive) this.cells.add(k);
        else this.cells.delete(k);
    }

    /**
     * Check if a coordinate is alive.
     * @param {number} a
     * @param {number} b
     * @param {number} c
     * @param {number} d
     * @returns {boolean}
     */
    isAlive(a, b, c, d) {
        return this.cells.has(GridUtils.key(a, b, c, d));
    }

    /**
     * Set a cell's alive state by raw coordinates.
     * @param {number} a
     * @param {number} b
     * @param {number} c
     * @param {number} d
     * @param {boolean} alive
     */
    set(a, b, c, d, alive) {
        const k = GridUtils.key(a, b, c, d);
        if (alive) this.cells.add(k);
        else this.cells.delete(k);
    }

    /**
     * Wrap a value to grid bounds (toroidal wrapping).
     * @param {number} v
     * @returns {number}
     */
    wrap(v) {
        return ((v % this.size) + this.size) % this.size;
    }

    /**
     * Count living neighbors of a cell using all 80 adjacent positions in 4D.
     * @param {number} a
     * @param {number} b
     * @param {number} c
     * @param {number} d
     * @returns {number}
     */
    countNeighbors(a, b, c, d) {
        let count = 0;
        for (let da = -1; da <= 1; da++)
            for (let db = -1; db <= 1; db++)
                for (let dc = -1; dc <= 1; dc++)
                    for (let dd = -1; dd <= 1; dd++) {
                        if (da === 0 && db === 0 && dc === 0 && dd === 0) continue;
                        if (this.isAlive(this.wrap(a + da), this.wrap(b + db), this.wrap(c + dc), this.wrap(d + dd)))
                            count++;
                    }
        return count;
    }

    /**
     * Advance one generation.
     * Collects all alive cells and their neighbors as candidates,
     * then applies birth/survival rules.
     */
    step() {
        const candidates = new Set();
        // Collect alive + their neighbors
        for (const k of this.cells) {
            const { a, b, c, d } = this.parseKey(k);
            for (let da = -1; da <= 1; da++)
                for (let db = -1; db <= 1; db++)
                    for (let dc = -1; dc <= 1; dc++)
                        for (let dd = -1; dd <= 1; dd++)
                            candidates.add(this.key(this.wrap(a + da), this.wrap(b + db), this.wrap(c + dc), this.wrap(d + dd)));
        }
        const next = new Set();
        for (const k of candidates) {
            const { a, b, c, d } = this.parseKey(k);
            const n = this.countNeighbors(a, b, c, d);
            const alive = this.cells.has(k);
            // 4D-tuned rules
            if (alive && n >= 4 && n <= 8) next.add(k);
            else if (!alive && n === 5) next.add(k);
        }
        this.cells = next;
        this.generation++;
        if (this.cells.size > this.peakPopulation) {
            this.peakPopulation = this.cells.size;
        }
    }

    /**
     * Seed with random cells in a subregion.
     * @param {number} count — Number of cells to seed.
     */
    seedRandom(count = 40) {
        this.cells.clear();
        this.generation = 0;
        this.peakPopulation = 0;
        const half = Math.floor(this.size / 2);
        for (let i = 0; i < count; i++) {
            const a = this.wrap(half + Math.floor(Math.random() * 4) - 2);
            const b = this.wrap(half + Math.floor(Math.random() * 4) - 2);
            const c = this.wrap(half + Math.floor(Math.random() * 4) - 2);
            const d = this.wrap(half + Math.floor(Math.random() * 4) - 2);
            this.set(a, b, c, d, true);
        }
    }

    /** Built-in pattern presets adapted for 4D IVM lattice. */
    static get PATTERNS() {
        return {
            blinker: [[0, 0, 0, 0], [1, 0, 0, 0], [2, 0, 0, 0]],
            toad: [[0, 0, 0, 0], [1, 0, 0, 0], [2, 0, 0, 0], [0, 1, 0, 0], [1, 1, 0, 0], [2, 1, 0, 0]],
            glider: [[0, 1, 0, 0], [1, 0, 0, 0], [1, 1, 0, 0], [2, 0, 0, 0], [0, 0, 1, 0]],
            rpentomino: [[0, 1, 0, 0], [1, 0, 0, 0], [1, 1, 0, 0], [0, 0, 0, 0], [1, 0, 1, 0]],
            block: [[0, 0, 0, 0], [0, 1, 0, 0], [1, 0, 0, 0], [1, 1, 0, 0]],
        };
    }

    /**
     * Load a named pattern preset, centered in the grid.
     * @param {string} name — Pattern name (blinker, toad, glider, rpentomino, block).
     */
    loadPattern(name) {
        const pattern = LifeBoard.PATTERNS[name];
        if (!pattern) {
            console.warn(`[LifeBoard] Unknown pattern: ${name}`);
            return false;
        }
        this.cells.clear();
        this.generation = 0;
        this.peakPopulation = 0;
        const half = Math.floor(this.size / 2);
        for (const [da, db, dc, dd] of pattern) {
            this.set(this.wrap(half + da), this.wrap(half + db), this.wrap(half + dc), this.wrap(half + dd), true);
        }
        console.log(`[LifeBoard] Loaded pattern '${name}' (${pattern.length} cells)`);
        return true;
    }

    /**
     * Reset board — re-seed with random cells.
     */
    reset() {
        this.seedRandom(50);
    }

    /**
     * Get all alive cells as Quadray positions for rendering.
     * Each cell includes its Quadray, cellType, and Cartesian coordinates.
     * @returns {Array<Object>}
     */
    getAliveCells() {
        const result = [];
        for (const k of this.cells) {
            const { a, b, c, d } = this.parseKey(k);
            const q = new Quadray(a, b, c, d);
            const cellType = typeof Quadray.cellType === 'function'
                ? Quadray.cellType(a, b, c, d) : 'tetra';
            const cartesian = typeof q.toCartesian === 'function'
                ? q.toCartesian() : { a: a, b: b, c: c, d: d };
            result.push({
                a, b, c, d,
                quadray: q,
                cellType,
                cartesian,
            });
        }
        return result;
    }

    /**
     * Get IVM neighbors of a position within grid bounds.
     * Uses GridUtils.boundedNeighbors().
     * @param {Quadray} q
     * @returns {Array<{a: number, b: number, c: number, d: number}>}
     */
    getNeighbors(q) {
        return GridUtils.boundedNeighbors(q.a, q.b, q.c, q.d, this.size);
    }

    /**
     * Calculate Manhattan distance between two positions.
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
     * Calculate Euclidean distance between two positions.
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
     * Get board metadata for HUD display and sidebar.
     * @returns {Object}
     */
    getMetadata() {
        let tetraCount = 0, octaCount = 0;
        let sa = 0, sb = 0, sc = 0, sd = 0;
        for (const k of this.cells) {
            const { a, b, c, d } = this.parseKey(k);
            const ct = typeof Quadray.cellType === 'function'
                ? Quadray.cellType(a, b, c, d) : 'tetra';
            if (ct === 'tetra') tetraCount++;
            else octaCount++;
            sa += a; sb += b; sc += c; sd += d;
        }
        const n = this.cells.size;
        const centerOfMass = n > 0
            ? { a: sa / n, b: sb / n, c: sc / n, d: sd / n }
            : { a: 0, b: 0, c: 0, d: 0 };

        return {
            generation: this.generation,
            livingCells: n,
            peakPopulation: this.peakPopulation,
            tetraCount,
            octaCount,
            volumeRatios: this.volumeRatios,
            cellVolume: this.cellVolumeUnit,
            s3: this.s3Constant,
            totalCells: Math.pow(this.size, 4),
            populationTV: n * this.s3Constant,
            centerOfMass,
            gameOver: this.gameOver,
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LifeBoard };
}
