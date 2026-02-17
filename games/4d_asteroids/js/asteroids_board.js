/**
 * asteroids_board.js — 4D Asteroids in Quadray/IVM Space
 *
 * Ship, asteroids, and bullets move continuously in 4D with wrap-around.
 * Deeply integrated with all Quadray/IVM shared modules:
 *   - Quadray: toKey, normalized, add, subtract, equals, distance,
 *              distanceTo, length, scale, toIVM, cellType, cellVolume,
 *              toCartesian, fromCartesian, clone, IVM_DIRECTIONS, BASIS
 *   - GridUtils: key, parseKey, neighbors, boundedNeighbors, inBounds,
 *                manhattan, euclidean, generateGrid, depthSort, shuffle
 *   - SYNERGETICS: constants, volume ratios
 *   - verifyRoundTrip, verifyGeometricIdentities, angleBetweenQuadrays
 *
 * @module AsteroidsBoard
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

/**
 * Entity in 4D Quadray space.
 */
class AsteroidsEntity {
    /**
     * @param {number[]} pos - [a,b,c,d] position
     * @param {number[]} vel - [a,b,c,d] velocity
     * @param {number} radius - Collision radius
     * @param {string} type - 'ship' | 'asteroid' | 'bullet'
     */
    constructor(pos, vel, radius, type) {
        this.pos = { a: pos[0], b: pos[1], c: pos[2], d: pos[3] };
        this.vel = { a: vel[0], b: vel[1], c: vel[2], d: vel[3] };
        this.radius = radius;
        this.type = type;
        this.alive = true;
        this.age = 0;
    }

    /**
     * Update position based on velocity and wrap around hypercube.
     * @param {number} dt - Time delta
     * @param {number} size - World size
     */
    update(dt, size) {
        this.pos.a += this.vel.a * dt;
        this.pos.b += this.vel.b * dt;
        this.pos.c += this.vel.c * dt;
        this.pos.d += this.vel.d * dt;

        // Wrap coords to [0, size)
        for (const k of ['a', 'b', 'c', 'd']) {
            this.pos[k] = ((this.pos[k] % size) + size) % size;
        }
        this.age += dt;
    }

    /**
     * Quadray distance to another entity using Quadray.distance().
     * @param {AsteroidsEntity} other
     * @returns {number} Distance
     */
    distTo(other) {
        return Quadray.distance(this.toQuadray(), other.toQuadray());
    }

    /**
     * GridUtils-based Euclidean distance to another entity.
     * @param {AsteroidsEntity} other
     * @returns {number} Distance
     */
    euclideanDistTo(other) {
        return GridUtils.euclidean(this.pos, other.pos);
    }

    /**
     * GridUtils-based Manhattan distance to another entity.
     * @param {AsteroidsEntity} other
     * @returns {number} Distance
     */
    manhattanDistTo(other) {
        return GridUtils.manhattan(this.pos, other.pos);
    }

    /** Get a GridUtils-compatible string key for this entity's position. */
    posKey() {
        return GridUtils.key(
            Math.round(this.pos.a), Math.round(this.pos.b),
            Math.round(this.pos.c), Math.round(this.pos.d)
        );
    }

    /** Helper to get Quadray object. */
    toQuadray() {
        return new Quadray(this.pos.a, this.pos.b, this.pos.c, this.pos.d);
    }
}

/**
 * Game state manager for 4D Asteroids.
 */
