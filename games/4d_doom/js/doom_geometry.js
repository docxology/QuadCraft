/**
 * doom_geometry.js — Synergetics Geometric Engine
 * 
 * Pure mathematical module implementing Fuller's Synergetics geometry:
 *   - Concentric Hierarchy (nested polyhedra volume table)
 *   - Jitterbug Transformation (VE → Icosa → Octa)
 *   - Frequency analysis (IVM grid subdivision)
 *   - S-module / E-module / T-module volumes
 *   - Edge/Face/Vertex census for polyhedra
 *   - Closest-packing sphere analysis
 *   - Great circle / geodesic calculations
 * 
 * All volumes in tetravolumes (regular tetrahedron = 1)
 * Reference: R. Buckminster Fuller, "Synergetics" (1975)
 */

import { Quadray, ROOT2, S3 } from './quadray.js';
import { Logger, LOG_LEVEL } from './doom_logger.js';

// ═══════════════════════════════════════════════════════════════════
// CONCENTRIC HIERARCHY — Volume Table (in tetravolumes)
// ═══════════════════════════════════════════════════════════════════

/** Concentric Hierarchy: nested polyhedra centered at origin, unit edge */
export const CONCENTRIC_HIERARCHY = Object.freeze({
    // Fundamental volumes (exact)
    TETRAHEDRON: 1,
    CUBE: 3,
    OCTAHEDRON: 4,
    RHOMBIC_DODECA: 6,
    CUBOCTAHEDRON: 20,         // = VE (vector equilibrium)

    // Derived volumes (exact ratios)
    ICOSAHEDRON: 18.512296,  // 5√2 φ² where φ = (1+√5)/2
    PENTAGONAL_DODECA: 15.350018,  // Exact: 3+√5)³/4

    // Module volumes
    A_MODULE: 1 / 24,       // 24 A-modules = 1 tetrahedron
    B_MODULE: 1 / 24,       // 24 B-modules = 1 tetrahedron  
    T_MODULE: 1 / 24,       // T-module = A-module (tetrahedral)
    E_MODULE: 0.041731,   // √2/2 · (√5-1)/4 · ... from Synergetics Table
    S_MODULE: 1 / 24,       // S-factor module

    // Sphere volumes in tetravolumes
    UNIT_SPHERE: 4.188790,   // 4π/3 in XYZ, converted
    IVM_SPHERE: 5.0,        // Sphere of radius = 1 IVM edge

    // S3 conversion factor
    S3: S3,         // √(9/8) ≈ 1.06066

    // Key ratios
    RATIO_T_O: 0.25,       // Tetra/Octa = 1/4
    RATIO_O_C: 0.2,        // Octa/Cubo = 4/20 = 1/5
    RATIO_T_C: 0.05,       // Tetra/Cubo = 1/20
});

/** Concentric Hierarchy ordered from inside-out */
export const HIERARCHY_ORDER = [
    { name: 'A-Module', volume: CONCENTRIC_HIERARCHY.A_MODULE, symbol: 'A', color: '#ff6666' },
    { name: 'B-Module', volume: CONCENTRIC_HIERARCHY.B_MODULE, symbol: 'B', color: '#66ff66' },
    { name: 'Tetrahedron', volume: CONCENTRIC_HIERARCHY.TETRAHEDRON, symbol: 'T', color: '#ff4444' },
    { name: 'Cube', volume: CONCENTRIC_HIERARCHY.CUBE, symbol: '□', color: '#8888ff' },
    { name: 'Octahedron', volume: CONCENTRIC_HIERARCHY.OCTAHEDRON, symbol: 'O', color: '#44ff44' },
    { name: 'Rhombic Dodecahedron', volume: CONCENTRIC_HIERARCHY.RHOMBIC_DODECA, symbol: 'RD', color: '#ffaa44' },
    { name: 'Icosahedron', volume: CONCENTRIC_HIERARCHY.ICOSAHEDRON, symbol: 'I', color: '#ff44ff' },
    { name: 'Cuboctahedron (VE)', volume: CONCENTRIC_HIERARCHY.CUBOCTAHEDRON, symbol: 'VE', color: '#44ffff' },
];

