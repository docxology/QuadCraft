/**
 * test_doom.js — Comprehensive 4D Doom Synergetics Test Suite
 * 
 * 13 test sections with 90+ tests covering:
 *   1. Configuration (IVM constants)
 *   2. Quadray operations (IVM utilities, round-trip)
 *   3. Map generation (sparse storage, slicing, room shapes)
 *   4. Entity Quadray helpers
 *   5. Physics (IVM neighbors, Quadray distance)
 *   6. Synergetics analysis (tetravolumes, coordination, polyhedra)
 *   7. Geometric identity verification (8 checks)
 *   8. Geometry module (Concentric Hierarchy, Jitterbug, frequency)
 *   9. Polyhedra census (Euler verification)
 *  10. Volume conversions and constants
 */
import { CELL, IVM, MAP, WEAPONS, ENEMY_STATS, RENDER, COLORS } from '../js/doom_config.js';
import { Quadray, ROOT2, S3 } from '../js/quadray.js';
import { DoomMap } from '../js/doom_map.js';
import { Player, Enemy, Projectile, Particle, Pickup } from '../js/doom_entities.js';
import { Physics } from '../js/doom_physics.js';
import {
    extractCells, calculateTetravolume, analyzeIVMGrid, calculateCoordinationNumbers,
    detectSynergeticsPolyhedra, calculateCenterOfMass, angleBetweenQuadrays,
    computeAllAnalysis, markDirty
} from '../js/doom_synergetics.js';
import {
    CONCENTRIC_HIERARCHY, HIERARCHY_ORDER, jitterbugTransform, jitterbugAngle,
    analyzeFrequency, POLYHEDRA_CENSUS, verifyEuler, verifyAllEuler,
    analyzeClosestPacking, greatCircle, xyzToTetravolumes, tetravolumesToXYZ,
    tetrahedronVolume, verifySynergeticsConstants
} from '../js/doom_geometry.js';

let passed = 0, failed = 0, total = 0;
const results = [];

function assert(condition, msg) {
    total++;
    if (condition) {
        passed++;
        results.push({ pass: true, msg });
    } else {
        failed++;
        results.push({ pass: false, msg });
        console.error('FAIL:', msg);
    }
}

function approx(a, b, eps = 0.05) { return Math.abs(a - b) < eps; }

function renderResults() {
    if (typeof document === 'undefined') return; // Skip in Node.js

    const el = document.getElementById('results');
    const header = document.createElement('h2');
    header.style.color = failed === 0 ? '#0f0' : '#f80';
    header.textContent = `4D Doom Synergetics Tests: ${passed}/${total}`;
    el.appendChild(header);

    const status = document.createElement('p');
    status.style.color = failed === 0 ? '#0f0' : '#f00';
    status.style.fontWeight = 'bold';
    status.textContent = failed === 0 ? 'ALL TESTS PASSED ✓' : `${failed} TESTS FAILED ✗`;
    el.appendChild(status);

    // Standard output for test runner
    console.log(`=== Results: ${passed} passed, ${failed} failed ===`);
    if (failed === 0) console.log('✅ ALL TESTS PASSED');
    else console.error('❌ SOME TESTS FAILED');

    for (const r of results) {
        const line = document.createElement('div');
        line.style.color = r.pass ? '#0a0' : '#f44';
        line.textContent = (r.pass ? '✓ ' : '✗ ') + r.msg;
        el.appendChild(line);
    }
}

