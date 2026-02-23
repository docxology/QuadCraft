/**
 * space_invaders_board.js — 4D Space Invaders on IVM Grid
 *
 * Alien formation on integer Quadray positions, player ship at bottom.
 * Projectiles travel along A axis. Formation shifts along B,C,D axes
 * and descends periodically.
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
 * @module SpaceInvadersBoard
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

class SpaceInvadersBoard extends BaseBoard {
    constructor(width = 6, height = 12, depthC = 3, depthD = 3) {
        super(width, { name: 'SpaceInvadersBoard', verify: false });
        this.width = width;
        this.height = height;
        this.depthC = depthC;
        this.depthD = depthD;
        this.aliens = [];         // [{a,b,c,d,type,alive,points,quadray,cellType}]
        this.bullets = [];        // [{a,b,c,d,da,owner,quadray}]
        this.ship = { b: Math.floor(width / 2), c: Math.floor(depthC / 2), d: Math.floor(depthD / 2) };
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameOver = false;
        this.formationDir = 1;    // +1 or -1 along B axis
        this.stepCount = 0;
        this.shootCooldown = 0;

        // Shield bunkers — 4 positions along B axis at row a=2
        this.shields = [];
        this._initShields();

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

        this._initAliens();
        console.log(`[SpaceInvadersBoard] ${this.aliens.length} aliens on ${width}x${height} IVM grid`);
        console.log(`[SpaceInvadersBoard] Cell volume: ${this.cellVolumeUnit}, S3: ${this.s3Constant}`);
        console.log(`[SpaceInvadersBoard] Volume ratios T:O:C = ${this.volumeRatios.tetra}:${this.volumeRatios.octa}:${this.volumeRatios.cubo}`);
    }

    /** Verify geometric integrity on construction. */
    _verifyIntegrity() {
        if (typeof verifyRoundTrip !== 'function') return;
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
                console.warn(`[SpaceInvadersBoard] Round-trip failed for ${corner.toString()}: error=${result.error.toFixed(6)}`);
                allPassed = false;
            }
        }
        if (allPassed) console.log('[SpaceInvadersBoard] Round-trip integrity verified on corner positions');
    }

    _initAliens() {
        this.aliens = [];
        const types = ['squid', 'crab', 'octopus'];
        const rowCount = Math.min(3 + Math.floor(this.level / 3), 5);
        for (let row = 0; row < rowCount; row++)
            for (let b = 1; b < this.width - 1; b++)
                for (let c = 0; c < this.depthC; c++) {
                    const a = this.height - 3 - row;
                    const d = Math.floor(this.depthD / 2);
                    const quadray = new Quadray(a, b, c, d);
                    const cellType = Quadray.cellType(a, b, c, d);
                    this.aliens.push({
                        a, b, c, d,
                        type: types[row % types.length], alive: true,
                        points: (row + 1) * 10,
                        quadray, cellType
                    });
                }
    }

    _initShields() {
        this.shields = [];
        const shieldRow = 2;
        const spacing = Math.max(1, Math.floor(this.width / 5));
        for (let i = 0; i < 4; i++) {
            const b = 1 + i * spacing;
            if (b < this.width) {
                this.shields.push({
                    a: shieldRow, b, c: Math.floor(this.depthC / 2), d: Math.floor(this.depthD / 2),
                    hp: 3, maxHp: 3
                });
            }
        }
    }

    /**
     * Check if coordinates are within the board bounds.
     * @param {Quadray} q
     * @returns {boolean}
     */
    inBounds(q) {
        return q.a >= 0 && q.a < this.height &&
            q.b >= 0 && q.b < this.width &&
            q.c >= 0 && q.c < this.depthC &&
            q.d >= 0 && q.d < this.depthD;
    }

    /**
     * Get cell data at a Quadray position.
     * @param {Quadray} q
     * @returns {Object|null}
     */
    getCell(q) {
        const key = GridUtils.key(q.a, q.b, q.c, q.d);
        // Check aliens at this position
        for (const alien of this.aliens) {
            if (alien.alive && GridUtils.key(alien.a, alien.b, alien.c, alien.d) === key) {
                return alien;
            }
        }
        return null;
    }

    /**
     * Set cell data at a Quadray position (no-op for space invaders — entities are list-based).
     * @param {Quadray} q
     * @param {*} v
     */
    setCell(q, v) { /* no-op — entities are stored in arrays, not a grid map */ }

    moveShip(db, dc, dd) {
        this.ship.b = Math.max(0, Math.min(this.width - 1, this.ship.b + db));
        this.ship.c = Math.max(0, Math.min(this.depthC - 1, this.ship.c + dc));
        this.ship.d = Math.max(0, Math.min(this.depthD - 1, this.ship.d + dd));
    }

    shoot() {
        if (this.shootCooldown > 0) return false;
        this.bullets.push({
            a: 1, b: this.ship.b, c: this.ship.c, d: this.ship.d,
            da: 1, owner: 'player',
            quadray: new Quadray(1, this.ship.b, this.ship.c, this.ship.d)
        });
        this.shootCooldown = 3;
        return true;
    }

    step() {
        if (this.gameOver) return 'gameover';
        this.stepCount++;
        if (this.shootCooldown > 0) this.shootCooldown--;

        // Move bullets
        this.bullets = this.bullets.filter(b => {
            b.a += b.da;
            b.quadray = new Quadray(b.a, b.b, b.c, b.d);
            return b.a >= 0 && b.a < this.height;
        });

        // Move formation every N steps (faster at higher levels)
        const moveRate = Math.max(2, 5 - Math.floor(this.level / 2));
        if (this.stepCount % moveRate === 0) {
            let hitEdge = false;
            for (const alien of this.aliens) {
                if (!alien.alive) continue;
                if ((alien.b + this.formationDir < 0) || (alien.b + this.formationDir >= this.width)) {
                    hitEdge = true;
                    break;
                }
            }

            if (hitEdge) {
                this.formationDir = -this.formationDir;
                for (const alien of this.aliens) {
                    if (alien.alive) {
                        alien.a--; // Descend
                        alien.quadray = new Quadray(alien.a, alien.b, alien.c, alien.d);
                        alien.cellType = Quadray.cellType(alien.a, alien.b, alien.c, alien.d);
                    }
                }
            } else {
                for (const alien of this.aliens) {
                    if (alien.alive) {
                        alien.b += this.formationDir;
                        alien.quadray = new Quadray(alien.a, alien.b, alien.c, alien.d);
                        alien.cellType = Quadray.cellType(alien.a, alien.b, alien.c, alien.d);
                    }
                }
            }
        }

        // Alien shooting (random)
        const liveAliens = this.aliens.filter(a => a.alive);
        const shootRate = Math.max(4, 8 - this.level);
        if (liveAliens.length > 0 && this.stepCount % shootRate === 0) {
            const shooter = liveAliens[Math.floor(Math.random() * liveAliens.length)];
            this.bullets.push({
                a: shooter.a - 1, b: shooter.b, c: shooter.c, d: shooter.d,
                da: -1, owner: 'alien',
                quadray: new Quadray(shooter.a - 1, shooter.b, shooter.c, shooter.d)
            });
        }

        // Bullet-alien collision using GridUtils.key for coordinate matching
        for (const bullet of this.bullets) {
            if (bullet.owner !== 'player') continue;
            const bulletKey = GridUtils.key(Math.round(bullet.a), bullet.b, bullet.c, bullet.d);
            for (const alien of this.aliens) {
                if (!alien.alive) continue;
                const alienKey = GridUtils.key(alien.a, alien.b, alien.c, alien.d);
                if (bulletKey === alienKey) {
                    alien.alive = false;
                    bullet.a = -1; // Mark for removal
                    this.score += alien.points;
                }
            }
        }

        // Bullet-ship collision using GridUtils.key
        const shipKey = GridUtils.key(0, this.ship.b, this.ship.c, this.ship.d);
        for (const bullet of this.bullets) {
            if (bullet.owner !== 'alien') continue;
            const bKey = GridUtils.key(Math.round(bullet.a), bullet.b, bullet.c, bullet.d);
            if (Math.round(bullet.a) <= 0 && bKey === shipKey) {
                this.lives--;
                bullet.a = -1;
                if (this.lives <= 0) { this.gameOver = true; return 'dead'; }
                return 'hit';
            }
        }

        // Clean up dead bullets
        this.bullets = this.bullets.filter(b => b.a >= 0 && b.a < this.height);

        // Bullet-shield collision
        for (const bullet of this.bullets) {
            if (bullet.a < 0) continue;
            const bKey = GridUtils.key(Math.round(bullet.a), bullet.b, bullet.c, bullet.d);
            for (const shield of this.shields) {
                if (shield.hp <= 0) continue;
                const sKey = GridUtils.key(shield.a, shield.b, shield.c, shield.d);
                if (bKey === sKey) {
                    shield.hp--;
                    bullet.a = -1;
                    break;
                }
            }
        }
        this.bullets = this.bullets.filter(b => b.a >= 0 && b.a < this.height);

        // Wave clear check
        if (this.aliens.every(a => !a.alive)) {
            this.level++;
            this._initAliens();
            return 'wave_clear';
        }

        // Aliens reached bottom
        if (liveAliens.some(a => a.a <= 0)) {
            this.gameOver = true;
            return 'invaded';
        }

        return 'play';
    }

    /** Full reset. */
    reset() {
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameOver = false;
        this.formationDir = 1;
        this.stepCount = 0;
        this.shootCooldown = 0;
        this.bullets = [];
        this.ship = { b: Math.floor(this.width / 2), c: Math.floor(this.depthC / 2), d: Math.floor(this.depthD / 2) };
        this._initAliens();
        this._initShields();
    }

    getLiveAlienCount() { return this.aliens.filter(a => a.alive).length; }

    /**
     * Get IVM neighbors of a position that are within board bounds.
     * Uses GridUtils.neighbors().
     * @param {Quadray} q
     * @returns {Array<{a:number, b:number, c:number, d:number}>}
     */
    getNeighbors(q) {
        const raw = GridUtils.neighbors(q.a, q.b, q.c, q.d);
        return raw.filter(n =>
            n.a >= 0 && n.a < this.height &&
            n.b >= 0 && n.b < this.width &&
            n.c >= 0 && n.c < this.depthC &&
            n.d >= 0 && n.d < this.depthD
        );
    }

    /**
     * Calculate Manhattan distance between two positions on the board.
     * Uses GridUtils.manhattan().
     * @param {{a:number,b:number,c:number,d:number}} p1
     * @param {{a:number,b:number,c:number,d:number}} p2
     * @returns {number}
     */
    manhattanDistance(p1, p2) {
        return GridUtils.manhattan(p1, p2);
    }

    /**
     * Calculate Euclidean distance between two positions on the board.
     * Uses GridUtils.euclidean().
     * @param {{a:number,b:number,c:number,d:number}} p1
     * @param {{a:number,b:number,c:number,d:number}} p2
     * @returns {number}
     */
    euclideanDistance(p1, p2) {
        return GridUtils.euclidean(p1, p2);
    }

    /**
     * Calculate Quadray distance (proper IVM distance) between two Quadrays.
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

    /** Get all entities for rendering. */
    getEntities() {
        const entities = [];
        for (const alien of this.aliens) {
            if (!alien.alive) continue;
            entities.push({
                a: alien.a, b: alien.b, c: alien.c, d: alien.d,
                type: alien.type,
                color: alien.type === 'squid' ? '#22c55e' : alien.type === 'crab' ? '#f59e0b' : '#ef4444',
                quadray: alien.quadray,
                cellType: alien.cellType,
                distFromOrigin: alien.quadray.distanceTo(Quadray.ORIGIN),
            });
        }
        // Ship
        const shipQuadray = new Quadray(0, this.ship.b, this.ship.c, this.ship.d);
        entities.push({
            a: 0, b: this.ship.b, c: this.ship.c, d: this.ship.d,
            type: 'ship', color: '#60a5fa',
            quadray: shipQuadray,
            cellType: Quadray.cellType(0, this.ship.b, this.ship.c, this.ship.d),
            distFromOrigin: shipQuadray.distanceTo(Quadray.ORIGIN),
        });
        // Bullets
        for (const b of this.bullets) {
            entities.push({
                a: b.a, b: b.b, c: b.c, d: b.d,
                type: 'bullet',
                color: b.owner === 'player' ? '#fbbf24' : '#f87171',
                quadray: b.quadray,
                cellType: Quadray.cellType(Math.round(b.a), b.b, b.c, b.d),
                distFromOrigin: b.quadray.distanceTo(Quadray.ORIGIN),
            });
        }
        // Shields
        for (const s of this.shields) {
            if (s.hp <= 0) continue;
            entities.push({
                a: s.a, b: s.b, c: s.c, d: s.d,
                type: 'shield', color: `rgba(34,197,94,${s.hp / s.maxHp})`,
                hp: s.hp, maxHp: s.maxHp,
                quadray: new Quadray(s.a, s.b, s.c, s.d),
                cellType: Quadray.cellType(s.a, s.b, s.c, s.d),
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
        for (const alien of this.aliens) {
            if (!alien.alive) continue;
            if (alien.cellType === 'tetra') tetraCount++;
            else octaCount++;
        }
        return {
            score: this.score,
            lives: this.lives,
            level: this.level,
            gameOver: this.gameOver,
            liveAliens: this.getLiveAlienCount(),
            tetraCount,
            octaCount,
            volumeRatios: this.volumeRatios,
            cellVolume: this.cellVolumeUnit,
            s3: this.s3Constant,
            stepCount: this.stepCount,
            shieldsAlive: this.shields.filter(s => s.hp > 0).length,
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SpaceInvadersBoard };
}
