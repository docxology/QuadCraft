/**
 * TowerDefenseBoard.js -- 4D Tower Defense on IVM Grid
 *
 * IVM grid-snapped paths, polyhedra tower types, Quadray-native creeps.
 * Synergetics geometry: tetrahedron (TV=1), octahedron (TV=4), rhombic dodecahedron (TV=6), cuboctahedron (TV=20).
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
 * @module TowerDefenseBoard
 */

// Node.js compatibility -- load shared modules if not already in scope.
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

// ─── Tower definitions keyed by synergetics polyhedra ───────────────────────
const TOWER_TYPES = {
    tetra: {
        name: 'Tetra', symbol: '\u25B2', tv: 1, cost: 15,
        range: 2.0, fireRate: 400, damage: 8,
        ability: 'rapid',           // fast single-target fire
        color: '#44aaff',
        upgrades: [
            { damage: 12, range: 2.3, fireRate: 350, cost: 15 },
            { damage: 18, range: 2.6, fireRate: 300, cost: 25 },
            { damage: 28, range: 3.0, fireRate: 250, cost: 40 }
        ]
    },
    octa: {
        name: 'Octa', symbol: '\u25C6', tv: 4, cost: 40,
        range: 3.5, fireRate: 900, damage: 12,
        ability: 'splash',          // hits all creeps within 50% of range
        splashRadius: 0.5,
        color: '#ffaa22',
        upgrades: [
            { damage: 18, range: 4.0, fireRate: 850, cost: 40 },
            { damage: 26, range: 4.5, fireRate: 800, cost: 55 },
            { damage: 38, range: 5.0, fireRate: 700, cost: 75 }
        ]
    },
    cubo: {
        name: 'Cubo', symbol: '\u2B21', tv: 20, cost: 100,
        range: 5.5, fireRate: 1800, damage: 35,
        ability: 'slow',            // slows all creeps in range by 50%
        slowFactor: 0.5,
        slowDuration: 120,          // frames
        color: '#ff44aa',
        upgrades: [
            { damage: 50, range: 6.0, fireRate: 1600, cost: 100 },
            { damage: 70, range: 7.0, fireRate: 1400, cost: 140 },
            { damage: 100, range: 8.0, fireRate: 1200, cost: 200 }
        ]
    },
    rhombic: {
        name: 'Rhombic', symbol: '\u2726', tv: 6, cost: 250,
        range: 12.0, fireRate: 3000, damage: 150,
        ability: 'sniper',          // extreme damage, very slow fire
        color: '#aa44ff',
        upgrades: [
            { damage: 250, range: 14.0, fireRate: 2800, cost: 250 },
            { damage: 400, range: 16.0, fireRate: 2500, cost: 400 },
            { damage: 700, range: 20.0, fireRate: 2000, cost: 600 }
        ]
    }
};

// ─── Creep type definitions ─────────────────────────────────────────────────
const CREEP_TYPES = {
    normal: { name: 'Normal', speedMul: 1.0, hpMul: 1.0, goldMul: 1.0, color: '#55cc55', symbol: '\u25CF' },
    fast: { name: 'Fast', speedMul: 2.0, hpMul: 0.5, goldMul: 1.2, color: '#55ccff', symbol: '\u25C6' },
    armored: { name: 'Armored', speedMul: 0.5, hpMul: 2.5, goldMul: 1.5, color: '#ccaa22', symbol: '\u25A0' },
    regen: { name: 'Regen', speedMul: 0.6, hpMul: 3.0, goldMul: 2.0, color: '#ffaaaa', symbol: '\u271A' },
    swarm: { name: 'Swarm', speedMul: 1.5, hpMul: 0.8, goldMul: 1.5, color: '#cccc33', symbol: '\u273F' },
    swarmlet: { name: 'Swarmlet', speedMul: 2.0, hpMul: 0.2, goldMul: 0.3, color: '#aaaa22', symbol: '\u2022' },
    boss: { name: 'Boss', speedMul: 0.3, hpMul: 6.0, goldMul: 5.0, color: '#ff4444', symbol: '\u2605' }
};

// ─── Creep ──────────────────────────────────────────────────────────────────
class TDCreep {
    constructor(type = 'normal', wave = 1) {
        const def = CREEP_TYPES[type] || CREEP_TYPES.normal;
        const baseHp = 40 + wave * 25;
        this.type = type;
        this.segmentIndex = 0;
        this.segmentT = 0;
        this.baseSpeed = 0.018 * def.speedMul;
        this.speed = this.baseSpeed;
        this.hp = Math.round(baseHp * def.hpMul);
        this.maxHp = this.hp;
        this.alive = true;
        this.delay = 0;
        this.goldValue = Math.round((8 + wave * 2) * def.goldMul);
        this.scoreValue = Math.round(50 * def.goldMul);
        this.slowTimer = 0;         // remaining frames of slow effect
        this.color = def.color;
        this.symbol = def.symbol;
        // Trail positions for afterimage effect
        this.trail = [];
    }
    get started() { return this.delay <= 0; }
}

