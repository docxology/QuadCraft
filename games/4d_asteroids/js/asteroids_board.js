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
    constructor(size = 8) {
        super(size, { name: 'AsteroidsBoard', verify: false });
        this.size = size;
        this.entities = [];
        this.particles = []; // Particle system events for the renderer to consume
        this.score = 0;
        this.lives = 3;
        this.gameOver = false;
        this.grid = new Map();  // Optional spatial index for nearby lookups

        this.ufoTimer = 0; // Time until next UFO spawn
        this.nextUfoDelay = 15;

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
            const sq = ship.toQuadray();
            for (const a of asteroids) {
                nearestDist = Math.min(nearestDist, Quadray.distance(sq, a.toQuadray()));
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

    spawnUFO() {
        const ufoType = this.score > 3000 ? (Math.random() > 0.5 ? 'small' : 'large') : 'large';
        const r = () => Math.random() * this.size;

        // Spawn far from ship
        let pos = [r(), r(), r(), r()];
        if (this.ship && this.ship.alive) {
            const shipSq = this.ship.toQuadray();
            pos = [r(), r(), r(), r()];
            // Just ensure it's not right on top of the player
            if (Quadray.distance(shipSq, new Quadray(pos[0], pos[1], pos[2], pos[3])) < 2.0) {
                pos[0] = (pos[0] + this.size / 2) % this.size;
            }
        }

        const speed = ufoType === 'small' ? 1.5 : 0.8;
        const v = () => (Math.random() - 0.5) * speed;

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
            dir[0] += (Math.random() - 0.5) * 0.2;
            dir[1] += (Math.random() - 0.5) * 0.2;
            dir[2] += (Math.random() - 0.5) * 0.2;
            dir[3] += (Math.random() - 0.5) * 0.2;
        } else {
            // Random direction
            dir = [Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5];
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

    hyperspace() {
        if (!this.ship.alive || this.gameOver) return;

        // Push particle effect for disappearing
        this.particles.push({ type: 'hyperspace_out', pos: { ...this.ship.pos } });

        // 1 in 6 chance of death
        if (Math.random() < 1 / 6) {
            console.log("[AsteroidsBoard] Hyperspace malfunction! Ship destroyed.");
            this.killShip();
            return;
        }

        // Teleport to random location
        const r = () => Math.random() * this.size;
        this.ship.pos = { a: r(), b: r(), c: r(), d: r() };
        this.ship.vel = { a: 0, b: 0, c: 0, d: 0 }; // Stop momentum

        // Push particle effect for reappearing
        this.particles.push({ type: 'hyperspace_in', pos: { ...this.ship.pos } });
    }

    update(dt) {
        if (this.gameOver) return;

        // Physics update
        for (const e of this.entities) {
            if (e.alive) {
                e.update(dt, this.size);

                // UFO shooting
                if (e.type === 'ufo') {
                    e.timer += dt;
                    // Large shoots every 2s, Small every 1.5s
                    const fireRate = e.ufoType === 'large' ? 2.0 : 1.5;
                    if (e.timer >= fireRate) {
                        e.timer = 0;
                        this.ufoShoot(e);
                    }
                }
            }
        }

        // Bullets expire
        for (const e of this.entities) {
            if ((e.type === 'bullet' || e.type === 'ufo_bullet') && e.age > 2) e.alive = false;
        }

        // UFOs expire after crossing the screen a few times (approx 15 seconds)
        for (const e of this.entities) {
            if (e.type === 'ufo' && e.age > 15) e.alive = false;
        }

        const bullets = this.entities.filter(e => e.type === 'bullet' && e.alive);
        const ufoBullets = this.entities.filter(e => e.type === 'ufo_bullet' && e.alive);
        const asteroids = this.entities.filter(e => e.type === 'asteroid' && e.alive);
        const ufos = this.entities.filter(e => e.type === 'ufo' && e.alive);

        // UFO Spawning Logic
        this.ufoTimer -= dt;
        if (this.ufoTimer <= 0 && ufos.length === 0 && this.score > 500) {
            this.spawnUFO();
            // Next UFO in 15-30 seconds
            this.ufoTimer = 15 + Math.random() * 15;
        }

        // Collision: bullet vs asteroid (using Quadray.distance)
        // Also check if bullet hits UFO
        for (const b of bullets) {
            if (!b.alive) continue;

            // Vs UFO
            for (const u of ufos) {
                if (!u.alive) continue;
                if (b.distTo(u) < u.radius + b.radius) {
                    b.alive = false;
                    u.alive = false;
                    this.score += (u.ufoType === 'small' ? 1000 : 200);
                    this.particles.push({ type: 'explosion', pos: { ...u.pos }, radius: u.radius, color: '#ff4444' });
                    break;
                }
            }
            if (!b.alive) continue;

            // Vs Asteroid
            for (const a of asteroids) {
                if (!a.alive) continue;
                if (b.distTo(a) < a.radius + b.radius) {
                    b.alive = false;
                    a.alive = false;
                    this.score += 100;

                    this.particles.push({ type: 'explosion', pos: { ...a.pos }, radius: a.radius, color: '#aa8866' });

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

        // Update shield
        if (this.shieldActive) {
            this.shieldTimer -= dt;
            if (this.shieldTimer <= 0) {
                this.shieldActive = false;
                console.log('[AsteroidsBoard] Shield expired');
            }
        }
        if (this.shieldCooldown > 0) this.shieldCooldown -= dt;

        // Collision: ship vs asteroid, UFO, and UFO bullets
        if (this.ship.alive) {
            let hit = false;
            let hitEntity = null;

            for (const a of asteroids) {
                if (!a.alive) continue;
                if (this.ship.distTo(a) < a.radius + this.ship.radius) {
                    hit = true; hitEntity = a; break;
                }
            }
            if (!hit) {
                for (const u of ufos) {
                    if (!u.alive) continue;
                    if (this.ship.distTo(u) < u.radius + this.ship.radius) {
                        hit = true; hitEntity = u; break;
                    }
                }
            }
            if (!hit) {
                for (const ub of ufoBullets) {
                    if (!ub.alive) continue;
                    if (this.ship.distTo(ub) < ub.radius + this.ship.radius) {
                        hit = true; ub.alive = false; hitEntity = ub; break;
                    }
                }
            }

            if (hit) {
                if (this.shieldActive) {
                    // Shield absorbs the hit
                    this.shieldActive = false;
                    this.shieldTimer = 0;
                    this.particles.push({ type: 'explosion', pos: { ...this.ship.pos }, radius: 1.5, color: '#00aaff' });
                    console.log('[AsteroidsBoard] Shield absorbed hit!');
                    if (hitEntity && hitEntity.type === 'asteroid') hitEntity.alive = false;
                } else {
                    this.killShip();
                }
            }
        }

        // Cleanup dead — only filter if list gets too big
        if (this.entities.length > 50) {
            this.entities = this.entities.filter(e => e.alive);
        }

        // Respawn asteroids if cleared — advance wave
        if (this.entities.filter(e => e.type === 'asteroid' && e.alive).length === 0) {
            this.wave++;
            const count = this.waveBaseAsteroids + Math.floor(this.score / 1000);
            this.spawnAsteroids(count);
            console.log(`[AsteroidsBoard] Wave ${this.wave} — ${count} asteroids`);
        }
    }

    killShip() {
        this.ship.alive = false;
        this.lives--;
        this.particles.push({ type: 'explosion', pos: { ...this.ship.pos }, radius: 1.0, color: '#00eeff' });

        if (this.lives > 0) {
            setTimeout(() => this.respawnShip(), 1500);
        } else {
            this.gameOver = true;
        }
    }

    respawnShip() {
        this.ship.alive = true;
        this.ship.pos = { a: this.size / 2, b: this.size / 2, c: this.size / 2, d: this.size / 2 };
        this.ship.vel = { a: 0, b: 0, c: 0, d: 0 };
        this.particles.push({ type: 'hyperspace_in', pos: { ...this.ship.pos } });
    }

    /** Activate shield if charges available. */
    activateShield() {
        if (this.shieldCharges <= 0 || this.shieldActive || this.shieldCooldown > 0) return false;
        this.shieldCharges--;
        this.shieldActive = true;
        this.shieldTimer = 5.0; // 5 seconds
        this.shieldCooldown = 3.0; // 3s cooldown after use
        console.log(`[AsteroidsBoard] Shield activated! ${this.shieldCharges} remaining`);
        return true;
    }

    /** Reset board to initial state. */
    reset() {
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

        this.ufoTimer = 15;
        this.spawnShip();
        this.spawnAsteroids(this.waveBaseAsteroids);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AsteroidsBoard, AsteroidsEntity };
}
