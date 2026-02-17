/**
 * minecraft_board.js — 4D Minecraft Voxel World on IVM Grid
 *
 * Tetrahedral voxel building, block placement/removal, chunk-based world.
 * Integer Quadray coordinates map directly to IVM grid vertices.
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
 * @module MinecraftBoard
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

const BlockType = { AIR: 0, STONE: 1, DIRT: 2, GRASS: 3, WOOD: 4, LEAVES: 5, WATER: 6, SAND: 7, DIAMOND: 8 };
const BLOCK_COLORS = { 0: 'transparent', 1: '#888', 2: '#965B3B', 3: '#4CAF50', 4: '#8B6914', 5: '#2E7D32', 6: '#1565C0', 7: '#F4D03F', 8: '#00BCD4' };
const BLOCK_NAMES = { 0: 'Air', 1: 'Stone', 2: 'Dirt', 3: 'Grass', 4: 'Wood', 5: 'Leaves', 6: 'Water', 7: 'Sand', 8: 'Diamond' };

class MinecraftBoard {

    /**
     * @param {number} size - World size per axis
     */
    constructor(size = 8) {
        this.size = size;
        this.blocks = new Map(); // GridUtils.key() -> BlockType
        this.inventory = { 1: 99, 2: 99, 3: 64, 4: 64, 5: 64, 7: 32, 8: 5 };
        this.selectedBlock = BlockType.STONE;
        this.gameOver = false; // BaseGame expects this property
        this.blocksPlaced = 0;
        this.blocksRemoved = 0;

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

        this.generateTerrain();

        console.log(`[MinecraftBoard] ${size}^4 IVM voxel grid`);
        console.log(`[MinecraftBoard] Cell volume: ${this.cellVolumeUnit}, S3: ${this.s3Constant}`);
        console.log(`[MinecraftBoard] Volume ratios T:O:C = ${this.volumeRatios.tetra}:${this.volumeRatios.octa}:${this.volumeRatios.cubo}`);
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
                console.warn(`[MinecraftBoard] Round-trip failed for ${corner.toString()}: error=${result.error.toFixed(6)}`);
                allPassed = false;
            }
        }
        if (allPassed) console.log('[MinecraftBoard] Round-trip integrity verified on corner positions');
    }

    /**
     * Get cell data at a Quadray position.
     * @param {Quadray} q
     * @returns {number} BlockType
     */
    getCell(q) {
        return this.blocks.get(GridUtils.key(q.a, q.b, q.c, q.d)) || BlockType.AIR;
    }

    /**
     * Set cell data at a Quadray position.
     * @param {Quadray} q
     * @param {number} value - BlockType
     */
    setCell(q, value) {
        const k = GridUtils.key(q.a, q.b, q.c, q.d);
        if (value === BlockType.AIR) this.blocks.delete(k);
        else this.blocks.set(k, value);
    }

    /**
     * Get block at integer coordinates.
     * Delegates to GridUtils.key() for consistent key generation.
     * @param {number} a
     * @param {number} b
     * @param {number} c
     * @param {number} d
     * @returns {number} BlockType
     */
    getBlock(a, b, c, d) {
        return this.blocks.get(GridUtils.key(a, b, c, d)) || BlockType.AIR;
    }

    /**
     * Set block at integer coordinates.
     * Delegates to GridUtils.key() for consistent key generation.
     * @param {number} a
     * @param {number} b
     * @param {number} c
     * @param {number} d
     * @param {number} type - BlockType
     */
    setBlock(a, b, c, d, type) {
        const k = GridUtils.key(a, b, c, d);
        if (type === BlockType.AIR) this.blocks.delete(k);
        else this.blocks.set(k, type);
    }

    /** Generate initial terrain with stone base, dirt, grass, trees, diamonds. */
    generateTerrain() {
        this.blocks.clear();
        for (let a = 0; a < this.size; a++)
            for (let b = 0; b < this.size; b++)
                for (let c = 0; c < 3; c++)
                    for (let d = 0; d < this.size; d++) {
                        if (c === 0) this.setBlock(a, b, c, d, BlockType.STONE);
                        else if (c === 1) this.setBlock(a, b, c, d, BlockType.DIRT);
                        else if (c === 2 && Math.random() > 0.3) this.setBlock(a, b, c, d, BlockType.GRASS);
                    }
        // Trees
        for (let i = 0; i < 4; i++) {
            const a = Math.floor(Math.random() * this.size), b = Math.floor(Math.random() * this.size), d = Math.floor(Math.random() * this.size);
            for (let h = 3; h < 6; h++) this.setBlock(a, b, h, d, BlockType.WOOD);
            for (let da = -1; da <= 1; da++) for (let db = -1; db <= 1; db++) for (let dd = -1; dd <= 1; dd++)
                if (this.getBlock(a + da, b + db, 6, d + dd) === BlockType.AIR) this.setBlock(a + da, b + db, 6, d + dd, BlockType.LEAVES);
        }
        // Diamond cave
        this.setBlock(3, 3, 0, 3, BlockType.DIAMOND);
        this.setBlock(4, 4, 0, 4, BlockType.DIAMOND);
    }

    /**
     * Place the selected block at coordinates.
     * @param {number} a
     * @param {number} b
     * @param {number} c
     * @param {number} d
     * @returns {boolean} Whether placement succeeded
     */
    placeBlock(a, b, c, d) {
        if (this.getBlock(a, b, c, d) !== BlockType.AIR) return false;
        if (this.inventory[this.selectedBlock] <= 0) return false;
        this.setBlock(a, b, c, d, this.selectedBlock);
        this.inventory[this.selectedBlock]--;
        this.blocksPlaced++;
        return true;
    }

    /**
     * Remove block at coordinates, returning it to inventory.
     * @param {number} a
     * @param {number} b
     * @param {number} c
     * @param {number} d
     * @returns {boolean} Whether removal succeeded
     */
    removeBlock(a, b, c, d) {
        const type = this.getBlock(a, b, c, d);
        if (type === BlockType.AIR) return false;
        this.blocks.delete(GridUtils.key(a, b, c, d));
        this.inventory[type] = (this.inventory[type] || 0) + 1;
        this.blocksRemoved++;
        return true;
    }

    /**
     * Get all placed blocks for rendering.
     * Each block includes its Quadray, cellType, Cartesian coordinates.
     * @returns {Array<Object>}
     */
    getVisibleBlocks() {
        const result = [];
        for (const [k, type] of this.blocks) {
            const { a, b, c, d } = GridUtils.parseKey(k);
            const quadray = new Quadray(a, b, c, d);
            const cellType = Quadray.cellType(a, b, c, d);
            result.push({ pos: quadray, type, a, b, c, d, cellType });
        }
        return result;
    }

    /**
     * Get IVM neighbors of a position that are within world bounds.
     * Uses GridUtils.boundedNeighbors().
     * @param {number} a
     * @param {number} b
     * @param {number} c
     * @param {number} d
     * @returns {Array<{a:number, b:number, c:number, d:number}>}
     */
    getNeighbors(a, b, c, d) {
        return GridUtils.boundedNeighbors(a, b, c, d, this.size);
    }

    /**
     * Get board metadata for HUD display.
     * @returns {Object}
     */
    getMetadata() {
        let tetraCount = 0, octaCount = 0;
        for (const [k] of this.blocks) {
            const { a, b, c, d } = GridUtils.parseKey(k);
            const ct = Quadray.cellType(a, b, c, d);
            if (ct === 'tetra') tetraCount++;
            else octaCount++;
        }
        return {
            blockCount: this.blocks.size,
            blocksPlaced: this.blocksPlaced,
            blocksRemoved: this.blocksRemoved,
            selectedBlock: this.selectedBlock,
            tetraCount,
            octaCount,
            volumeRatios: this.volumeRatios,
            cellVolume: this.cellVolumeUnit,
            s3: this.s3Constant,
        };
    }

    /** Reset board to initial state with fresh terrain. */
    reset() {
        this.blocks.clear();
        this.inventory = { 1: 99, 2: 99, 3: 64, 4: 64, 5: 64, 7: 32, 8: 5 };
        this.selectedBlock = BlockType.STONE;
        this.blocksPlaced = 0;
        this.blocksRemoved = 0;
        this.generateTerrain();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MinecraftBoard, BlockType, BLOCK_COLORS, BLOCK_NAMES };
}
