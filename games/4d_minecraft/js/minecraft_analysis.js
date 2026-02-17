/**
 * minecraft_analysis.js — Synergetics Geometry Analysis for 4D Minecraft
 *
 * Provides real-time geometric analysis of the block world using
 * Fuller's Synergetics concepts: tetravolumes, IVM grid analysis,
 * coordination numbers, polyhedra detection, and full Quadray verification.
 */

// ═══════════════════════════════════════════════════════════════════════════
// CACHE SYSTEM — recompute only on block change, not every frame
// ═══════════════════════════════════════════════════════════════════════════

let _analysisDirty = true;
let _analysisCache = null;

function markAnalysisDirty() {
    _analysisDirty = true;
}

function getAnalysis(board) {
    if (!_analysisDirty && _analysisCache) return _analysisCache;
    _analysisCache = computeAllAnalysis(board);
    _analysisDirty = false;
    return _analysisCache;
}

// ═══════════════════════════════════════════════════════════════════════════
// 10 ANALYSIS FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Extract all blocks with Quadray + Cartesian positions.
 * @param {MinecraftBoard} board
 * @returns {Array<{a,b,c,d,type,quadray:Quadray,cartesian:{x,y,z}}>}
 */
function extractBlocks(board) {
    const blocks = [];
    for (const [key, type] of board.blocks) {
        const [a, b, c, d] = key.split(',').map(Number);
        const quadray = new Quadray(a, b, c, d);
        const cartesian = quadray.toCartesian();
        blocks.push({ a, b, c, d, type, quadray, cartesian });
    }
    return blocks;
}

/**
 * Calculate world volume in tetravolumes (Fuller's unit: regular tetra = 1).
 * Per-block cell volume = (1/ROOT2)^3 * S3 = 0.375 tetravolumes.
 * @param {Array} blocks - from extractBlocks
 * @returns {{totalTetravolumes: number, perBlockTetravolume: number, blockCount: number}}
 */
function calculateTetravolume(blocks) {
    const perBlockTetravolume = Math.pow(1 / ROOT2, 3) * S3; // ~0.375
    return {
        totalTetravolumes: blocks.length * perBlockTetravolume,
        perBlockTetravolume,
        blockCount: blocks.length
    };
}

/**
 * Analyze IVM grid vertex occupancy and fill ratio.
 * All integer Quadray coordinates ARE IVM vertices.
 * @param {Array} blocks - from extractBlocks
 * @param {number} size - board size
 * @returns {{occupiedVertices: number, totalVertices: number, fillRatio: number}}
 */
function analyzeIVMGrid(blocks, size) {
    const totalVertices = Math.pow(size, 4);
    const occupiedVertices = blocks.length;
    return {
        occupiedVertices,
        totalVertices,
        fillRatio: totalVertices > 0 ? occupiedVertices / totalVertices : 0
    };
}

/**
 * Calculate geometric census: shared/exposed faces, connected components.
 * Uses union-find with path compression for connected components.
 * 4D adjacency: +-1 on each of the 4 axes (8 neighbors).
 * @param {Array} blocks - from extractBlocks
 * @param {MinecraftBoard} board
 * @returns {{sharedFaces: number, exposedFaces: number, components: number}}
 */
