/**
 * base_board.js — Base Board for QuadCraft 4D Games
 *
 * Provides the shared IVM-grid board infrastructure used by all games:
 *   - Geometric integrity verification (Synergetics round-trip)
 *   - Grid key management via GridUtils
 *   - Cell access (get/set) on a Map-backed grid
 *   - IVM neighbor lookup (bounded and unbounded)
 *   - Distance functions (Manhattan, Euclidean, Quadray IVM)
 *   - Angle calculation via Synergetics angleBetweenQuadrays
 *   - Direction constants (8 canonical IVM directions)
 *   - Base metadata for HUD display
 *
 * Subclass and override game-specific methods:
 *
 *   class SnakeBoard extends BaseBoard {
 *       constructor(size) {
 *           super(size, { lives: 1 });
 *           this.snake = [];
 *       }
 *       step() { /* game logic * / }
 *       getMetadata() {
 *           return { ...this._baseMetadata(), snakeLength: this.snake.length };
 *       }
 *   }
 *
 * @module BaseBoard
 */

// ─── Node.js compatibility ─────────────────────────────────────────────────
if (typeof Quadray === 'undefined' && typeof require !== 'undefined') {
    const _q = require('./quadray.js');
    globalThis.Quadray = _q.Quadray;
}
if (typeof GridUtils === 'undefined' && typeof require !== 'undefined') {
    const _g = require('./grid_utils.js');
    globalThis.GridUtils = _g.GridUtils;
}
if (typeof SYNERGETICS === 'undefined' && typeof require !== 'undefined') {
    const _s = require('./synergetics.js');
    globalThis.SYNERGETICS = _s.SYNERGETICS;
    globalThis.angleBetweenQuadrays = _s.angleBetweenQuadrays;
    globalThis.verifyRoundTrip = _s.verifyRoundTrip;
    globalThis.verifyGeometricIdentities = _s.verifyGeometricIdentities;
}

class BaseBoard {
    /**
     * @param {number} size — Grid dimension (0 to size-1 per axis).
     * @param {Object} [opts]
     * @param {number} [opts.lives=3]    — Starting lives.
     * @param {number} [opts.level=1]    — Starting level.
     * @param {boolean} [opts.verify=true] — Run geometric integrity check.
     * @param {string}  [opts.name='BaseBoard'] — Name for log messages.
     */
    constructor(size = 6, opts = {}) {
        this.size = size;
        this.grid = new Map();
        this.gameOver = false;
        this.score = 0;
        this.lives = opts.lives ?? 3;
        this.level = opts.level ?? 1;
        this._boardName = opts.name ?? this.constructor.name;

        // Synergetics constants (cached for children)
        if (typeof SYNERGETICS !== 'undefined') {
            this.volumeRatios = SYNERGETICS;
            this.cellVolumeUnit = SYNERGETICS.TETRA_VOLUME;
            this.s3Constant = SYNERGETICS.S3;
        }

        // Integrity verification
        if (opts.verify !== false) {
            this._verifyIntegrity();
        }
    }

    // ─── Category 2: Geometric Integrity ────────────────────────────────────

