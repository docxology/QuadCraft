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

// Resolve roundoff at elapsed-time boundaries without dropping timer remainders.
const ASTEROIDS_TIME_EPSILON = 64 * Number.EPSILON;

// Unscaled Cartesian coordinates: physical squared lengths are half their
// squared lengths here. Raw size-periods map to size * (x,y,z), where x,y,z
// are integers of common parity (the BCC lattice), not independent raw minima.
function asteroidsCartesian(q) {
    const ab = q.a - q.b;
    const cd = q.c - q.d;
    return [ab - cd, ab + cd, (q.a - q.c) + (q.b - q.d)];
}

function asteroidsPeriodicDistance(first, second, size) {
    const r = asteroidsCartesian({
        a: first.a - second.a, b: first.b - second.b,
        c: first.c - second.c, d: first.d - second.d,
    });
    let nearest = Infinity;
    // Each parity class is an orthogonal grid; its nearest point is obtained
    // independently per Cartesian axis. Compare both classes.
    for (let parity = 0; parity < 2; parity++) {
        const offset = r.map(x => x - size * (parity + 2 * Math.round((x / size - parity) / 2)));
        nearest = Math.min(nearest, Math.hypot(...offset) / Math.SQRT2);
    }
    return nearest;
}

function asteroidsImpactTime(first, second, duration, size) {
    const r = asteroidsCartesian({
        a: first.pos.a - second.pos.a, b: first.pos.b - second.pos.b,
        c: first.pos.c - second.pos.c, d: first.pos.d - second.pos.d,
    });
    const v = asteroidsCartesian({
        a: first.vel.a - second.vel.a, b: first.vel.b - second.vel.b,
        c: first.vel.c - second.vel.c, d: first.vel.d - second.vel.d,
    });
    const radius = (first.radius + second.radius) * Math.SQRT2;
    const radiusSquared = radius * radius;
    const speedSquared = v[0] ** 2 + v[1] ** 2 + v[2] ** 2;
    // Include floating-point boundary contacts in the candidate box.
    const padding = r.map((x, i) => 32 * Number.EPSILON * Math.max(1, Math.abs(x), Math.abs(v[i] * duration), radius));
    const lo = r.map((x, i) => Math.ceil((Math.min(x, x + v[i] * duration) - radius - padding[i]) / size));
    const hi = r.map((x, i) => Math.floor((Math.max(x, x + v[i] * duration) + radius + padding[i]) / size));
    let earliest = null;
    // Only images in the swept segment's radius-expanded AABB can intersect.
    // Enumerate every such BCC image, including long multi-period trajectories.
    for (let parity = 0; parity < 2; parity++) {
        const start = lo.map(x => parity + 2 * Math.ceil((x - parity) / 2));
        for (let x = start[0]; x <= hi[0]; x += 2) {
            for (let y = start[1]; y <= hi[1]; y += 2) {
                for (let z = start[2]; z <= hi[2]; z += 2) {
                    const c = [r[0] - size * x, r[1] - size * y, r[2] - size * z];
                    const distanceSquared = c[0] ** 2 + c[1] ** 2 + c[2] ** 2;
                    if (distanceSquared <= radiusSquared + 32 * Number.EPSILON * Math.max(distanceSquared, radiusSquared)) return 0;
                    if (speedSquared === 0) continue;
                    const dot = c[0] * v[0] + c[1] * v[1] + c[2] * v[2];
                    if (dot >= 0) continue;
                    const closest = -dot / speedSquared;
                    const perpendicularSquared = (c[0] + closest * v[0]) ** 2 +
                        (c[1] + closest * v[1]) ** 2 + (c[2] + closest * v[2]) ** 2;
                    const gap = radiusSquared - perpendicularSquared;
                    if (gap < -32 * Number.EPSILON * Math.max(radiusSquared, perpendicularSquared)) continue;
                    // Stable entering root, avoiding subtraction of two almost
                    // equal roots when a trajectory starts near the sphere.
                    const time = (distanceSquared - radiusSquared) /
                        (-dot + Math.sqrt(speedSquared * Math.max(0, gap)));
                    if (time <= duration + ASTEROIDS_TIME_EPSILON) {
                        const impact = Math.min(time, duration);
                        if (earliest === null || impact < earliest) earliest = impact;
                    }
                }
            }
        }
    }
    return earliest;
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
        this.type = type; // 'ship', 'asteroid', 'bullet', 'ufo', 'ufo_bullet'
        this.alive = true;
        this.age = 0;

        // Custom properties for specific types
        this.timer = 0;
        this.ufoType = 'large'; // 'large' or 'small'
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
class AsteroidsBoard extends BaseBoard {
    /**
     * @param {number} size - World hypercube size (0 to size per axis)
     */
    constructor(size = 8, options = {}) {
        super(size, { name: 'AsteroidsBoard', verify: false });
        this.size = size;
        this.seed = (options.seed ?? Math.floor(Math.random() * 0x100000000)) >>> 0;
        this.rng = GridUtils.createSeededRng(this.seed);
        this.respawnTimer = null;
        this.entities = [];
        this.particles = []; // Particle system events for the renderer to consume
        this.score = 0;
        this.lives = 3;
        this.gameOver = false;
        this.grid = new Map();  // Optional spatial index for nearby lookups

        this.ufoTimer = 0; // Time until next UFO spawn

        // Shield system
        this.shieldCharges = 3;
        this.shieldActive = false;
        this.shieldTimer = 0;    // Remaining shield duration
        this.shieldCooldown = 0; // Cooldown before next use

        // Wave tracking
        this.wave = 1;
        this.waveBaseAsteroids = 6;

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
        const bullets = this.entities.filter(e => (e.type === 'bullet' || e.type === 'ufo_bullet') && e.alive);
        const ship = this.entities.find(e => e.type === 'ship');
        const ufos = this.entities.filter(e => e.type === 'ufo' && e.alive);

        let nearestDist = Infinity;
        if (ship && ship.alive && asteroids.length > 0) {
            for (const a of asteroids) {
                nearestDist = Math.min(nearestDist, this.distanceBetween(ship.pos, a.pos));
            }
        }

        return {
            score: this.score,
            lives: this.lives,
            gameOver: this.gameOver,
            wave: this.wave,
            shieldCharges: this.shieldCharges,
            shieldActive: this.shieldActive,
            asteroidCount: asteroids.length,
            bulletCount: bullets.length,
            ufoCount: ufos.length,
            entityCount: this.entities.filter(e => e.alive).length,
            nearestAsteroid: nearestDist === Infinity ? null : nearestDist,
            fieldTetravolume: asteroids.length * this.s3Constant,
            volumeRatios: this.volumeRatios,
            cellVolume: this.cellVolumeUnit,
            s3: this.s3Constant,
            worldSize: this.size,
        };
    }

    /** Physical distance on the periodic raw world, including all BCC images. */
    distanceBetween(first, second) {
        return asteroidsPeriodicDistance(first, second, this.size);
    }

    spawnShip() {
        const h = this.size / 2;
        this.ship = new AsteroidsEntity([h, h, h, h], [0, 0, 0, 0], 0.3, 'ship');
        this.entities.push(this.ship);
    }

    spawnAsteroids(n) {
        for (let i = 0; i < n; i++) {
            const r = () => this.rng() * this.size;
            const v = () => (this.rng() - 0.5) * 1.5;
            this.entities.push(new AsteroidsEntity(
                [r(), r(), r(), r()],
                [v(), v(), v(), v()],
                0.4 + this.rng() * 0.3,
                'asteroid'
            ));
        }
    }

    spawnUFO() {
        const ufoType = this.score > 3000 ? (this.rng() > 0.5 ? 'small' : 'large') : 'large';
        const r = () => this.rng() * this.size;

        // Spawn far from ship
        let pos = [r(), r(), r(), r()];
        if (this.ship && this.ship.alive) {
            pos = [r(), r(), r(), r()];
            // Just ensure it's not right on top of the player
            if (this.distanceBetween(this.ship.pos, { a: pos[0], b: pos[1], c: pos[2], d: pos[3] }) < 2.0) {
                pos[0] = (pos[0] + this.size / 2) % this.size;
            }
        }

        const speed = ufoType === 'small' ? 1.5 : 0.8;
        const v = () => (this.rng() - 0.5) * speed;

        const ufo = new AsteroidsEntity(pos, [v(), v(), v(), v()], ufoType === 'small' ? 0.3 : 0.5, 'ufo');
        ufo.ufoType = ufoType;
        ufo.timer = 0; // Shoot timer
        this.entities.push(ufo);
        console.log(`[AsteroidsBoard] Spawned ${ufoType} UFO`);
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

    ufoShoot(ufo) {
        const speed = 3;
        let dir = [0, 0, 0, 0];

        if (ufo.ufoType === 'small' && this.ship && this.ship.alive) {
            // Target player
            const dx = this.ship.pos.a - ufo.pos.a;
            const dy = this.ship.pos.b - ufo.pos.b;
            const dz = this.ship.pos.c - ufo.pos.c;
            const dw = this.ship.pos.d - ufo.pos.d;

            // Very naive normalization for 4D vector towards player
            const mag = Math.sqrt(dx * dx + dy * dy + dz * dz + dw * dw);
            if (mag > 0) {
                dir = [dx / mag, dy / mag, dz / mag, dw / mag];
            } else {
                dir = [1, 0, 0, 0];
            }

            // Add a little inaccuracy
            dir[0] += (this.rng() - 0.5) * 0.2;
            dir[1] += (this.rng() - 0.5) * 0.2;
            dir[2] += (this.rng() - 0.5) * 0.2;
            dir[3] += (this.rng() - 0.5) * 0.2;
        } else {
            // Random direction
            dir = [this.rng() - 0.5, this.rng() - 0.5, this.rng() - 0.5, this.rng() - 0.5];
        }

        const vel = [
            ufo.vel.a + dir[0] * speed,
            ufo.vel.b + dir[1] * speed,
            ufo.vel.c + dir[2] * speed,
            ufo.vel.d + dir[3] * speed
        ];

        const bullet = new AsteroidsEntity(
            [ufo.pos.a, ufo.pos.b, ufo.pos.c, ufo.pos.d],
            vel,
            0.1,
            'ufo_bullet'
        );
        this.entities.push(bullet);
    }

    thrust(dir, amount = 0.3) {
        if (this.gameOver || !this.ship.alive) return;
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

    hyperspace() {
        if (!this.ship.alive || this.gameOver) return;

        // Push particle effect for disappearing
        this.particles.push({ type: 'hyperspace_out', pos: { ...this.ship.pos } });

        // 1 in 6 chance of death
        if (this.rng() < 1 / 6) {
            console.log("[AsteroidsBoard] Hyperspace malfunction! Ship destroyed.");
            this.killShip();
            return;
        }

        // Teleport to random location
        const r = () => this.rng() * this.size;
        this.ship.pos = { a: r(), b: r(), c: r(), d: r() };
        this.ship.vel = { a: 0, b: 0, c: 0, d: 0 }; // Stop momentum

        // Push particle effect for reappearing
        this.particles.push({ type: 'hyperspace_in', pos: { ...this.ship.pos } });
    }

    update(dt) {
        if (this.gameOver || dt <= 0) return;
        let remaining = dt;
        // Preserve the arcade rule of at most one ship contact response per tick.
        let shipContactHandled = false;
        while (remaining > 0 && !this.gameOver) {
            this._processTimers();
            const horizon = this._nextTimer(remaining);
            const collision = this._firstCollision(horizon, shipContactHandled);
            const elapsed = collision ? collision.time : horizon;
            this._advance(elapsed);
            remaining = Math.max(0, remaining - elapsed);
            if (collision) {
                if (collision.first.type === 'ship') {
                    shipContactHandled = true;
                    this._hitShip(collision.second);
                } else {
                    this._hitTarget(collision.first, collision.second);
                }
            }
        }
        if (this.gameOver) return;
        this._processTimers();
        // Keep the dead ship owned by the world until its simulation-time respawn.
        this.entities = this.entities.filter(e => e.alive || e === this.ship);
        if (!this.entities.some(e => e.type === 'asteroid' && e.alive)) {
            this.wave++;
            this.spawnAsteroids(this.waveBaseAsteroids + Math.floor(this.score / 1000));
        }
    }

    _nextTimer(duration) {
        let next = duration;
        if (this.respawnTimer !== null) next = Math.min(next, this.respawnTimer);
        if (this.shieldActive) next = Math.min(next, this.shieldTimer);
        const ufos = this.entities.filter(e => e.alive && e.type === 'ufo');
        if (ufos.length === 0 && this.score > 500) next = Math.min(next, this.ufoTimer);
        for (const e of this.entities) {
            if (!e.alive) continue;
            if (e.type === 'bullet' || e.type === 'ufo_bullet') next = Math.min(next, 2 - e.age);
            if (e.type === 'ufo') {
                next = Math.min(next, 15 - e.age, (e.ufoType === 'large' ? 2 : 1.5) - e.timer);
            }
        }
        return Math.max(0, next);
    }

    _advance(dt) {
        for (const e of this.entities) {
            if (!e.alive) continue;
            e.update(dt, this.size);
            if (e.type === 'ufo') e.timer += dt;
        }
        this.ufoTimer = Math.max(0, this.ufoTimer - dt);
        if (this.respawnTimer !== null) this.respawnTimer = Math.max(0, this.respawnTimer - dt);
        if (this.shieldActive) this.shieldTimer = Math.max(0, this.shieldTimer - dt);
        this.shieldCooldown = Math.max(0, this.shieldCooldown - dt);
    }

    _processTimers() {
        if (this.respawnTimer !== null && this.respawnTimer <= ASTEROIDS_TIME_EPSILON) this.respawnShip();
        if (this.shieldActive && this.shieldTimer <= ASTEROIDS_TIME_EPSILON) this.shieldActive = false;
        for (const e of this.entities) {
            if (!e.alive) continue;
            if (((e.type === 'bullet' || e.type === 'ufo_bullet') && e.age >= 2 - ASTEROIDS_TIME_EPSILON) ||
                (e.type === 'ufo' && e.age >= 15 - ASTEROIDS_TIME_EPSILON)) {
                e.alive = false;
                continue;
            }
            if (e.type === 'ufo') {
                const fireRate = e.ufoType === 'large' ? 2 : 1.5;
                while (e.timer >= fireRate - ASTEROIDS_TIME_EPSILON) {
                    e.timer = Math.max(0, e.timer - fireRate);
                    this.ufoShoot(e);
                }
            }
        }
        if (this.ufoTimer <= ASTEROIDS_TIME_EPSILON && this.score > 500 &&
            !this.entities.some(e => e.type === 'ufo' && e.alive)) {
            this.spawnUFO();
            this.ufoTimer += 15 + this.rng() * 15;
        }
    }

    _firstCollision(duration, shipContactHandled) {
        let first = null;
        const consider = (a, b) => {
            const time = asteroidsImpactTime(a, b, duration, this.size);
            if (time !== null && (first === null || time < first.time)) first = { first: a, second: b, time };
        };
        for (const bullet of this.entities) {
            if (!bullet.alive || bullet.type !== 'bullet') continue;
            for (const target of this.entities) {
                if (target.alive && (target.type === 'asteroid' || target.type === 'ufo')) consider(bullet, target);
            }
        }
        if (this.ship.alive && !shipContactHandled) {
            for (const target of this.entities) {
                if (target.alive && (target.type === 'asteroid' || target.type === 'ufo' ||
                    target.type === 'ufo_bullet')) consider(this.ship, target);
            }
        }
        return first;
    }

    _hitTarget(bullet, target) {
        bullet.alive = false;
        target.alive = false;
        this.score += target.type === 'ufo' ? (target.ufoType === 'small' ? 1000 : 200) : 100;
        this.particles.push({
            type: 'explosion', pos: { ...target.pos }, radius: target.radius,
            color: target.type === 'ufo' ? '#ff4444' : '#aa8866',
        });
        if (target.type === 'asteroid' && target.radius > 0.3) {
            for (let i = 0; i < 2; i++) {
                const v = () => (this.rng() - 0.5) * 2;
                this.entities.push(new AsteroidsEntity(
                    [target.pos.a, target.pos.b, target.pos.c, target.pos.d],
                    [v(), v(), v(), v()], target.radius * 0.6, 'asteroid'
                ));
            }
        }
    }

    _hitShip(target) {
        if (target.type === 'ufo_bullet') target.alive = false;
        if (this.shieldActive) {
            this.shieldActive = false;
            this.shieldTimer = 0;
            this.particles.push({ type: 'explosion', pos: { ...this.ship.pos }, radius: 1.5, color: '#00aaff' });
            if (target.type === 'asteroid') target.alive = false;
        } else {
            this.killShip();
        }
    }

    killShip() {
        if (this.gameOver || !this.ship.alive) return;
        this.ship.alive = false;
        this.lives--;
        this.particles.push({ type: 'explosion', pos: { ...this.ship.pos }, radius: 1.0, color: '#00eeff' });

        if (this.lives > 0) {
            this.respawnTimer = 1.5;
        } else {
            this.gameOver = true;
        }
    }

    respawnShip() {
        if (this.gameOver) return;
        this.respawnTimer = null;
        this.ship.alive = true;
        this.ship.pos = { a: this.size / 2, b: this.size / 2, c: this.size / 2, d: this.size / 2 };
        this.ship.vel = { a: 0, b: 0, c: 0, d: 0 };
        this.ship.age = 0;
        if (!this.entities.includes(this.ship)) this.entities.push(this.ship);
        this.particles.push({ type: 'hyperspace_in', pos: { ...this.ship.pos } });
    }

    /** Activate shield if charges available. */
    activateShield() {
        if (this.gameOver || !this.ship.alive || this.shieldCharges <= 0 || this.shieldActive || this.shieldCooldown > 0) return false;
        this.shieldCharges--;
        this.shieldActive = true;
        this.shieldTimer = 5.0; // 5 seconds
        this.shieldCooldown = 3.0; // 3s cooldown after use
        console.log(`[AsteroidsBoard] Shield activated! ${this.shieldCharges} remaining`);
        return true;
    }

    /** Reset board to initial state. */
    reset() {
        this.rng = GridUtils.createSeededRng(this.seed);
        this.respawnTimer = null;
        this.entities = [];
        this.particles = [];
        this.score = 0;
        this.lives = 3;
        this.gameOver = false;
        this.grid = new Map();
        this.wave = 1;
        this.shieldCharges = 3;
        this.shieldActive = false;
        this.shieldTimer = 0;
        this.shieldCooldown = 0;

        this.ufoTimer = 0;
        this.spawnShip();
        this.spawnAsteroids(this.waveBaseAsteroids);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AsteroidsBoard, AsteroidsEntity };
}
