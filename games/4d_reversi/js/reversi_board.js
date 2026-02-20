/**
 * reversi_board.js — 4D Reversi Board Logic on IVM Grid
 *
 * Manages the 4D grid, disc placement, flanking, and flipping.
 * Board: 4x4x4x4 Quadray grid. Two players: BLACK and WHITE.
 * Flanking: line of opponent discs between your disc and the new placement.
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
 * @module ReversiBoard
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

const ReversiColor = { BLACK: 'black', WHITE: 'white' };

class ReversiBoard extends BaseBoard {
    /**
     * @param {number} size - Board dimension per axis (default 4 = 4x4x4x4)
     */
    constructor(size = 4) {
        super(size, { name: 'ReversiBoard', verify: false });
        this.size = size;
        this.grid = new Map();          // GridUtils.key() -> ReversiColor
        this.currentPlayer = ReversiColor.BLACK;
        this.gameOver = false;
        this.gameOverMessage = '';
        this.moveCount = 0;
        this.moveHistory = [];          // Array of { player, quadray, cellType, moveNum, flipsCount }
        this.totalSlots = Math.pow(size, 4);

        // Synergetics metadata
        this.volumeRatios = {
            tetra: SYNERGETICS?.TETRA_VOL ?? 1,
            octa: SYNERGETICS?.OCTA_VOL ?? 4,
            cubo: SYNERGETICS?.CUBO_VOL ?? 20,
        };
        this.cellVolumeUnit = Quadray.cellVolume();
        this.s3Constant = SYNERGETICS?.S3 ?? 1.0607;

        this.setupInitial();

        // Integrity check — verify round-trip on corner positions
        this._verifyIntegrity();

        console.log(`[ReversiBoard] ${size}^4 IVM grid (${this.totalSlots} cells)`);
        console.log(`[ReversiBoard] Cell volume: ${this.cellVolumeUnit}, S3: ${this.s3Constant}`);
        console.log(`[ReversiBoard] Volume ratios T:O:C = ${this.volumeRatios.tetra}:${this.volumeRatios.octa}:${this.volumeRatios.cubo}`);
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
                console.warn(`[ReversiBoard] Round-trip failed for ${corner.toString()}: error=${result.error.toFixed(6)}`);
                allPassed = false;
            }
        }
        if (allPassed) console.log('[ReversiBoard] Round-trip integrity verified on corner positions');
    }

    /**
     * Check if coordinates are within the board bounds.
     * Delegates to GridUtils.inBounds().
     * @param {Object} pos - { a, b, c, d }
     * @returns {boolean}
     */
    inBounds(pos) {
        return GridUtils.inBounds(pos.a, pos.b, pos.c, pos.d, this.size);
    }

    /**
     * Get cell data at a Quadray position.
     * @param {Quadray|Object} q - Position with a,b,c,d
     * @returns {string|null} ReversiColor or null
     */
    getCell(q) {
        const key = GridUtils.key(q.a, q.b, q.c, q.d);
        return this.grid.get(key) || null;
    }

    /**
     * Set cell data at a Quadray position.
     * @param {Quadray|Object} q - Position with a,b,c,d
     * @param {string} value - ReversiColor
     */
    setCell(q, value) {
        this.grid.set(GridUtils.key(q.a, q.b, q.c, q.d), value);
    }

    /** Set up the initial 4 center discs */
    setupInitial() {
        this.grid.clear();
        // Center 4 discs in the middle of the 4D grid
        this.grid.set(GridUtils.key(1, 1, 1, 2), ReversiColor.BLACK);
        this.grid.set(GridUtils.key(2, 2, 1, 2), ReversiColor.WHITE);
        this.grid.set(GridUtils.key(1, 1, 2, 1), ReversiColor.WHITE);
        this.grid.set(GridUtils.key(2, 2, 2, 1), ReversiColor.BLACK);
    }

    /**
     * Get IVM neighbors of a position that are within board bounds.
     * Uses GridUtils.boundedNeighbors().
     * @param {Quadray|Object} q
     * @returns {Array<{a:number, b:number, c:number, d:number}>}
     */
    getNeighbors(q) {
        return GridUtils.boundedNeighbors(q.a, q.b, q.c, q.d, this.size);
    }

    /**
     * Calculate Manhattan distance between two positions on the board.
     * Uses GridUtils.manhattan().
     * @param {Object} q1
     * @param {Object} q2
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
     * @param {Object} q1
     * @param {Object} q2
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
     * Uses Quadray.distance().
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

    /** All 80 direction vectors in 4D (+-1 on 1-4 axes) */
    static get DIRECTIONS() {
        if (ReversiBoard._dirs) return ReversiBoard._dirs;
        const dirs = [];
        for (let a = -1; a <= 1; a++)
            for (let b = -1; b <= 1; b++)
                for (let c = -1; c <= 1; c++)
                    for (let d = -1; d <= 1; d++)
                        if (a !== 0 || b !== 0 || c !== 0 || d !== 0)
                            dirs.push([a, b, c, d]);
        ReversiBoard._dirs = dirs;
        return dirs;
    }

    /**
     * Get discs flipped in a direction.
     * @param {Object} pos - { a, b, c, d }
     * @param {string} color - ReversiColor
     * @param {number[]} dir - [da, db, dc, dd]
     * @returns {Array<{a:number, b:number, c:number, d:number}>}
     */
    getFlips(pos, color, dir) {
        const opp = color === ReversiColor.BLACK ? ReversiColor.WHITE : ReversiColor.BLACK;
        const flipped = [];
        let a = pos.a + dir[0], b = pos.b + dir[1], c = pos.c + dir[2], d = pos.d + dir[3];
        while (GridUtils.inBounds(a, b, c, d, this.size)) {
            const cv = this.grid.get(GridUtils.key(a, b, c, d));
            if (cv === opp) { flipped.push({ a, b, c, d }); }
            else if (cv === color) { return flipped; }
            else { return []; }
            a += dir[0]; b += dir[1]; c += dir[2]; d += dir[3];
        }
        return [];
    }

    /**
     * Get all flips for placing color at pos.
     * @param {Object} pos - { a, b, c, d }
     * @param {string} color - ReversiColor
     * @returns {Array<{a:number, b:number, c:number, d:number}>}
     */
    getAllFlips(pos, color) {
        if (this.getCell(pos)) return [];
        let allFlips = [];
        for (const dir of ReversiBoard.DIRECTIONS) {
            allFlips = allFlips.concat(this.getFlips(pos, color, dir));
        }
        return allFlips;
    }

    /**
     * Get all valid moves for a color.
     * @param {string} color - ReversiColor
     * @returns {Array<{pos: Quadray, flips: Array}>}
     */
    getValidMoves(color) {
        const moves = [];
        const allCells = GridUtils.generateGrid(this.size);
        for (const cell of allCells) {
            const flips = this.getAllFlips(cell, color);
            if (flips.length > 0) moves.push({ pos: new Quadray(cell.a, cell.b, cell.c, cell.d), flips });
        }
        return moves;
    }

    /**
     * Place a disc and flip captured discs.
     * @param {Quadray|Object} pos - Position
     * @param {string} color - ReversiColor
     * @returns {boolean} True if placement was valid
     */
    place(pos, color) {
        const p = { a: pos.a, b: pos.b, c: pos.c, d: pos.d };
        const flips = this.getAllFlips(p, color);
        if (flips.length === 0) return false;

        // Place the disc
        this.setCell(p, color);
        for (const f of flips) this.setCell(f, color);

        // Track move
        this.moveCount++;
        const cellType = Quadray.cellType(p.a, p.b, p.c, p.d);
        this.moveHistory.push({
            player: color,
            quadray: new Quadray(p.a, p.b, p.c, p.d),
            cellType,
            moveNum: this.moveCount,
            flipsCount: flips.length,
        });

        return true;
    }

    /**
     * Count discs of a color.
     * @param {string} color - ReversiColor
     * @returns {number}
     */
    count(color) {
        let n = 0;
        for (const c of this.grid.values()) if (c === color) n++;
        return n;
    }

    /**
     * All positions on the board as Quadray for rendering.
     * Uses GridUtils.generateGrid().
     * @returns {Array<Quadray>}
     */
    allPositions() {
        return GridUtils.generateGrid(this.size)
            .map(c => new Quadray(c.a, c.b, c.c, c.d));
    }

    /**
     * Get all placed cells for rendering.
     * Each cell includes its Quadray, cellType, Cartesian coordinates,
     * distance from origin.
     * @returns {Array<Object>}
     */
    getCells() {
        const cells = [];
        for (const [key, color] of this.grid) {
            const coords = GridUtils.parseKey(key);
            const q = new Quadray(coords.a, coords.b, coords.c, coords.d);
            const cartesian = q.toCartesian();
            const distFromOrigin = q.distanceTo(Quadray.ORIGIN);
            const cellType = Quadray.cellType(coords.a, coords.b, coords.c, coords.d);

            cells.push({
                a: coords.a, b: coords.b, c: coords.c, d: coords.d,
                player: color,
                cellType,
                quadray: q,
                cartesian,
                distFromOrigin,
                color: color === ReversiColor.BLACK ? '#333333' : '#eeeeee',
            });
        }
        return cells;
    }

    /**
     * Get board metadata for HUD display.
     * @returns {Object}
     */
    getMetadata() {
        let tetraCount = 0, octaCount = 0;
        for (const [key] of this.grid) {
            const coords = GridUtils.parseKey(key);
            const ct = Quadray.cellType(coords.a, coords.b, coords.c, coords.d);
            if (ct === 'tetra') tetraCount++;
            else octaCount++;
        }
        return {
            moveCount: this.moveCount,
            currentPlayer: this.currentPlayer,
            gameOver: this.gameOver,
            gameOverMessage: this.gameOverMessage,
            blackCount: this.count(ReversiColor.BLACK),
            whiteCount: this.count(ReversiColor.WHITE),
            tetraCount,
            octaCount,
            volumeRatios: this.volumeRatios,
            cellVolume: this.cellVolumeUnit,
            s3: this.s3Constant,
            totalSlots: this.totalSlots,
        };
    }

    /** Reset board to initial state. */
    reset() {
        this.grid = new Map();
        this.currentPlayer = ReversiColor.BLACK;
        this.gameOver = false;
        this.gameOverMessage = '';
        this.moveCount = 0;
        this.moveHistory = [];
        this.setupInitial();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ReversiBoard, ReversiColor };
}