    /**
     * Verify Synergetics geometric integrity on construction.
     * Tests round-trip conversion (Quadray → XYZ → Quadray) on grid corners.
     */
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
                console.warn(
                    `[${this._boardName}] Round-trip failed for ${corner.toString()}: error=${result.error.toFixed(6)}`
                );
                allPassed = false;
            }
        }
        if (allPassed) {
            console.log(`[${this._boardName}] ✅ Round-trip integrity verified`);
        }
    }

    // ─── Category 3: Key Management ─────────────────────────────────────────

    /**
     * Create a string key for a Quadray coordinate.
     * Delegates to GridUtils.key().
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
     * Parse a key back to coordinates.
     * Delegates to GridUtils.parseKey().
     * @param {string} k — "a,b,c,d"
     * @returns {{a:number, b:number, c:number, d:number}}
     */
    parseKey(k) {
        return GridUtils.parseKey(k);
    }

    // ─── Category 4: Cell Access ────────────────────────────────────────────

    /**
     * Get cell data at a Quadray position.
     * @param {Quadray|{a:number,b:number,c:number,d:number}} q
     * @returns {*|null}
     */
    getCell(q) {
        return this.grid.get(GridUtils.key(q.a, q.b, q.c, q.d)) ?? null;
    }

    /**
     * Set cell data at a Quadray position.
     * @param {Quadray|{a:number,b:number,c:number,d:number}} q
     * @param {*} value
     */
    setCell(q, value) {
        this.grid.set(GridUtils.key(q.a, q.b, q.c, q.d), value);
    }

    /**
     * Check if coordinates are within the board bounds.
     * Delegates to GridUtils.inBounds().
     * @param {Quadray|{a:number,b:number,c:number,d:number}} q
     * @returns {boolean}
     */
    inBounds(q) {
        return GridUtils.inBounds(q.a, q.b, q.c, q.d, this.size);
    }

    // ─── Category 5: Neighbors ──────────────────────────────────────────────

    /**
     * Get IVM neighbors of a position that are within board bounds.
     * Uses GridUtils.boundedNeighbors().
     * @param {Quadray|{a:number,b:number,c:number,d:number}} q
     * @returns {Array<{a:number, b:number, c:number, d:number}>}
     */
    getNeighbors(q) {
        return GridUtils.boundedNeighbors(q.a, q.b, q.c, q.d, this.size);
    }

    /**
     * Get all IVM neighbors (including out-of-bounds).
     * @param {Quadray|{a:number,b:number,c:number,d:number}} q
     * @returns {Array<{a:number, b:number, c:number, d:number}>}
     */
    getAllNeighbors(q) {
        return GridUtils.neighbors(q.a, q.b, q.c, q.d);
    }

    // ─── Category 6: Distance Functions ─────────────────────────────────────

    /**
     * Calculate Manhattan distance between two positions on the board.
     * Uses GridUtils.manhattan().
     * @param {Quadray|{a:number,b:number,c:number,d:number}} q1
     * @param {Quadray|{a:number,b:number,c:number,d:number}} q2
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
     * @param {Quadray|{a:number,b:number,c:number,d:number}} q1
     * @param {Quadray|{a:number,b:number,c:number,d:number}} q2
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

    // ─── Category 7: Angle ──────────────────────────────────────────────────

    /**
     * Get the angle between two direction vectors from a position.
     * Uses angleBetweenQuadrays() from synergetics.
     * @param {Quadray} from — Origin position.
     * @param {Quadray} to1  — First target position.
     * @param {Quadray} to2  — Second target position.
     * @returns {number} Angle in degrees.
     */
    angleBetween(from, to1, to2) {
        if (typeof angleBetweenQuadrays !== 'function') return 0;
        const v1 = to1.subtract(from);
        const v2 = to2.subtract(from);
        return angleBetweenQuadrays(v1, v2);
    }

    // ─── Category 8: Metadata ───────────────────────────────────────────────

    /**
     * Get base metadata common to all games.
     * Subclasses should merge with game-specific fields:
     *   getMetadata() { return { ...this._baseMetadata(), myField: this.myField }; }
     * @returns {Object}
     */
    _baseMetadata() {
        const meta = {
            score: this.score,
            lives: this.lives,
            level: this.level,
            gameOver: this.gameOver,
            size: this.size,
        };
        if (this.volumeRatios) {
            meta.volumeRatios = this.volumeRatios;
            meta.cellVolume = this.cellVolumeUnit;
            meta.s3 = this.s3Constant;
        }
        return meta;
    }

    /**
     * Get board metadata for HUD display.
     * Override in subclass to add game-specific fields.
     * @returns {Object}
     */
    getMetadata() {
        return this._baseMetadata();
    }

    // ─── Category 9: Directions ─────────────────────────────────────────────

    /**
     * 8 canonical IVM directions — delegates to GridUtils.DIRECTIONS_8.
     * Each direction is [da, db, dc, dd].
     * @returns {Array<number[]>}
     */
    static get DIRECTIONS_8() {
        return GridUtils.DIRECTIONS_8;
    }

    /**
     * Named IVM directions with labels (+A, -A, +B, -B, +C, -C, +D, -D).
     * @returns {Array<{da:number, db:number, dc:number, dd:number, name:string}>}
     */
    static get NAMED_DIRECTIONS() {
        const names = ['+A', '-A', '+B', '-B', '+C', '-C', '+D', '-D'];
        return GridUtils.DIRECTIONS_8.map(([da, db, dc, dd], i) => ({
            da, db, dc, dd, name: names[i]
        }));
    }

    // ─── Lifecycle ──────────────────────────────────────────────────────────

    /**
     * Wrap a coordinate within grid bounds (toroidal wrapping).
     * @param {number} v — Coordinate value.
     * @returns {number}
     */
    wrap(v) {
        return ((v % this.size) + this.size) % this.size;
    }

    /**
     * Iterate over all valid integer Quadray positions in the grid.
     * @param {function} fn — Callback receiving (a, b, c, d).
     */
    forEachCell(fn) {
        for (let a = 0; a < this.size; a++)
            for (let b = 0; b < this.size; b++)
                for (let c = 0; c < this.size; c++)
                    for (let d = 0; d < this.size; d++)
                        fn(a, b, c, d);
    }

    /**
     * Generate all grid positions as coordinate objects.
     * Delegates to GridUtils.generateGrid().
     * @returns {Array<{a:number, b:number, c:number, d:number}>}
     */
    generateGrid() {
        return GridUtils.generateGrid(this.size);
    }

    /**
     * Reset board to initial state.
     * Override in subclass for game-specific reset logic.
     */
    reset() {
        this.grid.clear();
        this.gameOver = false;
        this.score = 0;
    }
}

// Dual export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BaseBoard };
}
