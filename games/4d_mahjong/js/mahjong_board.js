/**
 * mahjong_board.js — 4D Mahjong Tile Matching on IVM Grid
 *
 * Stacked tetrahedral layers of tiles. Match exposed pairs to clear.
 * Tiles are placed in 4D Quadray coordinates across multiple layers.
 *
 * Integrated with Quadray/IVM shared modules:
 *   - Quadray: distance, toCartesian, toKey, cellType, cellVolume
 *   - GridUtils: key, parseKey, shuffle, DIRECTIONS_8
 *   - SYNERGETICS: constants, volume ratios
 *   - verifyRoundTrip, verifyGeometricIdentities
 *
 * @module MahjongBoard
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
if (typeof BaseBoard === 'undefined' && typeof require !== 'undefined') {
    const _b = require('../../4d_generic/base_board.js');
    globalThis.BaseBoard = _b.BaseBoard;
}

const TILE_SUITS = ['bamboo', 'circle', 'character', 'wind', 'dragon'];
const TILE_COLORS = { bamboo: '#4CAF50', circle: '#2196F3', character: '#FF5722', wind: '#9C27B0', dragon: '#F44336' };

class MahjongTile {
    constructor(suit, value, layer, pos) {
        this.suit = suit; this.value = value;
        this.layer = layer; this.pos = pos; // {a,b,c,d}
        this.matched = false;
    }
    matches(other) { return this.suit === other.suit && this.value === other.value && this !== other; }
    toQuadray() { return new Quadray(this.pos.a, this.pos.b, this.layer * 2, this.pos.d); }
}

class MahjongBoard extends BaseBoard {
    constructor() {
        super();
        this.tiles = [];
        this.selected = null;
        this.score = 0;
        this.moves = 0;
        this.gameOver = false;

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

        this.generateLayout();

        console.log(`[MahjongBoard] 4-layer IVM tile layout (144 tiles)`);
        console.log(`[MahjongBoard] Cell volume: ${this.cellVolumeUnit}, S3: ${this.s3Constant}`);
        console.log(`[MahjongBoard] Volume ratios T:O:C = ${this.volumeRatios.tetra}:${this.volumeRatios.octa}:${this.volumeRatios.cubo}`);
    }

    /** Verify geometric integrity on construction. */
    _verifyIntegrity() {
        if (typeof verifyRoundTrip !== 'function') return;
        const corners = [
            new Quadray(0, 0, 0, 0),
            new Quadray(7, 0, 6, 7),
            new Quadray(7, 0, 0, 0),
            new Quadray(0, 0, 6, 0),
        ];
        let allPassed = true;
        for (const corner of corners) {
            const result = verifyRoundTrip(corner);
            if (!result.passed) {
                console.warn(`[MahjongBoard] Round-trip failed for ${corner.toString()}: error=${result.error.toFixed(6)}`);
                allPassed = false;
            }
        }
        if (allPassed) console.log('[MahjongBoard] Round-trip integrity verified on corner positions');
    }

    generateLayout() {
        this.tiles = [];
        const pairs = [];
        // Create 72 pairs (144 tiles)
        for (let i = 0; i < 72; i++) {
            const suit = TILE_SUITS[i % 5];
            const value = (i % 9) + 1;
            pairs.push({ suit, value }, { suit, value });
        }
        // Shuffle using GridUtils
        GridUtils.shuffle(pairs);
        // Layout in 4D layers
        let idx = 0;
        const layouts = [
            { layer: 0, w: 8, h: 8 }, { layer: 1, w: 7, h: 5 },
            { layer: 2, w: 5, h: 5 }, { layer: 3, w: 4, h: 5 }
        ];
        for (const { layer, w, h } of layouts) {
            for (let a = 0; a < w && idx < pairs.length; a++)
                for (let d = 0; d < h && idx < pairs.length; d++) {
                    const t = pairs[idx++];
                    this.tiles.push(new MahjongTile(t.suit, t.value, layer, { a, b: 0, c: layer, d }));
                }
        }
    }

    /**
     * Get cell data at a Quadray position.
     * @param {Quadray} q
     * @returns {MahjongTile|null}
     */
    getCell(q) {
        const key = q.toKey();
        return this.tiles.find(t => !t.matched && t.toQuadray().toKey() === key) || null;
    }

    /**
     * Set cell data at a Quadray position.
     * @param {Quadray} q
     * @param {*} value
     */
    setCell(q, value) {
        // Tiles are stored in array; this is a compatibility method
        const key = q.toKey();
        const existing = this.tiles.find(t => t.toQuadray().toKey() === key);
        if (existing && value === null) {
            existing.matched = true;
        }
    }

    isExposed(tile) {
        if (tile.matched) return false;
        // Exposed if no tile above in next layer (Quadray distance check)
        const q1 = tile.toQuadray();
        const above = this.tiles.find(t => !t.matched && t.layer === tile.layer + 1 &&
            Quadray.distance(q1, t.toQuadray()) < 2.0);
        return !above;
    }

    getExposedTiles() { return this.tiles.filter(t => !t.matched && this.isExposed(t)); }

    select(tile) {
        if (tile.matched || !this.isExposed(tile)) return false;
        if (!this.selected) { this.selected = tile; return true; }
        if (this.selected.matches(tile)) {
            const dist = Quadray.distance(this.selected.toQuadray(), tile.toQuadray());
            this.selected.matched = true; tile.matched = true;
            this.selected = null; this.score += 10 + Math.floor(dist * 2); this.moves++;
            // Check completion
            if (this.isComplete()) {
                this.gameOver = true;
            }
            return true;
        }
        this.selected = tile;
        return true;
    }

    getHint() {
        const exposed = this.getExposedTiles();
        for (let i = 0; i < exposed.length; i++)
            for (let j = i + 1; j < exposed.length; j++)
                if (exposed[i].matches(exposed[j]))
                    return [exposed[i], exposed[j]];
        return null;
    }

    isComplete() { return this.tiles.every(t => t.matched); }
    isStuck() { return !this.getHint(); }
    remainingTiles() { return this.tiles.filter(t => !t.matched).length; }

    /**
     * Get board metadata for HUD display.
     * @returns {Object}
     */
    getMetadata() {
        const remaining = this.tiles.filter(t => !t.matched);
        let tetraCount = 0, octaCount = 0;
        for (const t of remaining) {
            const q = t.toQuadray();
            const parity = Quadray.cellType(q.a, q.b, q.c, q.d);
            if (parity === 'tetra') tetraCount++;
            else octaCount++;
        }
        return {
            remainingTiles: remaining.length,
            score: this.score,
            moves: this.moves,
            gameOver: this.gameOver,
            isComplete: this.isComplete(),
            isStuck: remaining.length > 0 && this.isStuck(),
            tetraCount,
            octaCount,
            volumeRatios: this.volumeRatios,
            cellVolume: this.cellVolumeUnit,
            s3: this.s3Constant,
        };
    }

    /** Reset board to initial state. */
    reset() {
        this.tiles = [];
        this.selected = null;
        this.score = 0;
        this.moves = 0;
        this.gameOver = false;
        this.generateLayout();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MahjongBoard, MahjongTile, TILE_SUITS, TILE_COLORS };
}
