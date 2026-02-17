/**
 * CatanBoard.js — 4D Catan Resource Trading on IVM Grid
 *
 * Tetrahedral tile-based resource trading game. Settlements, roads,
 * cities, trading, development cards, robber mechanics.
 * Win condition: first to 10 VP.
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
 * @module CatanBoard
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

const ResourceType = { WOOD: 'wood', BRICK: 'brick', WHEAT: 'wheat', SHEEP: 'sheep', ORE: 'ore', DESERT: 'desert' };
const RESOURCE_COLORS = { wood: '#4CAF50', brick: '#E65100', wheat: '#FFD54F', sheep: '#81C784', ore: '#78909C', desert: '#D2B48C' };

const BUILD_COSTS = {
    road: { wood: 1, brick: 1 },
    settlement: { wood: 1, brick: 1, wheat: 1, sheep: 1 },
    city: { ore: 3, wheat: 2 },
    devCard: { ore: 1, wheat: 1, sheep: 1 }
};

// Shared constants defined here so all modules can reference them

const TurnPhase = {
    ROLL: 'roll',
    ROBBER: 'robber',
    TRADE: 'trade',
    BUILD: 'build',
    END_TURN: 'endTurn'
};

// DevCardType defined here (loaded before catan_cards.js) so board can reference it
const DevCardType = {
    KNIGHT: 'knight',
    VICTORY_POINT: 'victoryPoint',
    ROAD_BUILDING: 'roadBuilding',
    YEAR_OF_PLENTY: 'yearOfPlenty',
    MONOPOLY: 'monopoly'
};

// Utility functions used by board and other modules
function canAfford(player, cost) {
    for (const [res, amt] of Object.entries(cost)) {
        if ((player.resources[res] || 0) < amt) return false;
    }
    return true;
}

function deductCost(player, cost) {
    for (const [res, amt] of Object.entries(cost)) {
        player.resources[res] -= amt;
    }
}

class CatanTile {
    constructor(pos, resource, number) {
        this.pos = pos; // {a,b,c,d}
        this.resource = resource;
        this.number = number; // 2-12
    }
    toQuadray() { return new Quadray(this.pos.a, this.pos.b, this.pos.c, this.pos.d); }
}

class CatanBoard {
    constructor() {
        this.tiles = [];
        this.grid = new Map();              // Quadray key -> tile/settlement data
        this.players = [
            {
                name: 'Red', color: '#ff4444',
                resources: { wood: 2, brick: 2, wheat: 1, sheep: 1, ore: 0 },
                settlements: [], roads: [], points: 0,
                devCards: [], knightsPlayed: 0,
                playedDevCardThisTurn: false,
                cardsBoughtThisTurn: [],
                ports: [],
                hasLongestRoad: false,
                hasLargestArmy: false
            },
            {
                name: 'Blue', color: '#4488ff',
                resources: { wood: 2, brick: 2, wheat: 1, sheep: 1, ore: 0 },
                settlements: [], roads: [], points: 0,
                devCards: [], knightsPlayed: 0,
                playedDevCardThisTurn: false,
                cardsBoughtThisTurn: [],
                ports: [],
                hasLongestRoad: false,
                hasLargestArmy: false
            }
        ];
        this.currentPlayer = 0;
        this.dice = [0, 0];
        this.robber = null;
        this.robberTile = -1;
        this.gameOver = false;
        this.moveCount = 0;

        // Synergetics metadata
        this.volumeRatios = {
            tetra: SYNERGETICS?.TETRA_VOL ?? 1,
            octa: SYNERGETICS?.OCTA_VOL ?? 4,
            cubo: SYNERGETICS?.CUBO_VOL ?? 20,
        };
        this.cellVolumeUnit = typeof Quadray !== 'undefined' && Quadray.cellVolume ? Quadray.cellVolume() : 1;
        this.s3Constant = SYNERGETICS?.S3 ?? 1.0607;

        this.generateBoard();

        // Integrity check — verify round-trip on tile corner positions
        this._verifyIntegrity();

        console.log(`[CatanBoard] ${this.tiles.length} tiles on IVM grid`);
        console.log(`[CatanBoard] Cell volume: ${this.cellVolumeUnit}, S3: ${this.s3Constant}`);
        console.log(`[CatanBoard] Volume ratios T:O:C = ${this.volumeRatios.tetra}:${this.volumeRatios.octa}:${this.volumeRatios.cubo}`);
    }

    /** Verify geometric integrity on construction. */
    _verifyIntegrity() {
        if (typeof verifyRoundTrip !== 'function') return;
        const corners = [
            new Quadray(0, 0, 0, 0),
            new Quadray(4, 4, 0, 3),
            new Quadray(3, 0, 0, 0),
            new Quadray(0, 3, 0, 0),
        ];
        let allPassed = true;
        for (const corner of corners) {
            const result = verifyRoundTrip(corner);
            if (!result.passed) {
                console.warn(`[CatanBoard] Round-trip failed for ${corner.toString()}: error=${result.error.toFixed(6)}`);
                allPassed = false;
            }
        }
        if (allPassed) console.log('[CatanBoard] Round-trip integrity verified on corner positions');
    }

    generateBoard() {
        const resources = [
            ResourceType.WOOD, ResourceType.WOOD, ResourceType.WOOD, ResourceType.WOOD,
            ResourceType.BRICK, ResourceType.BRICK, ResourceType.BRICK,
            ResourceType.WHEAT, ResourceType.WHEAT, ResourceType.WHEAT, ResourceType.WHEAT,
            ResourceType.SHEEP, ResourceType.SHEEP, ResourceType.SHEEP, ResourceType.SHEEP,
            ResourceType.ORE, ResourceType.ORE, ResourceType.ORE, ResourceType.DESERT
        ];
        const numbers = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12, 0];
        // Shuffle using GridUtils if available, else inline
        if (typeof GridUtils !== 'undefined') {
            // Pair-shuffle: zip, shuffle, unzip
            const paired = resources.map((r, i) => ({ r, n: numbers[i] }));
            GridUtils.shuffle(paired);
            for (let i = 0; i < paired.length; i++) {
                resources[i] = paired[i].r;
                numbers[i] = paired[i].n;
            }
        } else {
            for (let i = resources.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [resources[i], resources[j]] = [resources[j], resources[i]];
                [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
            }
        }
        // Place on a tetrahedral grid pattern
        let idx = 0;
        const rings = [
            [0, 0], [1, 0], [0, 1], [1, 1], [2, 0], [0, 2], [2, 1], [1, 2], [2, 2],
            [3, 0], [0, 3], [3, 1], [1, 3], [3, 2], [2, 3], [3, 3], [4, 1], [1, 4], [4, 2]
        ];
        for (const [a, b] of rings) {
            if (idx >= resources.length) break;
            const pos = { a, b, c: 0, d: Math.floor(idx / 5) };
            const tile = new CatanTile(pos, resources[idx], numbers[idx]);
            this.tiles.push(tile);
            // Register tile in grid Map via GridUtils.key
            const key = GridUtils ? GridUtils.key(pos.a, pos.b, pos.c, pos.d) : `${pos.a},${pos.b},${pos.c},${pos.d}`;
            this.grid.set(key, { tile, resource: resources[idx], number: numbers[idx], pos });
            idx++;
        }
        // Robber starts on desert
        const desertIdx = this.tiles.findIndex(t => t.resource === ResourceType.DESERT);
        this.robberTile = desertIdx >= 0 ? desertIdx : 0;
        this.robber = this.tiles[this.robberTile];
    }

    /**
     * Get cell data at a Quadray position.
     * @param {Quadray} q
     * @returns {Object|null}
     */
    getCell(q) {
        const key = q.toKey();
        return this.grid.get(key) || null;
    }

    /**
     * Set cell data at a Quadray position.
     * @param {Quadray} q
     * @param {*} value
     */
    setCell(q, value) {
        this.grid.set(q.toKey(), value);
    }

    /**
     * Get IVM neighbors of a tile position using GridUtils.
     * @param {Object} pos - {a,b,c,d}
     * @returns {Array<{a:number, b:number, c:number, d:number}>}
     */
    getGridNeighbors(pos) {
        if (typeof GridUtils !== 'undefined') {
            return GridUtils.neighbors(pos.a, pos.b, pos.c || 0, pos.d || 0);
        }
        return [];
    }

    /**
     * Calculate Manhattan distance between two positions.
     * Uses GridUtils.manhattan().
     * @param {Object} p1 - {a,b,c,d}
     * @param {Object} p2 - {a,b,c,d}
     * @returns {number}
     */
    manhattanDistance(p1, p2) {
        if (typeof GridUtils !== 'undefined') {
            return GridUtils.manhattan(
                { a: p1.a, b: p1.b, c: p1.c || 0, d: p1.d || 0 },
                { a: p2.a, b: p2.b, c: p2.c || 0, d: p2.d || 0 }
            );
        }
        return Math.abs(p1.a - p2.a) + Math.abs(p1.b - p2.b);
    }

    /**
     * Calculate Euclidean distance between two positions.
     * Uses GridUtils.euclidean().
     * @param {Object} p1 - {a,b,c,d}
     * @param {Object} p2 - {a,b,c,d}
     * @returns {number}
     */
    euclideanDistance(p1, p2) {
        if (typeof GridUtils !== 'undefined') {
            return GridUtils.euclidean(
                { a: p1.a, b: p1.b, c: p1.c || 0, d: p1.d || 0 },
                { a: p2.a, b: p2.b, c: p2.c || 0, d: p2.d || 0 }
            );
        }
        return 0;
    }

    /**
     * Calculate Quadray distance (proper IVM distance) between two positions.
     * @param {Object} p1 - {a,b,c,d}
     * @param {Object} p2 - {a,b,c,d}
     * @returns {number}
     */
    quadrayDistance(p1, p2) {
        const q1 = new Quadray(p1.a, p1.b, p1.c || 0, p1.d || 0);
        const q2 = new Quadray(p2.a, p2.b, p2.c || 0, p2.d || 0);
        return Quadray.distance(q1, q2);
    }

    /**
     * Get the angle between two direction vectors from a position.
     * Uses angleBetweenQuadrays() from synergetics.
     * @param {Object} from - {a,b,c,d}
     * @param {Object} to1 - {a,b,c,d}
     * @param {Object} to2 - {a,b,c,d}
     * @returns {number} Angle in degrees
     */
    angleBetween(from, to1, to2) {
        if (typeof angleBetweenQuadrays !== 'function') return 0;
        const fq = new Quadray(from.a, from.b, from.c || 0, from.d || 0);
        const t1q = new Quadray(to1.a, to1.b, to1.c || 0, to1.d || 0);
        const t2q = new Quadray(to2.a, to2.b, to2.c || 0, to2.d || 0);
        const v1 = t1q.subtract(fq);
        const v2 = t2q.subtract(fq);
        return angleBetweenQuadrays(v1, v2);
    }

    getNeighborTiles(tileIdx) {
        const tile = this.tiles[tileIdx];
        if (!tile) return [];
        const neighbors = [];
        for (let i = 0; i < this.tiles.length; i++) {
            if (i === tileIdx) continue;
            const t = this.tiles[i];
            const q1 = tile.toQuadray();
            const q2 = t.toQuadray();
            const dist = Quadray.distance(q1, q2);
            if (dist <= 1.5) {
                neighbors.push(i);
            }
        }
        return neighbors;
    }

    isValidSettlementSpot(pos) {
        // Must be on or near a tile position (vertex/intersection approximation)
        let nearTile = false;
        const posQ = new Quadray(pos.a, pos.b, pos.c || 0, pos.d || 0);
        for (const tile of this.tiles) {
            const tileQ = new Quadray(tile.pos.a, tile.pos.b, tile.pos.c || 0, tile.pos.d || 0);
            if (Quadray.distance(tileQ, posQ) <= 2.5) { nearTile = true; break; }
        }
        if (!nearTile) return false;

        // Distance rule: >= 2 edges from other settlements (Quadray distance)
        for (const pl of this.players) {
            for (const s of pl.settlements) {
                const q1 = new Quadray(s.a, s.b, s.c || 0, s.d || 0);
                if (Quadray.distance(q1, posQ) < 1.5 && Quadray.distance(q1, posQ) > 0.01) return false;
            }
        }

        // Not occupied
        for (const pl of this.players) {
            if (pl.settlements.some(s => s.a === pos.a && s.b === pos.b && s.c === pos.c && s.d === pos.d)) {
                return false;
            }
        }
        return true;
    }

    rollDice() {
        this.dice = [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1];
        const sum = this.dice[0] + this.dice[1];
        // Produce resources (skip robber tile)
        for (let i = 0; i < this.tiles.length; i++) {
            const tile = this.tiles[i];
            if (tile.number === sum && tile !== this.robber) {
                for (const p of this.players) {
                    const adjacent = p.settlements.filter(s => {
                        const sq = new Quadray(s.a, s.b, s.c || 0, s.d || 0);
                        const tq = tile.toQuadray();
                        return Quadray.distance(sq, tq) <= 2.5;
                    });
                    for (const s of adjacent) {
                        if (tile.resource !== ResourceType.DESERT) {
                            const amount = s.isCity ? 2 : 1;
                            p.resources[tile.resource] = (p.resources[tile.resource] || 0) + amount;
                        }
                    }
                }
            }
        }
        return this.dice;
    }

    buildSettlement(player, pos) {
        const p = this.players[player];
        if (!canAfford(p, BUILD_COSTS.settlement)) return false;
        if (!this.isValidSettlementSpot(pos)) return false;

        deductCost(p, BUILD_COSTS.settlement);
        p.settlements.push({ ...pos, isCity: false });
        this.moveCount++;
        this.recalcPoints();
        return true;
    }

    upgradeToCity(player, settlementIdx) {
        const p = this.players[player];
        if (!canAfford(p, BUILD_COSTS.city)) return false;
        if (settlementIdx < 0 || settlementIdx >= p.settlements.length) return false;
        if (p.settlements[settlementIdx].isCity) return false;

        deductCost(p, BUILD_COSTS.city);
        p.settlements[settlementIdx].isCity = true;
        this.moveCount++;
        this.recalcPoints();
        return true;
    }

    buildRoad(player, from, to) {
        const p = this.players[player];
        if (!canAfford(p, BUILD_COSTS.road)) return false;
        deductCost(p, BUILD_COSTS.road);
        p.roads.push({ from, to });
        this.moveCount++;
        this.recalcPoints();
        return true;
    }

    buildFreeRoad(player, from, to) {
        const p = this.players[player];
        p.roads.push({ from, to });
        this.recalcPoints();
        return true;
    }

    longestRoad(playerIdx) {
        const p = this.players[playerIdx];
        if (p.roads.length === 0) return 0;

        // Build adjacency list from roads
        const adj = {};
        for (const road of p.roads) {
            const fk = `${road.from.a},${road.from.b},${road.from.c || 0},${road.from.d || 0}`;
            const tk = `${road.to.a},${road.to.b},${road.to.c || 0},${road.to.d || 0}`;
            if (!adj[fk]) adj[fk] = [];
            if (!adj[tk]) adj[tk] = [];
            adj[fk].push(tk);
            adj[tk].push(fk);
        }

        // DFS to find longest path
        let maxLen = 0;
        const visited = new Set();

        function dfs(node, length) {
            if (length > maxLen) maxLen = length;
            for (const neighbor of (adj[node] || [])) {
                const edgeKey = node < neighbor ? `${node}|${neighbor}` : `${neighbor}|${node}`;
                if (!visited.has(edgeKey)) {
                    visited.add(edgeKey);
                    dfs(neighbor, length + 1);
                    visited.delete(edgeKey);
                }
            }
        }

        for (const startNode of Object.keys(adj)) {
            visited.clear();
            dfs(startNode, 0);
        }
        return maxLen;
    }

    largestArmy(playerIdx) {
        return this.players[playerIdx].knightsPlayed || 0;
    }

    recalcPoints() {
        // Longest road award (min 5)
        let longestLen = 0, longestPlayer = -1;
        for (let i = 0; i < this.players.length; i++) {
            const len = this.longestRoad(i);
            if (len >= 5 && len > longestLen) {
                longestLen = len;
                longestPlayer = i;
            }
        }
        for (let i = 0; i < this.players.length; i++) {
            this.players[i].hasLongestRoad = (i === longestPlayer);
        }

        // Largest army award (min 3)
        let largestCount = 0, largestPlayer = -1;
        for (let i = 0; i < this.players.length; i++) {
            const count = this.largestArmy(i);
            if (count >= 3 && count > largestCount) {
                largestCount = count;
                largestPlayer = i;
            }
        }
        for (let i = 0; i < this.players.length; i++) {
            this.players[i].hasLargestArmy = (i === largestPlayer);
        }

        // Compute VP for each player
        for (const p of this.players) {
            let vp = 0;
            // Settlements = 1 VP each, Cities = 2 VP each
            for (const s of p.settlements) {
                vp += s.isCity ? 2 : 1;
            }
            // Longest road = 2 VP
            if (p.hasLongestRoad) vp += 2;
            // Largest army = 2 VP
            if (p.hasLargestArmy) vp += 2;
            // VP cards
            vp += p.devCards.filter(c => c === DevCardType.VICTORY_POINT).length;
            p.points = vp;
        }
    }

    endTurn() {
        const p = this.players[this.currentPlayer];
        p.playedDevCardThisTurn = false;
        p.cardsBoughtThisTurn = [];
        this.currentPlayer = (this.currentPlayer + 1) % this.players.length;
    }

    winner() {
        return this.players.find(p => p.points >= 10) || null;
    }

    checkWin() {
        this.recalcPoints();
        const w = this.winner();
        if (w) this.gameOver = true;
        return w;
    }

    /**
     * Get board metadata for HUD display.
     * @returns {Object}
     */
    getMetadata() {
        let tetraCount = 0, octaCount = 0;
        for (const tile of this.tiles) {
            const parity = typeof Quadray !== 'undefined' && Quadray.cellType
                ? Quadray.cellType(tile.pos.a, tile.pos.b, tile.pos.c || 0, tile.pos.d || 0)
                : 'tetra';
            if (parity === 'tetra') tetraCount++;
            else octaCount++;
        }
        return {
            moveCount: this.moveCount,
            currentPlayer: this.currentPlayer,
            playerName: this.players[this.currentPlayer]?.name || '',
            playerColor: this.players[this.currentPlayer]?.color || '#fff',
            winner: this.winner(),
            gameOver: this.gameOver,
            tetraCount,
            octaCount,
            volumeRatios: this.volumeRatios,
            cellVolume: this.cellVolumeUnit,
            s3: this.s3Constant,
            totalTiles: this.tiles.length,
            playerPoints: this.players.map(p => p.points),
        };
    }

    /** Reset board to initial state. */
    reset() {
        this.tiles = [];
        this.grid = new Map();
        this.players[0] = {
            name: 'Red', color: '#ff4444',
            resources: { wood: 2, brick: 2, wheat: 1, sheep: 1, ore: 0 },
            settlements: [], roads: [], points: 0,
            devCards: [], knightsPlayed: 0,
            playedDevCardThisTurn: false,
            cardsBoughtThisTurn: [],
            ports: [],
            hasLongestRoad: false,
            hasLargestArmy: false
        };
        this.players[1] = {
            name: 'Blue', color: '#4488ff',
            resources: { wood: 2, brick: 2, wheat: 1, sheep: 1, ore: 0 },
            settlements: [], roads: [], points: 0,
            devCards: [], knightsPlayed: 0,
            playedDevCardThisTurn: false,
            cardsBoughtThisTurn: [],
            ports: [],
            hasLongestRoad: false,
            hasLargestArmy: false
        };
        this.currentPlayer = 0;
        this.dice = [0, 0];
        this.robber = null;
        this.robberTile = -1;
        this.gameOver = false;
        this.moveCount = 0;
        this.generateBoard();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CatanBoard, CatanTile, ResourceType, RESOURCE_COLORS, BUILD_COSTS, TurnPhase, DevCardType, canAfford, deductCost };
}