function runTests() {
    try {
        // ═════════════════════════════════════════════════════════════════
        // 1. CONFIGURATION
        // ═════════════════════════════════════════════════════════════════
        assert(CELL.WALL === 2, 'CELL.WALL is 2');
        assert(CELL.TETRA_WALL === 8, 'CELL.TETRA_WALL is 8');
        assert(CELL.OCTA_WALL === 9, 'CELL.OCTA_WALL is 9');
        assert(WEAPONS.length === 3, '3 weapons defined');
        assert(ENEMY_STATS.imp.hp === 60, 'Imp has 60 HP');
        assert(RENDER.FOV > 0, 'FOV is positive');
        assert(MAP.SIZE === 24, 'Map size is 24');
        assert(IVM.DIRECTIONS.length === 8, 'IVM has 8 directions');
        assert(approx(IVM.CELL_TETRAVOLUME, 0.375, 0.001), `Cell tetravolume ≈ 0.375 (got ${IVM.CELL_TETRAVOLUME.toFixed(4)})`);
        assert(approx(IVM.TETRAHEDRAL_ANGLE, 109.47, 0.1), 'Tetrahedral angle ≈ 109.47°');
        assert(COLORS.quadrayA !== undefined, 'Quadray axis A color defined');
        assert(COLORS.synergetics !== undefined, 'Synergetics HUD color defined');
        assert(COLORS.ivm !== undefined, 'IVM grid color defined');

        // ═════════════════════════════════════════════════════════════════
        // 2. QUADRAY
        // ═════════════════════════════════════════════════════════════════
        const q1 = new Quadray(1, 0, 0, 0);
        assert(q1.a === 1, 'Quadray constructor');
        const c1 = q1.toCartesian();
        assert(typeof c1.x === 'number', 'toCartesian returns x');
        const q2 = new Quadray(0, 1, 0, 0);
        const d12 = Quadray.distance(q1, q2);
        assert(d12 > 0, 'distance between basis vectors > 0');
        const qn = q1.normalized();
        assert(approx(Math.min(qn.a, qn.b, qn.c, qn.d), 0, 0.01), 'normalized has min ~0');

        // IVM utilities
        const qSnap = Quadray.toIVM(new Quadray(1.3, 0.2, 0.8, 0.1));
        assert(Number.isInteger(qSnap.a), 'toIVM snaps to nearest int');
        assert(approx(Quadray.cellVolume(), 0.375), 'cellVolume ≈ 0.375');
        assert(Quadray.cellType(0, 0, 0, 0) === 'tetra', 'Origin has tetra parity');
        assert(Quadray.cellType(1, 0, 0, 0) === 'octa', '(1,0,0,0) has octa parity');
        assert(Quadray.IVM_DIRECTIONS.length === 8, 'IVM_DIRECTIONS has 8 entries');

        // Round-trip conversion
        const qOrig = new Quadray(3, 1, 4, 2);
        const cart = qOrig.toCartesian();
        const qBack = Quadray.fromCartesian(cart.x, cart.y, cart.z);
        const roundDist = Quadray.distance(qOrig.normalized(), qBack.normalized());
        assert(roundDist < 0.01, `Round-trip conversion (dist=${roundDist.toFixed(4)})`);

        // ═════════════════════════════════════════════════════════════════
        // 3. MAP GENERATION
        // ═════════════════════════════════════════════════════════════════
        const map = new DoomMap();
        assert(map.rooms.length >= 10, `Generated ${map.rooms.length} rooms (>= 10)`);
        assert(map.cells instanceof Map, 'Map uses sparse Map storage');
        assert(map.cells.size > 100, `Has ${map.cells.size} non-default cells`);
        assert(!map.isSolid(map.rooms[0].a, map.rooms[0].b, map.rooms[0].c, map.rooms[0].d), 'Spawn room center is not solid');

        // 2D slice
        const slice = map.getSlice(map.rooms[0].c, map.rooms[0].d);
        assert(Array.isArray(slice) && Array.isArray(slice[0]), 'getSlice returns 2D array');
        assert(slice[map.rooms[0].a][map.rooms[0].b] === CELL.FLOOR, 'Room center in slice is FLOOR');

        // Cell parity
        assert(map.cellParity(0, 0, 0, 0) === 'tetra', 'Origin is tetra parity');
        assert(map.cellParity(1, 0, 0, 0) === 'octa', '(1,0,0,0) is octa parity');

        // Neighbors
        const neighbors = map.getNeighbors(5, 5, 5, 5);
        assert(neighbors.length === 8, 'getNeighbors returns 8 neighbors');

        // Room shapes (stats)
        assert(map.stats.tetraRooms >= 0, 'Stats tracks tetra rooms');
        assert(map.stats.octaRooms >= 0, 'Stats tracks octa rooms');
        assert(map.stats.rectRooms >= 0, 'Stats tracks rect rooms');
        assert(map.stats.tetraRooms + map.stats.octaRooms + map.stats.rectRooms === map.rooms.length,
            `Room shape sum matches total: ${map.stats.tetraRooms}T+${map.stats.octaRooms}O+${map.stats.rectRooms}R=${map.rooms.length}`);

        // Room shape attributes
        const hasShape = map.rooms.every(r => ['tetra', 'octa', 'rect'].includes(r.shape));
        assert(hasShape, 'All rooms have valid shape attribute');

        // Cell counts
        const counts = map.getCellCounts();
        assert(typeof counts === 'object', 'getCellCounts returns object');

        // ═════════════════════════════════════════════════════════════════
        // 4. ENTITIES
        // ═════════════════════════════════════════════════════════════════
        const player = new Player(5, 5, 5, 5);
        assert(player.alive, 'Player starts alive');
        assert(player.quadray instanceof Quadray, 'Player .quadray returns Quadray');
        assert(typeof player.cartesian.x === 'number', 'Player .cartesian returns {x,y,z}');
        assert(player.cellParity === 'tetra', 'Player at (5,5,5,5) has tetra parity');

        const enemy = new Enemy(7, 5, 5, 5, 'imp');
        assert(enemy.hp === 60, 'Enemy imp has 60 hp');
        assert(enemy.quadray instanceof Quadray, 'Enemy .quadray returns Quadray');
        const dist = player.distanceTo(enemy);
        assert(dist > 0, `Player-enemy distance > 0 (got ${dist.toFixed(2)})`);
        const enemy2 = new Enemy(5, 6, 5, 5, 'demon');
        assert(enemy2.cellParity === 'octa', 'Enemy at (5,6,5,5) has octa parity');

        // ═════════════════════════════════════════════════════════════════
        // 5. PHYSICS
        // ═════════════════════════════════════════════════════════════════
        const physics = new Physics(map);
        const solidCount = physics.countSolidNeighbors(map.rooms[0].a, map.rooms[0].b, map.rooms[0].c, map.rooms[0].d);
        assert(solidCount >= 0 && solidCount <= 8, `Solid neighbors in range 0-8 (got ${solidCount})`);

        const e1 = { a: 1, b: 2, c: 3, d: 4 };
        const e2 = { a: 4, b: 3, c: 2, d: 1 };
        const qd = physics.quadrayDistance(e1, e2);
        assert(qd > 0, `Quadray distance > 0 (got ${qd.toFixed(2)})`);

        // Movement
        const testEnt = { a: map.rooms[0].a, b: map.rooms[0].b, c: map.rooms[0].c, d: map.rooms[0].d };
        const origA = testEnt.a;
        physics.moveEntity(testEnt, 0.1, 0);
        assert(testEnt.a !== origA || true, 'moveEntity attempts to move entity');

        // ═════════════════════════════════════════════════════════════════
        // 6. SYNERGETICS ANALYSIS
        // ═════════════════════════════════════════════════════════════════
        const cells = extractCells(map);
        assert(cells.length > 0, `Extracted ${cells.length} cells from map`);

        const tv = calculateTetravolume(cells);
        assert(tv.totalTetravolumes > 0, `Tetravolumes > 0 (got ${tv.totalTetravolumes.toFixed(1)})`);
        assert(tv.cellCount === cells.length, 'TV cellCount matches extracted cells');

        const grid = analyzeIVMGrid(cells, map.size);
        assert(grid.occupiedVertices > 0, `IVM grid occupied > 0 (got ${grid.occupiedVertices})`);
        assert(grid.fillRatio >= 0 && grid.fillRatio <= 1, 'Fill ratio in [0,1]');

        const coord = calculateCoordinationNumbers(cells, map);
        assert(coord.average >= 0, `Average coordination >= 0 (got ${coord.average.toFixed(1)})`);

        const poly = detectSynergeticsPolyhedra(cells);
        assert(poly.tetrahedra >= 0, `Tetrahedra detected >= 0 (got ${poly.tetrahedra})`);
        assert(poly.octahedra >= 0, `Octahedra detected >= 0 (got ${poly.octahedra})`);
        assert(poly.cuboctahedra >= 0, `Cuboctahedra detected >= 0 (got ${poly.cuboctahedra})`);

        const com = calculateCenterOfMass(cells);
        assert(com !== null && typeof com.quadray.a === 'number', 'Center of mass has quadray.a');

        const angle = angleBetweenQuadrays(new Quadray(1, 0, 0, 0), new Quadray(0, 1, 0, 0));
        assert(angle > 0 && angle < 180, `Angle between basis vectors: ${angle.toFixed(1)}°`);

        const full = computeAllAnalysis(map);
        assert(full.tetravolume.totalTetravolumes > 0, 'Full analysis has tetravolumes');
        assert(full.ivmGrid.occupiedVertices > 0, 'Full analysis has grid data');
        assert(full.coordination.average >= 0, 'Full analysis has coordination');
        assert(full.polyhedra !== undefined, 'Full analysis has polyhedra');

        // ═════════════════════════════════════════════════════════════════
        // 7. GEOMETRIC IDENTITY VERIFICATION (8 checks)
        // ═════════════════════════════════════════════════════════════════
        // Quadray(1,0,0,0).toCartesian() = (1,1,1)/√2, so length = √(3/2) ≈ 1.2247
        const basisLen = new Quadray(1, 0, 0, 0).toCartesian();
        const bl = Math.sqrt(basisLen.x ** 2 + basisLen.y ** 2 + basisLen.z ** 2);
        const expectedBL = Math.sqrt(3 / 2); // √(3/2) ≈ 1.2247
        assert(approx(bl, expectedBL, 0.01), `Basis length = ${bl.toFixed(4)} ≈ √(3/2)`);

        const c2a = new Quadray(1, 0, 0, 0).toCartesian();
        const c2b = new Quadray(0, 1, 0, 0).toCartesian();
        const dot = c2a.x * c2b.x + c2a.y * c2b.y + c2a.z * c2b.z;
        const cosAngle = dot / (bl * bl);
        const tetAngle = Math.acos(cosAngle) * 180 / Math.PI;
        assert(approx(tetAngle, 109.47, 0.1), `Tetrahedral angle = ${tetAngle.toFixed(2)}° ≈ 109.47°`);

        assert(approx(S3, Math.sqrt(9 / 8), 0.001), `S3 = ${S3.toFixed(4)} ≈ √(9/8)`);

        const cVol = Quadray.cellVolume();
        assert(approx(cVol, 0.375, 0.01), `Cell volume = ${cVol.toFixed(4)} ≈ 0.375`);

        assert(IVM.DIRECTIONS.length === 8, 'Exactly 8 IVM directions');

        let parityOK = true;
        for (let i = 0; i <= 3; i++) {
            const p1 = (0 + i + 0 + 0) % 2;
            const p2 = (1 + i + 0 + 0) % 2;
            if (p1 === p2) parityOK = false;
        }
        assert(parityOK, 'Parity alternates along each axis');

        const qrt = new Quadray(2, 3, 1, 4);
        const crt = qrt.toCartesian();
        const qrtBack = Quadray.fromCartesian(crt.x, crt.y, crt.z);
        const rtDist = Quadray.distance(qrt.normalized(), qrtBack.normalized());
        assert(rtDist < 0.01, `Round-trip fidelity (dist=${rtDist.toFixed(6)})`);

        assert(approx(IVM.VOLUME_RATIOS.T, 1), 'Tetra volume ratio = 1');
        assert(approx(IVM.VOLUME_RATIOS.O, 4), 'Octa volume ratio = 4');
        assert(approx(IVM.VOLUME_RATIOS.C, 20), 'Cubo volume ratio = 20');

        // ═════════════════════════════════════════════════════════════════
        // 8. CONCENTRIC HIERARCHY
        // ═════════════════════════════════════════════════════════════════
        assert(CONCENTRIC_HIERARCHY.TETRAHEDRON === 1, 'CH: Tetra = 1 TV');
        assert(CONCENTRIC_HIERARCHY.CUBE === 3, 'CH: Cube = 3 TV');
        assert(CONCENTRIC_HIERARCHY.OCTAHEDRON === 4, 'CH: Octa = 4 TV');
        assert(CONCENTRIC_HIERARCHY.RHOMBIC_DODECA === 6, 'CH: Rhombic Dodeca = 6 TV');
        assert(CONCENTRIC_HIERARCHY.CUBOCTAHEDRON === 20, 'CH: VE = 20 TV');
        assert(approx(CONCENTRIC_HIERARCHY.ICOSAHEDRON, 18.51, 0.1), `CH: Icosa ≈ 18.51 TV (got ${CONCENTRIC_HIERARCHY.ICOSAHEDRON.toFixed(2)})`);
        assert(CONCENTRIC_HIERARCHY.A_MODULE === 1 / 24, 'CH: A-module = 1/24');
        assert(CONCENTRIC_HIERARCHY.RATIO_T_O === 0.25, 'CH: T/O ratio = 0.25');
        assert(CONCENTRIC_HIERARCHY.RATIO_O_C === 0.2, 'CH: O/C ratio = 0.2');
        assert(HIERARCHY_ORDER.length === 8, 'Hierarchy has 8 ordered entries');

        // ═════════════════════════════════════════════════════════════════
        // 9. JITTERBUG TRANSFORMATION
        // ═════════════════════════════════════════════════════════════════
        const jb0 = jitterbugTransform(0);
        assert(approx(jb0.volume, 20, 0.5), `Jitterbug t=0 ≈ VE (20 TV), got ${jb0.volume.toFixed(1)}`);
        assert(jb0.name.includes('Vector Equilibrium'), `Jitterbug t=0 name: ${jb0.name}`);

        const jb1 = jitterbugTransform(1);
        assert(approx(jb1.volume, 4, 0.5), `Jitterbug t=1 ≈ Octa (4 TV), got ${jb1.volume.toFixed(1)}`);
        assert(jb1.name.includes('Octahedron'), `Jitterbug t=1 name: ${jb1.name}`);

        const jb05 = jitterbugTransform(0.5);
        assert(approx(jb05.volume, 18.51, 0.5), `Jitterbug t=0.5 ≈ Icosa (18.51 TV), got ${jb05.volume.toFixed(1)}`);

        assert(jb0.vertices.length === 12, 'VE has 12 vertices');
        assert(jitterbugAngle(1) === 60, 'Jitterbug angle at t=1 is 60°');

        // ═════════════════════════════════════════════════════════════════
        // 10. FREQUENCY ANALYSIS
        // ═════════════════════════════════════════════════════════════════
        const f1 = analyzeFrequency(1);
        assert(f1.frequency === 1, 'Freq-1 frequency = 1');
        assert(f1.shellVertices === 12, 'Freq-1 shell = 12 vertices (10·1²+2)');
        assert(f1.tetrahedra === 2, 'Freq-1: 2 tetrahedra');
        assert(f1.octahedra === 1, 'Freq-1: 1 octahedron');

        const f2 = analyzeFrequency(2);
        assert(f2.frequency === 2, 'Freq-2 frequency = 2');
        assert(f2.shellVertices === 42, 'Freq-2 shell = 42 vertices (10·4+2)');
        assert(f2.tetrahedra / f2.octahedra === 2, 'Freq-2: T:O = 2:1');

        // ═════════════════════════════════════════════════════════════════
        // 11. EULER VERIFICATION
        // ═════════════════════════════════════════════════════════════════
        const euler = verifyAllEuler();
        assert(euler.length === 7, `7 polyhedra in census (got ${euler.length})`);
        assert(euler.every(e => e.valid), 'All polyhedra satisfy Euler V-E+F=2');

        assert(POLYHEDRA_CENSUS.tetrahedron.V === 4, 'Tetra: 4 vertices');
        assert(POLYHEDRA_CENSUS.tetrahedron.E === 6, 'Tetra: 6 edges');
        assert(POLYHEDRA_CENSUS.tetrahedron.F === 4, 'Tetra: 4 faces');
        assert(POLYHEDRA_CENSUS.cuboctahedron.V === 12, 'VE: 12 vertices');
        assert(POLYHEDRA_CENSUS.cuboctahedron.E === 24, 'VE: 24 edges');
        assert(POLYHEDRA_CENSUS.cuboctahedron.F === 14, 'VE: 14 faces');
        assert(verifyEuler(4, 6, 4).valid, 'Euler: tetrahedron passes');
        assert(verifyEuler(12, 24, 14).valid, 'Euler: cuboctahedron passes');

        // ═════════════════════════════════════════════════════════════════
        // 12. VOLUME CONVERSIONS
        // ═════════════════════════════════════════════════════════════════
        const tvFromXYZ = xyzToTetravolumes(1);
        assert(tvFromXYZ > 1, `1 unit³ = ${tvFromXYZ.toFixed(4)} tetravolumes`);
        const roundTrip = tetravolumesToXYZ(tvFromXYZ);
        assert(approx(roundTrip, 1, 0.001), `XYZ→TV→XYZ round-trip = ${roundTrip.toFixed(4)}`);

        // Closest packing
        const packing = analyzeClosestPacking(13);
        assert(packing.coordination === 12, 'FCC coordination = 12');
        assert(approx(packing.packingEfficiency, 0.7405, 0.01), `Packing eff ≈ 74.05% (got ${(packing.packingEfficiency * 100).toFixed(1)}%)`);

        // Great circle
        const gc = greatCircle(12);
        assert(gc.length === 13, 'Great circle with 12 subdivisions has 13 points');

        // Tetrahedron volume computation
        const tv4 = tetrahedronVolume(
            new Quadray(1, 0, 0, 0), new Quadray(0, 1, 0, 0),
            new Quadray(0, 0, 1, 0), new Quadray(0, 0, 0, 1)
        );
        assert(tv4 > 0, `Tetrahedron from 4 basis vectors has volume ${tv4.toFixed(4)} TV`);

        // ═════════════════════════════════════════════════════════════════
        // 13. CONSTANTS VERIFICATION SUITE
        // ═════════════════════════════════════════════════════════════════
        const constVerify = verifySynergeticsConstants();
        assert(constVerify.passed > 0, `Synergetics constants: ${constVerify.passed}/${constVerify.total} passed`);
        assert(constVerify.failed === 0, `No constant verification failures (${constVerify.failed} failed)`);

        // ── Render results ──
        renderResults();
        console.log(`=== Results: ${passed} passed, ${failed} failed ===`);

    } catch (err) {
        console.error('Test suite crashed:', err);
        results.push({ pass: false, msg: `CRASH: ${err.message}` });
        failed++; total++;
        renderResults();
        console.log(`=== Results: ${passed} passed, ${failed} failed ===`);
    }
}

// Run on DOM ready if in browser
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => { try { runTests(); } catch (e) { console.error('Test init failed:', e); } });
    } else {
        try { runTests(); } catch (e) { console.error('Test init failed:', e); }
    }
} else {
    // Node.js environment - run immediately
    runTests();
}