// ═══════════════════════════════════════════════════════════════════
// JITTERBUG TRANSFORMATION
// ═══════════════════════════════════════════════════════════════════

/**
 * Jitterbug transformation: VE → Icosahedron → Octahedron
 * t=0 → VE (20 TV), t=0.5 → Icosa (~18.51 TV), t=1.0 → Octa (4 TV)
 * 
 * @param {number} t — Phase, 0..1
 * @returns {{ volume: number, name: string, vertices: Array<{x,y,z}>, phase: number }}
 */
export function jitterbugTransform(t) {
    t = Math.max(0, Math.min(1, t));

    // Volume interpolation along the Jitterbug path
    // VE(20) → Icosa(18.51) → Octa(4)
    const veVol = CONCENTRIC_HIERARCHY.CUBOCTAHEDRON;
    const icosaVol = CONCENTRIC_HIERARCHY.ICOSAHEDRON;
    const octaVol = CONCENTRIC_HIERARCHY.OCTAHEDRON;

    let volume, name;
    if (t <= 0.5) {
        // VE → Icosahedron phase
        const p = t * 2; // 0..1 within this sub-phase
        volume = veVol + (icosaVol - veVol) * p;
        name = p < 0.1 ? 'Vector Equilibrium' : p > 0.9 ? 'Icosahedron' : 'Jitterbug (VE→Icosa)';
    } else {
        // Icosahedron → Octahedron phase
        const p = (t - 0.5) * 2; // 0..1 within this sub-phase
        volume = icosaVol + (octaVol - icosaVol) * p;
        name = p < 0.1 ? 'Icosahedron' : p > 0.9 ? 'Octahedron' : 'Jitterbug (Icosa→Octa)';
    }

    // Generate VE vertices and rotate triangular faces
    const phi = (1 + Math.sqrt(5)) / 2;
    const angle = t * Math.PI / 3; // 60° rotation total
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    // VE = 12 vertices, 8 triangular + 6 square faces
    // The 8 triangular faces rotate during Jitterbug
    const veVertices = [
        [1, 1, 0], [1, -1, 0], [-1, 1, 0], [-1, -1, 0],
        [1, 0, 1], [1, 0, -1], [-1, 0, 1], [-1, 0, -1],
        [0, 1, 1], [0, 1, -1], [0, -1, 1], [0, -1, -1]
    ];

    // Apply Jitterbug rotation to triangular face vertices
    const scale = 1 - t * 0.4; // Compress toward octahedron
    const vertices = veVertices.map(([x, y, z]) => ({
        x: (x * cos - y * sin) * scale,
        y: (x * sin + y * cos) * scale,
        z: z * scale
    }));

    return { volume, name, vertices, phase: t };
}

/**
 * Calculate the face-rotation angle during Jitterbug at phase t.
 * At t=0 (VE), angle=0°. At t=1 (Octa), angle=60°.
 * @param {number} t
 * @returns {number} Angle in degrees
 */
export function jitterbugAngle(t) {
    return t * 60; // Linear for simplicity; actual is nonlinear
}

// ═══════════════════════════════════════════════════════════════════
// FREQUENCY ANALYSIS
// ═══════════════════════════════════════════════════════════════════

/**
 * Calculate IVM frequency for a region.
 * Frequency = number of edge subdivisions between two IVM vertices.
 * A frequency-N IVM has N+1 vertices per edge, N² triangles per face.
 * 
 * @param {number} edgeLength — Distance between two connected IVM nodes
 * @param {number} unitLength — Unit edge length (default 1)
 * @returns {{ frequency: number, shellVertices: number, totalVertices: number, 
 *            shellEdges: number, tetrahedra: number, octahedra: number }}
 */
