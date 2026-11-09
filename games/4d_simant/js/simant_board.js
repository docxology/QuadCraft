/**
 * simant_board.js — independent raw four-index cells, reversible eight-neighbor graph
 *
 * Features:
 * - 4D Grid (12^4 = 20,736 cells)
 * - Terrain: DIRT, EMPTY, BEDROCK, FOOD
 * - Pheromones: Float32Array — 6 channels per cell (Food, Home, Danger × 2 factions)
 * - Factions: Yellow (Player) vs Red (AI)
 * - Tunnel network tracking with raw +/-unit-component connectivity
 * - Food regeneration, population caps, colony health
 * - Conservative masked graph transport and explicit pheromone evaporation
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
 * @module SimAntBoard
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
if (typeof ConservativeGraphField === 'undefined' && typeof require !== 'undefined') {
    globalThis.ConservativeGraphField = require('../../4d_generic/graph_field.js').ConservativeGraphField;
}

// Cell Types
var TYPE_EMPTY = 0;
var TYPE_DIRT = 1;
var TYPE_BEDROCK = 2;
var TYPE_FOOD = 3;

// Factions
var FACTION_YELLOW = 0;
var FACTION_RED = 1;

// Castes
var CASTE_QUEEN = 0;
var CASTE_WORKER = 1;
var CASTE_SOLDIER = 2;
var CASTE_SCOUT = 3;

// Pheromone channels (6 total)
var PHERO_YELLOW_FOOD = 0;
var PHERO_YELLOW_HOME = 1;
var PHERO_RED_FOOD = 2;
var PHERO_RED_HOME = 3;
var PHERO_YELLOW_DANGER = 4;
var PHERO_RED_DANGER = 5;
var PHERO_CHANNELS = 6;

// Population cap per faction
var MAX_ANTS_PER_FACTION = 60;

class Ant {
    constructor(a, b, c, d, faction, caste, rng = Math.random) {
        // Position (integer coordinates in Grid)
        this.a = a; this.b = b; this.c = c; this.d = d;
        // Previous position for animation interpolation
        this.prevA = a; this.prevB = b; this.prevC = c; this.prevD = d;
        this.faction = faction;
        this.caste = caste;

        // Stats
        this.hp = caste === CASTE_SOLDIER ? 50
            : caste === CASTE_QUEEN ? 200
                : caste === CASTE_SCOUT ? 15
                    : 20;
        this.maxHp = this.hp;
        this.energy = 100; // Hunger
        this.alive = true;
        this.carrying = 0; // Food amount

        // AI State
        this.target = null; // { a, b, c, d }
        this.state = 'idle'; // idle, foraging, returning, attacking, scouting
        this.scoutAngle = rng() * Math.PI * 2; // For spiral scout patterns
        this.explored = new Set(); // Raw sites visited, not cached terrain
        this.homeRoute = []; // Reverse-ordered raw indices; next step is last
        this.homeGoal = -1;
        this.homeRetry = 0;

        // Combat tracking
        this.kills = 0;
        this.deathTick = -1; // Set when killed, for death animation
    }

    // Convert grid coords to Quadray for rendering/distance
    toQuadray() {
        return new Quadray(this.a, this.b, this.c, this.d);
    }
}

class SimAntBoard extends BaseBoard {
    constructor(size = 12, options = {}) {
        super(size, { name: 'SimAntBoard', verify: false });
        if (!Number.isInteger(size) || size < 2) throw new RangeError('SimAnt size must be an integer >= 2');
        this.seed = options.seed === undefined ? Math.floor(Math.random() * 4294967296) : options.seed;
        this.rng = GridUtils.createSeededRng(this.seed);
        this.size = size;
        this.volume = size ** 4;

        // 4D Grid: Stores Cell Type (Uint8)
        this.grid = new Uint8Array(this.volume);

        // Pheromones: 6 channels per cell [YFood, YHome, RFood, RHome, YDanger, RDanger]
        this.pheromones = new Float32Array(this.volume * PHERO_CHANNELS);
        // Cache the full raw graph; permeability is refreshed at each transport event.
        const edges = [];
        for (let i = 0; i < this.volume; i++) {
            const q = this.coords(i);
            for (const j of this.getNeighbors(q.a, q.b, q.c, q.d)) if (i < j) edges.push([i, j]);
        }
        this.field = new ConservativeGraphField(this.volume, edges);
        this._fieldValues = new Float64Array(this.volume);
        this._fieldNext = new Float64Array(this.volume);
        this._fieldActive = new Uint8Array(this.volume);
        this.fieldStats = this._newFieldStats();

        this.ants = [];
        this.foodStored = [50, 50]; // [Yellow, Red]
        this.queens = [null, null];
        this.nests = [null, null]; // Nest positions { a, b, c, d }

        this.tick = 0;
        this.gameOver = false; // BaseGame compatibility
        this.winner = -1; // -1 = none, 0 = yellow, 1 = red

        // AI controller for Red Colony
        this.redAI = null;
        // Yellow assist AI
        this.yellowAI = null;
        this.yellowAssistEnabled = false;

        // Colony statistics
        this.stats = {
            yellowKills: 0, redKills: 0,
            yellowDeaths: 0, redDeaths: 0,
            yellowFoodCollected: 0, redFoodCollected: 0,
            foodIncome: [0, 0], // per-tick average
            _foodSampleWindow: [[], []], // rolling 50-tick samples
        };

        // Tunnel tracking — set of keys for quick lookup
        this.tunnelSet = new Set();

        // Synergetics metadata
        this.volumeRatios = {
            tetra: SYNERGETICS?.TETRA_VOL ?? 1,
            octa: SYNERGETICS?.OCTA_VOL ?? 4,
            cubo: SYNERGETICS?.CUBO_VOL ?? 20,
        };
        this.cellVolumeUnit = (typeof Quadray !== 'undefined' && Quadray.cellVolume) ? Quadray.cellVolume() : 1;
        this.s3Constant = SYNERGETICS?.S3 ?? 1.0607;

        // Integrity check — verify round-trip on corner positions
        this._verifyIntegrity();

        this.initWorld();

        console.log(`[SimAntBoard] ${size}^4 = ${this.volume} raw cells, eight-neighbor graph`);
        console.log(`[SimAntBoard] Cell volume: ${this.cellVolumeUnit}, S3: ${this.s3Constant}`);
        console.log(`[SimAntBoard] Volume ratios T:O:C = ${this.volumeRatios.tetra}:${this.volumeRatios.octa}:${this.volumeRatios.cubo}`);
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
                console.warn(`[SimAntBoard] Round-trip failed for ${corner.toString()}: error=${result.error.toFixed(6)}`);
                allPassed = false;
            }
        }
        if (allPassed) console.log('[SimAntBoard] Round-trip integrity verified on corner positions');
    }

    // --- Helpers ---

    idx(a, b, c, d) {
        // Bounded world — treat out-of-bounds as bedrock
        if (a < 0 || a >= this.size || b < 0 || b >= this.size ||
            c < 0 || c >= this.size || d < 0 || d >= this.size) return -1;
        return ((a * this.size + b) * this.size + c) * this.size + d;
    }

    coords(i) {
        let r = i;
        const d = r % this.size; r = Math.floor(r / this.size);
        const c = r % this.size; r = Math.floor(r / this.size);
        const b = r % this.size;
        const a = Math.floor(r / this.size);
        return { a, b, c, d };
    }

    /**
     * Get cell data at a Quadray-like position {a,b,c,d}.
     * @param {Object} q — { a, b, c, d } or Quadray
     * @returns {number|null} Cell type or null if out of bounds
     */
    getCell(q) {
        const i = this.idx(q.a, q.b, q.c, q.d);
        if (i === -1) return null;
        return this.grid[i];
    }

    /**
     * Set cell data at a Quadray-like position.
     * @param {Object} q — { a, b, c, d } or Quadray
     * @param {number} value — Cell type
     */
    setCell(q, value) {
        const i = this.idx(q.a, q.b, q.c, q.d);
        if (i !== -1) {
            this.grid[i] = value;
        }
    }

    /**
     * Count alive ants of a given faction.
     * @param {number} faction
     * @returns {number}
     */
    antCount(faction) {
        let count = 0;
        for (const a of this.ants) {
            if (a.faction === faction && a.alive) count++;
        }
        return count;
    }

    /**
     * Check if faction has reached population cap.
     * @param {number} faction
     * @returns {boolean}
     */
    atPopCap(faction) {
        return this.antCount(faction) >= MAX_ANTS_PER_FACTION;
    }

    // --- Initialization ---

    initWorld() {
        // 1. Fill with Dirt
        this.grid.fill(TYPE_DIRT);

        // Size-aware opposite raw corners with non-common-offset separation.
        // The embedding is for display only: common-offset labels remain distinct cells.
        const lo = Math.floor((this.size - 1) / 4);
        const hi = this.size - 1 - lo;
        this.nests = [
            { a: lo, b: lo, c: hi, d: lo },
            { a: hi, b: hi, c: lo, d: hi },
        ];
        for (let faction = 0; faction < 2; faction++) {
            const q = this.nests[faction];
            this.digRoom(q.a, q.b, q.c, q.d, 2);
            this.spawnAnt(q.a, q.b, q.c, q.d, faction, CASTE_QUEEN);
            for (let i = 0; i < 5; i++) this.spawnAnt(q.a, q.b, q.c, q.d, faction, CASTE_WORKER);
        }

        // Initialize Red Colony AI
        if (typeof RedColonyAI !== 'undefined') {
            this.redAI = new RedColonyAI(this);
        }

        // Initialize Yellow Assist AI
        if (typeof YellowAssistAI !== 'undefined') {
            this.yellowAI = new YellowAssistAI(this);
        }

        // 4. Scatter Food (in clusters)
        this.scatterFoodClusters(10);
    }

    digRoom(ca, cb, cc, cd, radius) {
        for (let a = ca - radius; a <= ca + radius; a++) {
            for (let b = cb - radius; b <= cb + radius; b++) {
                for (let c = cc - radius; c <= cc + radius; c++) {
                    for (let d = cd - radius; d <= cd + radius; d++) {
                        const i = this.idx(a, b, c, d);
                        if (i !== -1) {
                            // Use GridUtils.manhattan for distance check
                            const dist = GridUtils.manhattan(
                                { a: a, b: b, c: c, d: d },
                                { a: ca, b: cb, c: cc, d: cd }
                            );
                            if (dist <= radius * 1.5) {
                                this.grid[i] = TYPE_EMPTY;
                                this.tunnelSet.add(GridUtils.key(a, b, c, d));
                            }
                        }
                    }
                }
            }
        }
    }

    spawnAnt(a, b, c, d, faction, caste) {
        const i = this.idx(a, b, c, d);
        if (i === -1) return null; // Invalid
        // Population cap check
        if (caste !== CASTE_QUEEN && this.atPopCap(faction)) return null;
        const ant = new Ant(a, b, c, d, faction, caste, this.rng);
        this.ants.push(ant);
        if (caste === CASTE_QUEEN) this.queens[faction] = ant;
        return ant;
    }

    spawnFood(a, b, c, d) {
        const i = this.idx(a, b, c, d);
        if (i !== -1) {
            this.grid[i] = TYPE_FOOD;
        }
    }

    /**
     * True if (a,b,c,d) falls within a colony nest's dug-room footprint.
     * Nests are dug with radius 2 in initWorld() (see digRoom's
     * dist <= radius*1.5 threshold); food scattering must never overwrite
     * that footprint, or a randomly-placed cluster can land food directly
     * on a queen's nest tile — this was reproducible as a flaky test
     * failure ("Yellow nest cell is EMPTY") whenever the random cluster
     * center happened to coincide with (3,3,3,3).
     */
    isNestProtected(a, b, c, d) {
        const NEST_DIG_RADIUS = 2;
        for (const nest of this.nests) {
            if (!nest) continue;
            const dist = GridUtils.manhattan({ a, b, c, d }, nest);
            if (dist <= NEST_DIG_RADIUS * 1.5) return true;
        }
        return false;
    }

    scatterFoodClusters(count) {
        for (let c = 0; c < count; c++) {
            // Random center
            const ca = Math.floor(this.rng() * (this.size - 2)) + 1;
            const cb = Math.floor(this.rng() * (this.size - 2)) + 1;
            const cc = Math.floor(this.rng() * (this.size - 2)) + 1;
            const cd = Math.floor(this.rng() * (this.size - 2)) + 1;

            if (this.isNestProtected(ca, cb, cc, cd)) continue; // never overwrite a nest

            // Cluster
            this.digRoom(ca, cb, cc, cd, 1); // Clear space for food

            const i = this.idx(ca, cb, cc, cd);
            if (i !== -1) this.grid[i] = TYPE_FOOD; // Center is food

            // Add neighbors using GridUtils
            const neighborCoords = this.getNeighborCoords(ca, cb, cc, cd);
            for (const nc of neighborCoords) {
                if (this.isNestProtected(nc.a, nc.b, nc.c, nc.d)) continue;
                const ni = this.idx(nc.a, nc.b, nc.c, nc.d);
                if (ni !== -1 && this.rng() > 0.5) this.grid[ni] = TYPE_FOOD;
            }
        }
    }

    // --- Updates ---

    update() {
        if (this.gameOver) return;
        this.tick++;

        // 1. Update Ants
        // Shuffle ants to avoid movement bias
        GridUtils.shuffle(this.ants, this.rng);

        for (const ant of this.ants) {
            this.updateAnt(ant);
        }

        // 2. Combat Resolution
        if (typeof CombatSystem !== 'undefined') {
            CombatSystem.resolveCombat(this);
        }

        // 3. Red Colony AI
        if (this.redAI && this.tick % 30 === 0) {
            this.redAI.update();
        }

        // 4. Yellow Assist AI
        if (this.yellowAssistEnabled && this.yellowAI && this.tick % 30 === 0) {
            this.yellowAI.update();
        }

        // 5. Queen egg-laying (organic growth) — every 60 ticks
        if (this.tick % 60 === 0) {
            this._queenAutoSpawn();
        }

        // 6. Pheromone Decay & Diffusion
        if (this.tick % 5 === 0) {
            this.diffusePheromones();
        }

        // 7. Food Regeneration — every 200 ticks
        if (this.tick % 200 === 0 && this.tick > 0) {
            this.regenerateFood();
        }

        // 8. Update food income tracking
        this._trackFoodIncome();

        // 9. Check game-over/win conditions
        this._checkEndConditions();
    }

    /** Queen auto-spawns a worker when food > 80 and pop < cap */
    _queenAutoSpawn() {
        for (let f = 0; f < 2; f++) {
            const queen = this.queens[f];
            if (!queen || !queen.alive) continue;
            if (this.foodStored[f] >= 15 && !this.atPopCap(f)) {
                this.foodStored[f] -= 10;
                this.spawnAnt(queen.a, queen.b, queen.c, queen.d, f, CASTE_WORKER);
            }
        }
    }

    /** Track rolling food income rate */
    _trackFoodIncome() {
        for (let f = 0; f < 2; f++) {
            this.stats._foodSampleWindow[f].push(this.foodStored[f]);
            if (this.stats._foodSampleWindow[f].length > 50) {
                this.stats._foodSampleWindow[f].shift();
            }
            const w = this.stats._foodSampleWindow[f];
            if (w.length >= 2) {
                this.stats.foodIncome[f] = ((w[w.length - 1] - w[0]) / w.length).toFixed(1);
            }
        }
    }

    /** Check win/loss conditions */
    _checkEndConditions() {
        if (this.gameOver) return;
        const yellowDead = this.queens[0] && !this.queens[0].alive;
        const redDead = this.queens[1] && !this.queens[1].alive;
        if (yellowDead || redDead) {
            this.gameOver = true;
            this.winner = yellowDead && redDead ? -1 : yellowDead ? 1 : 0;
        }
    }

    /** Regenerate food clusters in unexplored dirt regions */
    regenerateFood() {
        const clusterCount = 2 + Math.floor(this.rng() * 2); // 2–3 clusters
        for (let c = 0; c < clusterCount; c++) {
            const ca = Math.floor(this.rng() * (this.size - 2)) + 1;
            const cb = Math.floor(this.rng() * (this.size - 2)) + 1;
            const cc = Math.floor(this.rng() * (this.size - 2)) + 1;
            const cd = Math.floor(this.rng() * (this.size - 2)) + 1;
            const i = this.idx(ca, cb, cc, cd);
            if (i !== -1 && this.grid[i] === TYPE_DIRT) {
                // Create small food cluster in dirt
                this.digRoom(ca, cb, cc, cd, 1);
                this.grid[i] = TYPE_FOOD;
                const neighbors = this.getNeighbors(ca, cb, cc, cd);
                for (const ni of neighbors) {
                    if (this.rng() > 0.6) this.grid[ni] = TYPE_FOOD;
                }
            }
        }
    }

    updateAnt(ant) {
        if (this.gameOver || !ant.alive) return;

        // Save previous position for animation interpolation
        ant.prevA = ant.a; ant.prevB = ant.b; ant.prevC = ant.c; ant.prevD = ant.d;

        // Hunger
        ant.energy -= 0.05;
        if (ant.energy <= 0) {
            ant.hp -= 0.1;
            if (ant.hp <= 0) {
                ant.alive = false;
                ant.deathTick = this.tick;
                const deaths = ant.faction === FACTION_YELLOW ? 'yellowDeaths' : 'redDeaths';
                this.stats[deaths]++;
                return;
            }
        }

        // Behavior Logic
        if (ant.caste === CASTE_QUEEN) return; // Queens just sit

        // Drop Home pheromone
        const homeChannel = ant.faction === FACTION_YELLOW ? PHERO_YELLOW_HOME : PHERO_RED_HOME;
        this.dropPheromone(ant, homeChannel, 2.0);

        const i = this.idx(ant.a, ant.b, ant.c, ant.d);
        ant.explored.add(i);

        // Check current cell for food pickup
        if (this.grid[i] === TYPE_FOOD && !ant.carrying) {
            this.grid[i] = TYPE_EMPTY;
            ant.carrying = 10;
            ant.state = 'returning';
        }
        this._deliverFood(ant);

        // Move
        const neighbors = ant.carrying ? [] : this.getNeighborCoords(ant.a, ant.b, ant.c, ant.d);

        let bestMove = ant.carrying ? this._homeMove(ant) : null;
        let maxVal = -Infinity;

        // Determine pheromone channel to follow
        const foodChannel = ant.faction === FACTION_YELLOW ? PHERO_YELLOW_FOOD : PHERO_RED_FOOD;
        const dangerChannel = ant.faction === FACTION_YELLOW ? PHERO_YELLOW_DANGER : PHERO_RED_DANGER;

        for (const n of neighbors) {
            const ni = this.idx(n.a, n.b, n.c, n.d);
            if (ni === -1) continue;

            let score = this.rng() * 0.5; // Simulation-owned random noise

            // Pheromone attraction
            const pVal = this.pheromones[ni * PHERO_CHANNELS + foodChannel];
            score += pVal * 2.0;

            // Danger avoidance (workers and scouts avoid, soldiers don't)
            if (ant.caste !== CASTE_SOLDIER) {
                const dangerVal = this.pheromones[ni * PHERO_CHANNELS + dangerChannel];
                score -= dangerVal * 1.5;
            }

            // Scout behavior: spiral exploration away from home
            if (ant.caste === CASTE_SCOUT && ant.state === 'scouting') {
                const homeSmell = this.pheromones[ni * PHERO_CHANNELS + homeChannel];
                score -= homeSmell * 0.8; // Explore away from home
                score += this.rng() * 3.0; // High randomness
            }

            // Target-based movement (soldiers directed by AI)
            if (ant.target && ant.state === 'attacking') {
                const distNow = GridUtils.manhattan(
                    { a: ant.a, b: ant.b, c: ant.c, d: ant.d },
                    { a: ant.target.a, b: ant.target.b, c: ant.target.c, d: ant.target.d }
                );
                const distNext = GridUtils.manhattan(
                    { a: n.a, b: n.b, c: n.c, d: n.d },
                    { a: ant.target.a, b: ant.target.b, c: ant.target.c, d: ant.target.d }
                );
                if (distNext < distNow) score += 10; // Strong bias toward target
            }

            // Terrain cost
            const cell = this.grid[ni];
            if (cell === TYPE_BEDROCK) continue;
            if (cell === TYPE_DIRT) {
                if (ant.caste === CASTE_WORKER || ant.caste === CASTE_SCOUT) {
                    score -= 2.0; // Digging cost
                } else {
                    score = -Infinity; // Soldiers can't dig well
                }
            } else if (cell === TYPE_FOOD) {
                score += 100; // Found food!
            }

            // Prefer tunnel network for speed
            const key = GridUtils.key(n.a, n.b, n.c, n.d);
            if (this.tunnelSet.has(key)) {
                score += 0.3; // Small tunnel preference
            }
            if ((ant.caste === CASTE_WORKER || ant.caste === CASTE_SCOUT) && ant.explored.has(ni)) {
                // Novel ground can beat an empty retreat without removing reverse edges.
                score -= 3.0;
            }

            if (score > maxVal) {
                maxVal = score;
                bestMove = n;
            }
        }

        if (bestMove) {
            const ni = this.idx(bestMove.a, bestMove.b, bestMove.c, bestMove.d);
            if (this.grid[ni] === TYPE_DIRT) {
                // Dig
                if (ant.energy > 5) {
                    this.grid[ni] = TYPE_EMPTY;
                    this.tunnelSet.add(GridUtils.key(bestMove.a, bestMove.b, bestMove.c, bestMove.d));
                    ant.energy -= 2;
                    ant.a = bestMove.a; ant.b = bestMove.b; ant.c = bestMove.c; ant.d = bestMove.d;
                }
            } else {
                // Move
                ant.a = bestMove.a; ant.b = bestMove.b; ant.c = bestMove.c; ant.d = bestMove.d;
            }
            if (ant.carrying && this.idx(ant.a, ant.b, ant.c, ant.d) === ant.homeRoute[ant.homeRoute.length - 1]) {
                ant.homeRoute.pop();
            }

            // Drop Food pheromone if carrying
            if (ant.carrying) {
                const fc = ant.faction === FACTION_YELLOW ? PHERO_YELLOW_FOOD : PHERO_RED_FOOD;
                this.dropPheromone(ant, fc, 5.0);

                this._deliverFood(ant);
            }
        }
    }

    /** Live terrain permission shared by route planning and next-step validation. */
    _canEnter(ant, i) {
        const cell = this.grid[i];
        return cell === TYPE_EMPTY || cell === TYPE_FOOD ||
            (cell === TYPE_DIRT && ant.energy > 5 &&
                (ant.caste === CASTE_WORKER || ant.caste === CASTE_SCOUT));
    }

    /**
     * Plan once per return, then consume one reversible raw edge per decision.
     * BFS stops at the existing delivery radius; Manhattan distance is only
     * the goal test, never a monotonic movement restriction. No world cache:
     * a blocked next step or relocated queen invalidates the private route.
     */
    _homeMove(ant) {
        const queen = this.queens[ant.faction];
        if (!queen || !queen.alive) return null;
        const goal = this.idx(queen.a, queen.b, queen.c, queen.d);
        const start = this.idx(ant.a, ant.b, ant.c, ant.d);
        const next = ant.homeRoute[ant.homeRoute.length - 1];
        if (ant.homeGoal !== goal || (next !== undefined &&
            (!this._canEnter(ant, next) || GridUtils.manhattan(ant, this.coords(next)) !== 1))) {
            ant.homeRoute.length = 0;
            ant.homeRetry = 0;
        }
        ant.homeGoal = goal;
        if (ant.homeRoute.length) return this.coords(ant.homeRoute[ant.homeRoute.length - 1]);
        // Unreachable ants retry after eight decisions, not a whole-world BFS
        // every tick. Reopening terrain is discovered on the next retry.
        if (ant.homeRetry > 0) {
            ant.homeRetry--;
            return null;
        }
        const parent = new Int32Array(this.volume).fill(-1);
        const queue = [start];
        parent[start] = start;
        for (let k = 0; k < queue.length; k++) {
            const i = queue[k];
            const q = this.coords(i);
            if (GridUtils.manhattan(q, queen) < 3) {
                for (let j = i; j !== start; j = parent[j]) ant.homeRoute.push(j);
                return ant.homeRoute.length ? this.coords(ant.homeRoute[ant.homeRoute.length - 1]) : null;
            }
            for (const j of this.getNeighbors(q.a, q.b, q.c, q.d)) {
                if (parent[j] !== -1 || !this._canEnter(ant, j)) continue;
                parent[j] = i;
                queue.push(j);
            }
        }
        ant.homeRetry = 8;
        return null;
    }
    _deliverFood(ant) {
        const queen = this.queens[ant.faction];
        if (!ant.carrying || !queen || !queen.alive || GridUtils.manhattan(ant, queen) >= 3) return;
        this.foodStored[ant.faction] += ant.carrying;
        const key = ant.faction === FACTION_YELLOW ? 'yellowFoodCollected' : 'redFoodCollected';
        this.stats[key] += ant.carrying;
        ant.carrying = 0;
        ant.energy = 100;
        ant.state = 'foraging';
        ant.homeRoute.length = 0;
        ant.homeGoal = -1;
        ant.homeRetry = 0;
    }

    dropPheromone(ant, typeIdx, amount) {
        const i = this.idx(ant.a, ant.b, ant.c, ant.d);
        if (i !== -1) {
            const offset = i * PHERO_CHANNELS + typeIdx;
            const requested = this.pheromones[offset] + amount;
            const stored = Math.min(100, requested);
            this.fieldStats.sources[typeIdx] += amount;
            this.fieldStats.saturationLoss[typeIdx] += requested - stored;
            this.pheromones[offset] = stored;
            this.fieldStats.roundingDelta[typeIdx] += this.pheromones[offset] - stored;
        }
    }

    /** Emit danger pheromone at a position */
    emitDanger(a, b, c, d, faction, amount) {
        const i = this.idx(a, b, c, d);
        if (i !== -1) {
            const channel = faction === FACTION_YELLOW ? PHERO_YELLOW_DANGER : PHERO_RED_DANGER;
            this.dropPheromone({ a, b, c, d }, channel, amount);
        }
    }

    /** Per-channel mass accounting; transport itself has no sink. */
    _newFieldStats() {
        return {
            sources: Array(PHERO_CHANNELS).fill(0),
            saturationLoss: Array(PHERO_CHANNELS).fill(0),
            evaporationLoss: Array(PHERO_CHANNELS).fill(0),
            roundingDelta: Array(PHERO_CHANNELS).fill(0),
            lastBefore: Array(PHERO_CHANNELS).fill(0),
            lastAfter: Array(PHERO_CHANNELS).fill(0),
        };
    }

    fieldTotals() {
        const totals = Array(PHERO_CHANNELS).fill(0);
        for (let i = 0; i < this.pheromones.length; i++) totals[i % PHERO_CHANNELS] += this.pheromones[i];
        return totals;
    }

    diffusePheromones() {
        // Food sites are permeable too; dirt/bedrock hold their field without
        // transporting it. Digging opens incident edges on the next event.
        const transport = this.tick % 10 === 0;
        for (let i = 0; i < this.volume; i++) {
            this._fieldActive[i] = this.grid[i] === TYPE_EMPTY || this.grid[i] === TYPE_FOOD ? 1 : 0;
        }
        for (let ch = 0; ch < PHERO_CHANNELS; ch++) {
            let before = 0, after = 0, evaporated = 0, rounding = 0;
            for (let i = 0; i < this.volume; i++) {
                const value = this.pheromones[i * PHERO_CHANNELS + ch];
                this._fieldValues[i] = value;
                before += value;
            }
            const values = transport
                ? this.field.step(this._fieldValues, 0.8, this._fieldNext, this._fieldActive)
                : this._fieldValues;
            for (let i = 0; i < this.volume; i++) {
                // Explicit 2% evaporation per five logical ticks, no cutoff.
                const decayed = values[i] * 0.98;
                evaporated += values[i] - decayed;
                const offset = i * PHERO_CHANNELS + ch;
                this.pheromones[offset] = decayed;
                after += this.pheromones[offset];
                rounding += this.pheromones[offset] - decayed;
            }
            this.fieldStats.lastBefore[ch] = before;
            this.fieldStats.lastAfter[ch] = after;
            this.fieldStats.evaporationLoss[ch] += evaporated;
            this.fieldStats.roundingDelta[ch] += rounding;
        }
    }

    /**
     * Eight reversible raw +/-unit-component neighbors. No gauge reduction:
     * these are independent gameplay labels, not twelve physical FCC neighbors.
     */
    getNeighborCoords(a, b, c, d) {
        return [
            { a: a + 1, b, c, d }, { a: a - 1, b, c, d },
            { a, b: b + 1, c, d }, { a, b: b - 1, c, d },
            { a, b, c: c + 1, d }, { a, b, c: c - 1, d },
            { a, b, c, d: d + 1 }, { a, b, c, d: d - 1 },
        ];
    }

    /**
     * Get valid neighbor indices using GridUtils.
     */
    getNeighbors(a, b, c, d) {
        const coords = this.getNeighborCoords(a, b, c, d);
        return coords.map(c => this.idx(c.a, c.b, c.c, c.d)).filter(i => i !== -1);
    }

    /**
     * Compute colony health for a faction (0–100 scale).
     * @param {number} faction
     * @returns {number}
     */
    colonyHealth(faction) {
        const queen = this.queens[faction];
        if (!queen || !queen.alive) return 0;

        const queenFactor = (queen.hp / queen.maxHp) * 30; // 30% weight
        const popFactor = Math.min(30, (this.antCount(faction) / 20) * 30); // 30% weight
        const foodFactor = Math.min(20, (this.foodStored[faction] / 100) * 20); // 20% weight
        const combatFactor = Math.min(20, Math.max(0,
            10 + (this.stats[faction === 0 ? 'yellowKills' : 'redKills'] -
                this.stats[faction === 0 ? 'yellowDeaths' : 'redDeaths']) * 2
        )); // 20% weight

        return Math.round(Math.min(100, queenFactor + popFactor + foodFactor + combatFactor));
    }

    /**
     * Get board metadata for HUD display.
     * @returns {Object}
     */
    getMetadata() {
        const yAnts = this.ants.filter(a => a.faction === 0 && a.alive);
        const rAnts = this.ants.filter(a => a.faction === 1 && a.alive);
        const totalCells = this.grid.length;
        let tunnelCells = 0;
        let foodCells = 0;
        for (let i = 0; i < totalCells; i++) {
            if (this.grid[i] === TYPE_EMPTY) tunnelCells++;
            if (this.grid[i] === TYPE_FOOD) foodCells++;
        }

        return {
            tick: this.tick,
            yellowAnts: yAnts.length,
            redAnts: rAnts.length,
            yellowFood: Math.floor(this.foodStored[0]),
            redFood: Math.floor(this.foodStored[1]),
            yellowQueenAlive: this.queens[0] && this.queens[0].alive,
            redQueenAlive: this.queens[1] && this.queens[1].alive,
            yellowHealth: this.colonyHealth(0),
            redHealth: this.colonyHealth(1),
            totalCells,
            tunnelCells,
            foodCells,
            tunnelPercent: ((tunnelCells / totalCells) * 100).toFixed(1),
            volumeRatios: this.volumeRatios,
            cellVolume: this.cellVolumeUnit,
            s3: this.s3Constant,
            gameOver: this.gameOver,
            winner: this.winner,
            stats: { ...this.stats },
            foodIncome: [...this.stats.foodIncome],
            yellowAssist: this.yellowAssistEnabled,
            popCap: MAX_ANTS_PER_FACTION,
            topology: 'raw eight-neighbor +/-unit-component graph',
            seed: this.seed,
            field: { totals: this.fieldTotals(), ...this.fieldStats, mixing: 0.8, evaporation: 0.02,
                transportTicks: 10, evaporationTicks: 5 },
        };
    }

    /** Reset board to initial state. */
    reset() {
        this.rng = GridUtils.createSeededRng(this.seed);
        this.fieldStats = this._newFieldStats();
        this.grid = new Uint8Array(this.volume);
        this.pheromones = new Float32Array(this.volume * PHERO_CHANNELS);
        this.ants = [];
        this.foodStored = [50, 50];
        this.queens = [null, null];
        this.nests = [null, null];
        this.tick = 0;
        this.gameOver = false;
        this.winner = -1;
        this.redAI = null;
        this.yellowAI = null;
        this.tunnelSet = new Set();
        this.stats = {
            yellowKills: 0, redKills: 0,
            yellowDeaths: 0, redDeaths: 0,
            yellowFoodCollected: 0, redFoodCollected: 0,
            foodIncome: [0, 0],
            _foodSampleWindow: [[], []],
        };
        this.initWorld();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SimAntBoard, Ant, TYPE_EMPTY, TYPE_DIRT, TYPE_BEDROCK, TYPE_FOOD,
        FACTION_YELLOW, FACTION_RED, CASTE_QUEEN, CASTE_WORKER, CASTE_SOLDIER, CASTE_SCOUT,
        PHERO_CHANNELS, PHERO_YELLOW_FOOD, PHERO_YELLOW_HOME, PHERO_RED_FOOD, PHERO_RED_HOME,
        PHERO_YELLOW_DANGER, PHERO_RED_DANGER, MAX_ANTS_PER_FACTION
    };
}
