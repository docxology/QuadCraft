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
//
// angleBetweenQuadrays, verifyRoundTrip, and the 8-check verifyGeometricIdentities
// are the canonical shared implementations from 4d_generic/synergetics.js — this
// file does NOT redeclare them (a prior local copy drifted from the shared one
// and silently shadowed it in the browser; see docs/games.md "Shared Math
// Foundation"). Only the board-specific 9th check lives here, layered on top of
// the shared 8-check result via verifyGeometricIdentitiesWithBoard().
// ═══════════════════════════════════════════════════════════════════════════

// Node.js compatibility: load the shared Synergetics functions if not already
// in scope (in the browser, 4d_generic/synergetics.js is loaded via <script>
// before this file — see index.html).
if (typeof angleBetweenQuadrays === 'undefined' && typeof require !== 'undefined') {
    /* eslint-disable no-global-assign */
    const _s = require('../../4d_generic/synergetics.js');
    globalThis.angleBetweenQuadrays = _s.angleBetweenQuadrays;
    globalThis.verifyRoundTrip = _s.verifyRoundTrip;
    globalThis.verifyGeometricIdentities = _s.verifyGeometricIdentities;
}

// Capture the canonical shared 8-check implementation into a local closure
// binding NOW — before any consumer (e.g. a test harness re-pointing the
// global at this module's own export) can reassign the mutable global of the
// same name. verifyGeometricIdentitiesWithBoard() must always delegate to the
// original shared checks, never to whatever currently occupies the global slot.
const _sharedVerifyGeometricIdentities = verifyGeometricIdentities;

/**
 * Comprehensive geometric identity verification — the shared 8 checks from
 * 4d_generic/synergetics.js, plus a 9th Minecraft-specific check that requires
 * a board (all placed blocks have integer IVM coordinates).
 * @param {MinecraftBoard|null} board
 * @returns {{timestamp: string, checks: Array, allPassed: boolean}}
 */
function verifyGeometricIdentitiesWithBoard(board = null) {
    const results = _sharedVerifyGeometricIdentities();

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
        verifyGeometricIdentities: verifyGeometricIdentitiesWithBoard,
        computeAllAnalysis
    };
}
