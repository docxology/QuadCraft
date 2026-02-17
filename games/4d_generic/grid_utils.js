/**
 * grid_utils.js — IVM Grid Math Utilities
 *
 * Shared math for Quadray/IVM grids: grid generation, neighbor lookup,
 * distance calculation, bounds checking, and depth sorting for rendering.
 *
 * Used by Minesweeper (neighbors), Snake/Pac-Man (grid generation),
 * and multiple renderers (depth sorting).
 *
 * @module GridUtils
 */

class GridUtils {
    /**
     * 8 canonical IVM directions (Quadray unit vectors).
     * ±A, ±B, ±C, ±D axis movements.
     */
    static DIRECTIONS_8 = [
        [1, 0, 0, 0], // +A
        [-1, 0, 0, 0], // -A
        [0, 1, 0, 0], // +B
        [0, -1, 0, 0], // -B
        [0, 0, 1, 0], // +C
        [0, 0, -1, 0], // -C
        [0, 0, 0, 1], // +D
        [0, 0, 0, -1], // -D
    ];

    /**
     * Generate all integer Quadray coordinates in a size^4 grid.
     * @param {number} size — Grid dimension (0 to size-1 per axis).
     * @returns {Array<{a:number, b:number, c:number, d:number}>}
     */
    static generateGrid(size) {
        const cells = [];
        for (let a = 0; a < size; a++)
            for (let b = 0; b < size; b++)
                for (let c = 0; c < size; c++)
                    for (let d = 0; d < size; d++)
                        cells.push({ a, b, c, d });
        return cells;
    }

    /**
     * Create a string key for a Quadray coordinate — useful for Set/Map lookups.
     * @param {number} a
     * @param {number} b
     * @param {number} c
     * @param {number} d
     * @returns {string}
     */
    static key(a, b, c, d) {
        return `${a},${b},${c},${d}`;
    }

    /**
     * Parse a key back to coordinates.
     * @param {string} key — "a,b,c,d"
     * @returns {{a:number, b:number, c:number, d:number}}
     */
    static parseKey(key) {
        const [a, b, c, d] = key.split(',').map(Number);
        return { a, b, c, d };
    }

    /**
     * Get the 8 IVM neighbors of a coordinate.
     * @param {number} a
     * @param {number} b
     * @param {number} c
     * @param {number} d
     * @returns {Array<{a:number, b:number, c:number, d:number}>}
     */
    static neighbors(a, b, c, d) {
        return GridUtils.DIRECTIONS_8.map(([da, db, dc, dd]) => ({
            a: a + da, b: b + db, c: c + dc, d: d + dd
        }));
    }

    /**
     * Get bounded neighbors (only those within grid bounds).
     * @param {number} a
     * @param {number} b
     * @param {number} c
     * @param {number} d
     * @param {number} size — Grid size.
     * @returns {Array<{a:number, b:number, c:number, d:number}>}
     */
    static boundedNeighbors(a, b, c, d, size) {
        return GridUtils.neighbors(a, b, c, d)
            .filter(n => GridUtils.inBounds(n.a, n.b, n.c, n.d, size));
    }

    /**
     * Check if a coordinate is within grid bounds.
     * @param {number} a
     * @param {number} b
     * @param {number} c
     * @param {number} d
     * @param {number} size
     * @returns {boolean}
     */
    static inBounds(a, b, c, d, size) {
        return a >= 0 && a < size && b >= 0 && b < size &&
            c >= 0 && c < size && d >= 0 && d < size;
    }

    /**
     * 4D Manhattan distance between two Quadray points.
     * @param {{a:number, b:number, c:number, d:number}} p1
     * @param {{a:number, b:number, c:number, d:number}} p2
     * @returns {number}
     */
    static manhattan(p1, p2) {
        return Math.abs(p1.a - p2.a) + Math.abs(p1.b - p2.b) +
            Math.abs(p1.c - p2.c) + Math.abs(p1.d - p2.d);
    }

    /**
     * 4D Euclidean distance between two Quadray points.
     * @param {{a:number, b:number, c:number, d:number}} p1
     * @param {{a:number, b:number, c:number, d:number}} p2
     * @returns {number}
     */
    static euclidean(p1, p2) {
        const da = p1.a - p2.a, db = p1.b - p2.b;
        const dc = p1.c - p2.c, dd = p1.d - p2.d;
        return Math.sqrt(da * da + db * db + dc * dc + dd * dd);
    }

    /**
     * Sort cells by projected depth (pScale) for proper rendering order.
     * Uses the projectQuadray function if available.
     * @param {Array} cells — Array of objects with {a,b,c,d} or {quadray}.
     * @param {function} projectFn — Projection function returning {x, y, scale}.
     * @returns {Array} — Same array, sorted back-to-front.
     */
    static depthSort(cells, projectFn) {
        return cells
            .map(cell => {
                const coords = cell.quadray || cell;
                const p = projectFn(coords.a, coords.b, coords.c, coords.d);
                return { ...cell, px: p.x, py: p.y, pScale: p.scale };
            })
            .sort((a, b) => a.pScale - b.pScale);
    }

    /**
     * Shuffle an array in-place (Fisher-Yates).
     * Useful for random mine placement, food spawning, etc.
     * @param {Array} arr
     * @returns {Array} — Same array, shuffled.
     */
    static shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    /**
     * Pick a random coordinate from a grid.
     * @param {number} size
     * @returns {{a:number, b:number, c:number, d:number}}
     */
    static randomCoord(size) {
        return {
            a: Math.floor(Math.random() * size),
            b: Math.floor(Math.random() * size),
            c: Math.floor(Math.random() * size),
            d: Math.floor(Math.random() * size),
        };
    }
}

// Dual export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GridUtils };
}
