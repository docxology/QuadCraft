/**
 * bomberman_board.js — 4D Bomberman on IVM Grid
 *
 * Grid of cells with destructible and indestructible walls.
 * Bombs explode along IVM axes (+/-A, +/-B, +/-C, +/-D = 8 directions).
 * Enemies roam the grid along IVM shortest paths.
 * Explosion range configurable. Power-ups in destroyed walls.
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
 * @module BombermanBoard
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

class BombermanBoard {
    /** 8 IVM explosion/movement directions. */
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

    /**
     * @param {number} size - Grid dimension (size^4 IVM grid)
     */
    constructor(size = 6) {
        this.size = size;
        this.grid = new Map();    // GridUtils.key() -> { type, quadray, cellType }
        this.player = { a: 0, b: 0, c: 0, d: 0 };
        this.enemies = [];        // [{a,b,c,d,alive,moveDelay}]
        this.bombs = [];          // [{a,b,c,d,timer,range}]
        this.explosions = new Set(); // Active explosion cell keys
        this.bombRange = 2;
        this.maxBombs = 1;
        this.activeBombs = 0;
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameOver = false;
        this.stepCount = 0;

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

        this._generateLevel();

        console.log(`[BombermanBoard] ${size}^4 IVM grid, ${this.enemies.length} enemies`);
        console.log(`[BombermanBoard] Cell volume: ${this.cellVolumeUnit}, S3: ${this.s3Constant}`);
        console.log(`[BombermanBoard] Volume ratios T:O:C = ${this.volumeRatios.tetra}:${this.volumeRatios.octa}:${this.volumeRatios.cubo}`);
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
                console.warn(`[BombermanBoard] Round-trip failed for ${corner.toString()}: error=${result.error.toFixed(6)}`);
                allPassed = false;
            }
        }
        if (allPassed) console.log('[BombermanBoard] Round-trip integrity verified on corner positions');
    }

    /**
     * Delegate key creation to GridUtils.key().
     * @param {number} a
     * @param {number} b
     * @param {number} c
     * @param {number} d
     * @returns {string}
     */
    key(a, b, c, d) { return GridUtils.key(a, b, c, d); }

    /**
     * Delegate key parsing to GridUtils.parseKey().
     * @param {string} k
     * @returns {{a:number, b:number, c:number, d:number}}
     */
    parseKey(k) {
        const parsed = GridUtils.parseKey(k);
        return [parsed.a, parsed.b, parsed.c, parsed.d];
    }

    /**
     * Check if coordinates are within the board bounds.
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
     * Get cell data at a Quadray position.
     * @param {Quadray} q
     * @returns {Object|null}
     */
    getCell(q) {
        const k = GridUtils.key(q.a, q.b, q.c, q.d);
        return this.grid.get(k) || null;
    }

    /**
     * Set cell data at a Quadray position.
     * @param {Quadray} q
     * @param {*} value
     */
    setCell(q, value) {
        this.grid.set(GridUtils.key(q.a, q.b, q.c, q.d), value);
    }

    /**
     * Get the raw cell type string at coordinate key.
     * @param {string} k — GridUtils key
     * @returns {string|null}
     */
    getCellType(k) {
        const cell = this.grid.get(k);
        if (!cell) return null;
        return cell.type || null;
    }

    _generateLevel() {
        this.grid = new Map();
        this.bombs = [];
        this.explosions.clear();
        this.enemies = [];
        this.activeBombs = 0;

        for (let a = 0; a < this.size; a++)
            for (let b = 0; b < this.size; b++)
                for (let c = 0; c < this.size; c++)
                    for (let d = 0; d < this.size; d++) {
                        const k = GridUtils.key(a, b, c, d);
                        const parity = Quadray.cellType(a, b, c, d);
                        // Indestructible walls on even grid intersections (not origin)
                        if (a % 2 === 0 && b % 2 === 0 && c % 2 === 0 && d % 2 === 0 &&
                            !(a === 0 && b === 0 && c === 0 && d === 0)) {
                            this.grid.set(k, { type: 'wall', quadray: new Quadray(a, b, c, d), cellType: parity });
                        }
                        // Destructible walls (~30%, not near player start)
                        else if (Math.random() < 0.3 && a + b + c + d > 2) {
                            this.grid.set(k, { type: 'destructible', quadray: new Quadray(a, b, c, d), cellType: parity });
                        }
                    }

        // Spawn enemies in open spaces far from player
        const enemyCount = 2 + this.level;
        let placed = 0;
        for (let attempts = 0; attempts < 200 && placed < enemyCount; attempts++) {
            const coord = GridUtils.randomCoord(this.size);
            if (coord.a + coord.b + coord.c + coord.d <= 3) continue; // Too close to player
            const k = GridUtils.key(coord.a, coord.b, coord.c, coord.d);
            if (!this.grid.has(k)) {
                this.enemies.push({
                    a: coord.a, b: coord.b, c: coord.c, d: coord.d,
                    alive: true,
                    moveDelay: Math.max(2, 4 - Math.floor(this.level / 3)),
                });
                placed++;
            }
        }
    }

    movePlayer(dir) {
        if (this.gameOver) return 'gameover';
        const na = this.player.a + dir.da;
        const nb = this.player.b + dir.db;
        const nc = this.player.c + dir.dc;
        const nd = this.player.d + dir.dd;

        if (!this.inBounds(na, nb, nc, nd)) return 'blocked';

        const nk = GridUtils.key(na, nb, nc, nd);
        const cellData = this.grid.get(nk);
        if (cellData && (cellData.type === 'wall' || cellData.type === 'destructible')) return 'blocked';

        this.player = { a: na, b: nb, c: nc, d: nd };

        // Pickup powerup
        if (cellData && cellData.type === 'powerup') {
            this.grid.delete(nk);
            this.bombRange++;
            this.score += 50;
            return 'powerup';
        }

        // Explosion check
        if (this.explosions.has(nk)) {
            this.lives--;
            if (this.lives <= 0) { this.gameOver = true; return 'dead'; }
            this.player = { a: 0, b: 0, c: 0, d: 0 };
            return 'hit';
        }

        // Enemy collision
        for (const enemy of this.enemies) {
            if (enemy.alive && enemy.a === na && enemy.b === nb && enemy.c === nc && enemy.d === nd) {
                this.lives--;
                if (this.lives <= 0) { this.gameOver = true; return 'dead'; }
                this.player = { a: 0, b: 0, c: 0, d: 0 };
                return 'hit';
            }
        }

        return 'moved';
    }

    placeBomb() {
        if (this.gameOver) return false;
        if (this.activeBombs >= this.maxBombs) return false;
        const { a, b, c, d } = this.player;
        this.bombs.push({ a, b, c, d, timer: 5, range: this.bombRange });
        this.activeBombs++;
        return true;
    }

    step() {
        if (this.gameOver) return 'gameover';
        this.stepCount++;
        this.explosions.clear(); // Explosions last 1 tick

        // Tick bombs
        for (let i = this.bombs.length - 1; i >= 0; i--) {
            this.bombs[i].timer--;
            if (this.bombs[i].timer <= 0) {
                this._explode(this.bombs[i]);
                this.bombs.splice(i, 1);
                this.activeBombs--;
            }
        }

        // Move enemies
        for (const enemy of this.enemies) {
            if (!enemy.alive) continue;
            if (this.stepCount % enemy.moveDelay !== 0) continue;
            this._moveEnemy(enemy);
        }

        // Check if player is in explosion
        const pk = GridUtils.key(this.player.a, this.player.b, this.player.c, this.player.d);
        if (this.explosions.has(pk)) {
            this.lives--;
            if (this.lives <= 0) { this.gameOver = true; return 'dead'; }
            this.player = { a: 0, b: 0, c: 0, d: 0 };
            return 'hit';
        }

        // Check if enemies are in explosions
        for (const enemy of this.enemies) {
            if (!enemy.alive) continue;
            if (this.explosions.has(GridUtils.key(enemy.a, enemy.b, enemy.c, enemy.d))) {
                enemy.alive = false;
                this.score += 100;
            }
        }

        // Enemy+player collision
        for (const enemy of this.enemies) {
            if (!enemy.alive) continue;
            if (enemy.a === this.player.a && enemy.b === this.player.b &&
                enemy.c === this.player.c && enemy.d === this.player.d) {
                this.lives--;
                if (this.lives <= 0) { this.gameOver = true; return 'dead'; }
                this.player = { a: 0, b: 0, c: 0, d: 0 };
                return 'hit';
            }
        }

        // Level clear — all enemies dead
        if (this.enemies.length > 0 && this.enemies.every(e => !e.alive)) {
            this.level++;
            this.score += 200;
            this._generateLevel();
            return 'level_clear';
        }

        return 'play';
    }

    /** Move enemy semi-randomly along IVM directions using GridUtils.shuffle(). */
    _moveEnemy(enemy) {
        const dirs = [...BombermanBoard.DIRECTIONS];
        GridUtils.shuffle(dirs);
        for (const dir of dirs) {
            const na = enemy.a + dir.da;
            const nb = enemy.b + dir.db;
            const nc = enemy.c + dir.dc;
            const nd = enemy.d + dir.dd;
            if (!this.inBounds(na, nb, nc, nd)) continue;
            const nk = GridUtils.key(na, nb, nc, nd);
            if (this.grid.has(nk)) continue; // Can't walk through walls
            if (this.explosions.has(nk)) continue; // Avoid explosions
            enemy.a = na; enemy.b = nb; enemy.c = nc; enemy.d = nd;
            return;
        }
    }

    /** Explode along 8 IVM directions. */
    _explode(bomb) {
        const center = GridUtils.key(bomb.a, bomb.b, bomb.c, bomb.d);
        this.explosions.add(center);

        for (const dir of BombermanBoard.DIRECTIONS) {
            for (let i = 1; i <= bomb.range; i++) {
                const ea = bomb.a + dir.da * i;
                const eb = bomb.b + dir.db * i;
                const ec = bomb.c + dir.dc * i;
                const ed = bomb.d + dir.dd * i;
                if (!this.inBounds(ea, eb, ec, ed)) break;

                const ek = GridUtils.key(ea, eb, ec, ed);
                const cellData = this.grid.get(ek);

                if (cellData && cellData.type === 'wall') break; // Stop at indestructible wall

                if (cellData && cellData.type === 'destructible') {
                    const parity = Quadray.cellType(ea, eb, ec, ed);
                    if (Math.random() < 0.3) {
                        this.grid.set(ek, { type: 'powerup', quadray: new Quadray(ea, eb, ec, ed), cellType: parity });
                    } else {
                        this.grid.delete(ek);
                    }
                    this.score += 10;
                    this.explosions.add(ek);
                    break; // Stop after destroying wall
                }

                this.explosions.add(ek);
            }
        }
    }

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

    /** Full reset. */
    reset() {
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameOver = false;
        this.bombRange = 2;
        this.maxBombs = 1;
        this.activeBombs = 0;
        this.stepCount = 0;
        this.player = { a: 0, b: 0, c: 0, d: 0 };
        this._generateLevel();
    }

    /**
     * Get all entities for rendering.
     * Each entity includes Quadray, cellType, Cartesian coordinates.
     * @returns {Array<Object>}
     */
    getEntities() {
        const entities = [];
        // Grid cells
        for (const [k, cellData] of this.grid) {
            const q = cellData.quadray;
            const cartesian = q.toCartesian();
            const distFromOrigin = q.distanceTo(Quadray.ORIGIN);
            const color = cellData.type === 'wall' ? '#475569'
                : cellData.type === 'destructible' ? '#92400e'
                : '#22d3ee';
            entities.push({
                a: q.a, b: q.b, c: q.c, d: q.d,
                type: cellData.type,
                color,
                quadray: q,
                cellType: cellData.cellType,
                cartesian,
                distFromOrigin,
            });
        }
        // Explosions
        for (const ek of this.explosions) {
            const parsed = GridUtils.parseKey(ek);
            const q = new Quadray(parsed.a, parsed.b, parsed.c, parsed.d);
            const parity = Quadray.cellType(parsed.a, parsed.b, parsed.c, parsed.d);
            entities.push({
                a: parsed.a, b: parsed.b, c: parsed.c, d: parsed.d,
                type: 'explosion', color: '#f97316',
                quadray: q,
                cellType: parity,
                cartesian: q.toCartesian(),
                distFromOrigin: q.distanceTo(Quadray.ORIGIN),
            });
        }
        // Bombs
        for (const bomb of this.bombs) {
            const q = new Quadray(bomb.a, bomb.b, bomb.c, bomb.d);
            const parity = Quadray.cellType(bomb.a, bomb.b, bomb.c, bomb.d);
            entities.push({
                a: bomb.a, b: bomb.b, c: bomb.c, d: bomb.d,
                type: 'bomb', color: '#1e293b', timer: bomb.timer,
                quadray: q,
                cellType: parity,
                cartesian: q.toCartesian(),
                distFromOrigin: q.distanceTo(Quadray.ORIGIN),
            });
        }
        // Enemies
        for (const enemy of this.enemies) {
            if (!enemy.alive) continue;
            const q = new Quadray(enemy.a, enemy.b, enemy.c, enemy.d);
            const parity = Quadray.cellType(enemy.a, enemy.b, enemy.c, enemy.d);
            entities.push({
                a: enemy.a, b: enemy.b, c: enemy.c, d: enemy.d,
                type: 'enemy', color: '#dc2626',
                quadray: q,
                cellType: parity,
                cartesian: q.toCartesian(),
                distFromOrigin: q.distanceTo(Quadray.ORIGIN),
            });
        }
        // Player
        const pq = new Quadray(this.player.a, this.player.b, this.player.c, this.player.d);
        const pParity = Quadray.cellType(this.player.a, this.player.b, this.player.c, this.player.d);
        entities.push({
            a: this.player.a, b: this.player.b, c: this.player.c, d: this.player.d,
            type: 'player', color: '#3b82f6',
            quadray: pq,
            cellType: pParity,
            cartesian: pq.toCartesian(),
            distFromOrigin: pq.distanceTo(Quadray.ORIGIN),
        });
        return entities;
    }

    /**
     * Get board metadata for HUD display.
     * @returns {Object}
     */
    getMetadata() {
        let tetraCount = 0, octaCount = 0;
        for (const [, cellData] of this.grid) {
            if (cellData.cellType === 'tetra') tetraCount++;
            else octaCount++;
        }
        const aliveEnemies = this.enemies.filter(e => e.alive).length;
        return {
            stepCount: this.stepCount,
            score: this.score,
            lives: this.lives,
            level: this.level,
            gameOver: this.gameOver,
            bombRange: this.bombRange,
            aliveEnemies,
            tetraCount,
            octaCount,
            volumeRatios: this.volumeRatios,
            cellVolume: this.cellVolumeUnit,
            s3: this.s3Constant,
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BombermanBoard };
}
