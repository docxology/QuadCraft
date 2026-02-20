/**
 * entity_system.js — Quadray Entity System for Real-Time 4D Games
 *
 * Provides entity management for games with moving objects in Quadray space:
 *   - QuadrayEntity: position, velocity, radius, collision, wrap-around
 *   - EntityManager: collection management, collision detection, updates
 *
 * Used by real-time games: Asteroids, Frogger, Space Invaders, Bomberman,
 * Pac-Man, SimAnt, Pong, Breakout.
 *
 * Usage:
 *   const ship = new QuadrayEntity([4, 4, 4, 4], [0.1, 0, 0, 0], {
 *       type: 'ship', radius: 0.5
 *   });
 *   const manager = new EntityManager();
 *   manager.add(ship);
 *   manager.update(dt, worldSize);
 *
 * @module EntitySystem
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

/**
 * An entity in 4D Quadray space with position, velocity, and collision radius.
 */
class QuadrayEntity {
    /**
     * @param {number[]} pos — [a, b, c, d] initial position.
     * @param {number[]} vel — [a, b, c, d] velocity (can be null for static entities).
     * @param {Object}   [opts]
     * @param {number}   [opts.radius=0.5] — Collision radius.
     * @param {string}   [opts.type='default'] — Entity type identifier.
     * @param {string}   [opts.color='#ffffff'] — Rendering color.
     * @param {*}        [opts.data=null] — Arbitrary game-specific data.
     */
    constructor(pos, vel = null, opts = {}) {
        this.pos = { a: pos[0], b: pos[1], c: pos[2], d: pos[3] };
        this.vel = vel
            ? { a: vel[0], b: vel[1], c: vel[2], d: vel[3] }
            : { a: 0, b: 0, c: 0, d: 0 };
        this.radius = opts.radius ?? 0.5;
        this.type = opts.type ?? 'default';
        this.color = opts.color ?? '#ffffff';
        this.data = opts.data ?? null;
        this.active = true;
    }

    /**
     * Update position based on velocity.
     * @param {number} dt — Time delta (fraction of a step).
     * @param {number} [size] — If provided, wrap position within [0, size).
     */
    update(dt, size) {
        this.pos.a += this.vel.a * dt;
        this.pos.b += this.vel.b * dt;
        this.pos.c += this.vel.c * dt;
        this.pos.d += this.vel.d * dt;
        if (size != null) this.wrapPosition(size);
    }

    /**
     * Wrap position within [0, size) on all axes (toroidal space).
     * @param {number} size — World size.
     */
    wrapPosition(size) {
        this.pos.a = ((this.pos.a % size) + size) % size;
        this.pos.b = ((this.pos.b % size) + size) % size;
        this.pos.c = ((this.pos.c % size) + size) % size;
        this.pos.d = ((this.pos.d % size) + size) % size;
    }

    /**
     * Quadray distance to another entity using Quadray.distance().
     * @param {QuadrayEntity} other
     * @returns {number}
     */
    distTo(other) {
        const q1 = new Quadray(this.pos.a, this.pos.b, this.pos.c, this.pos.d);
        const q2 = new Quadray(other.pos.a, other.pos.b, other.pos.c, other.pos.d);
        return Quadray.distance(q1, q2);
    }

    /**
     * Euclidean (4D) distance to another entity via GridUtils.
     * @param {QuadrayEntity} other
     * @returns {number}
     */
    euclideanDistTo(other) {
        return GridUtils.euclidean(this.pos, other.pos);
    }

    /**
     * Manhattan distance to another entity via GridUtils.
     * @param {QuadrayEntity} other
     * @returns {number}
     */
    manhattanDistTo(other) {
        return GridUtils.manhattan(this.pos, other.pos);
    }

    /**
     * Check if this entity collides with another (radius-based).
     * @param {QuadrayEntity} other
     * @returns {boolean}
     */
    collidesWith(other) {
        return this.euclideanDistTo(other) < (this.radius + other.radius);
    }

    /**
     * Get a GridUtils-compatible string key for this entity's position
     * (rounded to nearest integer coordinates).
     * @returns {string}
     */
    posKey() {
        return GridUtils.key(
            Math.round(this.pos.a),
            Math.round(this.pos.b),
            Math.round(this.pos.c),
            Math.round(this.pos.d)
        );
    }