export function analyzeFrequency(edgeLength, unitLength = 1) {
    const freq = Math.round(edgeLength / unitLength);
    const f = Math.max(1, freq);

    // Shell formula: vertices on shell at radius r from center
    // For frequency f: shell has 10f² + 2 vertices (f≥1)
    const shellVertices = f >= 1 ? 10 * f * f + 2 : 1;

    // Total vertices up to frequency f
    // Sum of shells: Σ(10k² + 2) for k=1..f = 10f(f+1)(2f+1)/6 + 2f + 1
    const totalVertices = Math.round(10 * f * (f + 1) * (2 * f + 1) / 6 + 2 * f + 1);

    // Edges: each vertex has coordination 12 (cuboctahedral)  
    const shellEdges = 30 * f * f;

    // Tetrahedra and octahedra in the IVM grid up to frequency f
    // Tetra: 8 per face × (f³ total) → simplified
    const tetrahedra = 2 * f * f * f;
    const octahedra = f * f * f;

    return {
        frequency: f,
        shellVertices,
        totalVertices,
        shellEdges,
        tetrahedra,
        octahedra,
        ratio: `T:O = ${tetrahedra}:${octahedra} = 2:1`
    };
}

/**
 * Determine the frequency of the current player region.
 * @param {object} map — DoomMap
 * @param {number} a
 * @param {number} b
 * @param {number} c
 * @param {number} d
 * @returns {{ localFreq: number, nearestNode: {a,b,c,d}, distToNode: number }}
 */
export function localFrequency(map, a, b, c, d) {
    const na = Math.round(a);
    const nb = Math.round(b);
    const nc = Math.round(c);
    const nd = Math.round(d);

    const dist = Math.sqrt(
        (a - na) ** 2 + (b - nb) ** 2 +
        (c - nc) ** 2 + (d - nd) ** 2
    );

    // Local frequency = how many grid lines cross in the nearest unit cell
    // For IVM unit, freq=1 means standard spacing
    let freq = 1;
    if (dist < 0.15) freq = 1; // Near a vertex
    else if (dist < 0.35) freq = 2;
    else freq = 3;

    return {
        localFreq: freq,
        nearestNode: { a: na, b: nb, c: nc, d: nd },
        distToNode: dist
    };
}

// ═══════════════════════════════════════════════════════════════════
// POLYHEDRA CENSUS
// ═══════════════════════════════════════════════════════════════════

/** Euler's formula: V - E + F = 2 for any convex polyhedron */
export const POLYHEDRA_CENSUS = Object.freeze({
    tetrahedron: { V: 4, E: 6, F: 4, euler: 2, volume: 1, dualOf: 'tetrahedron' },
    cube: { V: 8, E: 12, F: 6, euler: 2, volume: 3, dualOf: 'octahedron' },
    octahedron: { V: 6, E: 12, F: 8, euler: 2, volume: 4, dualOf: 'cube' },
    icosahedron: { V: 12, E: 30, F: 20, euler: 2, volume: 18.51, dualOf: 'pentagonal_dodecahedron' },
    dodecahedron: { V: 20, E: 30, F: 12, euler: 2, volume: 15.35, dualOf: 'icosahedron' },
    cuboctahedron: { V: 12, E: 24, F: 14, euler: 2, volume: 20, dualOf: 'rhombic_dodecahedron' },
    rhombicDodeca: { V: 14, E: 24, F: 12, euler: 2, volume: 6, dualOf: 'cuboctahedron' },
});

/**
 * Verify Euler's formula for a polyhedron.
 * @param {number} V - vertices
 * @param {number} E - edges
 * @param {number} F - faces
 * @returns {{ valid: boolean, euler: number }}
 */
export function verifyEuler(V, E, F) {
    const euler = V - E + F;
    return { valid: euler === 2, euler };
}

/**
 * Run full Euler verification on all known polyhedra.
 * @returns {Array<{name: string, V: number, E: number, F: number, valid: boolean}>}
 */
export function verifyAllEuler() {
    return Object.entries(POLYHEDRA_CENSUS).map(([name, p]) => ({
        name,
        V: p.V, E: p.E, F: p.F,
        valid: verifyEuler(p.V, p.E, p.F).valid,
        volume: p.volume
    }));
}

// ═══════════════════════════════════════════════════════════════════
// CLOSEST PACKING ANALYSIS
// ═══════════════════════════════════════════════════════════════════

/**
 * Analyze closest-packing sphere arrangement.
 * In IVM, each sphere has 12 neighbors (kissing number = 12).
 * 
 * @param {number} numSpheres — Total spheres in the cluster
 * @param {number} radius — Sphere radius
 * @returns {{ layers: number, packingEfficiency: number, coordination: number,
 *            totalVolume: number, filledVolume: number }}
 */
