/**
 * snake_board.js — 4D Snake on IVM (Quadray) Lattice
 *
 * Snake body is a list of Quadray positions moving along IVM adjacency directions.
 * 8 primary IVM directions: ±1 on each of 4 Quadray axes.
 * Food spawns at random unoccupied Quadray positions.
 *
 * Deeply integrated with all Quadray/IVM shared modules:
 *   - Quadray: toKey, normalized, add, subtract, equals, distance,
 *              distanceTo, length, scale, toIVM, cellType, cellVolume,
 *              toCartesian, fromCartesian, clone, IVM_DIRECTIONS, BASIS
 *   - GridUtils: key, parseKey, neighbors, boundedNeighbors, inBounds,
 *                manhattan, euclidean, generateGrid, depthSort, shuffle
 *   - SYNERGETICS: constants, volume ratios
 *   - verifyRoundTrip, verifyGeometricIdentities
 *
 * @module SnakeBoard
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
    globalThis.verifyRoundTrip = _s.verifyRoundTrip;
    globalThis.verifyGeometricIdentities = _s.verifyGeometricIdentities;
}

class SnakeBoard extends BaseBoard {
    /** IVM axis-aligned directions: +/-1 on each Quadray axis, delegated to GridUtils. */
    static get DIRECTIONS() {
        return GridUtils.DIRECTIONS.map((d, i) => ({
            da: d[0], db: d[1], dc: d[2], dd: d[3],
            name: `IVM_${i}`
        }));
    }

    /**
     * @param {number} size - Grid size per Quadray axis
     */
    constructor(size = 6) {
        super(size, { name: 'SnakeBoard', verify: false });
        this.size = size;
        this.snake = [];          // Array of position keys (head is last)
        this.snakeSet = new Set();
        this.food = null;         // Position key of food
        this.direction = SnakeBoard.DIRECTIONS[0]; // Current movement direction
        this.nextDirection = null; // Buffered direction change
        this.score = 0;
        this.level = 1;
        this.gameOver = false;
        this.tickInterval = 200;  // ms between moves

        // Synergetics metadata
        this.volumeRatios = {
            tetra: SYNERGETICS?.TETRA_VOL ?? 1,
            octa: SYNERGETICS?.OCTA_VOL ?? 4,
            cubo: SYNERGETICS?.CUBO_VOL ?? 20,
        };
        this.cellVolumeUnit = typeof Quadray !== 'undefined' ? Quadray.cellVolume() : 0.375;
        this.s3Constant = SYNERGETICS?.S3 ?? 1.0607;

        // Integrity check — verify round-trip on corner positions
        this._verifyIntegrity();

        this.init();

        console.log(`[SnakeBoard] ${this.size}^4 IVM grid`);
        console.log(`[SnakeBoard] Cell volume: ${this.cellVolumeUnit}, S3: ${this.s3Constant}`);
        console.log(`[SnakeBoard] Volume ratios T:O:C = ${this.volumeRatios.tetra}:${this.volumeRatios.octa}:${this.volumeRatios.cubo}`);
    }

    /** Verify geometric integrity on construction. */
    _verifyIntegrity() {
        if (typeof verifyRoundTrip !== 'function') return;
        const corners = [
            new Quadray(0, 0, 0, 0),
            new Quadray(this.size - 1, this.size - 1, this.size - 1, this.size - 1),
        ];
        let allPassed = true;
        for (const corner of corners) {
            const result = verifyRoundTrip(corner);
            if (!result.passed) {
                console.warn(`[SnakeBoard] Round-trip failed for ${corner.toString()}: error=${result.error.toFixed(6)}`);
                allPassed = false;
            }
        }
        if (allPassed) console.log('[SnakeBoard] ✅ Round-trip integrity verified');
    }

    init() {
        this.snake = [];
        this.snakeSet = new Set();
        this.score = 0;
        this.level = 1;
        this.gameOver = false;
        this.direction = SnakeBoard.DIRECTIONS[0];
        this.nextDirection = null;
        this.tickInterval = 200;

        // Start snake in center, 3 segments long
        const mid = Math.floor(this.size / 2);
        for (let i = 0; i < 3; i++) {
            const k = this.key(mid - 2 + i, mid, mid, mid);
            this.snake.push(k);
            this.snakeSet.add(k);
        }

        this._spawnFood();
        console.log(`[SnakeBoard] Initialized on ${this.size}^4 IVM grid`);
    }

    /** Reset board to initial state — alias for init(). */
    reset() {
        this.init();
    }

    key(a, b, c, d) { return GridUtils.key(a, b, c, d); }
    parseKey(k) { const p = GridUtils.parseKey(k); return [p.a, p.b, p.c, p.d]; }

    /** Get head position key. */
    get head() { return this.snake[this.snake.length - 1]; }

    /** Wrap coordinate within grid bounds. */
    wrap(v) { return ((v % this.size) + this.size) % this.size; }

    /** Set direction (prevents 180° reversal). */
    setDirection(dir) {
        // Can't reverse into self
        const isOpposite = (
            dir.da === 2 - this.direction.da &&
            dir.db === 2 - this.direction.db &&
            dir.dc === 2 - this.direction.dc &&
            dir.dd === 2 - this.direction.dd
        );
        if (!isOpposite) {
            this.nextDirection = dir;
        }
    }

    /** Set direction by index (0-7). */
    setDirectionIndex(idx) {
        if (idx >= 0 && idx < SnakeBoard.DIRECTIONS.length) {
            this.setDirection(SnakeBoard.DIRECTIONS[idx]);
        }
    }

    /**
     * Advance the snake one step. Returns result:
     * 'move' — normal move
     * 'eat'  — ate food, grew
     * 'die'  — hit self or boundary
     */
    step() {
        if (this.gameOver) return 'dead';

        // Apply buffered direction
        if (this.nextDirection) {
            this.direction = this.nextDirection;
            this.nextDirection = null;
        }

        // Calculate new head
        const [ha, hb, hc, hd] = this.parseKey(this.head);
        const na = this.wrap(ha + this.direction.da);
        const nb = this.wrap(hb + this.direction.db);
        const nc = this.wrap(hc + this.direction.dc);
        const nd = this.wrap(hd + this.direction.dd);
        const newKey = this.key(na, nb, nc, nd);

        // Self-collision check (not counting tail that's about to move)
        if (this.snakeSet.has(newKey) && newKey !== this.snake[0]) {
            this.gameOver = true;
            return 'die';
        }

        // Move head
        this.snake.push(newKey);
        this.snakeSet.add(newKey);

        // Check food
        if (newKey === this.food) {
            this.score += 10;
            this._spawnFood();

            // Speed up every 5 food
            if (this.score % 50 === 0) {
                this.level++;
                this.tickInterval = Math.max(50, this.tickInterval - 20);
            }
            return 'eat';
        }

        // Remove tail
        const tail = this.snake.shift();
        this.snakeSet.delete(tail);
        return 'move';
    }

    /** Spawn food at a random unoccupied position. */
    _spawnFood() {
        const candidates = [];
        for (let a = 0; a < this.size; a++)
            for (let b = 0; b < this.size; b++)
                for (let c = 0; c < this.size; c++)
                    for (let d = 0; d < this.size; d++) {
                        const k = this.key(a, b, c, d);
                        if (!this.snakeSet.has(k)) candidates.push(k);
                    }

        if (candidates.length > 0) {
            this.food = candidates[Math.floor(Math.random() * candidates.length)];
        } else {
            // Board full — win!
            this.gameOver = true;
            this.food = null;
        }
    }

    /** Get snake body as Quadray objects for rendering. */
    getSnakeCells() {
        return this.snake.map((k, i) => {
            const [a, b, c, d] = this.parseKey(k);
            return {
                a, b, c, d, isHead: i === this.snake.length - 1,
                quadray: typeof Quadray !== 'undefined' ? new Quadray(a, b, c, d) : null
            };
        });
    }

    /** Get food as Quadray. */
    getFood() {
        if (!this.food) return null;
        const [a, b, c, d] = this.parseKey(this.food);
        return { a, b, c, d, quadray: typeof Quadray !== 'undefined' ? new Quadray(a, b, c, d) : null };
    }

    /**
     * Get board metadata for HUD display.
     * @returns {Object}
     */
    getMetadata() {
        return {
            score: this.score,
            level: this.level,
            gameOver: this.gameOver,
            snakeLength: this.snake.length,
            size: this.size,
            volumeRatios: this.volumeRatios,
            cellVolume: this.cellVolumeUnit,
            s3: this.s3Constant,
        };
    }

    /** Compatibility with scaffold test API. */
    getCell(q) { return this.snakeSet.has(this.key(q.a, q.b, q.c, q.d)) ? 'snake' : null; }
    setCell(q, v) { /* no-op for compat */ }
}

// Dual export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SnakeBoard };
}
