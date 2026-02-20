/**
 * simant_board.js — 4D SimAnt Board on IVM Grid
 *
 * Features:
 * - 4D Grid (12^4 = 20,736 cells)
 * - Terrain: DIRT, EMPTY, BEDROCK, FOOD
 * - Pheromones: Float32Array for diffusion
 * - Factions: Yellow (Player) vs Red (AI)
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

// Cell Types
const TYPE_EMPTY = 0;
const TYPE_DIRT = 1;
const TYPE_BEDROCK = 2;
const TYPE_FOOD = 3;

// Factions
const FACTION_YELLOW = 0;
const FACTION_RED = 1;

// Castes
const CASTE_QUEEN = 0;
const CASTE_WORKER = 1;
const CASTE_SOLDIER = 2;

class Ant {
    constructor(x, y, z, w, faction, caste) {
        // Position (integer coordinates in Grid)
        this.x = x; this.y = y; this.z = z; this.w = w;
        this.faction = faction;
        this.caste = caste;

        // Stats
        this.hp = caste === CASTE_SOLDIER ? 50 : (caste === CASTE_QUEEN ? 200 : 20);
        this.maxHp = this.hp;
        this.energy = 100; // Hunger
        this.alive = true;
        this.carrying = 0; // Food amount

        // AI State
        this.target = null; // {x,y,z,w}
        this.state = 'idle'; // idle, foraging, returning, attacking
    }

    // Convert grid coords to Quadray for rendering/distance
    toQuadray() {
        return new Quadray(this.x, this.y, this.z, this.w);
    }
}

class SimAntBoard extends BaseBoard {
    constructor(size = 12) {
        super(size, { name: 'SimAntBoard', verify: false });
        this.size = size;
        this.volume = size ** 4;

        // 4D Grid: Stores Cell Type (Uint8)
        this.grid = new Uint8Array(this.volume);

        // Pheromones: 4 channels per cell [YellowFood, YellowHome, RedFood, RedHome]
        this.pheromones = new Float32Array(this.volume * 4);

        this.ants = [];
        this.foodStored = [50, 50]; // [Yellow, Red]
        this.queens = [null, null];
        this.nests = [null, null]; // Nest positions {x,y,z,w}

        this.tick = 0;
        this.gameOver = false; // BaseGame compatibility

        // AI controller for Red Colony
        this.redAI = null;

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

        console.log(`[SimAntBoard] ${size}^4 = ${this.volume} cell IVM grid`);
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

    idx(x, y, z, w) {
        // Bounded world — treat out-of-bounds as bedrock
        if (x < 0 || x >= this.size || y < 0 || y >= this.size ||
            z < 0 || z >= this.size || w < 0 || w >= this.size) return -1;
        return ((x * this.size + y) * this.size + z) * this.size + w;
    }

    coords(i) {
        let r = i;
        const w = r % this.size; r = Math.floor(r / this.size);
        const z = r % this.size; r = Math.floor(r / this.size);
        const y = r % this.size;
        const x = Math.floor(r / this.size);
        return { x, y, z, w };
    }

    /**
     * Get cell data at a Quadray-like position {a,b,c,d} or (x,y,z,w).
     * @param {Object} q — { a, b, c, d } or Quadray
     * @returns {number|null} Cell type or null if out of bounds
     */
    getCell(q) {
        const i = this.idx(q.a ?? q.x, q.b ?? q.y, q.c ?? q.z, q.d ?? q.w);
        if (i === -1) return null;
        return this.grid[i];
    }

    /**
     * Set cell data at a Quadray-like position.
     * @param {Object} q — { a, b, c, d } or Quadray
     * @param {number} value — Cell type
     */
    setCell(q, value) {
        const i = this.idx(q.a ?? q.x, q.b ?? q.y, q.c ?? q.z, q.d ?? q.w);
        if (i !== -1) {
            this.grid[i] = value;
        }
    }

    // --- Initialization ---

    initWorld() {
        // 1. Fill with Dirt
        this.grid.fill(TYPE_DIRT);

        // 3. Dig Chambers for Colonies
        // Yellow: Near (3,3,3,3)
        this.digRoom(3, 3, 3, 3, 2);
        this.nests[0] = { x: 3, y: 3, z: 3, w: 3 };
        this.spawnAnt(3, 3, 3, 3, FACTION_YELLOW, CASTE_QUEEN);
        for (let i = 0; i < 5; i++) this.spawnAnt(3, 3, 3, 3, FACTION_YELLOW, CASTE_WORKER);

        // Red: Near (size-4,...)
        const f = this.size - 4;
        this.digRoom(f, f, f, f, 2);
        this.nests[1] = { x: f, y: f, z: f, w: f };
        this.spawnAnt(f, f, f, f, FACTION_RED, CASTE_QUEEN);
        for (let i = 0; i < 5; i++) this.spawnAnt(f, f, f, f, FACTION_RED, CASTE_WORKER);

        // Initialize Red Colony AI
        if (typeof RedColonyAI !== 'undefined') {
            this.redAI = new RedColonyAI(this);
        }

        // 4. Scatter Food (in clusters)
        this.scatterFoodClusters(10);
    }

    digRoom(cx, cy, cz, cw, radius) {
        for (let x = cx - radius; x <= cx + radius; x++) {
            for (let y = cy - radius; y <= cy + radius; y++) {
                for (let z = cz - radius; z <= cz + radius; z++) {
                    for (let w = cw - radius; w <= cw + radius; w++) {
                        const i = this.idx(x, y, z, w);
                        if (i !== -1) {
                            // Use GridUtils.manhattan for distance check
                            const dist = GridUtils.manhattan(
                                { a: x, b: y, c: z, d: w },
                                { a: cx, b: cy, c: cz, d: cw }
                            );
                            if (dist <= radius * 1.5) {
                                this.grid[i] = TYPE_EMPTY;
                            }
                        }
                    }
                }
            }
        }
    }

    spawnAnt(x, y, z, w, faction, caste) {
        const i = this.idx(x, y, z, w);
        if (i === -1) return; // Invalid
        const ant = new Ant(x, y, z, w, faction, caste);
        this.ants.push(ant);
        if (caste === CASTE_QUEEN) this.queens[faction] = ant;
    }

    spawnFood(x, y, z, w) {
        const i = this.idx(x, y, z, w);
        if (i !== -1) {
            this.grid[i] = TYPE_FOOD;
        }
    }

    scatterFoodClusters(count) {
        for (let c = 0; c < count; c++) {
            // Random center
            const cx = Math.floor(Math.random() * (this.size - 2)) + 1;
            const cy = Math.floor(Math.random() * (this.size - 2)) + 1;
            const cz = Math.floor(Math.random() * (this.size - 2)) + 1;
            const cw = Math.floor(Math.random() * (this.size - 2)) + 1;

            // Cluster
            this.digRoom(cx, cy, cz, cw, 1); // Clear space for food

            const i = this.idx(cx, cy, cz, cw);
            if (i !== -1) this.grid[i] = TYPE_FOOD; // Center is food

            // Add neighbors using GridUtils
            const neighbors = this.getNeighbors(cx, cy, cz, cw);
            for (const ni of neighbors) {
                if (Math.random() > 0.5) this.grid[ni] = TYPE_FOOD;
            }
        }
    }

    // --- Updates ---

    update() {
        this.tick++;

        // 1. Update Ants
        // Shuffle ants to avoid movement bias
        this.ants.sort(() => Math.random() - 0.5);

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

        // 4. Pheromone Decay & Diffusion (Simplified)
        if (this.tick % 5 === 0) {
            this.diffusePheromones();
        }

        // 5. Check game-over condition (queen death)
        if (this.queens[0] && !this.queens[0].alive) {
            this.gameOver = true;
        }
    }

    updateAnt(ant) {
        if (!ant.alive) return;

        // Hunger
        ant.energy -= 0.05;
        if (ant.energy <= 0) {
            ant.hp -= 0.1;
            if (ant.hp <= 0) ant.alive = false;
        }

        // Behavior Logic
        if (ant.caste === CASTE_QUEEN) return; // Queens just sit

        // drop Home pheromone
        this.dropPheromone(ant, ant.faction === FACTION_YELLOW ? 1 : 3, 2.0); // 1=YellowHome

        const i = this.idx(ant.x, ant.y, ant.z, ant.w);

        // Check current cell
        if (this.grid[i] === TYPE_FOOD && !ant.carrying) {
            // Pick up food
            this.grid[i] = TYPE_EMPTY;
            ant.carrying = 10; // Units of food
            ant.state = 'returning';
        }

        // Move
        const neighbors = this.getNeighborCoords(ant.x, ant.y, ant.z, ant.w);
        // Filter valid moves
        // Logic:
        // - If carrying, follow 'Home' pheromone gradient (uphill)
        // - If foraging, follow 'Food' pheromone gradient
        // - Else random
        // - Can DIG dirt (costs energy)

        let bestMove = null;
        let maxVal = -Infinity;

        // Gradient Search
        const pheromoneType = ant.carrying ? (ant.faction === FACTION_YELLOW ? 1 : 3) : (ant.faction === FACTION_YELLOW ? 0 : 2); // 0=YellowFood, 1=YellowHome...
        // Wait, if carrying, follow HOME. If foraging, follow FOOD.

        for (const n of neighbors) {
            const ni = this.idx(n.x, n.y, n.z, n.w);
            if (ni === -1) continue;

            let score = Math.random() * 0.5; // Random noise

            // Pheromone attraction
            // If carrying, go UP Home gradient
            // If foraging, go UP Food gradient (if weak, go DOWN Home gradient = away from home)
            const pVal = this.pheromones[ni * 4 + pheromoneType];
            score += pVal * 2.0;

            // If foraging and smell home strongly, maybe go away? (Exploration bias)
            if (!ant.carrying) {
                const homeSmell = this.pheromones[ni * 4 + (pheromoneType + 1)];
                // score -= homeSmell * 0.5;
            }

            // Target-based movement (soldiers directed by AI)
            if (ant.target && ant.state === 'attacking') {
                const distNow = GridUtils.manhattan(
                    { a: ant.x, b: ant.y, c: ant.z, d: ant.w },
                    { a: ant.target.x, b: ant.target.y, c: ant.target.z, d: ant.target.w }
                );
                const distNext = GridUtils.manhattan(
                    { a: n.x, b: n.y, c: n.z, d: n.w },
                    { a: ant.target.x, b: ant.target.y, c: ant.target.z, d: ant.target.w }
                );
                if (distNext < distNow) score += 10; // Strong bias toward target
            }

            // Terrain cost
            const cell = this.grid[ni];
            if (cell === TYPE_DIRT) {
                if (ant.caste === CASTE_WORKER) score -= 2.0; // Digging cost
                else score = -Infinity; // Soldiers can't dig well
            } else if (cell === TYPE_FOOD) {
                if (!ant.carrying) score += 100; // Found food!
            }

            if (score > maxVal) {
                maxVal = score;
                bestMove = n;
            }
        }

        if (bestMove) {
            const ni = this.idx(bestMove.x, bestMove.y, bestMove.z, bestMove.w);
            if (this.grid[ni] === TYPE_DIRT) {
                // Dig
                if (ant.energy > 5) {
                    this.grid[ni] = TYPE_EMPTY;
                    ant.energy -= 2;
                    ant.x = bestMove.x; ant.y = bestMove.y; ant.z = bestMove.z; ant.w = bestMove.w;
                }
            } else {
                // Move
                ant.x = bestMove.x; ant.y = bestMove.y; ant.z = bestMove.z; ant.w = bestMove.w;
            }

            // Drop Food pheromone if carrying
            if (ant.carrying) {
                this.dropPheromone(ant, ant.faction === FACTION_YELLOW ? 0 : 2, 5.0); // 0=YellowFood

                // At home?
                // Check dist to Queen
                const q = this.queens[ant.faction];
                if (q) {
                    const distToQueen = GridUtils.manhattan(
                        { a: ant.x, b: ant.y, c: ant.z, d: ant.w },
                        { a: q.x, b: q.y, c: q.z, d: q.w }
                    );
                    if (distToQueen < 3) {
                        // Drop food
                        this.foodStored[ant.faction] += ant.carrying;
                        ant.carrying = 0;
                        ant.energy = 100; // Refuel
                    }
                }
            }
        }
    }

    dropPheromone(ant, typeIdx, amount) {
        const i = this.idx(ant.x, ant.y, ant.z, ant.w);
        if (i !== -1) {
            this.pheromones[i * 4 + typeIdx] = Math.min(100, this.pheromones[i * 4 + typeIdx] + amount);
        }
    }

    diffusePheromones() {
        // Simple decay for performance (True diffusion in 4D is expensive in JS loop)
        // Just decay 2% per tick
        for (let i = 0; i < this.pheromones.length; i++) {
            this.pheromones[i] *= 0.98;
            if (this.pheromones[i] < 0.1) this.pheromones[i] = 0;
        }
    }

    /**
     * Get neighbor coordinates using GridUtils.DIRECTIONS_8.
     * Delegates to GridUtils for consistent IVM direction handling.
     */
    getNeighborCoords(x, y, z, w) {
        return GridUtils.DIRECTIONS_8.map(([da, db, dc, dd]) => ({
            x: x + da, y: y + db, z: z + dc, w: w + dd
        }));
    }

    /**
     * Get valid neighbor indices using GridUtils.
     */
    getNeighbors(x, y, z, w) {
        const coords = this.getNeighborCoords(x, y, z, w);
        return coords.map(c => this.idx(c.x, c.y, c.z, c.w)).filter(i => i !== -1);
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
            totalCells,
            tunnelCells,
            foodCells,
            tunnelPercent: ((tunnelCells / totalCells) * 100).toFixed(1),
            worldTetravolume: (totalCells * (SYNERGETICS?.S3 ?? 1.0607)).toFixed(0),
            volumeRatios: this.volumeRatios,
            cellVolume: this.cellVolumeUnit,
            s3: this.s3Constant,
            gameOver: this.gameOver,
        };
    }

    /** Reset board to initial state. */
    reset() {
        this.grid = new Uint8Array(this.volume);
        this.pheromones = new Float32Array(this.volume * 4);
        this.ants = [];
        this.foodStored = [50, 50];
        this.queens = [null, null];
        this.nests = [null, null];
        this.tick = 0;
        this.gameOver = false;
        this.redAI = null;
        this.initWorld();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SimAntBoard, Ant, TYPE_EMPTY, TYPE_DIRT, TYPE_BEDROCK, TYPE_FOOD,
        FACTION_YELLOW, FACTION_RED, CASTE_QUEEN, CASTE_WORKER, CASTE_SOLDIER
    };
}