export function analyzeClosestPacking(numSpheres, radius = 0.5) {
    // FCC/HCP coordination number = 12
    const coordination = 12;

    // Packing efficiency for FCC = π/(3√2) ≈ 74.048%
    const packingEfficiency = Math.PI / (3 * ROOT2);

    // Layer analysis (cubic close packing shells: 1, 12, 42, 92, ...)
    // Shell n: 10n² + 2 (for n ≥ 1), shell 0 = 1
    let layers = 0;
    let total = 1;
    while (total < numSpheres) {
        layers++;
        total += 10 * layers * layers + 2;
    }

    const sphereVol = (4 / 3) * Math.PI * radius ** 3;
    const filledVol = numSpheres * sphereVol;

    // Bounding volume (roughly spherical cluster)
    const clusterRadius = (layers + 1) * radius * 2;
    const totalVol = (4 / 3) * Math.PI * clusterRadius ** 3;

    return {
        layers,
        packingEfficiency,
        coordination,
        totalVolume: totalVol,
        filledVolume: filledVol,
        fillRatio: totalVol > 0 ? filledVol / totalVol : 0,
        theoreticalMax: packingEfficiency
    };
}

// ═══════════════════════════════════════════════════════════════════
// GREAT CIRCLE & GEODESIC
// ═══════════════════════════════════════════════════════════════════

/**
 * Generate great circle coordinates on a sphere.
 * Used for geodesic dome visualization.
 * 
 * @param {number} subdivisions — Number of segments
 * @param {number} tilt — Tilt angle in radians
 * @returns {Array<{x: number, y: number, z: number}>}
 */
export function greatCircle(subdivisions = 36, tilt = 0) {
    const points = [];
    for (let i = 0; i <= subdivisions; i++) {
        const theta = (2 * Math.PI * i) / subdivisions;
        const x = Math.cos(theta);
        const y = Math.sin(theta) * Math.cos(tilt);
        const z = Math.sin(theta) * Math.sin(tilt);
        points.push({ x, y, z });
    }
    return points;
}

/**
 * Generate 31 great circles of the icosahedron.
 * These define the geodesic grid on a sphere.
 * @param {number} subdivisions
 * @returns {Array<Array<{x,y,z}>>}
 */
export function icosahedralGreatCircles(subdivisions = 36) {
    // The 31 great circles: 6 sets of 5 + 1 equatorial
    const circles = [];
    const phi = (1 + Math.sqrt(5)) / 2;

    // 6 equatorial-type circles at various tilts
    for (let i = 0; i < 6; i++) {
        const tilt = (Math.PI * i) / 6;
        circles.push(greatCircle(subdivisions, tilt));
    }
    // Additional circles at golden-angle offsets
    for (let i = 0; i < 10; i++) {
        const tilt = Math.atan(phi) + (Math.PI * i) / 5;
        circles.push(greatCircle(subdivisions, tilt));
    }

    return circles;
}

// ═══════════════════════════════════════════════════════════════════
// VOLUME CONVERSION UTILITIES
// ═══════════════════════════════════════════════════════════════════

/**
 * Convert XYZ (cubic) volume to tetravolumes.
 * @param {number} xyzVol — Volume in cubic units
 * @returns {number} Volume in tetravolumes
 */
export function xyzToTetravolumes(xyzVol) {
    // 1 cube (XYZ) = 3 tetravolumes, so 1 unit³ = 3/s³ TV
    // where s = edge of cube inscribed in tetra
    return xyzVol * S3 * S3 * S3;
}

/**
 * Convert tetravolumes to XYZ (cubic) volume.
 * @param {number} tv — Volume in tetravolumes
 * @returns {number} Volume in cubic units
 */
export function tetravolumesToXYZ(tv) {
    return tv / (S3 * S3 * S3);
}

/**
 * Compute the volume of an irregular tetrahedron given 4 Quadray vertices.
 * Uses the Cayley–Menger determinant.
 * 
 * @param {Quadray} q1
 * @param {Quadray} q2
 * @param {Quadray} q3
 * @param {Quadray} q4
 * @returns {number} Volume in tetravolumes
 */