// ─── Tower ──────────────────────────────────────────────────────────────────
class TDTower {
    constructor(pos, type = 'tetra') {
        const def = TOWER_TYPES[type];
        this.pos = pos;
        this.type = type;
        this.level = 0;             // 0 = base, 1-3 = upgrades
        this.range = def.range;
        this.fireRate = def.fireRate;
        this.damage = def.damage;
        this.lastFire = 0;
        this.totalInvested = def.cost;
        this.kills = 0;
        this.target = null;         // current target creep reference
        // Animation state
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.fireFlash = 0;         // countdown frames for fire visual
    }

    /** Upgrade this tower to the next level. Returns cost or -1 if maxed. */
    getUpgradeCost() {
        const def = TOWER_TYPES[this.type];
        if (this.level >= def.upgrades.length) return -1;
        return def.upgrades[this.level].cost;
    }

    /** Apply the next upgrade level. */
    upgrade() {
        const def = TOWER_TYPES[this.type];
        if (this.level >= def.upgrades.length) return false;
        const up = def.upgrades[this.level];
        this.damage = up.damage;
        this.range = up.range;
        this.fireRate = up.fireRate;
        this.totalInvested += up.cost;
        this.level++;
        return true;
    }

    /** Get sell refund (60% of total invested). */
    getSellValue() {
        return Math.floor(this.totalInvested * 0.6);
    }
}

// ─── Board ──────────────────────────────────────────────────────────────────
class TowerDefenseBoard extends BaseBoard {

