/**
 * doom_map.js — 4D Dungeon Generator on IVM Grid
 *
 * Uses sparse Map-based storage (like Minecraft) for IVM cells.
 * Integer Quadray coordinates ARE IVM vertices — no cubic approximation.
 * Room carving now produces tetrahedral and octahedral room shapes
 * based on IVM cell parity.
 * getSlice(c,d) returns 2D projection for the DDA raycaster.
 */
import { CELL, MAP, IVM } from './doom_config.js';
import { Quadray } from './quadray.js';

export class DoomMap {
    constructor(size = MAP.SIZE) {
        this.size = size;
        this.cells = new Map();  // "a,b,c,d" → cell type (sparse IVM storage)
        this.rooms = [];
        this._sliceCache = new Map();
        this.stats = { tetraRooms: 0, octaRooms: 0, rectRooms: 0, corridorCells: 0 };
        this.generate();
    }

    // ─── IVM cell access (native Quadray coords) ───────────────

    key(a, b, c, d) { return `${a},${b},${c},${d}`; }

    getCell(a, b, c, d) {
        if (a < 0 || b < 0 || c < 0 || d < 0 ||
            a >= this.size || b >= this.size || c >= this.size || d >= this.size)
            return CELL.WALL;
        return this.cells.get(this.key(a, b, c, d)) ?? CELL.WALL;
    }

    setCell(a, b, c, d, type) {
        const k = this.key(a, b, c, d);
        if (type === CELL.WALL) {
            this.cells.delete(k);
        } else {
            this.cells.set(k, type);
        }
        this._sliceCache.clear();
    }

    isSolid(a, b, c, d) {
        const cell = this.getCell(Math.floor(a), Math.floor(b), Math.floor(c), Math.floor(d));
        return cell >= CELL.WALL && cell !== CELL.DOOR;
    }

    getCartesian(a, b, c, d) {
        return new Quadray(a, b, c, d).toCartesian();
    }

    getNeighbors(a, b, c, d) {
        return IVM.DIRECTIONS.map(([da, db, dc, dd]) => [a + da, b + db, c + dc, d + dd]);
    }

    cellParity(a, b, c, d) {
        return (a + b + c + d) % 2 === 0 ? 'tetra' : 'octa';
    }

    // ─── 2D Slice for raycasting ────────────────────────────────

    getSlice(c, d) {
        const ci = Math.floor(c), di = Math.floor(d);
        const cacheKey = `${ci},${di}`;
        if (this._sliceCache.has(cacheKey)) return this._sliceCache.get(cacheKey);

        const slice = [];
        for (let a = 0; a < this.size; a++) {
            slice[a] = [];
            for (let b = 0; b < this.size; b++) {
                slice[a][b] = this.getCell(a, b, ci, di);
            }
        }
        this._sliceCache.set(cacheKey, slice);
        return slice;
    }

    // ─── Dungeon generation (Synergetics-aware) ──────────────────

    generate() {
        this.cells.clear();
        this._sliceCache.clear();
        this.rooms = [];
        this.stats = { tetraRooms: 0, octaRooms: 0, rectRooms: 0, corridorCells: 0 };

        const S = this.size;
        const minR = MAP.MIN_ROOM, maxR = MAP.MAX_ROOM;

        for (let i = 0; i < MAP.NUM_ROOMS; i++) {
            const ra = minR + Math.floor(Math.random() * (maxR - minR));
            const rb = minR + Math.floor(Math.random() * (maxR - minR));
            const rc = 1 + Math.floor(Math.random() * 2);
            const rd = 1 + Math.floor(Math.random() * 2);

            const ca = 2 + Math.floor(Math.random() * (S - ra - 4));
            const cb = 2 + Math.floor(Math.random() * (S - rb - 4));
            const cc = 1 + Math.floor(Math.random() * (S - rc - 2));
            const cd = 1 + Math.floor(Math.random() * (S - rd - 2));

            const parity = this.cellParity(ca, cb, cc, cd);

            // Choose room shape based on IVM geometry
            const shapeRoll = Math.random();
            let shape, wallType;
            if (shapeRoll < 0.35) {
                shape = 'tetra';
                wallType = CELL.TETRA_WALL;
                this.stats.tetraRooms++;
            } else if (shapeRoll < 0.65) {
                shape = 'octa';
                wallType = CELL.OCTA_WALL;
                this.stats.octaRooms++;
            } else {
                shape = 'rect';
                wallType = (i % 2 === 0) ? CELL.WALL2 : CELL.WALL3;
                this.stats.rectRooms++;
            }

            this._carveRoom(ca, cb, cc, cd, ra, rb, rc, rd, shape, wallType);

            this.rooms.push({
                a: ca + Math.floor(ra / 2),
                b: cb + Math.floor(rb / 2),
                c: cc + Math.floor(rc / 2),
                d: cd + Math.floor(rd / 2),
                sa: ra, sb: rb, sc: rc, sd: rd,
                wallType, parity, shape,
            });
        }

        // Connect rooms with IVM-aware corridors
        for (let i = 1; i < this.rooms.length; i++) {
            this._carveCorridorIVM(this.rooms[i - 1], this.rooms[i]);
        }
        if (this.rooms.length > 2) {
            this._carveCorridorIVM(this.rooms[this.rooms.length - 1], this.rooms[0]);
        }

        console.log(`[DoomMap] Generated ${this.rooms.length} rooms ` +
            `(T:${this.stats.tetraRooms} O:${this.stats.octaRooms} R:${this.stats.rectRooms}) ` +
            `in ${S}^4 IVM grid (${this.cells.size} cells)`);
    }