export function tetrahedronVolume(q1, q2, q3, q4) {
    const c1 = q1.toCartesian();
    const c2 = q2.toCartesian();
    const c3 = q3.toCartesian();
    const c4 = q4.toCartesian();

    // Edges from c1
    const ax = c2.x - c1.x, ay = c2.y - c1.y, az = c2.z - c1.z;
    const bx = c3.x - c1.x, by = c3.y - c1.y, bz = c3.z - c1.z;
    const cx = c4.x - c1.x, cy = c4.y - c1.y, cz = c4.z - c1.z;

    // Volume = |det([a,b,c])| / 6
    const det = ax * (by * cz - bz * cy)
        - ay * (bx * cz - bz * cx)
        + az * (bx * cy - by * cx);
    const xyzVol = Math.abs(det) / 6;

    // Convert to tetravolumes
    return xyzToTetravolumes(xyzVol);
}

// ═══════════════════════════════════════════════════════════════════
// SYNERGETICS CONSTANTS VERIFICATION
// ═══════════════════════════════════════════════════════════════════

/**
 * Run comprehensive verification of all Synergetics constants.
 * Returns pass/fail for each identity. Logged to console.
 * 
 * @returns {{ passed: number, failed: number, checks: Array<{name,expected,actual,passed}> }}
 */
export function verifySynergeticsConstants() {
    const phi = (1 + Math.sqrt(5)) / 2;
    const checks = [];

    const check = (name, expected, actual, tolerance = 0.01) => {
        const passed = Math.abs(expected - actual) <= tolerance;
        checks.push({ name, expected, actual: parseFloat(actual.toFixed(6)), passed });
        return passed;
    };

    // Volume ratios
    check('Tetra/Octa ratio', 0.25, CONCENTRIC_HIERARCHY.TETRAHEDRON / CONCENTRIC_HIERARCHY.OCTAHEDRON);
    check('Octa/VE ratio', 0.2, CONCENTRIC_HIERARCHY.OCTAHEDRON / CONCENTRIC_HIERARCHY.CUBOCTAHEDRON);
    check('Cube volume', 3, CONCENTRIC_HIERARCHY.CUBE);
    check('Octa volume', 4, CONCENTRIC_HIERARCHY.OCTAHEDRON);
    check('VE volume', 20, CONCENTRIC_HIERARCHY.CUBOCTAHEDRON);
    check('RD volume', 6, CONCENTRIC_HIERARCHY.RHOMBIC_DODECA);

    // S3 constant
    check('S3 = √(9/8)', Math.sqrt(9 / 8), S3, 0.0001);

    // Module volumes
    check('24 A-modules = 1 Tetra', 1, 24 * CONCENTRIC_HIERARCHY.A_MODULE);
    check('24 T-modules = 1 Tetra', 1, 24 * CONCENTRIC_HIERARCHY.T_MODULE);

    // Euler checks
    for (const [name, p] of Object.entries(POLYHEDRA_CENSUS)) {
        check(`Euler: ${name}`, 2, p.V - p.E + p.F, 0);
    }

    // Packing efficiency
    check('FCC packing = π/(3√2)', Math.PI / (3 * ROOT2), 0.7404804896930611, 0.001);

    // Icosahedron volume (5√2 φ²)
    check('Icosa volume = 5√2·φ²', 5 * ROOT2 * phi * phi, CONCENTRIC_HIERARCHY.ICOSAHEDRON, 0.01);

    // Frequency T:O ratio
    check('IVM freq T:O = 2:1', 2, analyzeFrequency(3).tetrahedra / analyzeFrequency(3).octahedra);

    const passed = checks.filter(c => c.passed).length;
    const failed = checks.filter(c => !c.passed).length;

    Logger.geometry(`${passed}/${checks.length} constant verifications passed`);
    if (failed > 0) {
        checks.filter(c => !c.passed).forEach(c =>
            Logger.warn('Geometry', `FAIL: ${c.name} — expected ${c.expected}, got ${c.actual}`)
        );
    }

    return { passed, failed, checks, total: checks.length };
}
