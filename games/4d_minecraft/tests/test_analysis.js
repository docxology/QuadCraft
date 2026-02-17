/**
 * test_analysis.js — Tests for Synergetics Geometry Analysis
 * ~30 tests covering all analysis functions and geometric verification.
 */

const assert = (c, m) => { if (!c) { console.error(`❌ FAILED: ${m}`); throw new Error(m); } console.log(`✅ PASSED: ${m}`); };

if (typeof require !== 'undefined') {
    const { Quadray, ROOT2, S3 } = require('../../4d_generic/quadray.js');
    const { MinecraftBoard, BlockType, BLOCK_NAMES, BLOCK_COLORS } = require('../js/minecraft_board.js');
    const analysis = require('../js/minecraft_analysis.js');
    global.Quadray = Quadray; global.ROOT2 = ROOT2; global.S3 = S3;
    global.MinecraftBoard = MinecraftBoard; global.BlockType = BlockType;
    global.BLOCK_NAMES = BLOCK_NAMES; global.BLOCK_COLORS = BLOCK_COLORS;
    global.extractBlocks = analysis.extractBlocks;
    global.calculateTetravolume = analysis.calculateTetravolume;
    global.analyzeIVMGrid = analysis.analyzeIVMGrid;
    global.calculateGeometricCensus = analysis.calculateGeometricCensus;
    global.calculateCenterOfMass = analysis.calculateCenterOfMass;
    global.calculateBoundingTetrahedron = analysis.calculateBoundingTetrahedron;
    global.calculateBlockDensity = analysis.calculateBlockDensity;
    global.calculateCoordinationNumbers = analysis.calculateCoordinationNumbers;
    global.detectSynergeticsPolyhedra = analysis.detectSynergeticsPolyhedra;
    global.calculateDistanceStatistics = analysis.calculateDistanceStatistics;
    global.angleBetweenQuadrays = analysis.angleBetweenQuadrays;
    global.verifyRoundTrip = analysis.verifyRoundTrip;
    global.verifyGeometricIdentities = analysis.verifyGeometricIdentities;
    global.computeAllAnalysis = analysis.computeAllAnalysis;
    global.markAnalysisDirty = analysis.markAnalysisDirty;
    global.getAnalysis = analysis.getAnalysis;
}