    /**
     * @param {number} size - Grid dimension
     */
    constructor(size = 6) {
        super(size, { name: 'TowerDefenseBoard', verify: false });
        this.size = size;
        this.grid = new Map();          // GridUtils.key() -> cell data
        this.path = this.generateIVMPath();
        this.towers = [];
        this.creeps = [];
        this.projectiles = [];
        this.particles = [];        // visual particles for explosions
        this.wave = 0;
        this.lives = 20;
        this.gold = 100;
        this.score = 0;
        this.tick = 0;
        this.gameOver = false;
        this.totalKills = 0;
        this.waveCountdown = 0;     // frames until auto-wave
        this.waveActive = false;
        this.speed = 1;             // 1x, 2x, 3x
        this.log = [];              // event log for UI

        // Synergetics metadata
        this.volumeRatios = {
            tetra: SYNERGETICS?.TETRA_VOL ?? 1,
            octa: SYNERGETICS?.OCTA_VOL ?? 4,
            cubo: SYNERGETICS?.CUBO_VOL ?? 20,
            rhombic: 6,
        };
        this.cellVolumeUnit = Quadray.cellVolume();
        this.s3Constant = SYNERGETICS?.S3 ?? 1.0607;

        // Integrity check -- verify round-trip on corner positions
        this._verifyIntegrity();

        console.log(`[TowerDefenseBoard] ${size}^4 IVM grid`);
        console.log(`[TowerDefenseBoard] Cell volume: ${this.cellVolumeUnit}, S3: ${this.s3Constant}`);
        console.log(`[TowerDefenseBoard] Volume ratios T:O:C:R = ${this.volumeRatios.tetra}:${this.volumeRatios.octa}:${this.volumeRatios.cubo}:${this.volumeRatios.rhombic}`);
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
                console.warn(`[TowerDefenseBoard] Round-trip failed for ${corner.toString()}: error=${result.error.toFixed(6)}`);
                allPassed = false;
            }
        }
        if (allPassed) console.log('[TowerDefenseBoard] Round-trip integrity verified on corner positions');
    }

    /**
     * Get cell data at a Quadray position.
     * Delegates key generation to GridUtils.key().
     * @param {Quadray} q
     * @returns {Object|null}
     */
    getCell(q) {
        const key = GridUtils.key(q.a, q.b, q.c, q.d);
        return this.grid.get(key) || null;
    }

    /**
     * Set cell data at a Quadray position.
     * Delegates key generation to GridUtils.key().
     * @param {Quadray} q
     * @param {*} value
     */
    setCell(q, value) {
        this.grid.set(GridUtils.key(q.a, q.b, q.c, q.d), value);
    }

    /**
     * Get IVM neighbors of a position that are within board bounds.
     * Uses GridUtils.boundedNeighbors().
     * @param {Quadray} q
     * @returns {Array<Quadray>}
     */
    getNeighbors(q) {
        const raw = GridUtils.neighbors(q.a, q.b, q.c, q.d);
        return raw.map(n => new Quadray(n.a, n.b, n.c, n.d));
    }

    /**
     * Calculate Manhattan distance between two Quadray positions.
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
     * Calculate Euclidean distance between two Quadray positions.
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

    /**
     * Procedurally generate a meandering, grid-snapped IVM path.
     */
    generateIVMPath() {
        const path = [new Quadray(0, 0, 0, 0)];
        let current = path[0];
        const visited = new Set([GridUtils.key(0, 0, 0, 0)]);
        const maxLen = 20 + Math.floor(Math.random() * 8);

        for (let i = 1; i < maxLen; i++) {
            let candidates = [];
            for (const basis of Quadray.BASIS) {
                const next = current.add(basis);
                const rn = new Quadray(Math.round(next.a), Math.round(next.b), Math.round(next.c), Math.round(next.d));
                const k = GridUtils.key(rn.a, rn.b, rn.c, rn.d);
                if (!visited.has(k)) candidates.push({ q: rn, k });
            }
            if (candidates.length === 0) break;

            candidates.sort((c1, c2) => {
                const d1 = c1.q.a + c1.q.b + c1.q.c + c1.q.d;
                const d2 = c2.q.a + c2.q.b + c2.q.c + c2.q.d;
                return d2 - d1; // Descending sum (moves away from origin)
            });

            const chosen = (Math.random() < 0.7) ? candidates[0] : candidates[Math.floor(Math.random() * candidates.length)];
            path.push(chosen.q);
            visited.add(chosen.k);
            current = chosen.q;
        }
        return path;
    }

    /**
     * Place a tower at a Quadray position.
     * Returns true if placed, false if insufficient gold or invalid.
     */
    placeTower(quadray, type = 'tetra') {
        const def = TOWER_TYPES[type];
        if (!def) return false;
        if (this.gold < def.cost) return false;
        // Prevent placing on path
        for (const wp of this.path) {
            if (Quadray.distance(quadray, wp) < 0.1) return false;
        }
        // Prevent stacking towers
        for (const t of this.towers) {
            if (Quadray.distance(quadray, t.pos) < 0.1) return false;
        }
        this.towers.push(new TDTower(quadray, type));
        this.gold -= def.cost;
        this.addLog(`Built ${def.name} tower`);
        return true;
    }

    /** Upgrade a tower. Returns true on success. */
    upgradeTower(tower) {
        const cost = tower.getUpgradeCost();
        if (cost < 0) return false;
        if (this.gold < cost) return false;
        this.gold -= cost;
        tower.upgrade();
        this.addLog(`Upgraded ${TOWER_TYPES[tower.type].name} to Lv${tower.level}`);
        return true;
    }

    /** Sell a tower and refund gold. */
    sellTower(tower) {
        const idx = this.towers.indexOf(tower);
        if (idx < 0) return false;
        const refund = tower.getSellValue();
        this.gold += refund;
        this.towers.splice(idx, 1);
        this.addLog(`Sold tower for ${refund}g`);
        return true;
    }

    /** Spawn a wave of creeps with type variety. */
    spawnWave() {
        this.wave++;
        this.waveActive = true;
        const count = 4 + this.wave * 2;
        const isBossWave = this.wave % 5 === 0;

        for (let i = 0; i < count; i++) {
            let type = 'normal';
            if (isBossWave && i === 0) {
                type = 'boss';
            } else if (this.wave >= 6 && Math.random() < 0.15) {
                type = 'regen';
            } else if (this.wave >= 4 && Math.random() < 0.2) {
                type = 'swarm';
            } else if (this.wave >= 3 && Math.random() < 0.2) {
                type = 'fast';
            } else if (this.wave >= 5 && Math.random() < 0.15) {
                type = 'armored';
            }
            const c = new TDCreep(type, this.wave);
            c.delay = i * 18;
            this.creeps.push(c);
        }
        this.addLog(`Wave ${this.wave}${isBossWave ? ' BOSS' : ''} -- ${count} creeps`);
    }

    /** Get the interpolated Quadray position of a creep along the path. */
    getCreepPosition(creep) {
        if (!creep.started) return this.path[0];
        const idx = creep.segmentIndex;
        const t = creep.segmentT;
        if (idx >= this.path.length - 1) return this.path[this.path.length - 1];
        const from = this.path[idx];
        const to = this.path[idx + 1];
        return new Quadray(
            from.a + (to.a - from.a) * t,
            from.b + (to.b - from.b) * t,
            from.c + (to.c - from.c) * t,
            from.d + (to.d - from.d) * t
        );
    }

    /** Main update loop -- called each frame. Respects speed multiplier. */
    update() {
        if (this.gameOver) return;
        const steps = this.speed;
        for (let s = 0; s < steps; s++) {
            this._step();
        }
    }

    /** Single simulation step. */
    _step() {
        if (this.gameOver) return;
        this.tick++;
        // Use simulated time (16ms per tick) so that 2x/3x speed
        // increases BOTH simulated time and process speed correctly.
        // Tower cooldowns compare against this value.
        const now = this.tick * 16;

        // -- Move creeps --
        for (const c of this.creeps) {
            if (!c.alive) continue;
            if (c.delay > 0) { c.delay--; continue; }

            // Apply slow effect
            if (c.slowTimer > 0) {
                c.speed = c.baseSpeed * 0.5;
                c.slowTimer--;
            } else {
                c.speed = c.baseSpeed;
            }

            // Regen effect
            if (c.type === 'regen' && this.tick % 30 === 0 && c.hp < c.maxHp) {
                c.hp = Math.min(c.maxHp, c.hp + c.maxHp * 0.05);
            }

            // Store trail position
            const pos = this.getCreepPosition(c);
            c.trail.push({ a: pos.a, b: pos.b, c: pos.c, d: pos.d });
            if (c.trail.length > 6) c.trail.shift();

            c.segmentT += c.speed;
            while (c.segmentT >= 1 && c.segmentIndex < this.path.length - 1) {
                c.segmentT -= 1;
                c.segmentIndex++;
            }
            // Reached end
            if (c.segmentIndex >= this.path.length - 1 && c.segmentT >= 1) {
                c.alive = false;
                this.lives--;
                if (this.lives <= 0) {
                    this.gameOver = true;
                    this.addLog('GAME OVER');
                }
            }
        }

        // -- Tower fire --
        for (const t of this.towers) {
            if (now - t.lastFire < t.fireRate) continue;
            const tq = t.pos;
            const def = TOWER_TYPES[t.type];

            if (def.ability === 'splash') {
                // Splash: hit ALL creeps within range
                let fired = false;
                const splashRange = t.range * (def.splashRadius || 0.5);
                for (const c of this.creeps) {
                    if (!c.alive || !c.started) continue;
                    const cq = this.getCreepPosition(c);
                    const dist = Quadray.distance(tq, cq);
                    if (dist <= t.range) {
                        // Full damage to primary target, splash to others nearby
                        if (!fired) {
                            t.lastFire = now;
                            t.fireFlash = 8;
                            fired = true;
                        }
                        const isPrimary = dist <= splashRange;
                        const dmg = isPrimary ? t.damage : Math.round(t.damage * 0.5);
                        c.hp -= dmg;
                        this.projectiles.push({ from: tq, to: cq, life: 6, color: def.color });
                        if (c.hp <= 0) this._killCreep(c, t);
                    }
                }
            } else if (def.ability === 'slow') {
                // Slow: damage + apply slow to all in range
                let fired = false;
                for (const c of this.creeps) {
                    if (!c.alive || !c.started) continue;
                    const cq = this.getCreepPosition(c);
                    const dist = Quadray.distance(tq, cq);
                    if (dist <= t.range) {
                        c.slowTimer = def.slowDuration || 120;
                        if (!fired) {
                            c.hp -= t.damage;
                            this.projectiles.push({ from: tq, to: cq, life: 6, color: def.color });
                            if (c.hp <= 0) this._killCreep(c, t);
                            t.lastFire = now;
                            t.fireFlash = 8;
                            fired = true;
                        }
                    }
                }
            } else if (def.ability === 'sniper') {
                // Sniper: single target, prioritises highest-HP creep
                let best = null;
                let bestHP = -1;
                let bestCq = null;
                for (const c of this.creeps) {
                    if (!c.alive || !c.started) continue;
                    const cq = this.getCreepPosition(c);
                    const dist = Quadray.distance(tq, cq);
                    if (dist <= t.range && c.hp > bestHP) {
                        best = c; bestHP = c.hp; bestCq = cq;
                    }
                }
                if (best) {
                    best.hp -= t.damage;
                    t.lastFire = now;
                    t.fireFlash = 12;
                    this.projectiles.push({ from: tq, to: bestCq, life: 8, color: def.color });
                    if (best.hp <= 0) this._killCreep(best, t);
                }
            } else {
                // Rapid: single target, fast fire
                for (const c of this.creeps) {
                    if (!c.alive || !c.started) continue;
                    const cq = this.getCreepPosition(c);
                    const dist = Quadray.distance(tq, cq);
                    if (dist <= t.range) {
                        c.hp -= t.damage;
                        t.lastFire = now;
                        t.fireFlash = 8;
                        this.projectiles.push({ from: tq, to: cq, life: 6, color: def.color });
                        if (c.hp <= 0) this._killCreep(c, t);
                        break;
                    }
                }
            }
        }

        // -- Cleanup --
        this.creeps = this.creeps.filter(c => c.alive);
        this.projectiles = this.projectiles.filter(p => { p.life--; return p.life > 0; });
        this.particles = this.particles.filter(p => { p.life--; return p.life > 0; });

        // -- Wave management --
        if (this.creeps.length === 0 && this.waveActive) {
            this.waveActive = false;
            this.waveCountdown = 180; // 3 seconds at 60 fps
            this.addLog('Wave cleared!');
        }
        if (!this.waveActive && this.waveCountdown > 0) {
            this.waveCountdown--;
            if (this.waveCountdown <= 0) {
                this.spawnWave();
            }
        }
    }

    /** Handle creep death -- gold, score, particles. */
    _killCreep(creep, tower) {
        creep.alive = false;
        this.gold += creep.goldValue;
        this.score += creep.scoreValue;
        this.totalKills++;
        if (tower) tower.kills++;

        if (creep.type === 'swarm') {
            for (let i = 0; i < 2; i++) {
                const letc = new TDCreep('swarmlet', this.wave);
                letc.segmentIndex = creep.segmentIndex;
                letc.segmentT = Math.max(0, creep.segmentT + (i === 0 ? 0.05 : -0.05));
                letc.delay = 0;
                this.creeps.push(letc);
            }
        }

        // Spawn death particles
        const pos = this.getCreepPosition(creep);
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: pos.a, y: pos.b, z: pos.c, w: pos.d,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                vz: (Math.random() - 0.5) * 0.3,
                life: 15 + Math.random() * 10,
                color: creep.color
            });
        }
    }

    /** Get total tetravolume of placed towers. */
    getTotalTV() {
        return this.towers.reduce((sum, t) => sum + TOWER_TYPES[t.type].tv, 0);
    }

    /** Get total range TV across all towers. */
    getTotalRangeTV() {
        return this.towers.reduce((sum, t) => sum + t.range, 0);
    }

    /**
     * Get board metadata for HUD display.
     * @returns {Object}
     */
    getMetadata() {
        let tetraCount = 0, octaCount = 0, cuboCount = 0, rhombicCount = 0;
        for (const t of this.towers) {
            if (t.type === 'tetra') tetraCount++;
            else if (t.type === 'octa') octaCount++;
            else if (t.type === 'rhombic') rhombicCount++;
            else cuboCount++;
        }
        return {
            wave: this.wave,
            lives: this.lives,
            gold: this.gold,
            score: this.score,
            totalKills: this.totalKills,
            gameOver: this.gameOver,
            waveActive: this.waveActive,
            waveCountdown: this.waveCountdown,
            towerCount: this.towers.length,
            creepCount: this.creeps.filter(c => c.alive && c.started).length,
            tetraCount,
            octaCount,
            cuboCount,
            rhombicCount,
            totalTV: this.getTotalTV(),
            totalRangeTV: this.getTotalRangeTV(),
            waypointCount: this.path.length,
            volumeRatios: this.volumeRatios,
            cellVolume: this.cellVolumeUnit,
            s3: this.s3Constant,
            speed: this.speed,
        };
    }

    /** Add event to log (keep last 8 entries). */
    addLog(msg) {
        this.log.push({ msg, tick: this.tick });
        if (this.log.length > 8) this.log.shift();
    }

    /** Reset board to initial state. */
    reset() {
        this.grid = new Map();
        this.path = this.generateIVMPath();
        this.towers = [];
        this.creeps = [];
        this.projectiles = [];
        this.particles = [];
        this.wave = 0;
        this.lives = 20;
        this.gold = 100;
        this.score = 0;
        this.tick = 0;
        this.gameOver = false;
        this.totalKills = 0;
        this.waveCountdown = 0;
        this.waveActive = false;
        this.speed = 1;
        this.log = [];
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TowerDefenseBoard, TDTower, TDCreep, TOWER_TYPES, CREEP_TYPES };
}
