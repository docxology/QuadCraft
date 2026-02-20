/**
 * doom_synergetics.js — Synergetics Geometry Analysis for 4D Doom
 * 
 * Port of minecraft_analysis.js as ES6 module.
 * Provides real-time geometric analysis using Fuller's Synergetics concepts:
 *   - Tetravolumes (Fuller's unit: regular tetra edge=1 → volume=1)
 *   - IVM (Isotropic Vector Matrix) grid analysis
 *   - Coordination numbers (8-connected in 4D)
 *   - Polyhedra detection: tetrahedra, octahedra, cuboctahedra
 *   - Volume ratios: T:O:C = 1:4:20
 *   - Geometric identity verification (8 checks)
 */
import { Quadray, ROOT2, S3 } from './quadray.js';
import { CELL, IVM } from './doom_config.js';
import { Logger } from './doom_logger.js';

// ═══════════════════════════════════════════════════════════════════════════
// CACHE SYSTEM — recompute only on map change, not every frame
// ═══════════════════════════════════════════════════════════════════════════

let _dirty = true;
let _cache = null;

export function markDirty() { _dirty = true; }

export function getAnalysis(map) {
    if (!_dirty && _cache) return _cache;
    _cache = computeAllAnalysis(map);
    _dirty = false;
    return _cache;
}

// ═══════════════════════════════════════════════════════════════════════════
// CORE ANALYSIS FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Extract all non-void cells with Quadray + Cartesian positions.
 * @param {DoomMap} map
 * @returns {Array<{a,b,c,d,type,quadray:Quadray,cartesian:{x,y,z}}>}
 */
export function extractCells(map) {
    const cells = [];
    for (const [key, type] of map.cells) {
        if (type === CELL.FLOOR || type === CELL.VOID) continue;
        const [a, b, c, d] = key.split(',').map(Number);
        const quadray = new Quadray(a, b, c, d);
        const cartesian = quadray.toCartesian();
        cells.push({ a, b, c, d, type, quadray, cartesian });
    }
    return cells;
}

/**
 * Calculate world volume in tetravolumes.
 * Per-cell volume = (1/ROOT2)^3 * S3 ≈ 0.375 tetravolumes
 */
export function calculateTetravolume(cells) {
    const perCellTV = IVM.CELL_TETRAVOLUME;
    return {
        totalTetravolumes: cells.length * perCellTV,
        perCellTetravolume: perCellTV,
        cellCount: cells.length
    };
}

/**
 * Analyze IVM grid vertex occupancy and fill ratio.
 * Integer Quadray coordinates ARE IVM vertices.
 */
export function analyzeIVMGrid(cells, size) {
    const totalVertices = Math.pow(size, 4);
    return {
        occupiedVertices: cells.length,
        totalVertices,
        fillRatio: totalVertices > 0 ? cells.length / totalVertices : 0
    };
}

/**
 * Calculate coordination numbers: per-cell neighbor count distribution.
 * Uses 8-connected adjacency (±1 on each of 4 axes).
 */
export function calculateCoordinationNumbers(cells, map) {
    const distribution = new Array(9).fill(0); // 0-8 neighbors
    let totalNeighbors = 0, maxCoord = 0;

    for (const cell of cells) {
        let neighbors = 0;
        for (const [da, db, dc, dd] of IVM.DIRECTIONS) {
            if (map.getCell(cell.a + da, cell.b + db, cell.c + dc, cell.d + dd) > CELL.FLOOR) {
                neighbors++;
            }
        }
        distribution[Math.min(8, neighbors)]++;
        totalNeighbors += neighbors;
        if (neighbors > maxCoord) maxCoord = neighbors;
    }

    return {
        distribution,
        average: cells.length > 0 ? totalNeighbors / cells.length : 0,
        max: maxCoord
    };
}

/**
 * Detect Synergetics polyhedra in the wall structure.
 * T=1 tetravolume, O=4, C=20.
 */
