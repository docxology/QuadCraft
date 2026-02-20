/**
 * tetris_board.js — 4D Tetris on IVM (Quadray) Grid
 *
 * Tetrominoes are defined as sets of Quadray offsets.
 * Gravity falls along the -A axis. Pieces can be rotated by
 * cycling Quadray components (tetrahedral symmetry).
 * Lines clear when an entire A-slice is filled.
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
 * @module TetrisBoard
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

class TetrisBoard extends BaseBoard {
    /** Tetromino shapes as Quadray offset arrays. */
    static PIECES = {
        I: [[0, 0, 0, 0], [1, 0, 0, 0], [2, 0, 0, 0], [3, 0, 0, 0]],
        O: [[0, 0, 0, 0], [1, 0, 0, 0], [0, 1, 0, 0], [1, 1, 0, 0]],
        T: [[0, 0, 0, 0], [1, 0, 0, 0], [2, 0, 0, 0], [1, 1, 0, 0]],
        S: [[1, 0, 0, 0], [2, 0, 0, 0], [0, 1, 0, 0], [1, 1, 0, 0]],
        Z: [[0, 0, 0, 0], [1, 0, 0, 0], [1, 1, 0, 0], [2, 1, 0, 0]],
        L: [[0, 0, 0, 0], [1, 0, 0, 0], [2, 0, 0, 0], [0, 1, 0, 0]],
        J: [[0, 0, 0, 0], [1, 0, 0, 0], [2, 0, 0, 0], [2, 1, 0, 0]],
    };

    static PIECE_COLORS = {
        I: '#06b6d4', O: '#fbbf24', T: '#a855f7',
        S: '#4ade80', Z: '#f87171', L: '#fb923c', J: '#60a5fa'
    };

    /**
     * @param {number} width - Grid width in B axis
     * @param {number} height - Grid height in A axis (gravity axis)
     * @param {number} depthC - Grid depth in C axis
     * @param {number} depthD - Grid depth in D axis
     */
    constructor(width = 6, height = 16, depthC = 3, depthD = 3) {
        super(width, { name: 'TetrisBoard', verify: false });
        this.width = width;
        this.height = height;
        this.depthC = depthC;
        this.depthD = depthD;
        this.grid = {};           // key -> piece type letter
        this.activePiece = null;  // { type, offsets, pos: {a,b,c,d} }
        this.score = 0;
        this.level = 1;
        this.linesCleared = 0;
        this.gameOver = false;
        this.tickInterval = 500;

        // Synergetics metadata
        this.volumeRatios = {
            tetra: SYNERGETICS?.TETRA_VOL ?? 1,
            octa: SYNERGETICS?.OCTA_VOL ?? 4,
            cubo: SYNERGETICS?.CUBO_VOL ?? 20,
        };
        this.cellVolumeUnit = typeof Quadray !== 'undefined' ? Quadray.cellVolume() : 1;
        this.s3Constant = SYNERGETICS?.S3 ?? 1.0607;

        // Integrity check — verify round-trip on corner positions
        this._verifyIntegrity();

        console.log(`[TetrisBoard] ${width}w x ${height}h x ${depthC}c x ${depthD}d IVM grid`);
        console.log(`[TetrisBoard] Cell volume: ${this.cellVolumeUnit}, S3: ${this.s3Constant}`);
        console.log(`[TetrisBoard] Volume ratios T:O:C = ${this.volumeRatios.tetra}:${this.volumeRatios.octa}:${this.volumeRatios.cubo}`);
    }

    /** Verify geometric integrity on construction. */
    _verifyIntegrity() {
        if (typeof verifyRoundTrip !== 'function') return;
        const corners = [
            new Quadray(0, 0, 0, 0),
            new Quadray(this.height - 1, this.width - 1, this.depthC - 1, this.depthD - 1),
            new Quadray(this.height - 1, 0, 0, 0),
            new Quadray(0, this.width - 1, 0, 0),
        ];
        let allPassed = true;
        for (const corner of corners) {
            const result = verifyRoundTrip(corner);
            if (!result.passed) {
                console.warn(`[TetrisBoard] Round-trip failed for ${corner.toString()}: error=${result.error.toFixed(6)}`);
                allPassed = false;
            }
        }
        if (allPassed) console.log('[TetrisBoard] Round-trip integrity verified on corner positions');
    }

    /** Delegate to GridUtils.key(). */
    key(a, b, c, d) { return GridUtils.key(a, b, c, d); }

    /** Delegate to GridUtils.parseKey(). */
    parseKey(k) {
        const p = GridUtils.parseKey(k);
        return [p.a, p.b, p.c, p.d];
    }

    /** Initialize/reset the board. */
    reset() {
        this.grid = {};
        this.activePiece = null;
        this.score = 0;
        this.level = 1;
        this.linesCleared = 0;
        this.gameOver = false;
        this.tickInterval = 500;
    }

    /** Check if position is in bounds and unoccupied. */
    isFree(a, b, c, d) {
        return a >= 0 && a < this.height &&
            b >= 0 && b < this.width &&
            c >= 0 && c < this.depthC &&
            d >= 0 && d < this.depthD &&
            !this.grid[this.key(a, b, c, d)];
    }

    /** Spawn a new piece at the top. */
    spawnPiece(forceType = null) {
        const types = Object.keys(TetrisBoard.PIECES);
        const type = forceType || types[Math.floor(Math.random() * types.length)];
        const offsets = TetrisBoard.PIECES[type].map(o => [...o]);
        const pos = {
            a: this.height - 4,
            b: Math.floor(this.width / 2) - 1,
            c: Math.floor(this.depthC / 2),
            d: Math.floor(this.depthD / 2)
        };

        this.activePiece = { type, offsets, pos };

        // Check if piece can be placed
        if (!this._pieceCanFit(offsets, pos)) {
            this.gameOver = true;
            return false;
        }
        return true;
    }

    /** Check if piece fits at position. */
    _pieceCanFit(offsets, pos) {
        return offsets.every(([oa, ob, oc, od]) =>
            this.isFree(pos.a + oa, pos.b + ob, pos.c + oc, pos.d + od)
        );
    }

    /** Move active piece by delta. */
    movePiece(da, db, dc, dd) {
        if (!this.activePiece || this.gameOver) return false;
        const { offsets, pos } = this.activePiece;
        const newPos = { a: pos.a + da, b: pos.b + db, c: pos.c + dc, d: pos.d + dd };
        if (this._pieceCanFit(offsets, newPos)) {
            this.activePiece.pos = newPos;
            return true;
        }
        return false;
    }

    /**
     * Rotate piece using tetrahedral symmetry: cycle (b,c,d) components.
     * This gives 3 rotations within the BCD hyperplane.
     */
    rotatePiece() {
        if (!this.activePiece || this.gameOver) return false;
        const { offsets, pos } = this.activePiece;
        const rotated = offsets.map(([oa, ob, oc, od]) => [oa, od, ob, oc]); // cycle b->c->d->b
        if (this._pieceCanFit(rotated, pos)) {
            this.activePiece.offsets = rotated;
            return true;
        }
        return false;
    }

    /** Drop piece by one row (gravity along -A). Returns 'moved', 'landed', or 'gameover'. */
    gravity() {
        if (!this.activePiece || this.gameOver) return 'gameover';
        if (this.movePiece(-1, 0, 0, 0)) return 'moved';

        // Can't move down — lock piece
        this._lockPiece();
        const cleared = this._clearLines();
        if (cleared > 0) {
            this.linesCleared += cleared;
            this.score += cleared * cleared * 100;
            this.level = 1 + Math.floor(this.linesCleared / 10);
            this.tickInterval = Math.max(100, 500 - (this.level - 1) * 40);
        }

        if (!this.spawnPiece()) return 'gameover';
        return 'landed';
    }

    /** Hard drop: move piece as far down as possible. */
    hardDrop() {
        if (!this.activePiece) return;
        let dropped = 0;
        while (this.movePiece(-1, 0, 0, 0)) dropped++;
        this.score += dropped * 2;
        this.gravity(); // Lock it
    }

    /** Lock active piece into the grid. */
    _lockPiece() {
        const { type, offsets, pos } = this.activePiece;
        for (const [oa, ob, oc, od] of offsets) {
            this.grid[this.key(pos.a + oa, pos.b + ob, pos.c + oc, pos.d + od)] = type;
        }
        this.activePiece = null;
    }

    /**
     * Clear completed A-slices (rows).
     * A slice is complete when all positions in that A-layer are occupied.
     */
    _clearLines() {
        let cleared = 0;
        for (let a = 0; a < this.height; a++) {
            let full = true;
            for (let b = 0; b < this.width && full; b++)
                for (let c = 0; c < this.depthC && full; c++)
                    for (let d = 0; d < this.depthD && full; d++)
                        if (!this.grid[this.key(a, b, c, d)]) full = false;

            if (full) {
                cleared++;
                // Remove this slice
                for (let b = 0; b < this.width; b++)
                    for (let c = 0; c < this.depthC; c++)
                        for (let d = 0; d < this.depthD; d++)
                            delete this.grid[this.key(a, b, c, d)];

                // Shift everything above down
                for (let aa = a + 1; aa < this.height; aa++)
                    for (let b = 0; b < this.width; b++)
                        for (let c = 0; c < this.depthC; c++)
                            for (let d = 0; d < this.depthD; d++) {
                                const k = this.key(aa, b, c, d);
                                if (this.grid[k]) {
                                    this.grid[this.key(aa - 1, b, c, d)] = this.grid[k];
                                    delete this.grid[k];
                                }
                            }
                a--; // Re-check this row
            }
        }
        return cleared;
    }

    /** Get all occupied cells for rendering. */
    getLockedCells() {
        const cells = [];
        for (const [k, type] of Object.entries(this.grid)) {
            const [a, b, c, d] = this.parseKey(k);
            cells.push({
                a, b, c, d, type,
                color: TetrisBoard.PIECE_COLORS[type] || '#94a3b8',
                quadray: typeof Quadray !== 'undefined' ? new Quadray(a, b, c, d) : null
            });
        }
        return cells;
    }

    /** Get active piece cells for rendering. */
    getActiveCells() {
        if (!this.activePiece) return [];
        const { type, offsets, pos } = this.activePiece;
        return offsets.map(([oa, ob, oc, od]) => ({
            a: pos.a + oa, b: pos.b + ob, c: pos.c + oc, d: pos.d + od,
            type,
            color: TetrisBoard.PIECE_COLORS[type],
            quadray: typeof Quadray !== 'undefined'
                ? new Quadray(pos.a + oa, pos.b + ob, pos.c + oc, pos.d + od) : null
        }));
    }

    /** Compatibility: getCell, setCell */
    getCell(q) { return this.grid[this.key(q.a, q.b, q.c, q.d)] || null; }
    setCell(q, v) { this.grid[this.key(q.a, q.b, q.c, q.d)] = v; }

    /** Get ghost piece position (where piece would land). */
    getGhostCells() {
        if (!this.activePiece) return [];
        const { type, offsets, pos } = this.activePiece;
        let ghostA = pos.a;
        // Drop until it can't move further
        while (ghostA > 0) {
            const newA = ghostA - 1;
            const fits = offsets.every(([oa, ob, oc, od]) =>
                this.isFree(newA + oa, pos.b + ob, pos.c + oc, pos.d + od)
            );
            if (!fits) break;
            ghostA = newA;
        }
        if (ghostA === pos.a) return []; // Already at bottom
        return offsets.map(([oa, ob, oc, od]) => ({
            a: ghostA + oa, b: pos.b + ob, c: pos.c + oc, d: pos.d + od,
            type, color: 'rgba(255,255,255,0.15)',
            quadray: typeof Quadray !== 'undefined'
                ? new Quadray(ghostA + oa, pos.b + ob, pos.c + oc, pos.d + od) : null
        }));
    }

    /**
     * Get IVM neighbors of a position that are within board bounds.
     * Uses GridUtils.neighbors().
     * @param {Quadray} q
     * @returns {Array<{a:number, b:number, c:number, d:number}>}
     */
    getNeighbors(q) {
        return GridUtils.neighbors(q.a, q.b, q.c, q.d)
            .filter(n => n.a >= 0 && n.a < this.height &&
                         n.b >= 0 && n.b < this.width &&
                         n.c >= 0 && n.c < this.depthC &&
                         n.d >= 0 && n.d < this.depthD);
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
     * Get board metadata for HUD display.
     * @returns {Object}
     */
    getMetadata() {
        let tetraCount = 0, octaCount = 0;
        if (typeof Quadray !== 'undefined') {
            for (const k of Object.keys(this.grid)) {
                const [a, b, c, d] = this.parseKey(k);
                const parity = Quadray.cellType(a, b, c, d);
                if (parity === 'tetra') tetraCount++;
                else octaCount++;
            }
        }
        return {
            score: this.score,
            level: this.level,
            linesCleared: this.linesCleared,
            gameOver: this.gameOver,
            tetraCount,
            octaCount,
            volumeRatios: this.volumeRatios,
            cellVolume: this.cellVolumeUnit,
            s3: this.s3Constant,
            totalCells: Object.keys(this.grid).length,
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TetrisBoard };
}