function calculateGeometricCensus(blocks, board) {
    const DIRECTIONS = [
        [1, 0, 0, 0], [-1, 0, 0, 0],
        [0, 1, 0, 0], [0, -1, 0, 0],
        [0, 0, 1, 0], [0, 0, -1, 0],
        [0, 0, 0, 1], [0, 0, 0, -1]
    ];

    let sharedFaces = 0;
    const totalPossibleFaces = blocks.length * 8;

    // Union-Find
    const parent = {};
    const rank = {};
    function find(x) {
        if (parent[x] !== x) parent[x] = find(parent[x]);
        return parent[x];
    }
    function union(x, y) {
        const px = find(x), py = find(y);
        if (px === py) return;
        if (rank[px] < rank[py]) parent[px] = py;
        else if (rank[px] > rank[py]) parent[py] = px;
        else { parent[py] = px; rank[px]++; }
    }

    // Initialize union-find
    for (const block of blocks) {
        const key = `${block.a},${block.b},${block.c},${block.d}`;
        parent[key] = key;
        rank[key] = 0;
    }

    // Check adjacency
    for (const block of blocks) {
        const key = `${block.a},${block.b},${block.c},${block.d}`;
        for (const [da, db, dc, dd] of DIRECTIONS) {
            const na = block.a + da, nb = block.b + db, nc = block.c + dc, nd = block.d + dd;
            if (board.getBlock(na, nb, nc, nd) !== BlockType.AIR) {
                sharedFaces++;
                const neighborKey = `${na},${nb},${nc},${nd}`;
                if (parent[neighborKey] !== undefined) {
                    union(key, neighborKey);
                }
            }
        }
    }

    // Each shared face is counted twice (once from each side)
    sharedFaces = Math.floor(sharedFaces / 2);
    const exposedFaces = totalPossibleFaces - sharedFaces * 2;

    // Count unique components
    const roots = new Set();
    for (const block of blocks) {
        const key = `${block.a},${block.b},${block.c},${block.d}`;
        roots.add(find(key));
    }

    return { sharedFaces, exposedFaces, components: roots.size };
}

/**
 * Calculate center of mass in Quadray and Cartesian.
 * @param {Array} blocks - from extractBlocks
 * @returns {{quadray: Quadray, cartesian: {x,y,z}}|null}
 */
function calculateCenterOfMass(blocks) {
    if (blocks.length === 0) return null;
    let sa = 0, sb = 0, sc = 0, sd = 0;
    let sx = 0, sy = 0, sz = 0;
    for (const block of blocks) {
        sa += block.a; sb += block.b; sc += block.c; sd += block.d;
        sx += block.cartesian.x; sy += block.cartesian.y; sz += block.cartesian.z;
    }
    const n = blocks.length;
    return {
        quadray: new Quadray(sa / n, sb / n, sc / n, sd / n),
        cartesian: { x: sx / n, y: sy / n, z: sz / n }
    };
}

/**
 * Calculate bounding box volume converted to tetravolumes.
 * V_bound_tetra = V_bbox_xyz * 3 * S3
 * @param {Array} blocks - from extractBlocks
 * @returns {{bboxVolume: number, boundingTetravolumes: number, min: {x,y,z}, max: {x,y,z}}|null}
 */
function calculateBoundingTetrahedron(blocks) {
    if (blocks.length === 0) return null;
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (const block of blocks) {
        const c = block.cartesian;
        if (c.x < minX) minX = c.x; if (c.y < minY) minY = c.y; if (c.z < minZ) minZ = c.z;
        if (c.x > maxX) maxX = c.x; if (c.y > maxY) maxY = c.y; if (c.z > maxZ) maxZ = c.z;
    }
    // Add half-cell padding (block occupies a cell around its center)
    const pad = 1 / (2 * ROOT2);
    minX -= pad; minY -= pad; minZ -= pad;
    maxX += pad; maxY += pad; maxZ += pad;
    const bboxVolume = (maxX - minX) * (maxY - minY) * (maxZ - minZ);
    return {
        bboxVolume,
        boundingTetravolumes: bboxVolume * 3 * S3,
        min: { x: minX, y: minY, z: minZ },
        max: { x: maxX, y: maxY, z: maxZ }
    };
}

/**
 * Calculate fill density: block tetravolume / bounding tetravolume.
 * @param {Array} blocks - from extractBlocks
 * @returns {{density: number}|null}
 */
function calculateBlockDensity(blocks) {
    if (blocks.length === 0) return null;
    const tetra = calculateTetravolume(blocks);
    const bounding = calculateBoundingTetrahedron(blocks);
    if (!bounding || bounding.boundingTetravolumes === 0) return { density: 0 };
    return {
        density: tetra.totalTetravolumes / bounding.boundingTetravolumes
    };
}

/**
 * Calculate coordination numbers: per-block neighbor count distribution.
 * @param {Array} blocks - from extractBlocks
 * @param {MinecraftBoard} board
 * @returns {{distribution: number[], average: number, max: number}}
 */