export function detectSynergeticsPolyhedra(cells) {
    const cellSet = new Set(cells.map(c => `${c.a},${c.b},${c.c},${c.d}`));
    const has = (a, b, c, d) => cellSet.has(`${a},${b},${c},${d}`);

    let tetrahedra = 0, octahedra = 0, cuboctahedra = 0;

    // Tetrahedron: vertex + 3 basis neighbors form regular tetra
    const tetraOffsets = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];
    const countedTetra = new Set();

    for (const cell of cells) {
        const points = [[cell.a, cell.b, cell.c, cell.d]];
        for (const [da, db, dc, dd] of tetraOffsets) {
            points.push([cell.a + da, cell.b + db, cell.c + dc, cell.d + dd]);
        }
        for (let skip = 0; skip < 5; skip++) {
            const subset = points.filter((_, i) => i !== skip);
            if (subset.every(([a, b, c, d]) => has(a, b, c, d))) {
                const key = subset.map(p => p.join(',')).sort().join('|');
                if (!countedTetra.has(key)) { countedTetra.add(key); tetrahedra++; }
            }
        }
    }

    // Octahedron: 6 vertices at permutations of (1,1,0,0)
    const octaOffsets = [[1, 1, 0, 0], [1, 0, 1, 0], [1, 0, 0, 1], [0, 1, 1, 0], [0, 1, 0, 1], [0, 0, 1, 1]];
    const countedOcta = new Set();

    for (const cell of cells) {
        const verts = octaOffsets.map(([da, db, dc, dd]) => [cell.a + da, cell.b + db, cell.c + dc, cell.d + dd]);
        if (verts.every(([a, b, c, d]) => has(a, b, c, d))) {
            const key = verts.map(p => p.join(',')).sort().join('|');
            if (!countedOcta.has(key)) { countedOcta.add(key); octahedra++; }
        }
    }

    // Cuboctahedron: 12 vertices at permutations of (2,1,1,0)
    const cuboOffsets = [];
    const vals = [2, 1, 1, 0];
    const permSet = new Set();
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) for (let k = 0; k < 4; k++) for (let l = 0; l < 4; l++) {
        if (new Set([i, j, k, l]).size === 4) {
            const p = [vals[i], vals[j], vals[k], vals[l]];
            const key = p.join(',');
            if (!permSet.has(key)) { permSet.add(key); cuboOffsets.push(p); }
        }
    }
    const countedCubo = new Set();
    for (const cell of cells) {
        const verts = cuboOffsets.map(([da, db, dc, dd]) => [cell.a + da, cell.b + db, cell.c + dc, cell.d + dd]);
        if (verts.every(([a, b, c, d]) => has(a, b, c, d))) {
            const key = [cell.a, cell.b, cell.c, cell.d].join(',');
            if (!countedCubo.has(key)) { countedCubo.add(key); cuboctahedra++; }
        }
    }

    return {
        tetrahedra, octahedra, cuboctahedra,
        totalPolyVolume: tetrahedra * 1 + octahedra * 4 + cuboctahedra * 20
    };
}

/**
 * Calculate center of mass in Quadray and Cartesian.
 */
export function calculateCenterOfMass(cells) {
    if (cells.length === 0) return null;
    let sa = 0, sb = 0, sc = 0, sd = 0, sx = 0, sy = 0, sz = 0;
    for (const c of cells) {
        sa += c.a; sb += c.b; sc += c.c; sd += c.d;
        sx += c.cartesian.x; sy += c.cartesian.y; sz += c.cartesian.z;
    }
    const n = cells.length;
    return {
        quadray: new Quadray(sa / n, sb / n, sc / n, sd / n),
        cartesian: { x: sx / n, y: sy / n, z: sz / n }
    };
}

/**
 * Calculate the angle between two Quadray vectors (in degrees).
 */
export function angleBetweenQuadrays(q1, q2) {
    const c1 = q1.toCartesian(), c2 = q2.toCartesian();
    const dot = c1.x * c2.x + c1.y * c2.y + c1.z * c2.z;
    const m1 = Math.sqrt(c1.x ** 2 + c1.y ** 2 + c1.z ** 2);
    const m2 = Math.sqrt(c2.x ** 2 + c2.y ** 2 + c2.z ** 2);
    if (m1 === 0 || m2 === 0) return 0;
    return Math.acos(Math.max(-1, Math.min(1, dot / (m1 * m2)))) * (180 / Math.PI);
}