    /**
     * Get position as a Quadray object.
     * @returns {Quadray}
     */
    toQuadray() {
        return new Quadray(this.pos.a, this.pos.b, this.pos.c, this.pos.d);
    }

    /**
     * Set velocity from an array.
     * @param {number[]} v — [a, b, c, d]
     */
    setVelocity(v) {
        this.vel.a = v[0];
        this.vel.b = v[1];
        this.vel.c = v[2];
        this.vel.d = v[3];
    }

    /**
     * Scale velocity to a maximum speed.
     * @param {number} maxSpeed — Maximum speed magnitude.
     */
    clampSpeed(maxSpeed) {
        const speed = Math.sqrt(
            this.vel.a ** 2 + this.vel.b ** 2 +
            this.vel.c ** 2 + this.vel.d ** 2
        );
        if (speed > maxSpeed) {
            const scale = maxSpeed / speed;
            this.vel.a *= scale;
            this.vel.b *= scale;
            this.vel.c *= scale;
            this.vel.d *= scale;
        }
    }

    /**
     * Deactivate this entity (marks for removal).
     */
    destroy() {
        this.active = false;
    }
}

/**
 * Manages a collection of QuadrayEntity instances.
 * Provides batch update, collision detection, and filtering.
 */
class EntityManager {
    constructor() {
        /** @type {QuadrayEntity[]} */
        this.entities = [];
    }

    /**
     * Add an entity to the manager.
     * @param {QuadrayEntity} entity
     * @returns {QuadrayEntity} — The added entity (for chaining).
     */
    add(entity) {
        this.entities.push(entity);
        return entity;
    }

    /**
     * Remove all inactive entities from the collection.
     * @returns {number} — Number of entities removed.
     */
    removeInactive() {
        const before = this.entities.length;
        this.entities = this.entities.filter(e => e.active);
        return before - this.entities.length;
    }

    /**
     * Get all entities of a specific type.
     * @param {string} type
     * @returns {QuadrayEntity[]}
     */
    getByType(type) {
        return this.entities.filter(e => e.active && e.type === type);
    }

    /**
     * Get all active entities.
     * @returns {QuadrayEntity[]}
     */
    getActive() {
        return this.entities.filter(e => e.active);
    }

    /**
     * Update all active entities.
     * @param {number} dt — Time delta.
     * @param {number} [size] — World size for wrapping.
     */
    update(dt, size) {
        for (const e of this.entities) {
            if (e.active) e.update(dt, size);
        }
    }

    /**
     * Check collisions between two groups of entities.
     * Calls the callback for each collision pair.
     * @param {string} typeA — Type of first group.
     * @param {string} typeB — Type of second group.
     * @param {function(QuadrayEntity, QuadrayEntity)} callback
     * @returns {number} — Number of collisions detected.
     */
    checkCollisions(typeA, typeB, callback) {
        const groupA = this.getByType(typeA);
        const groupB = this.getByType(typeB);
        let count = 0;
        for (const a of groupA) {
            for (const b of groupB) {
                if (a !== b && a.active && b.active && a.collidesWith(b)) {
                    callback(a, b);
                    count++;
                }
            }
        }
        return count;
    }

    /**
     * Find the nearest entity of a given type to a position.
     * @param {{a:number,b:number,c:number,d:number}} pos
     * @param {string} type
     * @returns {QuadrayEntity|null}
     */
    nearest(pos, type) {
        const group = this.getByType(type);
        if (group.length === 0) return null;
        const ref = new QuadrayEntity([pos.a, pos.b, pos.c, pos.d]);
        let best = null;
        let bestDist = Infinity;
        for (const e of group) {
            const d = ref.euclideanDistTo(e);
            if (d < bestDist) {
                bestDist = d;
                best = e;
            }
        }
        return best;
    }

    /**
     * Total count of active entities.
     * @returns {number}
     */
    get count() {
        return this.entities.filter(e => e.active).length;
    }

    /**
     * Clear all entities.
     */
    clear() {
        this.entities = [];
    }
}

// Dual export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { QuadrayEntity, EntityManager };
}