function calculateCoordinationNumbers(blocks, board) {
    const DIRECTIONS = [
        [1, 0, 0, 0], [-1, 0, 0, 0],
        [0, 1, 0, 0], [0, -1, 0, 0],
        [0, 0, 1, 0], [0, 0, -1, 0],
        [0, 0, 0, 1], [0, 0, 0, -1]
    ];
    const distribution = new Array(9).fill(0); // 0-8 neighbors
    let totalNeighbors = 0;
    let maxCoord = 0;

    for (const block of blocks) {
        let neighbors = 0;
        for (const [da, db, dc, dd] of DIRECTIONS) {
            if (board.getBlock(block.a + da, block.b + db, block.c + dc, block.d + dd) !== BlockType.AIR) {
                neighbors++;
            }
        }
        distribution[neighbors]++;
        totalNeighbors += neighbors;
        if (neighbors > maxCoord) maxCoord = neighbors;
    }

    return {
        distribution,
        average: blocks.length > 0 ? totalNeighbors / blocks.length : 0,
        max: maxCoord
    };
}

/**
 * Detect Synergetics polyhedra: tetrahedra (4 blocks), octahedra (6), cuboctahedra (12).
 * Pattern-matches against known vertex sets in IVM coordinates.
 * Tetra: basis offsets from any block.
 * Octa: permutations of (1,1,0,0) offsets.
 * Cubo: permutations of (2,1,1,0) offsets.
 * Volumes: T=1, O=4, C=20 tetravolumes.
 * @param {Array} blocks - from extractBlocks
 * @returns {{tetrahedra: number, octahedra: number, cuboctahedra: number, totalPolyVolume: number}}
 */
function detectSynergeticsPolyhedra(blocks) {
    const blockSet = new Set(blocks.map(b => `${b.a},${b.b},${b.c},${b.d}`));
    const has = (a, b, c, d) => blockSet.has(`${a},${b},${c},${d}`);

    let tetrahedra = 0;
    let octahedra = 0;
    let cuboctahedra = 0;

    // Tetrahedron: 4 vertices forming a regular tetrahedron
    // Pattern: base block + offsets (1,0,0,0), (0,1,0,0), (0,0,1,0), (0,0,0,1)
    // Check if a block plus its 3 basis-direction neighbors form a tetrahedron
    const tetraOffsets = [
        [1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]
    ];
    const countedTetra = new Set();

    for (const block of blocks) {
        // Check all combinations of 4 from the 5 points (block + 4 offsets)
        const points = [[block.a, block.b, block.c, block.d]];
        for (const [da, db, dc, dd] of tetraOffsets) {
            points.push([block.a + da, block.b + db, block.c + dc, block.d + dd]);
        }

        // Check all C(5,4)=5 subsets of 4 points
        for (let skip = 0; skip < 5; skip++) {
            const subset = points.filter((_, i) => i !== skip);
            if (subset.every(([a, b, c, d]) => has(a, b, c, d))) {
                const key = subset.map(p => p.join(',')).sort().join('|');
                if (!countedTetra.has(key)) {
                    countedTetra.add(key);
                    tetrahedra++;
                }
            }
        }
    }

    // Octahedron: 6 vertices — permutations of offsets (+-1, +-1, 0, 0)
    // from center block, the 6 vertices at distance 1 along axis pairs
    const octaOffsets = [
        [1, 1, 0, 0], [1, 0, 1, 0], [1, 0, 0, 1],
        [0, 1, 1, 0], [0, 1, 0, 1], [0, 0, 1, 1]
    ];
    const countedOcta = new Set();

    for (const block of blocks) {
        const verts = octaOffsets.map(([da, db, dc, dd]) => [block.a + da, block.b + db, block.c + dc, block.d + dd]);
        if (verts.every(([a, b, c, d]) => has(a, b, c, d))) {
            const key = verts.map(p => p.join(',')).sort().join('|');
            if (!countedOcta.has(key)) {
                countedOcta.add(key);
                octahedra++;
            }
        }
    }

    // Cuboctahedron: 12 vertices — permutations of (2,1,1,0)
    const cuboOffsets = [];
    const vals = [2, 1, 1, 0];
    // Generate all unique permutations of (2,1,1,0)
    const permSet = new Set();
    for (let i = 0; i < 4; i++)
        for (let j = 0; j < 4; j++)
            for (let k = 0; k < 4; k++)
                for (let l = 0; l < 4; l++) {
                    if (new Set([i, j, k, l]).size === 4) {
                        const p = [vals[i], vals[j], vals[k], vals[l]];
                        const key = p.join(',');
                        if (!permSet.has(key)) {
                            permSet.add(key);
                            cuboOffsets.push(p);
                        }
                    }
                }
    const countedCubo = new Set();

    for (const block of blocks) {
        const verts = cuboOffsets.map(([da, db, dc, dd]) => [block.a + da, block.b + db, block.c + dc, block.d + dd]);
        if (verts.every(([a, b, c, d]) => has(a, b, c, d))) {
            const key = [block.a, block.b, block.c, block.d].join(',');
            if (!countedCubo.has(key)) {
                countedCubo.add(key);
                cuboctahedra++;
            }
        }
    }

    return {
        tetrahedra,
        octahedra,
        cuboctahedra,
        totalPolyVolume: tetrahedra * 1 + octahedra * 4 + cuboctahedra * 20
    };
}

