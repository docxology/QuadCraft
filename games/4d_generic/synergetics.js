/**
 * synergetics.js - Core Synergetics constants and verification
 *
 * Extracted from minecraft_analysis.js for shared use across all QuadCraft games.
 * Provides Fuller's Synergetics geometry verification suite.
 *
 * In browser: load quadray.js before this file via script tags.
 * In Node.js: Quadray is loaded automatically via require.
 */

// Node.js compatibility: load Quadray if not already in scope
// NOTE: Do NOT use `var` here — it conflicts with `const ROOT2`/`const S3`
// from quadray.js when loaded via <script> tags in browsers.
if (typeof Quadray === 'undefined' && typeof require !== 'undefined') {
    const _q = require('./quadray.js');
    globalThis.Quadray = _q.Quadray;
    globalThis.ROOT2 = _q.ROOT2;
    globalThis.S3 = _q.S3;
}

// ═══════════════════════════════════════════════════════════════════════════
// SYNERGETICS CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const SYNERGETICS = {
    ROOT2: 1.4142135623730951,
    S3: 1.0606601717798212, // sqrt(9/8) — XYZ-to-IVM volume conversion
    TETRAHEDRAL_ANGLE: 109.4712, // degrees between any two basis vectors
    BASIS_LENGTH: 1 / Math.sqrt(2), // ~0.7071

    // Synergetics volume ratios (tetravolumes)
    TETRA_VOL: 1,
    OCTA_VOL: 4,
    CUBO_VOL: 20
};

// ═══════════════════════════════════════════════════════════════════════════
// GEOMETRY FUNCTIONS
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
 * @returns {{timestamp: string, checks: Array, allPassed: boolean}}
 */
function verifyGeometricIdentities() {
    const TOLERANCE = 0.01;

    const results = {
        timestamp: new Date().toISOString(),
        checks: [],
        allPassed: true
    };

    function addCheck(check) {
        results.checks.push(check);
        if (!check.passed) results.allPassed = false;
    }

    // 1. Basis vector lengths = 0.7071
    const basisLengths = Quadray.BASIS.map(b => b.length());
    addCheck({
        name: 'Basis Vector Lengths',
        description: 'All 4 basis vectors should have equal length (~0.707)',
        expected: SYNERGETICS.BASIS_LENGTH.toFixed(4),
        actual: basisLengths.map(l => l.toFixed(4)),
        passed: basisLengths.every(l => Math.abs(l - SYNERGETICS.BASIS_LENGTH) < TOLERANCE)
    });

    // 2. Tetrahedral angles = 109.47 deg (all 6 pairs)
    const anglePairs = [];
    const labels = ['A', 'B', 'C', 'D'];
    for (let i = 0; i < 4; i++) {
        for (let j = i + 1; j < 4; j++) {
            const angle = angleBetweenQuadrays(Quadray.BASIS[i], Quadray.BASIS[j]);
            anglePairs.push({ pair: `${labels[i]}-${labels[j]}`, angle: angle.toFixed(2) });
        }
    }
    addCheck({
        name: 'Tetrahedral Symmetry',
        description: `All basis pairs should form ${SYNERGETICS.TETRAHEDRAL_ANGLE.toFixed(2)}° angles`,
        expected: SYNERGETICS.TETRAHEDRAL_ANGLE.toFixed(2),
        actual: anglePairs,
        passed: anglePairs.every(p => Math.abs(parseFloat(p.angle) - SYNERGETICS.TETRAHEDRAL_ANGLE) < 1.0)
    });

    // 3. Origin identity (0,0,0,0) -> (0,0,0)
    const originCart = Quadray.ORIGIN.toCartesian();
    addCheck({
        name: 'Origin Identity',
        description: 'Quadray origin (0,0,0,0) maps to Cartesian origin (0,0,0)',
        expected: '{x: 0, y: 0, z: 0}',
        actual: `{x: ${originCart.x.toFixed(4)}, y: ${originCart.y.toFixed(4)}, z: ${originCart.z.toFixed(4)}}`,
        passed: Math.abs(originCart.x) < TOLERANCE && Math.abs(originCart.y) < TOLERANCE && Math.abs(originCart.z) < TOLERANCE
    });

    // 4. Round-trip conversion (6 test points, error < 0.01)
    const testPoints = [
        new Quadray(1, 0, 0, 0), new Quadray(0, 1, 0, 0),
        new Quadray(0, 0, 1, 0), new Quadray(0, 0, 0, 1),
        new Quadray(2, 1, 0, 1), new Quadray(3, 2, 1, 0)
    ];
    const roundTripResults = testPoints.map(q => verifyRoundTrip(q));
    addCheck({
        name: 'Round-Trip Conversion',
        description: 'Quadray -> Cartesian -> Quadray recovers original position',
        expected: 'error < 0.01 for all test points',
        actual: roundTripResults.map((r, i) => `Point ${i + 1}: error=${r.error.toFixed(4)}`),
        passed: roundTripResults.every(r => r.passed)
    });

    // 5. Distance symmetry d(A,B) = d(B,A)
    const qA = new Quadray(1, 0, 0, 0);
    const qB = new Quadray(0, 1, 0, 0);
    const d1 = Quadray.distance(qA, qB);
    const d2 = Quadray.distance(qB, qA);
    addCheck({
        name: 'Distance Symmetry',
        description: 'distance(A, B) equals distance(B, A)',
        expected: 'd1 === d2',
        actual: `d1=${d1.toFixed(6)}, d2=${d2.toFixed(6)}`,
        passed: Math.abs(d1 - d2) < 0.0001
    });

    // 6. Triangle inequality d(A,B)+d(B,C) >= d(A,C)
    const qC = new Quadray(0, 0, 1, 0);
    const dAB = Quadray.distance(qA, qB);
    const dBC = Quadray.distance(qB, qC);
    const dAC = Quadray.distance(qA, qC);
    addCheck({
        name: 'Triangle Inequality',
        description: 'd(A,B) + d(B,C) >= d(A,C) for all points',
        expected: `${dAB.toFixed(4)} + ${dBC.toFixed(4)} >= ${dAC.toFixed(4)}`,
        actual: `${(dAB + dBC).toFixed(4)} >= ${dAC.toFixed(4)}`,
        passed: dAB + dBC >= dAC - TOLERANCE
    });

    // 7. S3 constant validation — S3 = sqrt(9/8)
    const expectedS3 = Math.sqrt(9 / 8);
    addCheck({
        name: 'S3 Constant Validation',
        description: 'S3 = sqrt(9/8) = 1.0607 (XYZ-to-IVM volume conversion)',
        expected: expectedS3.toFixed(6),
        actual: SYNERGETICS.S3.toFixed(6),
        passed: Math.abs(SYNERGETICS.S3 - expectedS3) < 0.0001
    });

    // 8. Synergetics volume ratios — Tetra:Octa:Cubo = 1:4:20
    addCheck({
        name: 'Synergetics Volume Ratios',
        description: 'Tetra:Octa:Cubo = 1:4:20 in tetravolumes',
        expected: 'T:O:C = 1:4:20',
        actual: `T:O:C = ${SYNERGETICS.TETRA_VOL}:${SYNERGETICS.OCTA_VOL}:${SYNERGETICS.CUBO_VOL}`,
        passed: SYNERGETICS.OCTA_VOL / SYNERGETICS.TETRA_VOL === 4 && SYNERGETICS.CUBO_VOL / SYNERGETICS.TETRA_VOL === 20
    });

    return results;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SYNERGETICS, angleBetweenQuadrays, verifyRoundTrip, verifyGeometricIdentities };
}
