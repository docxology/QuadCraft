/**
 * backgammon_board.js — 4D Backgammon on IVM Grid
 *
 * 24-point track mapped onto 4 tetrahedral Quadray axes (lanes A-D).
 * Dice-driven race game with hitting, bar re-entry, and bearing off.
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
 * @module BackgammonBoard
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

class BackgammonBoard extends BaseBoard {

    /** Lane labels for the 4 Quadray axes. */
    static LANE_NAMES = ['A', 'B', 'C', 'D'];

    /** Lane colors matching the axis coloring convention. */
    static LANE_COLORS = ['#ff4444', '#44ff44', '#4488ff', '#ffff44'];

    constructor() {
        super(6, { name: 'BackgammonBoard', verify: false });
        this.points = new Array(24).fill(null).map(() => []);
        this.bar = { white: 0, black: 0 };
        this.borne = { white: 0, black: 0 };
        this.currentPlayer = 'white';
        this.dice = [0, 0];
        this.gameOver = false;
        this.moveCount = 0;
        this.moveHistory = [];

        // Quadray position cache — maps point index -> Quadray
        this.quadrayCache = new Map();
        for (let i = 0; i < 24; i++) {
            this.quadrayCache.set(i, this._computeQuadray(i));
        }

        // Grid map for getCell/setCell — keyed by GridUtils.key()
        this.grid = new Map();

        // Synergetics metadata
        this.volumeRatios = {
            tetra: SYNERGETICS?.TETRA_VOL ?? 1,
            octa: SYNERGETICS?.OCTA_VOL ?? 4,
            cubo: SYNERGETICS?.CUBO_VOL ?? 20,
        };
        this.cellVolumeUnit = typeof Quadray !== 'undefined' ? Quadray.cellVolume() : 1;
        this.s3Constant = SYNERGETICS?.S3 ?? 1.0607;

        // Set up initial position
        this.setupInitial();

        // Integrity check — verify round-trip on lane endpoint positions
        this._verifyIntegrity();

        console.log('[BackgammonBoard] 24-point IVM track, 4 lanes x 6 points');
        console.log(`[BackgammonBoard] Cell volume: ${this.cellVolumeUnit}, S3: ${this.s3Constant}`);
        console.log(`[BackgammonBoard] Volume ratios T:O:C = ${this.volumeRatios.tetra}:${this.volumeRatios.octa}:${this.volumeRatios.cubo}`);
    }

    /** Verify geometric integrity on construction. */
    _verifyIntegrity() {
        if (typeof verifyRoundTrip !== 'function') return;
        const testPoints = [
            new Quadray(0, 0, 0, 0),          // origin
            new Quadray(5, 0, 0, 0),          // end of lane A
            new Quadray(0, 5, 0, 0),          // end of lane B
            new Quadray(0, 0, 5, 0),          // end of lane C
            new Quadray(0, 0, 0, 5),          // end of lane D
        ];
        let allPassed = true;
        for (const pt of testPoints) {
            const result = verifyRoundTrip(pt);
            if (!result.passed) {
                console.warn(`[BackgammonBoard] Round-trip failed for ${pt.toString()}: error=${result.error.toFixed(6)}`);
                allPassed = false;
            }
        }
        if (allPassed) console.log('[BackgammonBoard] Round-trip integrity verified on lane endpoints');
    }

    /** Set up standard backgammon initial position. */
    setupInitial() {
        this.points.forEach(p => p.length = 0);
        this.bar = { white: 0, black: 0 };
        this.borne = { white: 0, black: 0 };

        const place = (pt, color, n) => {
            for (let i = 0; i < n; i++) this.points[pt].push(color);
        };
        // Standard backgammon setup adapted to 24-point track
        place(0, 'white', 2);
        place(11, 'white', 5);
        place(16, 'white', 3);
        place(18, 'white', 5);
        place(23, 'black', 2);
        place(12, 'black', 5);
        place(7, 'black', 3);
        place(5, 'black', 5);

        // Sync grid map
        this._syncGrid();
    }

    /**
     * Sync the grid Map with current point state.
     * Uses GridUtils.key() for all key generation.
     */
    _syncGrid() {
        this.grid.clear();
        for (let i = 0; i < 24; i++) {
            const q = this.pointToQuadray(i);
            const key = GridUtils.key(q.a, q.b, q.c, q.d);
            if (this.points[i].length > 0) {
                this.grid.set(key, {
                    pointIndex: i,
                    stones: this.points[i].slice(),
                    quadray: q,
                    cellType: Quadray.cellType(q.a, q.b, q.c, q.d),
                    count: this.points[i].length,
                    owner: this.points[i][0],
                });
            }
        }
    }

    /**
     * Get cell data at a Quadray position.
     * Uses GridUtils.key() for lookup.
     * @param {Quadray} q
     * @returns {Object|null}
     */
    getCell(q) {
        const key = GridUtils.key(q.a, q.b, q.c, q.d);
        return this.grid.get(key) || null;
    }

    /**
     * Set cell data at a Quadray position.
     * Uses GridUtils.key() for storage.
     * @param {Quadray} q
     * @param {*} value
     */
    setCell(q, value) {
        const key = GridUtils.key(q.a, q.b, q.c, q.d);
        this.grid.set(key, value);
    }

    /** Roll two dice. */
    rollDice() {
        this.dice = [
            Math.floor(Math.random() * 6) + 1,
            Math.floor(Math.random() * 6) + 1,
        ];
        return this.dice;
    }

    /**
     * Get all valid moves for the current player.
     * @returns {Array<{from: number|string, to: number|string, die: number}>}
     */
    getValidMoves() {
        const moves = [];
        const c = this.currentPlayer;
        const dir = c === 'white' ? 1 : -1;

        for (const die of this.dice) {
            if (this.bar[c] > 0) {
                const target = c === 'white' ? die - 1 : 24 - die;
                if (this.canLand(target, c)) {
                    moves.push({ from: 'bar', to: target, die });
                }
            } else {
                for (let i = 0; i < 24; i++) {
                    if (this.points[i].length > 0 && this.points[i][0] === c) {
                        const target = i + die * dir;
                        if (target >= 0 && target < 24 && this.canLand(target, c)) {
                            moves.push({ from: i, to: target, die });
                        }
                        // Bearing off
                        if ((c === 'white' && target >= 24) || (c === 'black' && target < 0)) {
                            if (this.canBearOff(c)) {
                                moves.push({ from: i, to: 'off', die });
                            }
                        }
                    }
                }
            }
        }
        return moves;
    }

    /**
     * Check if a color can land on a point.
     * @param {number} pt
     * @param {string} color
     * @returns {boolean}
     */
    canLand(pt, color) {
        return this.points[pt].length < 2 || this.points[pt][0] === color;
    }

    /**
     * Check if a player can bear off (all remaining stones in home board).
     * @param {string} color
     * @returns {boolean}
     */
    canBearOff(color) {
        const start = color === 'white' ? 18 : 0;
        const end = color === 'white' ? 24 : 6;
        for (let i = 0; i < 24; i++) {
            if (i >= start && i < end) continue;
            if (this.points[i].some(c => c === color)) return false;
        }
        return this.bar[color] === 0;
    }

    /**
     * Execute a move.
     * @param {number|string} from — Point index or 'bar'
     * @param {number|string} to — Point index or 'off'
     * @param {number} die — Die value used
     */
    move(from, to, die) {
        const c = this.currentPlayer;

        // Record move in history
        this.moveCount++;
        const fromQ = from === 'bar' ? null : this.pointToQuadray(from);
        const toQ = to === 'off' ? null : this.pointToQuadray(to);
        this.moveHistory.push({
            player: c,
            from,
            to,
            die,
            fromQuadray: fromQ ? fromQ.clone() : null,
            toQuadray: toQ ? toQ.clone() : null,
            moveNum: this.moveCount,
        });

        // Remove from source
        if (from === 'bar') {
            this.bar[c]--;
        } else {
            this.points[from].pop();
        }

        // Place at destination
        if (to === 'off') {
            this.borne[c]++;
        } else {
            const opp = c === 'white' ? 'black' : 'white';
            // Hit opponent blot
            if (this.points[to].length === 1 && this.points[to][0] === opp) {
                this.bar[opp]++;
                this.points[to].pop();
            }
            this.points[to].push(c);
        }

        // Remove used die
        this.dice = this.dice.filter((_, i) => i !== this.dice.indexOf(die));

        // Sync grid
        this._syncGrid();

        // Check game over
        if (this.isGameOver()) {
            this.gameOver = true;
        }
    }

    /** End the current turn. */
    endTurn() {
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        this.dice = [0, 0];
    }

    /** Check if the game is over (a player has borne off all 15). */
    isGameOver() {
        return this.borne.white >= 15 || this.borne.black >= 15;
    }

    /** Get the winner, or null. */
    winner() {
        if (this.borne.white >= 15) return 'white';
        if (this.borne.black >= 15) return 'black';
        return null;
    }

    /**
     * Get Quadray position for a point index.
     * 24 points = 4 lanes of 6 along each Quadray axis.
     * Points 0-5: Lane A (+A axis), Points 6-11: Lane B (+B axis),
     * Points 12-17: Lane C (+C axis), Points 18-23: Lane D (+D axis).
     *
     * Uses cached Quadray instances for performance.
     * @param {number} i — Point index (0-23)
     * @returns {Quadray}
     */
    pointToQuadray(i) {
        return this.quadrayCache.get(i) || this._computeQuadray(i);
    }

    /**
     * Compute a Quadray for a point index (internal).
     * @param {number} i
     * @returns {Quadray}
     */
    _computeQuadray(i) {
        const lane = Math.floor(i / 6);  // 0=A, 1=B, 2=C, 3=D
        const step = i % 6;
        const coords = [0, 0, 0, 0];
        coords[lane] = step;
        return new Quadray(...coords);
    }

    /**
     * Get the lane index (0-3) for a point.
     * @param {number} i
     * @returns {number}
     */
    getLane(i) {
        return Math.floor(i / 6);
    }

    /**
     * Get lane color for a point index.
     * @param {number} i
     * @returns {string}
     */
    getLaneColor(i) {
        return BackgammonBoard.LANE_COLORS[this.getLane(i)];
    }

    /**
     * Get IVM neighbors of a point's Quadray position that map to valid points.
     * Uses GridUtils.neighbors().
     * @param {number} pointIndex
     * @returns {Array<{index: number, quadray: Quadray}>}
     */
    getNeighborPoints(pointIndex) {
        const q = this.pointToQuadray(pointIndex);
        const raw = GridUtils.neighbors(q.a, q.b, q.c, q.d);
        const result = [];
        for (const n of raw) {
            // Find which point index (if any) maps to this neighbor
            for (let j = 0; j < 24; j++) {
                const pq = this.pointToQuadray(j);
                if (pq.a === n.a && pq.b === n.b && pq.c === n.c && pq.d === n.d) {
                    result.push({ index: j, quadray: pq });
                    break;
                }
            }
        }
        return result;
    }

    /**
     * Calculate Manhattan distance between two points.
     * Uses GridUtils.manhattan().
     * @param {number} i1 — Point index
     * @param {number} i2 — Point index
     * @returns {number}
     */
    manhattanDistance(i1, i2) {
        const q1 = this.pointToQuadray(i1);
        const q2 = this.pointToQuadray(i2);
        return GridUtils.manhattan(
            { a: q1.a, b: q1.b, c: q1.c, d: q1.d },
            { a: q2.a, b: q2.b, c: q2.c, d: q2.d }
        );
    }

    /**
     * Calculate Euclidean distance between two points.
     * Uses GridUtils.euclidean().
     * @param {number} i1
     * @param {number} i2
     * @returns {number}
     */
    euclideanDistance(i1, i2) {
        const q1 = this.pointToQuadray(i1);
        const q2 = this.pointToQuadray(i2);
        return GridUtils.euclidean(
            { a: q1.a, b: q1.b, c: q1.c, d: q1.d },
            { a: q2.a, b: q2.b, c: q2.c, d: q2.d }
        );
    }

    /**
     * Calculate Quadray distance between two points.
     * Uses Quadray.distance().
     * @param {number} i1
     * @param {number} i2
     * @returns {number}
     */
    quadrayDistance(i1, i2) {
        return Quadray.distance(this.pointToQuadray(i1), this.pointToQuadray(i2));
    }

    /**
     * Get the angle between two direction vectors from a point.
     * Uses angleBetweenQuadrays() from synergetics.
     * @param {number} fromPt
     * @param {number} toPt1
     * @param {number} toPt2
     * @returns {number} Angle in degrees
     */
    angleBetween(fromPt, toPt1, toPt2) {
        if (typeof angleBetweenQuadrays !== 'function') return 0;
        const from = this.pointToQuadray(fromPt);
        const v1 = this.pointToQuadray(toPt1).subtract(from);
        const v2 = this.pointToQuadray(toPt2).subtract(from);
        return angleBetweenQuadrays(v1, v2);
    }

    /**
     * Get board metadata for HUD display.
     * @returns {Object}
     */
    getMetadata() {
        // Count stones per lane and cell types
        let tetraCount = 0, octaCount = 0;
        const laneCounts = [0, 0, 0, 0];
        for (let i = 0; i < 24; i++) {
            const count = this.points[i].length;
            if (count > 0) {
                laneCounts[this.getLane(i)] += count;
                const q = this.pointToQuadray(i);
                const ct = Quadray.cellType(q.a, q.b, q.c, q.d);
                if (ct === 'tetra') tetraCount += count;
                else octaCount += count;
            }
        }

        return {
            moveCount: this.moveCount,
            currentPlayer: this.currentPlayer,
            winner: this.winner(),
            gameOver: this.gameOver,
            tetraCount,
            octaCount,
            laneCounts,
            bar: { ...this.bar },
            borne: { ...this.borne },
            dice: [...this.dice],
            volumeRatios: this.volumeRatios,
            cellVolume: this.cellVolumeUnit,
            s3: this.s3Constant,
            totalStones: 30,
        };
    }

    /** Reset board to initial state. */
    reset() {
        this.currentPlayer = 'white';
        this.dice = [0, 0];
        this.gameOver = false;
        this.moveCount = 0;
        this.moveHistory = [];
        this.setupInitial();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BackgammonBoard };
}