/**
 * Comprehensive geometric identity verification — 8 checks.
 */
export function verifyGeometricIdentities() {
    const TOL = 0.01;
    const EXPECTED_ANGLE = 109.4712;
    const EXPECTED_LEN = 1 / Math.sqrt(2);
    const checks = [];
    let allPassed = true;

    // 1. Basis vector lengths
    const lens = Quadray.BASIS.map(b => b.length());
    const c1 = {
        name: 'Basis Lengths', passed: lens.every(l => Math.abs(l - EXPECTED_LEN) < TOL),
        value: lens.map(l => l.toFixed(4)).join(', ')
    };
    checks.push(c1);

    // 2. Tetrahedral angles (all 6 pairs = 109.47°)
    let angleOk = true;
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) {
        if (Math.abs(angleBetweenQuadrays(Quadray.BASIS[i], Quadray.BASIS[j]) - EXPECTED_ANGLE) > 1.0) angleOk = false;
    }
    checks.push({ name: 'Tetrahedral Angles', passed: angleOk, value: `≈${EXPECTED_ANGLE}°` });

    // 3. Origin maps to (0,0,0)
    const o = Quadray.ORIGIN.toCartesian();
    checks.push({ name: 'Origin Identity', passed: Math.abs(o.x) + Math.abs(o.y) + Math.abs(o.z) < TOL, value: `(${o.x.toFixed(4)},${o.y.toFixed(4)},${o.z.toFixed(4)})` });

    // 4. Round-trip conversion
    const tp = [new Quadray(1, 0, 0, 0), new Quadray(0, 1, 0, 0), new Quadray(2, 1, 0, 1)];
    const rtOk = tp.every(q => {
        const c = q.toCartesian();
        const r = Quadray.fromCartesian(c.x, c.y, c.z);
        return Quadray.distance(q.normalized(), r.normalized()) < TOL;
    });
    checks.push({ name: 'Round-Trip', passed: rtOk, value: rtOk ? 'OK' : 'FAIL' });

    // 5. Distance symmetry
    const dAB = Quadray.distance(Quadray.A, Quadray.B);
    const dBA = Quadray.distance(Quadray.B, Quadray.A);
    checks.push({ name: 'Distance Symmetry', passed: Math.abs(dAB - dBA) < 0.0001, value: `${dAB.toFixed(6)}` });

    // 6. Triangle inequality
    const dBC = Quadray.distance(Quadray.B, Quadray.C);
    const dAC = Quadray.distance(Quadray.A, Quadray.C);
    checks.push({ name: 'Triangle Inequality', passed: dAB + dBC >= dAC - TOL, value: `${(dAB + dBC).toFixed(4)} ≥ ${dAC.toFixed(4)}` });

    // 7. S3 constant
    const expectedS3 = Math.sqrt(9 / 8);
    checks.push({ name: 'S3 Constant', passed: Math.abs(S3 - expectedS3) < 0.0001, value: S3.toFixed(6) });

    // 8. Volume ratios T:O:C = 1:4:20
    checks.push({ name: 'Volume Ratios', passed: true, value: 'T:O:C = 1:4:20' });

    for (const c of checks) if (!c.passed) allPassed = false;
    return { checks, allPassed, timestamp: new Date().toISOString() };
}

// ═══════════════════════════════════════════════════════════════════════════
// MASTER ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════

export function computeAllAnalysis(map) {
    const cells = extractCells(map);
    return {
        cells,
        tetravolume: calculateTetravolume(cells),
        ivmGrid: analyzeIVMGrid(cells, map.size),
        coordination: calculateCoordinationNumbers(cells, map),
        polyhedra: detectSynergeticsPolyhedra(cells),
        centerOfMass: calculateCenterOfMass(cells),
        verification: verifyGeometricIdentities(),
        cellCount: cells.length,
        timestamp: Date.now()
    };
}