    /**
     * Carve a room in the given shape.
     * 'tetra' — diamond/tetrahedral cross-section (slopes inward)
     * 'octa'  — octahedral cross-section (two opposing diamonds)
     * 'rect'  — traditional rectangular room
     */
    _carveRoom(ca, cb, cc, cd, ra, rb, rc, rd, shape, wallType) {
        const centerA = ca + ra / 2;
        const centerB = cb + rb / 2;

        for (let a = ca; a < ca + ra; a++) {
            for (let b = cb; b < cb + rb; b++) {
                for (let c = cc; c < cc + rc; c++) {
                    for (let d = cd; d < cd + rd; d++) {
                        let isInterior = true;
                        let isBorder = false;

                        if (shape === 'tetra') {
                            // Tetrahedral cross-section: diamond shape
                            // |a - centerA| / (ra/2) + |b - centerB| / (rb/2) ≤ 1
                            const da = Math.abs(a - centerA) / (ra / 2);
                            const db = Math.abs(b - centerB) / (rb / 2);
                            if (da + db > 1.0) {
                                isInterior = false; // Outside diamond
                            } else if (da + db > 0.75) {
                                isBorder = true; // Border ring
                            }
                        } else if (shape === 'octa') {
                            // Octahedral: wider diamond, flattened at poles
                            const da = Math.abs(a - centerA) / (ra / 2);
                            const db = Math.abs(b - centerB) / (rb / 2);
                            if (da + db > 1.1) {
                                isInterior = false;
                            } else if (da + db > 0.85) {
                                isBorder = true;
                            }
                        } else {
                            // Rect: border = edges
                            if (a === ca || a === ca + ra - 1 || b === cb || b === cb + rb - 1) {
                                isBorder = true;
                            }
                        }

                        if (!isInterior) continue;

                        if (isBorder) {
                            this.setCell(a, b, c, d, wallType);
                        } else {
                            this.setCell(a, b, c, d, CELL.FLOOR);
                        }
                    }
                }
            }
        }
    }

    _carveCorridorIVM(src, dst) {
        let a = src.a, b = src.b, c = src.c, d = src.d;

        while (a !== dst.a) {
            a += Math.sign(dst.a - a);
            this.setCell(a, b, c, d, CELL.FLOOR);
            if (b + 1 < this.size) this.setCell(a, b + 1, c, d, CELL.FLOOR);
            this.stats.corridorCells += 2;
        }
        while (b !== dst.b) {
            b += Math.sign(dst.b - b);
            this.setCell(a, b, c, d, CELL.FLOOR);
            if (a + 1 < this.size) this.setCell(a + 1, b, c, d, CELL.FLOOR);
            this.stats.corridorCells += 2;
        }
        while (c !== dst.c) {
            c += Math.sign(dst.c - c);
            this.setCell(a, b, c, d, CELL.FLOOR);
            this.stats.corridorCells++;
        }
        while (d !== dst.d) {
            d += Math.sign(dst.d - d);
            this.setCell(a, b, c, d, CELL.FLOOR);
            this.stats.corridorCells++;
        }
    }

    /** Count total cells by type (for Synergetics HUD). */
    getCellCounts() {
        const counts = {};
        for (const [, type] of this.cells) {
            counts[type] = (counts[type] || 0) + 1;
        }
        return counts;
    }
}