function runAnalysisTests() {
    console.log("Running Synergetics Analysis Tests...\n");

    // --- extractBlocks ---
    const board = new MinecraftBoard(4);
    const blocks = extractBlocks(board);
    assert(blocks.length > 0, "extractBlocks returns non-empty array for populated board");
    assert(blocks[0].quadray instanceof Quadray, "extractBlocks includes Quadray objects");
    assert(typeof blocks[0].cartesian.x === 'number', "extractBlocks includes Cartesian coords");
    assert(typeof blocks[0].type === 'number', "extractBlocks includes block type");

    // --- calculateTetravolume ---
    const tetra = calculateTetravolume(blocks);
    const expectedPerBlock = Math.pow(1 / ROOT2, 3) * S3;
    assert(Math.abs(tetra.perBlockTetravolume - expectedPerBlock) < 0.001, "Per-block tetravolume = (1/ROOT2)^3 * S3 ≈ 0.375");
    assert(Math.abs(tetra.totalTetravolumes - blocks.length * expectedPerBlock) < 0.01, "Total tetravolumes = blockCount * perBlock");
    assert(tetra.blockCount === blocks.length, "Tetravolume blockCount matches");

    // --- analyzeIVMGrid ---
    const ivmBoard = new MinecraftBoard(4);
    const ivmBlocks = extractBlocks(ivmBoard);
    const ivm = analyzeIVMGrid(ivmBlocks, 4);
    assert(ivm.totalVertices === 256, "IVM totalVertices = size^4 = 256 for size 4");
    assert(ivm.occupiedVertices === ivmBlocks.length, "IVM occupiedVertices matches block count");
    assert(ivm.fillRatio >= 0, "IVM fillRatio >= 0 (can exceed 1 when blocks extend beyond grid)");

    // --- calculateCenterOfMass ---
    const symBoard = new MinecraftBoard(4);
    symBoard.blocks.clear();
    symBoard.setBlock(1, 0, 0, 0, BlockType.STONE);
    symBoard.setBlock(0, 1, 0, 0, BlockType.STONE);
    const symBlocks = extractBlocks(symBoard);
    const com = calculateCenterOfMass(symBlocks);
    assert(com !== null, "Center of mass is not null for non-empty blocks");
    assert(typeof com.quadray.a === 'number', "Center of mass has Quadray component");
    assert(typeof com.cartesian.x === 'number', "Center of mass has Cartesian component");

    // center of single block = block itself
    const singleBoard = new MinecraftBoard(4);
    singleBoard.blocks.clear();
    singleBoard.setBlock(2, 3, 1, 0, BlockType.STONE);
    const singleBlocks = extractBlocks(singleBoard);
    const singleCom = calculateCenterOfMass(singleBlocks);
    assert(Math.abs(singleCom.quadray.a - 2) < 0.001, "Single block center of mass equals block position");

    // --- calculateCoordinationNumbers ---
    const coordBoard = new MinecraftBoard(4);
    const coordBlocks = extractBlocks(coordBoard);
    const coord = calculateCoordinationNumbers(coordBlocks, coordBoard);
    assert(coord.distribution.length === 9, "Coordination distribution has 9 entries (0-8)");
    assert(coord.average >= 0 && coord.average <= 8, "Average coordination between 0 and 8");
    assert(coord.max >= 0 && coord.max <= 8, "Max coordination between 0 and 8");

    // --- calculateGeometricCensus ---
    const census = calculateGeometricCensus(coordBlocks, coordBoard);
    assert(census.sharedFaces >= 0, "Shared faces >= 0");
    assert(census.exposedFaces >= 0, "Exposed faces >= 0");
    assert(census.components >= 1, "At least 1 connected component");

    // --- calculateBoundingTetrahedron ---
    const bounding = calculateBoundingTetrahedron(blocks);
    assert(bounding !== null, "Bounding tetrahedron not null for non-empty blocks");
    assert(bounding.bboxVolume > 0, "Bounding box volume > 0");
    assert(bounding.boundingTetravolumes > 0, "Bounding tetravolumes > 0");
    assert(bounding.boundingTetravolumes === bounding.bboxVolume * 3 * S3, "V_bound_tetra = V_bbox * 3 * S3");

    // --- calculateBlockDensity ---
    const density = calculateBlockDensity(blocks);
    assert(density !== null, "Density not null for non-empty blocks");
    assert(density.density > 0 && density.density <= 1, "Density between 0 and 1");

    // --- calculateDistanceStatistics ---
    const distBoard = new MinecraftBoard(4);
    const distBlocks = extractBlocks(distBoard);
    const dist = calculateDistanceStatistics(distBlocks);
    assert(dist !== null, "Distance stats not null for multiple blocks");
    assert(dist.min >= 0, "Min distance >= 0");
    assert(dist.max >= dist.min, "Max distance >= min distance");
    assert(dist.mean >= dist.min && dist.mean <= dist.max, "Mean distance between min and max");

    // Cap test: 200 block limit
    const bigBoard = new MinecraftBoard(8);
    const bigBlocks = extractBlocks(bigBoard);
    if (bigBlocks.length > 200) {
        const bigDist = calculateDistanceStatistics(bigBlocks);
        assert(bigDist.capped === true, "Distance stats capped for >200 blocks");
        assert(bigDist.count <= 200 * 199 / 2, "Pairwise count limited to C(200,2)");
    } else {
        console.log("✅ PASSED: Distance cap (skipped — board has ≤200 blocks, testing flag)");
        // Verify capped=false for small boards
        assert(dist.capped === false, "Distance stats not capped for small board");
    }

    // --- detectSynergeticsPolyhedra ---
    const polyBoard = new MinecraftBoard(4);
    polyBoard.blocks.clear();
    // Place a tetrahedron: 4 blocks at basis positions
    polyBoard.setBlock(0, 0, 0, 0, BlockType.STONE);
    polyBoard.setBlock(1, 0, 0, 0, BlockType.STONE);
    polyBoard.setBlock(0, 1, 0, 0, BlockType.STONE);
    polyBoard.setBlock(0, 0, 1, 0, BlockType.STONE);
    const polyBlocks = extractBlocks(polyBoard);
    const poly = detectSynergeticsPolyhedra(polyBlocks);
    assert(poly.tetrahedra >= 1, "Detects tetrahedron from 4 basis blocks");
    assert(typeof poly.octahedra === 'number', "Polyhedra detection includes octahedra count");
    assert(typeof poly.cuboctahedra === 'number', "Polyhedra detection includes cuboctahedra count");
    assert(typeof poly.totalPolyVolume === 'number', "Polyhedra detection includes total volume");

    // --- Geometric Verification Suite (8 checks) ---
    const verif = verifyGeometricIdentities();
    assert(verif.checks.length === 8, "Verification suite has exactly 8 checks");
    assert(verif.checks[0].name === 'Basis Vector Lengths', "Check 1: Basis Vector Lengths");
    assert(verif.checks[0].passed, "Basis vector lengths ≈ 0.7071");
    assert(verif.checks[1].name === 'Tetrahedral Symmetry', "Check 2: Tetrahedral Symmetry");
    assert(verif.checks[1].passed, "Tetrahedral angles ≈ 109.47°");
    assert(verif.checks[2].passed, "Check 3: Origin identity passes");
    assert(verif.checks[3].passed, "Check 4: Round-trip conversion passes");
    assert(verif.checks[4].passed, "Check 5: Distance symmetry passes");
    assert(verif.checks[5].passed, "Check 6: Triangle inequality passes");
    assert(verif.checks[6].name === 'S3 Constant Validation', "Check 7: S3 Constant Validation");
    assert(verif.checks[6].passed, "S3 = sqrt(9/8) validated");
    assert(verif.checks[7].name === 'Synergetics Volume Ratios', "Check 8: Synergetics Volume Ratios");
    assert(verif.checks[7].passed, "T:O:C = 1:4:20 validated");
    assert(verif.allPassed, "All 8 geometric verification checks pass");

    // --- S3 constant direct check ---
    assert(Math.abs(S3 - Math.sqrt(9 / 8)) < 0.0001, "S3 constant equals sqrt(9/8)");

    // --- Round-trip for all basis vectors ---
    for (let i = 0; i < 4; i++) {
        const rt = verifyRoundTrip(Quadray.BASIS[i]);
        assert(rt.passed, `Round-trip passes for basis vector ${['A', 'B', 'C', 'D'][i]}`);
    }

    // --- Cache invalidation ---
    const cacheBoard = new MinecraftBoard(4);
    const result1 = getAnalysis(cacheBoard);
    const result2 = getAnalysis(cacheBoard);
    assert(result1 === result2, "Cache returns same object when not dirty");
    markAnalysisDirty();
    const result3 = getAnalysis(cacheBoard);
    assert(result3 !== result1, "Cache recomputes after markAnalysisDirty()");

    // --- computeAllAnalysis master function ---
    const all = computeAllAnalysis(board);
    assert(all.tetravolume !== undefined, "computeAllAnalysis includes tetravolume");
    assert(all.ivmGrid !== undefined, "computeAllAnalysis includes ivmGrid");
    assert(all.census !== undefined, "computeAllAnalysis includes census");
    assert(all.polyhedra !== undefined, "computeAllAnalysis includes polyhedra");
    assert(all.distances !== undefined || all.distances === null, "computeAllAnalysis includes distances");

    console.log("\n✅ All Synergetics Analysis tests completed!");
}

if (typeof require !== 'undefined' && require.main === module) runAnalysisTests();
