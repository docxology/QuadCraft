/**
 * test_synergetics.js — Tests for shared Synergetics module
 * Run: node 4d_generic/tests/test_synergetics.js
 */
const { Quadray, ROOT2, S3 } = require('../quadray.js');
const { SYNERGETICS, angleBetweenQuadrays, verifyRoundTrip, verifyGeometricIdentities } = require('../synergetics.js');

let passed = 0, failed = 0;
function assert(name, condition) {
    if (condition) { passed++; console.log(`  ✅ ${name}`); }
    else { failed++; console.log(`  ❌ ${name}`); }
}

console.log('=== Synergetics Shared Module Tests ===\n');

// Constants
assert('TETRA_VOL = 1', SYNERGETICS.TETRA_VOL === 1);
assert('OCTA_VOL = 4', SYNERGETICS.OCTA_VOL === 4);
assert('CUBO_VOL = 20', SYNERGETICS.CUBO_VOL === 20);
assert('S3 matches sqrt(9/8)', Math.abs(SYNERGETICS.S3 - Math.sqrt(9 / 8)) < 0.0001);
assert('BASIS_LENGTH ≈ 0.7071', Math.abs(SYNERGETICS.BASIS_LENGTH - 1 / Math.sqrt(2)) < 0.001);

// Tetrahedral angle
const angle = angleBetweenQuadrays(Quadray.A, Quadray.B);
assert('Tetrahedral angle ≈ 109.47°', Math.abs(angle - 109.4712) < 1.0);

// Angle symmetry
const angle2 = angleBetweenQuadrays(Quadray.B, Quadray.A);
assert('Angle is symmetric', Math.abs(angle - angle2) < 0.001);

// Round-trip
const rt = verifyRoundTrip(new Quadray(2, 1, 0, 1));
assert('Round-trip passes', rt.passed);
assert('Round-trip error < 0.01', rt.error < 0.01);

// Full verification suite
const results = verifyGeometricIdentities();
assert('Verification suite has 8 checks', results.checks.length === 8);
assert('All 8 checks pass', results.allPassed);

// Individual check names
const expectedNames = [
    'Basis Vector Lengths', 'Tetrahedral Symmetry', 'Origin Identity',
    'Round-Trip Conversion', 'Distance Symmetry', 'Triangle Inequality',
    'S3 Constant Validation', 'Synergetics Volume Ratios'
];
for (let i = 0; i < expectedNames.length; i++) {
    assert(`Check ${i + 1}: ${expectedNames[i]}`, results.checks[i].name === expectedNames[i]);
    assert(`Check ${i + 1} passes`, results.checks[i].passed);
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