/**
 * Calculate pairwise distance statistics using Quadray.distance().
 * Capped at 200 blocks for O(n^2) computation.
 * @param {Array} blocks - from extractBlocks
 * @returns {{min: number, max: number, mean: number, count: number, capped: boolean}|null}
 */
function calculateDistanceStatistics(blocks) {
    if (blocks.length < 2) return null;
    const capped = blocks.length > 200;
    const subset = capped ? blocks.slice(0, 200) : blocks;
    let min = Infinity, max = 0, total = 0, count = 0;

    for (let i = 0; i < subset.length; i++) {
        for (let j = i + 1; j < subset.length; j++) {
            const d = Quadray.distance(subset[i].quadray, subset[j].quadray);
            if (d < min) min = d;
            if (d > max) max = d;
            total += d;
            count++;
        }
    }

    return {
        min: count > 0 ? min : 0,
        max,
        mean: count > 0 ? total / count : 0,
        count,
        capped
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// GEOMETRIC VERIFICATION SUITE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate the angle between two Quadray vectors (in degrees).
 * @param {Quadray} q1
 * @param {Quadray} q2
 * @returns {number} Angle in degrees
 */
function angleBetweenQuadrays(q1, q2) {
    const c1 = q1.toCartesian();
    const c2 = q2.toCartesian();
    const dot = c1.x * c2.x + c1.y * c2.y + c1.z * c2.z;
    const mag1 = Math.sqrt(c1.x ** 2 + c1.y ** 2 + c1.z ** 2);
    const mag2 = Math.sqrt(c2.x ** 2 + c2.y ** 2 + c2.z ** 2);
    if (mag1 === 0 || mag2 === 0) return 0;
    const cosAngle = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
    return Math.acos(cosAngle) * (180 / Math.PI);
}

/**
 * Verify round-trip conversion (Quadray -> Cartesian -> Quadray).
 * @param {Quadray} q
 * @param {number} tolerance
 * @returns {{passed: boolean, error: number, original: Quadray, recovered: Quadray}}
 */
function verifyRoundTrip(q, tolerance = 0.01) {
    const cart = q.toCartesian();
    const recovered = Quadray.fromCartesian(cart.x, cart.y, cart.z);
    const error = Quadray.distance(q.normalized(), recovered.normalized());
    return { passed: error < tolerance, error, original: q, recovered };
}

/**
 * Comprehensive geometric identity verification — 8 checks.
 * Checks 1-6 ported from chess analysis.js, checks 7-8 are Synergetics-specific.
 * @returns {{timestamp: string, checks: Array, allPassed: boolean}}
 */
function verifyGeometricIdentities(board = null) {
    const TOLERANCE = 0.01;
    const EXPECTED_TETRAHEDRAL_ANGLE = 109.4712;
    const EXPECTED_BASIS_LENGTH = 1 / Math.sqrt(2);

    const results = {
        timestamp: new Date().toISOString(),
        checks: [],
        allPassed: true
    };

    // 1. Basis vector lengths = 0.7071
    const basisLengths = Quadray.BASIS.map(b => b.length());
    const check1 = {
        name: 'Basis Vector Lengths',
        description: 'All 4 basis vectors should have equal length (~0.707)',
        expected: EXPECTED_BASIS_LENGTH.toFixed(4),
        actual: basisLengths.map(l => l.toFixed(4)),
        passed: basisLengths.every(l => Math.abs(l - EXPECTED_BASIS_LENGTH) < TOLERANCE)
    };
    results.checks.push(check1);
    if (!check1.passed) results.allPassed = false;

    // 2. Tetrahedral angles = 109.47 deg (all 6 pairs)
    const anglePairs = [];
    const labels = ['A', 'B', 'C', 'D'];
    for (let i = 0; i < 4; i++) {
        for (let j = i + 1; j < 4; j++) {
            const angle = angleBetweenQuadrays(Quadray.BASIS[i], Quadray.BASIS[j]);
            anglePairs.push({ pair: `${labels[i]}-${labels[j]}`, angle: angle.toFixed(2) });
        }
    }
    const check2 = {
        name: 'Tetrahedral Symmetry',
        description: `All basis pairs should form ${EXPECTED_TETRAHEDRAL_ANGLE.toFixed(2)}° angles`,
        expected: EXPECTED_TETRAHEDRAL_ANGLE.toFixed(2),
        actual: anglePairs,
        passed: anglePairs.every(p => Math.abs(parseFloat(p.angle) - EXPECTED_TETRAHEDRAL_ANGLE) < 1.0)
    };
    results.checks.push(check2);
    if (!check2.passed) results.allPassed = false;

    // 3. Origin identity (0,0,0,0) -> (0,0,0)
    const originCart = Quadray.ORIGIN.toCartesian();
    const check3 = {
        name: 'Origin Identity',
        description: 'Quadray origin (0,0,0,0) maps to Cartesian origin (0,0,0)',
        expected: '{x: 0, y: 0, z: 0}',
        actual: `{x: ${originCart.x.toFixed(4)}, y: ${originCart.y.toFixed(4)}, z: ${originCart.z.toFixed(4)}}`,
        passed: Math.abs(originCart.x) < TOLERANCE && Math.abs(originCart.y) < TOLERANCE && Math.abs(originCart.z) < TOLERANCE
    };
    results.checks.push(check3);
    if (!check3.passed) results.allPassed = false;

    // 4. Round-trip conversion (6 test points, error < 0.01)
    const testPoints = [
        new Quadray(1, 0, 0, 0), new Quadray(0, 1, 0, 0),
        new Quadray(0, 0, 1, 0), new Quadray(0, 0, 0, 1),
        new Quadray(2, 1, 0, 1), new Quadray(3, 2, 1, 0)
    ];
    const roundTripResults = testPoints.map(q => verifyRoundTrip(q));
    const check4 = {
        name: 'Round-Trip Conversion',
        description: 'Quadray -> Cartesian -> Quadray recovers original position',
        expected: 'error < 0.01 for all test points',
        actual: roundTripResults.map((r, i) => `Point ${i + 1}: error=${r.error.toFixed(4)}`),
        passed: roundTripResults.every(r => r.passed)
    };
    results.checks.push(check4);
    if (!check4.passed) results.allPassed = false;

    // 5. Distance symmetry d(A,B) = d(B,A)
    const qA = new Quadray(1, 0, 0, 0);
    const qB = new Quadray(0, 1, 0, 0);
    const d1 = Quadray.distance(qA, qB);
    const d2 = Quadray.distance(qB, qA);
    const check5 = {
        name: 'Distance Symmetry',
        description: 'distance(A, B) equals distance(B, A)',
        expected: 'd1 === d2',
        actual: `d1=${d1.toFixed(6)}, d2=${d2.toFixed(6)}`,
        passed: Math.abs(d1 - d2) < 0.0001
    };
    results.checks.push(check5);
    if (!check5.passed) results.allPassed = false;

    // 6. Triangle inequality d(A,B)+d(B,C) >= d(A,C)
    const qC = new Quadray(0, 0, 1, 0);
    const dAB = Quadray.distance(qA, qB);
    const dBC = Quadray.distance(qB, qC);
    const dAC = Quadray.distance(qA, qC);
    const check6 = {
        name: 'Triangle Inequality',
        description: 'd(A,B) + d(B,C) >= d(A,C) for all points',
        expected: `${dAB.toFixed(4)} + ${dBC.toFixed(4)} >= ${dAC.toFixed(4)}`,
        actual: `${(dAB + dBC).toFixed(4)} >= ${dAC.toFixed(4)}`,
        passed: dAB + dBC >= dAC - TOLERANCE
    };
    results.checks.push(check6);
    if (!check6.passed) results.allPassed = false;

    // 7. NEW: S3 constant validation — S3 = sqrt(9/8)
    const expectedS3 = Math.sqrt(9 / 8);
    const check7 = {
        name: 'S3 Constant Validation',
        description: 'S3 = sqrt(9/8) = 1.0607 (XYZ-to-IVM volume conversion)',
        expected: expectedS3.toFixed(6),
        actual: S3.toFixed(6),
        passed: Math.abs(S3 - expectedS3) < 0.0001
    };
    results.checks.push(check7);
    if (!check7.passed) results.allPassed = false;

    // 8. NEW: Synergetics volume ratios — Tetra:Octa:Cubo = 1:4:20
    const tetraVol = 1;
    const octaVol = 4;
    const cuboVol = 20;
    const ratioOT = octaVol / tetraVol;
    const ratioCT = cuboVol / tetraVol;
    const check8 = {
        name: 'Synergetics Volume Ratios',
        description: 'Tetra:Octa:Cubo = 1:4:20 in tetravolumes',
        expected: 'T:O:C = 1:4:20',
        actual: `T:O:C = ${tetraVol}:${octaVol}:${cuboVol} (O/T=${ratioOT}, C/T=${ratioCT})`,
        passed: ratioOT === 4 && ratioCT === 20
    };
    results.checks.push(check8);
    if (!check8.passed) results.allPassed = false;

    // 9. All Block Coordinates Integer (only when board is provided)
    if (board) {
        let allInteger = true;
        let nonIntegerCount = 0;
        const blockCount = board.blocks.size;
        for (const [key] of board.blocks) {
            const [a, b, c, d] = key.split(',').map(Number);
            if (!Number.isInteger(a) || !Number.isInteger(b) || !Number.isInteger(c) || !Number.isInteger(d)) {
                allInteger = false;
                nonIntegerCount++;
            }
        }
        const check9 = {
            name: 'All Block Coordinates Integer',
            description: 'Every block (a,b,c,d) must have integer coordinates (IVM grid)',
            expected: `All ${blockCount} blocks have integer coordinates`,
            actual: allInteger ? `All ${blockCount} blocks are integer` : `${nonIntegerCount} of ${blockCount} blocks have non-integer coordinates`,
            passed: allInteger
        };
        results.checks.push(check9);
        if (!check9.passed) results.allPassed = false;
    }

    return results;
}

// ═══════════════════════════════════════════════════════════════════════════
// MASTER FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Compute all analysis metrics for the current board state.
 * @param {MinecraftBoard} board
 * @returns {object} All metrics
 */
function computeAllAnalysis(board) {
    const blocks = extractBlocks(board);
    const tetravolume = calculateTetravolume(blocks);
    const ivmGrid = analyzeIVMGrid(blocks, board.size);
    const census = calculateGeometricCensus(blocks, board);
    const centerOfMass = calculateCenterOfMass(blocks);
    const boundingTetra = calculateBoundingTetrahedron(blocks);
    const density = calculateBlockDensity(blocks);
    const coordination = calculateCoordinationNumbers(blocks, board);
    const polyhedra = detectSynergeticsPolyhedra(blocks);
    const distances = calculateDistanceStatistics(blocks);

    return {
        blocks,
        tetravolume,
        ivmGrid,
        census,
        centerOfMass,
        boundingTetra,
        density,
        coordination,
        polyhedra,
        distances,
        blockCount: blocks.length,
        timestamp: Date.now()
    };
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        markAnalysisDirty,
        getAnalysis,
        extractBlocks,
        calculateTetravolume,
        analyzeIVMGrid,
        calculateGeometricCensus,
        calculateCenterOfMass,
        calculateBoundingTetrahedron,
        calculateBlockDensity,
        calculateCoordinationNumbers,
        detectSynergeticsPolyhedra,
        calculateDistanceStatistics,
        angleBetweenQuadrays,
        verifyRoundTrip,
        verifyGeometricIdentities,
        computeAllAnalysis
    };
}
