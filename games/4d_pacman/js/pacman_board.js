/**
 * pacman_board.js — 4D Pac-Man on IVM Grid
 *
 * Maze defined on integer Quadray positions. Pac-Man and ghosts
 * move along IVM adjacency directions. Pellets at each open cell.
 * Power pellets make ghosts vulnerable.
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
 * @module PacManBoard
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

class PacManBoard extends BaseBoard {
    /**
     * Canonical 8 IVM directions — delegated from GridUtils.DIRECTIONS_8.
     * Each entry gains a name label for HUD display and logging.
     */
    static DIRECTIONS = GridUtils.DIRECTIONS_8.map(([da, db, dc, dd], i) => {
        const names = ['+A', '-A', '+B', '-B', '+C', '-C', '+D', '-D'];
        return { da, db, dc, dd, name: names[i] };
    });

    /**
     * @param {number} size — Grid dimension (0 to size-1 per axis).
     */
    constructor(size = 5) {
        super(size, { name: 'PacManBoard', verify: false });
        this.size = size;
        this.walls = new Set();
        this.pellets = new Set();
        this.powerPellets = new Set();
        this.pacman = { a: 1, b: 1, c: 1, d: 1 };
        this.pacmanDir = PacManBoard.DIRECTIONS[0];
        this.ghosts = [];
        this.score = 0;
        this.lives = 3;
        this.gameOver = false;
        this.won = false;
        this.powerTimer = 0;
        this.pelletsEaten = 0;
        this.ghostsEaten = 0;
        this.totalPellets = 0;

        // Synergetics metadata
        this.volumeRatios = {
            tetra: SYNERGETICS?.TETRA_VOL ?? 1,
            octa: SYNERGETICS?.OCTA_VOL ?? 4,
            cubo: SYNERGETICS?.CUBO_VOL ?? 20,
        };
        this.cellVolumeUnit = Quadray.cellVolume();
        this.s3Constant = SYNERGETICS?.S3 ?? 1.0607;

        this._generateMaze();

        // Integrity check — verify round-trip on corner positions
        this._verifyIntegrity();

        console.log(`[PacManBoard] ${size}^4 IVM maze, ${this.pellets.size} pellets`);
        console.log(`[PacManBoard] Cell volume: ${this.cellVolumeUnit}, S3: ${this.s3Constant}`);
        console.log(`[PacManBoard] Volume ratios T:O:C = ${this.volumeRatios.tetra}:${this.volumeRatios.octa}:${this.volumeRatios.cubo}`);
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
                console.warn(`[PacManBoard] Round-trip failed for ${corner.toString()}: error=${result.error.toFixed(6)}`);
                allPassed = false;
            }
        }
        if (allPassed) console.log('[PacManBoard] Round-trip integrity verified on corner positions');
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
     * Delegate key parsing to GridUtils.
     * @param {string} k — "a,b,c,d"
     * @returns {[number, number, number, number]}
     */
    parseKey(k) {
        const obj = GridUtils.parseKey(k);
        return [obj.a, obj.b, obj.c, obj.d];
    }

    /**
     * Wrap a coordinate for toroidal maze movement.
     * @param {number} v
     * @returns {number}
     */
    wrap(v) { return ((v % this.size) + this.size) % this.size; }

    /**
     * Check if coordinates are within the board bounds.
     * @param {Quadray} q
     * @returns {boolean}
     */
    inBounds(q) {
        return GridUtils.inBounds(q.a, q.b, q.c, q.d, this.size);
    }

    /**
     * Get cell data at a Quadray position.
     * @param {Quadray} q
     * @returns {string|null} 'wall' or null
     */
    getCell(q) {
        return this.walls.has(this.key(q.a, q.b, q.c, q.d)) ? 'wall' : null;
    }

    /**
     * Set cell data at a Quadray position (no-op for maze-based board).
     * @param {Quadray} q
     * @param {*} value
     */
    setCell(q, value) { /* no-op for maze board */ }

    /**
     * Get IVM neighbors of a position that are within board bounds.
     * Uses GridUtils.boundedNeighbors().
     * @param {Quadray} q
     * @returns {Array<{a:number, b:number, c:number, d:number}>}
     */
    getNeighbors(q) {
        return GridUtils.boundedNeighbors(q.a, q.b, q.c, q.d, this.size);
    }

    /**
     * Calculate Manhattan distance between two positions.
     * Uses GridUtils.manhattan().
     * @param {{a:number,b:number,c:number,d:number}} p1
     * @param {{a:number,b:number,c:number,d:number}} p2
     * @returns {number}
     */
    manhattanDistance(p1, p2) {
        return GridUtils.manhattan(p1, p2);
    }

    /**
     * Calculate Euclidean distance between two positions.
     * Uses GridUtils.euclidean().
     * @param {{a:number,b:number,c:number,d:number}} p1
     * @param {{a:number,b:number,c:number,d:number}} p2
     * @returns {number}
     */
    euclideanDistance(p1, p2) {
        return GridUtils.euclidean(p1, p2);
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

    _generateMaze() {
        this.walls.clear();
        this.pellets.clear();
        this.powerPellets.clear();

        for (let a = 0; a < this.size; a++)
            for (let b = 0; b < this.size; b++)
                for (let c = 0; c < this.size; c++)
                    for (let d = 0; d < this.size; d++) {
                        const k = this.key(a, b, c, d);
                        // Border walls (with gaps for wrapping)
                        if (a === 0 || b === 0 || a === this.size - 1 || b === this.size - 1) {
                            if ((a + b + c + d) % 3 === 0) {
                                this.walls.add(k);
                                continue;
                            }
                        }
                        // Interior walls (sparse, deterministic pattern)
                        if ((a * 7 + b * 13 + c * 3 + d * 11) % 5 === 0 && a > 0 && b > 0) {
                            this.walls.add(k);
                            continue;
                        }
                        this.pellets.add(k);
                    }

        // Power pellets in 4D corners
        const corners = [
            [1, 1, 1, 1], [1, 1, 1, this.size - 2],
            [1, this.size - 2, 1, 1], [this.size - 2, 1, 1, 1]
        ];
        for (const [a, b, c, d] of corners) {
            const k = this.key(a, b, c, d);
            this.pellets.delete(k);
            this.walls.delete(k);
            this.powerPellets.add(k);
        }

        this.totalPellets = this.pellets.size + this.powerPellets.size;

        // Ghosts at center
        const mid = Math.floor(this.size / 2);
        this.ghosts = [
            { a: mid, b: mid, c: mid, d: mid, scared: false, name: 'Blinky', color: '#ef4444' },
            { a: mid + 1, b: mid, c: mid, d: mid, scared: false, name: 'Pinky', color: '#f472b6' },
            { a: mid, b: mid + 1, c: mid, d: mid, scared: false, name: 'Inky', color: '#22d3ee' },
        ];

        // Clear pacman start area
        const pk = this.key(1, 1, 1, 1);
        this.walls.delete(pk);
        this.pellets.delete(pk);
    }

    /** Reset the game. */
    reset() {
        this.score = 0;
        this.lives = 3;
        this.gameOver = false;
        this.won = false;
        this.powerTimer = 0;
        this.pelletsEaten = 0;
        this.ghostsEaten = 0;
        this.pacman = { a: 1, b: 1, c: 1, d: 1 };
        this.pacmanDir = PacManBoard.DIRECTIONS[0];
        this._generateMaze();
    }

    setDirection(dir) { this.pacmanDir = dir; }

    step() {
        if (this.gameOver) return 'gameover';

        // Move Pac-Man
        const na = this.wrap(this.pacman.a + this.pacmanDir.da);
        const nb = this.wrap(this.pacman.b + this.pacmanDir.db);
        const nc = this.wrap(this.pacman.c + this.pacmanDir.dc);
        const nd = this.wrap(this.pacman.d + this.pacmanDir.dd);
        const nk = this.key(na, nb, nc, nd);

        if (!this.walls.has(nk)) {
            this.pacman = { a: na, b: nb, c: nc, d: nd };
        }

        // Eat pellet
        const pk = this.key(this.pacman.a, this.pacman.b, this.pacman.c, this.pacman.d);
        if (this.pellets.has(pk)) {
            this.pellets.delete(pk);
            this.score += 10;
            this.pelletsEaten++;
        }
        if (this.powerPellets.has(pk)) {
            this.powerPellets.delete(pk);
            this.score += 50;
            this.powerTimer = 30;
            this.ghosts.forEach(g => g.scared = true);
        }

        // Move ghosts
        for (const ghost of this.ghosts) {
            this._moveGhost(ghost);
        }

        // Power timer
        if (this.powerTimer > 0) {
            this.powerTimer--;
            if (this.powerTimer === 0) {
                this.ghosts.forEach(g => g.scared = false);
                this.ghostsEaten = 0;
            }
        }

        // Ghost collision
        for (const ghost of this.ghosts) {
            if (ghost.a === this.pacman.a && ghost.b === this.pacman.b &&
                ghost.c === this.pacman.c && ghost.d === this.pacman.d) {
                if (ghost.scared) {
                    this.ghostsEaten++;
                    this.score += 200 * this.ghostsEaten; // Escalating bonus
                    const mid = Math.floor(this.size / 2);
                    ghost.a = mid; ghost.b = mid; ghost.c = mid; ghost.d = mid;
                    ghost.scared = false;
                } else {
                    this.lives--;
                    if (this.lives <= 0) { this.gameOver = true; return 'dead'; }
                    this.pacman = { a: 1, b: 1, c: 1, d: 1 };
                    return 'hit';
                }
            }
        }

        // Win check
        if (this.pellets.size === 0 && this.powerPellets.size === 0) {
            this.won = true;
            this.gameOver = true;
            return 'win';
        }

        return 'play';
    }

    /** Ghost AI: chase when normal, flee when scared. Uses GridUtils.manhattan(). */
    _moveGhost(ghost) {
        const dirs = PacManBoard.DIRECTIONS;
        let bestDir = dirs[Math.floor(Math.random() * dirs.length)];
        let bestDist = ghost.scared ? -1 : Infinity;

        for (const dir of dirs) {
            const na = this.wrap(ghost.a + dir.da);
            const nb = this.wrap(ghost.b + dir.db);
            const nc = this.wrap(ghost.c + dir.dc);
            const nd = this.wrap(ghost.d + dir.dd);
            if (this.walls.has(this.key(na, nb, nc, nd))) continue;

            // Use GridUtils.manhattan() for distance calculation
            const dist = GridUtils.manhattan(
                { a: na, b: nb, c: nc, d: nd },
                this.pacman
            );

            if (ghost.scared) {
                // Flee: maximize distance from Pac-Man
                if (dist > bestDist) {
                    bestDist = dist;
                    bestDir = dir;
                }
            } else {
                // Chase: minimize distance to Pac-Man
                if (dist < bestDist) {
                    bestDist = dist;
                    bestDir = dir;
                }
            }
        }

        const na = this.wrap(ghost.a + bestDir.da);
        const nb = this.wrap(ghost.b + bestDir.db);
        const nc = this.wrap(ghost.c + bestDir.dc);
        const nd = this.wrap(ghost.d + bestDir.dd);
        if (!this.walls.has(this.key(na, nb, nc, nd))) {
            ghost.a = na; ghost.b = nb; ghost.c = nc; ghost.d = nd;
        }
    }

    /** Get all entities for rendering. */
    getEntities() {
        const entities = [];
        // Pellets
        for (const pk of this.pellets) {
            const [a, b, c, d] = this.parseKey(pk);
            entities.push({
                a, b, c, d, type: 'pellet', color: '#fbbf24',
                quadray: new Quadray(a, b, c, d),
                cellType: Quadray.cellType(a, b, c, d),
            });
        }
        for (const pk of this.powerPellets) {
            const [a, b, c, d] = this.parseKey(pk);
            entities.push({
                a, b, c, d, type: 'power', color: '#f97316',
                quadray: new Quadray(a, b, c, d),
                cellType: Quadray.cellType(a, b, c, d),
            });
        }
        // Walls
        for (const wk of this.walls) {
            const [a, b, c, d] = this.parseKey(wk);
            entities.push({
                a, b, c, d, type: 'wall', color: '#1e3a5f',
                quadray: new Quadray(a, b, c, d),
                cellType: Quadray.cellType(a, b, c, d),
            });
        }
        // Pacman
        const p = this.pacman;
        entities.push({
            a: p.a, b: p.b, c: p.c, d: p.d, type: 'pacman', color: '#facc15',
            quadray: new Quadray(p.a, p.b, p.c, p.d),
            cellType: Quadray.cellType(p.a, p.b, p.c, p.d),
        });
        // Ghosts
        for (const g of this.ghosts) {
            entities.push({
                a: g.a, b: g.b, c: g.c, d: g.d, type: 'ghost',
                color: g.scared ? '#60a5fa' : g.color, name: g.name, scared: g.scared,
                quadray: new Quadray(g.a, g.b, g.c, g.d),
                cellType: Quadray.cellType(g.a, g.b, g.c, g.d),
            });
        }
        return entities;
    }

    /**
     * Get board metadata for HUD display.
     * @returns {Object}
     */
    getMetadata() {
        let tetraCount = 0, octaCount = 0;
        // Count cell types in pellets, power pellets, and walls
        for (const pk of this.pellets) {
            const [a, b, c, d] = this.parseKey(pk);
            if (Quadray.cellType(a, b, c, d) === 'tetra') tetraCount++;
            else octaCount++;
        }
        for (const pk of this.powerPellets) {
            const [a, b, c, d] = this.parseKey(pk);
            if (Quadray.cellType(a, b, c, d) === 'tetra') tetraCount++;
            else octaCount++;
        }
        return {
            score: this.score,
            lives: this.lives,
            pelletsRemaining: this.pellets.size + this.powerPellets.size,
            pelletsEaten: this.pelletsEaten,
            ghostsEaten: this.ghostsEaten,
            powerTimer: this.powerTimer,
            gameOver: this.gameOver,
            won: this.won,
            tetraCount,
            octaCount,
            volumeRatios: this.volumeRatios,
            cellVolume: this.cellVolumeUnit,
            s3: this.s3Constant,
            totalPellets: this.totalPellets,
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PacManBoard };
}
