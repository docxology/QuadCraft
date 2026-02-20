/**
 * breakout_board.js — 4D Breakout on IVM Grid
 *
 * Bricks at integer Quadray positions, ball with continuous Quadray
 * position/velocity, paddle on a tetrahedral face. Ball bounces off
 * walls and paddle, destroys bricks on contact.
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
 * @module BreakoutBoard
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

class BreakoutBoard extends BaseBoard {
    constructor(width = 8, height = 12, depthC = 3, depthD = 3) {
        super(width, { name: 'BreakoutBoard', verify: false });
        this.width = width;
        this.height = height;
        this.depthC = depthC;
        this.depthD = depthD;
        this.bricks = {};         // key -> {hits, maxHits, color, points}
        this.ball = { a: 1.5, b: width / 2, c: depthC / 2, d: depthD / 2 };
        this.ballVel = { a: 0.15, b: 0.1, c: 0.03, d: -0.02 };
        this.paddle = { b: width / 2, c: depthC / 2, d: depthD / 2, size: 2 };
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.combo = 0;
        this.gameOver = false;
        this.won = false;

        // Synergetics metadata
        this.volumeRatios = {
            tetra: SYNERGETICS?.TETRA_VOL ?? 1,
            octa: SYNERGETICS?.OCTA_VOL ?? 4,
            cubo: SYNERGETICS?.CUBO_VOL ?? 20,
        };
        this.cellVolumeUnit = typeof Quadray !== 'undefined' && Quadray.cellVolume ? Quadray.cellVolume() : 1;
        this.s3Constant = SYNERGETICS?.S3 ?? 1.0607;

        this._initBricks();

        // Integrity check — verify round-trip on corner positions
        this._verifyIntegrity();

        console.log(`[BreakoutBoard] ${width}×${height}×${depthC}×${depthD} IVM grid`);
        console.log(`[BreakoutBoard] Cell volume: ${this.cellVolumeUnit}, S3: ${this.s3Constant}`);
        console.log(`[BreakoutBoard] Volume ratios T:O:C = ${this.volumeRatios.tetra}:${this.volumeRatios.octa}:${this.volumeRatios.cubo}`);
    }

    /** Verify geometric integrity on construction. */
    _verifyIntegrity() {
        if (typeof verifyRoundTrip !== 'function') return;
        if (typeof Quadray === 'undefined') return;
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
                console.warn(`[BreakoutBoard] Round-trip failed for ${corner.toString()}: error=${result.error.toFixed(6)}`);
                allPassed = false;
            }
        }
        if (allPassed) console.log('[BreakoutBoard] Round-trip integrity verified on corner positions');
    }

    /**
     * Create a string key for a Quadray coordinate — delegates to GridUtils.
     * @param {number} a
     * @param {number} b
     * @param {number} c
     * @param {number} d
     * @returns {string}
     */
    key(a, b, c, d) {
        return typeof GridUtils !== 'undefined' ? GridUtils.key(a, b, c, d) : `${a},${b},${c},${d}`;
    }

    /**
     * Parse a key back to coordinates — delegates to GridUtils.
     * @param {string} k
     * @returns {Array<number>|{a:number,b:number,c:number,d:number}}
     */
    parseKey(k) {
        if (typeof GridUtils !== 'undefined') {
            const p = GridUtils.parseKey(k);
            return [p.a, p.b, p.c, p.d];
        }
        return k.split(',').map(Number);
    }

    _initBricks() {
        this.bricks = {};
        const colors = [
            ['#ef4444', '#fca5a5'],  // red -> light red
            ['#f59e0b', '#fcd34d'],  // amber -> light amber
            ['#22c55e', '#86efac'],  // green -> light green
            ['#3b82f6', '#93c5fd'],  // blue -> light blue
            ['#8b5cf6', '#c4b5fd'],  // purple -> light purple
        ];
        for (let a = this.height - 5; a < this.height - 1; a++)
            for (let b = 1; b < this.width - 1; b++)
                for (let c = 0; c < this.depthC; c++)
                    for (let d = 0; d < this.depthD; d++) {
                        const row = a - (this.height - 5);
                        const maxHits = row >= 2 ? 2 : 1; // Top 2 rows are 2-hit
                        const pair = colors[row % colors.length];
                        this.bricks[this.key(a, b, c, d)] = {
                            hits: maxHits, maxHits,
                            color: pair[0], damagedColor: pair[1],
                            points: (row + 1) * 10 * maxHits
                        };
                    }
    }

    step() {
        if (this.gameOver) return 'gameover';

        this.ball.a += this.ballVel.a;
        this.ball.b += this.ballVel.b;
        this.ball.c += this.ballVel.c;
        this.ball.d += this.ballVel.d;

        // Wall bounces (B, C, D)
        for (const axis of ['b', 'c', 'd']) {
            const max = axis === 'b' ? this.width : axis === 'c' ? this.depthC : this.depthD;
            if (this.ball[axis] <= 0) { this.ball[axis] = 0; this.ballVel[axis] = Math.abs(this.ballVel[axis]); }
            if (this.ball[axis] >= max) { this.ball[axis] = max; this.ballVel[axis] = -Math.abs(this.ballVel[axis]); }
        }

        // Ceiling bounce (top A)
        if (this.ball.a >= this.height) {
            this.ball.a = this.height;
            this.ballVel.a = -Math.abs(this.ballVel.a);
        }

        // Paddle check (bottom A)
        if (this.ball.a <= 1 && this.ballVel.a < 0) {
            const db = Math.abs(this.ball.b - this.paddle.b);
            const dc = Math.abs(this.ball.c - this.paddle.c);
            const dd = Math.abs(this.ball.d - this.paddle.d);
            if (db <= this.paddle.size && dc <= this.paddle.size && dd <= this.paddle.size) {
                this.ball.a = 1;
                this.ballVel.a = Math.abs(this.ballVel.a);
                // Spin from paddle offset
                this.ballVel.b += (this.ball.b - this.paddle.b) * 0.02;
                this.ballVel.c += (this.ball.c - this.paddle.c) * 0.01;
                this._clampVelocity();
                this.combo = 0;
                return 'paddle';
            }
        }

        // Miss — lose life
        if (this.ball.a <= 0) {
            this.lives--;
            this.combo = 0;
            if (this.lives <= 0) { this.gameOver = true; return 'gameover'; }
            this._resetBall();
            return 'miss';
        }

        // Brick collision — check grid cell nearest to ball
        const ba = Math.round(this.ball.a);
        const bb = Math.round(this.ball.b);
        const bc = Math.round(this.ball.c);
        const bd = Math.round(this.ball.d);
        const bk = this.key(ba, bb, bc, bd);
        if (this.bricks[bk]) {
            this.bricks[bk].hits--;
            this.combo++;
            if (this.bricks[bk].hits <= 0) {
                this.score += this.bricks[bk].points * Math.min(this.combo, 5);
                delete this.bricks[bk];
            } else {
                // Brick damaged but still alive
                this.bricks[bk].color = this.bricks[bk].damagedColor;
                this.score += 5 * this.combo;
            }
            this.ballVel.a = -this.ballVel.a;
            if (Object.keys(this.bricks).length === 0) {
                this.won = true;
                this.level++;
                this._initBricks();
                this._resetBall();
                // Slightly faster each level
                this.ballVel.a *= 1.1;
                return 'level_clear';
            }
            return 'brick';
        }

        return 'play';
    }

    _resetBall() {
        this.ball = { a: 1.5, b: this.paddle.b, c: this.paddle.c, d: this.paddle.d };
        const speed = 0.15 + (this.level - 1) * 0.02;
        this.ballVel = { a: speed, b: (Math.random() - 0.5) * 0.1, c: 0.03, d: -0.02 };
    }

    /** Clamp velocity components to prevent runaway speed. */
    _clampVelocity() {
        const maxV = 0.4;
        for (const axis of ['a', 'b', 'c', 'd']) {
            this.ballVel[axis] = Math.max(-maxV, Math.min(maxV, this.ballVel[axis]));
        }
    }

    movePaddle(db, dc, dd) {
        this.paddle.b = Math.max(this.paddle.size, Math.min(this.width - this.paddle.size, this.paddle.b + db));
        this.paddle.c = Math.max(0, Math.min(this.depthC, this.paddle.c + dc));
        this.paddle.d = Math.max(0, Math.min(this.depthD, this.paddle.d + dd));
    }

    /** Reset the game fully. */
    reset() {
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.combo = 0;
        this.gameOver = false;
        this.won = false;
        this._initBricks();
        this._resetBall();
    }

    getBrickCount() { return Object.keys(this.bricks).length; }

    getBallQuadray() {
        return typeof Quadray !== 'undefined'
            ? new Quadray(this.ball.a, this.ball.b, this.ball.c, this.ball.d) : null;
    }

    /**
     * Get cell data at a Quadray position.
     * @param {Quadray} q
     * @returns {Object|null}
     */
    getCell(q) {
        return this.bricks[this.key(q.a, q.b, q.c, q.d)] || null;
    }

    /**
     * Set cell data at a Quadray position.
     * @param {Quadray} q
     * @param {*} value
     */
    setCell(q, value) {
        if (value) {
            this.bricks[this.key(q.a, q.b, q.c, q.d)] = value;
        } else {
            delete this.bricks[this.key(q.a, q.b, q.c, q.d)];
        }
    }

    /**
     * Get IVM neighbors of a position that are within board bounds.
     * Uses GridUtils.neighbors().
     * @param {number} a
     * @param {number} b
     * @param {number} c
     * @param {number} d
     * @returns {Array<{a:number,b:number,c:number,d:number}>}
     */
    getNeighbors(a, b, c, d) {
        if (typeof GridUtils === 'undefined') return [];
        return GridUtils.neighbors(a, b, c, d)
            .filter(n => n.a >= 0 && n.a < this.height &&
                         n.b >= 0 && n.b < this.width &&
                         n.c >= 0 && n.c < this.depthC &&
                         n.d >= 0 && n.d < this.depthD);
    }

    /**
     * Calculate Manhattan distance between two positions.
     * Uses GridUtils.manhattan().
     * @param {{a:number,b:number,c:number,d:number}} p1
     * @param {{a:number,b:number,c:number,d:number}} p2
     * @returns {number}
     */
    manhattanDistance(p1, p2) {
        return typeof GridUtils !== 'undefined' ? GridUtils.manhattan(p1, p2) : 0;
    }

    /**
     * Calculate Euclidean distance between two positions.
     * Uses GridUtils.euclidean().
     * @param {{a:number,b:number,c:number,d:number}} p1
     * @param {{a:number,b:number,c:number,d:number}} p2
     * @returns {number}
     */
    euclideanDistance(p1, p2) {
        return typeof GridUtils !== 'undefined' ? GridUtils.euclidean(p1, p2) : 0;
    }

    /**
     * Get board metadata for HUD display.
     * @returns {Object}
     */
    getMetadata() {
        return {
            score: this.score,
            lives: this.lives,
            level: this.level,
            combo: this.combo,
            brickCount: this.getBrickCount(),
            gameOver: this.gameOver,
            won: this.won,
            volumeRatios: this.volumeRatios,
            cellVolume: this.cellVolumeUnit,
            s3: this.s3Constant,
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BreakoutBoard };
}
