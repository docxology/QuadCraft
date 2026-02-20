/**
 * frogger_board.js — 4D Frogger on IVM Grid
 *
 * Lanes along the A axis with obstacles moving along B/C/D axes.
 * Frog hops along IVM directions (8 directions, +/-1 per axis).
 * Goal: cross all lanes without collision. Timer adds pressure.
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
 * @module FroggerBoard
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

class FroggerBoard extends BaseBoard {
    static DIRECTIONS = [
        { da: 1, db: 0, dc: 0, dd: 0, name: '+A' },
        { da: -1, db: 0, dc: 0, dd: 0, name: '-A' },
        { da: 0, db: 1, dc: 0, dd: 0, name: '+B' },
        { da: 0, db: -1, dc: 0, dd: 0, name: '-B' },
        { da: 0, db: 0, dc: 1, dd: 0, name: '+C' },
        { da: 0, db: 0, dc: -1, dd: 0, name: '-C' },
        { da: 0, db: 0, dc: 0, dd: 1, name: '+D' },
        { da: 0, db: 0, dc: 0, dd: -1, name: '-D' },
    ];

    constructor(width = 8, lanes = 8, depthC = 3, depthD = 3) {
        super(width, { name: 'FroggerBoard', verify: false });
        this.width = width;
        this.lanes = lanes;      // Total A rows (including safe zones)
        this.depthC = depthC;
        this.depthD = depthD;
        this.grid = new Map();   // Quadray key -> entity data (for getCell/setCell)
        this.frog = { a: 0, b: Math.floor(width / 2), c: Math.floor(depthC / 2), d: Math.floor(depthD / 2) };
        this.obstacles = [];
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameOver = false;
        this.won = false;
        this.maxRow = 0;          // Furthest row reached
        this.timeLeft = 120;      // Steps remaining (time pressure)
        this.maxTime = 120;
        this.goalsReached = 0;

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

        this._initObstacles();

        console.log(`[FroggerBoard] ${width}w x ${lanes} lanes x ${depthC}c x ${depthD}d IVM grid`);
        console.log(`[FroggerBoard] Cell volume: ${this.cellVolumeUnit}, S3: ${this.s3Constant}`);
        console.log(`[FroggerBoard] Volume ratios T:O:C = ${this.volumeRatios.tetra}:${this.volumeRatios.octa}:${this.volumeRatios.cubo}`);
    }

    /** Verify geometric integrity on construction. */
    _verifyIntegrity() {
        if (typeof verifyRoundTrip !== 'function') return;
        const corners = [
            new Quadray(0, 0, 0, 0),
            new Quadray(this.lanes - 1, this.width - 1, this.depthC - 1, this.depthD - 1),
            new Quadray(this.lanes - 1, 0, 0, 0),
            new Quadray(0, this.width - 1, 0, 0),
        ];
        let allPassed = true;
        for (const corner of corners) {
            const result = verifyRoundTrip(corner);
            if (!result.passed) {
                console.warn(`[FroggerBoard] Round-trip failed for ${corner.toString()}: error=${result.error.toFixed(6)}`);
                allPassed = false;
            }
        }
        if (allPassed) console.log('[FroggerBoard] Round-trip integrity verified on corner positions');
    }

    /**
     * Delegate key generation to GridUtils.
     * @param {number} a
     * @param {number} b
     * @param {number} c
     * @param {number} d
     * @returns {string}
     */
    key(a, b, c, d) { return GridUtils.key(a, b, c, d); }

    /**
     * Parse a key back to coordinates via GridUtils.
     * @param {string} k
     * @returns {{a:number, b:number, c:number, d:number}}
     */
    parseKey(k) { return GridUtils.parseKey(k); }

    wrap(v, max) { return ((v % max) + max) % max; }

    _initObstacles() {
        this.obstacles = [];
        for (let a = 1; a < this.lanes - 1; a++) {
            if (a === Math.floor(this.lanes / 2)) continue; // Safe zone
            const speed = (a % 2 === 0 ? 1 : -1);
            const axis = a % 3 === 0 ? 'c' : a % 3 === 1 ? 'b' : 'd';
            const count = 2 + Math.floor(a / 3) + Math.floor(this.level / 2);
            for (let i = 0; i < count; i++) {
                this.obstacles.push({
                    a, b: (i * 3) % this.width, c: Math.floor(this.depthC / 2),
                    d: Math.floor(this.depthD / 2),
                    speed: speed * Math.min(2, 1 + Math.floor(this.level / 3)),
                    axis, length: 2
                });
            }
        }
    }

    /**
     * Get cell data at a Quadray position.
     * @param {Quadray} q
     * @returns {Object|null}
     */
    getCell(q) {
        const k = q.toKey();
        return this.grid.get(k) || null;
    }

    /**
     * Set cell data at a Quadray position.
     * @param {Quadray} q
     * @param {*} value
     */
    setCell(q, value) {
        this.grid.set(q.toKey(), value);
    }

    hop(dir) {
        if (this.gameOver) return 'gameover';
        const na = this.frog.a + dir.da;
        const nb = this.wrap(this.frog.b + dir.db, this.width);
        const nc = this.wrap(this.frog.c + dir.dc, this.depthC);
        const nd = this.wrap(this.frog.d + dir.dd, this.depthD);

        if (na < 0 || na >= this.lanes) return 'blocked';

        this.frog = { a: na, b: nb, c: nc, d: nd };

        // Track progress
        if (na > this.maxRow) {
            this.maxRow = na;
            this.score += 10;
        }

        // Reached top
        if (na >= this.lanes - 1) {
            this.goalsReached++;
            this.score += 100 + this.timeLeft; // Bonus for time remaining
            this.level++;
            this.timeLeft = this.maxTime;
            this.frog = { a: 0, b: Math.floor(this.width / 2), c: Math.floor(this.depthC / 2), d: Math.floor(this.depthD / 2) };
            this.maxRow = 0;
            this._initObstacles();
            return 'goal';
        }

        return 'hop';
    }

    step() {
        if (this.gameOver) return 'gameover';

        // Time pressure
        this.timeLeft--;
        if (this.timeLeft <= 0) {
            this.lives--;
            if (this.lives <= 0) { this.gameOver = true; return 'timeout'; }
            this.timeLeft = this.maxTime;
            this.frog = { a: 0, b: Math.floor(this.width / 2), c: Math.floor(this.depthC / 2), d: Math.floor(this.depthD / 2) };
            this.maxRow = 0;
            return 'timeout';
        }

        // Move obstacles
        for (const obs of this.obstacles) {
            if (obs.axis === 'b') obs.b = this.wrap(obs.b + obs.speed, this.width);
            else if (obs.axis === 'c') obs.c = this.wrap(obs.c + obs.speed, this.depthC);
            else obs.d = this.wrap(obs.d + obs.speed, this.depthD);
        }

        // Check collision
        for (const obs of this.obstacles) {
            if (obs.a === this.frog.a) {
                const db = Math.abs(obs.b - this.frog.b);
                const dc = Math.abs(obs.c - this.frog.c);
                const dd = Math.abs(obs.d - this.frog.d);
                if (db <= 1 && dc <= 1 && dd <= 1) {
                    this.lives--;
                    if (this.lives <= 0) { this.gameOver = true; return 'dead'; }
                    this.frog = { a: 0, b: Math.floor(this.width / 2), c: Math.floor(this.depthC / 2), d: Math.floor(this.depthD / 2) };
                    this.maxRow = 0;
                    return 'hit';
                }
            }
        }

        return 'play';
    }

    /** Full reset. */
    reset() {
        this.grid = new Map();
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameOver = false;
        this.won = false;
        this.maxRow = 0;
        this.goalsReached = 0;
        this.timeLeft = this.maxTime;
        this.frog = { a: 0, b: Math.floor(this.width / 2), c: Math.floor(this.depthC / 2), d: Math.floor(this.depthD / 2) };
        this._initObstacles();
    }

    /** Get all entities for rendering. */
    getEntities() {
        const entities = [];
        // Frog
        const frogQ = new Quadray(this.frog.a, this.frog.b, this.frog.c, this.frog.d);
        const frogParity = Quadray.cellType(this.frog.a, this.frog.b, this.frog.c, this.frog.d);
        entities.push({
            a: this.frog.a, b: this.frog.b, c: this.frog.c, d: this.frog.d,
            type: 'frog', color: '#4ade80',
            quadray: frogQ,
            cellType: frogParity,
            cartesian: frogQ.toCartesian(),
            distFromOrigin: frogQ.distanceTo(Quadray.ORIGIN),
        });
        // Obstacles
        for (const obs of this.obstacles) {
            const obsQ = new Quadray(obs.a, obs.b, obs.c, obs.d);
            const obsParity = Quadray.cellType(obs.a, obs.b, obs.c, obs.d);
            entities.push({
                a: obs.a, b: obs.b, c: obs.c, d: obs.d,
                type: 'obstacle', color: obs.a % 2 === 0 ? '#ef4444' : '#f59e0b',
                quadray: obsQ,
                cellType: obsParity,
                cartesian: obsQ.toCartesian(),
                distFromOrigin: obsQ.distanceTo(Quadray.ORIGIN),
            });
        }
        return entities;
    }

    /**
     * Get IVM neighbors of a position that are within lane bounds.
     * Uses GridUtils.neighbors().
     * @param {{a:number, b:number, c:number, d:number}} pos
     * @returns {Array<{a:number, b:number, c:number, d:number}>}
     */
    getNeighbors(pos) {
        const raw = GridUtils.neighbors(pos.a, pos.b, pos.c, pos.d);
        return raw.filter(n =>
            n.a >= 0 && n.a < this.lanes &&
            n.b >= 0 && n.b < this.width &&
            n.c >= 0 && n.c < this.depthC &&
            n.d >= 0 && n.d < this.depthD
        );
    }

    /**
     * Manhattan distance between two positions on the board.
     * Uses GridUtils.manhattan().
     * @param {{a:number, b:number, c:number, d:number}} p1
     * @param {{a:number, b:number, c:number, d:number}} p2
     * @returns {number}
     */
    manhattanDistance(p1, p2) {
        return GridUtils.manhattan(p1, p2);
    }

    /**
     * Euclidean distance between two positions on the board.
     * Uses GridUtils.euclidean().
     * @param {{a:number, b:number, c:number, d:number}} p1
     * @param {{a:number, b:number, c:number, d:number}} p2
     * @returns {number}
     */
    euclideanDistance(p1, p2) {
        return GridUtils.euclidean(p1, p2);
    }

    /**
     * Quadray distance (proper IVM distance) between two positions.
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

    /**
     * Get board metadata for HUD display.
     * @returns {Object}
     */
    getMetadata() {
        return {
            score: this.score,
            lives: this.lives,
            level: this.level,
            gameOver: this.gameOver,
            goalsReached: this.goalsReached,
            timeLeft: this.timeLeft,
            maxTime: this.maxTime,
            maxRow: this.maxRow,
            frog: { ...this.frog },
            volumeRatios: this.volumeRatios,
            cellVolume: this.cellVolumeUnit,
            s3: this.s3Constant,
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FroggerBoard };
}