class AsteroidsBoard {
    /**
     * @param {number} size - World hypercube size (0 to size per axis)
     */
    constructor(size = 8) {
        this.size = size;
        this.entities = [];
        this.score = 0;
        this.lives = 3;
        this.gameOver = false;
        this.grid = new Map();  // Optional spatial index for nearby lookups

        // Synergetics metadata
        this.volumeRatios = {
            tetra: SYNERGETICS?.TETRA_VOL ?? 1,
            octa: SYNERGETICS?.OCTA_VOL ?? 4,
            cubo: SYNERGETICS?.CUBO_VOL ?? 20,
        };
        this.cellVolumeUnit = (typeof Quadray !== 'undefined' && Quadray.cellVolume)
            ? Quadray.cellVolume() : 1;
        this.s3Constant = SYNERGETICS?.S3 ?? 1.0607;

        // Integrity check — verify round-trip on corner positions
        this._verifyIntegrity();

        this.spawnShip();
        this.spawnAsteroids(6);

        console.log(`[AsteroidsBoard] ${size}^4 IVM world`);
        console.log(`[AsteroidsBoard] Cell volume: ${this.cellVolumeUnit}, S3: ${this.s3Constant}`);
        console.log(`[AsteroidsBoard] Volume ratios T:O:C = ${this.volumeRatios.tetra}:${this.volumeRatios.octa}:${this.volumeRatios.cubo}`);
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
                console.warn(`[AsteroidsBoard] Round-trip failed for ${corner.toString()}: error=${result.error.toFixed(6)}`);
                allPassed = false;
            }
        }
        if (allPassed) console.log('[AsteroidsBoard] Round-trip integrity verified on corner positions');
    }

    /**
     * Check if coordinates are within the world bounds.
     * @param {Quadray} q
     * @returns {boolean}
     */
    inBounds(q) {
        return q.a >= 0 && q.a < this.size &&
            q.b >= 0 && q.b < this.size &&
            q.c >= 0 && q.c < this.size &&
            q.d >= 0 && q.d < this.size;
    }

    /**
     * Get cell data at a Quadray position (spatial index).
     * @param {Quadray} q
     * @returns {Object|null}
     */
    getCell(q) {
        const key = GridUtils.key(
            Math.round(q.a), Math.round(q.b),
            Math.round(q.c), Math.round(q.d)
        );
        return this.grid.get(key) || null;
    }

    /**
     * Set cell data at a Quadray position (spatial index).
     * @param {Quadray} q
     * @param {*} value
     */
    setCell(q, value) {
        const key = GridUtils.key(
            Math.round(q.a), Math.round(q.b),
            Math.round(q.c), Math.round(q.d)
        );
        this.grid.set(key, value);
    }

    /**
     * Get IVM neighbors of a position within world bounds.
     * Uses GridUtils.boundedNeighbors().
     * @param {Quadray} q
     * @returns {Array<{a:number, b:number, c:number, d:number}>}
     */
    getNeighbors(q) {
        return GridUtils.boundedNeighbors(
            Math.round(q.a), Math.round(q.b),
            Math.round(q.c), Math.round(q.d),
            this.size
        );
    }

    /**
     * Get board metadata for HUD display.
     * @returns {Object}
     */
    getMetadata() {
        const asteroids = this.entities.filter(e => e.type === 'asteroid' && e.alive);
        const bullets = this.entities.filter(e => e.type === 'bullet' && e.alive);
        const ship = this.entities.find(e => e.type === 'ship');

        let nearestDist = Infinity;
        if (ship && ship.alive && asteroids.length > 0) {
            const sq = ship.toQuadray();
            for (const a of asteroids) {
                nearestDist = Math.min(nearestDist, Quadray.distance(sq, a.toQuadray()));
            }
        }

        return {
            score: this.score,
            lives: this.lives,
            gameOver: this.gameOver,
            asteroidCount: asteroids.length,
            bulletCount: bullets.length,
            entityCount: this.entities.filter(e => e.alive).length,
            nearestAsteroid: nearestDist === Infinity ? null : nearestDist,
            fieldTetravolume: asteroids.length * this.s3Constant,
            volumeRatios: this.volumeRatios,
            cellVolume: this.cellVolumeUnit,
            s3: this.s3Constant,
            worldSize: this.size,
        };
    }

    spawnShip() {
        const h = this.size / 2;
        this.ship = new AsteroidsEntity([h, h, h, h], [0, 0, 0, 0], 0.3, 'ship');
        this.entities.push(this.ship);
    }

    spawnAsteroids(n) {
        for (let i = 0; i < n; i++) {
            const r = () => Math.random() * this.size;
            const v = () => (Math.random() - 0.5) * 1.5;
            this.entities.push(new AsteroidsEntity(
                [r(), r(), r(), r()],
                [v(), v(), v(), v()],
                0.4 + Math.random() * 0.3,
                'asteroid'
            ));
        }
    }

    shoot(dir) {
        if (this.gameOver || !this.ship.alive) return;
        const speed = 4;
        const vel = [
            this.ship.vel.a + dir[0] * speed,
            this.ship.vel.b + dir[1] * speed,
            this.ship.vel.c + dir[2] * speed,
            this.ship.vel.d + dir[3] * speed
        ];
        // Spawn slightly ahead to avoid self-collision
        const bullet = new AsteroidsEntity(
            [
                this.ship.pos.a + dir[0] * 0.4,
                this.ship.pos.b + dir[1] * 0.4,
                this.ship.pos.c + dir[2] * 0.4,
                this.ship.pos.d + dir[3] * 0.4
            ],
            vel,
            0.1,
            'bullet'
        );
        this.entities.push(bullet);
    }

    thrust(dir, amount = 0.3) {
        if (!this.ship.alive) return;
        this.ship.vel.a += dir[0] * amount;
        this.ship.vel.b += dir[1] * amount;
        this.ship.vel.c += dir[2] * amount;
        this.ship.vel.d += dir[3] * amount;

        // Cap speed
        const maxSpeed = 2.0;
        const speed = Math.sqrt(
            this.ship.vel.a ** 2 + this.ship.vel.b ** 2 +
            this.ship.vel.c ** 2 + this.ship.vel.d ** 2
        );
        if (speed > maxSpeed) {
            const scale = maxSpeed / speed;
            this.ship.vel.a *= scale;
            this.ship.vel.b *= scale;
            this.ship.vel.c *= scale;
            this.ship.vel.d *= scale;
        }
    }

    update(dt) {
        if (this.gameOver) return;

        // Physics update
        for (const e of this.entities) {
            if (e.alive) e.update(dt, this.size);
        }

        // Bullets expire
        for (const e of this.entities) {
            if (e.type === 'bullet' && e.age > 2) e.alive = false;
        }

        const bullets = this.entities.filter(e => e.type === 'bullet' && e.alive);
        const asteroids = this.entities.filter(e => e.type === 'asteroid' && e.alive);

        // Collision: bullet vs asteroid (using Quadray.distance)
        for (const b of bullets) {
            if (!b.alive) continue;
            for (const a of asteroids) {
                if (!a.alive) continue;
                if (b.distTo(a) < a.radius + b.radius) {
                    b.alive = false;
                    a.alive = false;
                    this.score += 100;

                    // Split asteroid
                    if (a.radius > 0.3) {
                        for (let i = 0; i < 2; i++) {
                            const v = () => (Math.random() - 0.5) * 2;
                            this.entities.push(new AsteroidsEntity(
                                [a.pos.a, a.pos.b, a.pos.c, a.pos.d],
                                [v(), v(), v(), v()],
                                a.radius * 0.6,
                                'asteroid'
                            ));
                        }
                    }
                    break; // Bullet hits one asteroid max
                }
            }
        }

        // Collision: ship vs asteroid
        if (this.ship.alive) {
            for (const a of asteroids) {
                if (!a.alive) continue;
                if (this.ship.distTo(a) < a.radius + this.ship.radius) {
                    this.ship.alive = false;
                    this.lives--;
                    if (this.lives > 0) {
                        setTimeout(() => this.respawnShip(), 1500);
                    } else {
                        this.gameOver = true;
                    }
                    break;
                }
            }
        }

        // Cleanup dead — only filter if list gets too big
        if (this.entities.length > 50) {
            this.entities = this.entities.filter(e => e.alive);
        }

        // Respawn asteroids if cleared
        if (this.entities.filter(e => e.type === 'asteroid' && e.alive).length === 0) {
            this.spawnAsteroids(6 + Math.floor(this.score / 1000));
        }
    }

    respawnShip() {
        this.ship.alive = true;
        this.ship.pos = { a: this.size / 2, b: this.size / 2, c: this.size / 2, d: this.size / 2 };
        this.ship.vel = { a: 0, b: 0, c: 0, d: 0 };
    }

    /** Reset board to initial state. */
    reset() {
        this.entities = [];
        this.score = 0;
        this.lives = 3;
        this.gameOver = false;
        this.grid = new Map();
        this.spawnShip();
        this.spawnAsteroids(6);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AsteroidsBoard, AsteroidsEntity };
}
