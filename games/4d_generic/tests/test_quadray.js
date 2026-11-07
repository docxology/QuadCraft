/**
 * test_quadray.js — Tests for shared Quadray module
 * Run: node 4d_generic/tests/test_quadray.js
 */
const { Quadray, ROOT2, S3 } = require('../quadray.js');

let passed = 0, failed = 0;
function assert(name, condition) {
    if (condition) { passed++; console.log(`  ✅ ${name}`); }
    else { failed++; console.log(`  ❌ ${name}`); }
}

console.log('=== Quadray Shared Module Tests ===\n');

// Constructor
const q = new Quadray(1, 2, 3, 4);
assert('Constructor sets a,b,c,d', q.a === 1 && q.b === 2 && q.c === 3 && q.d === 4);

// Default constructor
const q0 = new Quadray();
assert('Default constructor is (0,0,0,0)', q0.a === 0 && q0.b === 0 && q0.c === 0 && q0.d === 0);

// Clone
const qc = q.clone();
assert('Clone produces equal values', qc.a === q.a && qc.b === q.b && qc.c === q.c && qc.d === q.d);

// Normalized
const qn = new Quadray(3, 5, 2, 7).normalized();
assert('Normalized has min component = 0', Math.min(qn.a, qn.b, qn.c, qn.d) === 0);

// toCartesian origin
const origin = new Quadray(0, 0, 0, 0).toCartesian();
assert('Origin maps to (0,0,0)', Math.abs(origin.x) < 0.001 && Math.abs(origin.y) < 0.001 && Math.abs(origin.z) < 0.001);

// fromCartesian round-trip
const q1 = new Quadray(2, 1, 0, 1);
const cart = q1.toCartesian();
const q1r = Quadray.fromCartesian(cart.x, cart.y, cart.z);
const err = Quadray.distance(q1.normalized(), q1r.normalized());
assert('Round-trip error < 0.01', err < 0.01);

// Distance symmetry
const qa = new Quadray(1, 0, 0, 0);
const qb = new Quadray(0, 1, 0, 0);
assert('Distance is symmetric', Math.abs(Quadray.distance(qa, qb) - Quadray.distance(qb, qa)) < 0.0001);

// Basis vectors
assert('4 basis vectors defined', Quadray.BASIS.length === 4);
assert('Basis A is (1,0,0,0)', Quadray.A.a === 1 && Quadray.A.b === 0);
assert('Basis B is (0,1,0,0)', Quadray.B.b === 1 && Quadray.B.a === 0);

// Basis length
const bLen = Quadray.A.length();
assert('Basis length agrees with embedded vertex radius', Math.abs(bLen - Math.sqrt(3 / 2)) < 1e-12);

// Add
const sum = qa.add(qb);
assert('Add produces normalized result', Math.min(sum.a, sum.b, sum.c, sum.d) === 0);

// Scale
const scaled = qa.scale(3);
assert('Scale multiplies all components', scaled.a === 3 && scaled.b === 0);

// toKey
const key = new Quadray(1, 2, 0, 3).toKey();
assert('toKey produces string', typeof key === 'string' && key.includes(','));

// Constants
assert('ROOT2 is sqrt(2)', Math.abs(ROOT2 - Math.sqrt(2)) < 0.0001);
assert('S3 is sqrt(9/8)', Math.abs(S3 - Math.sqrt(9 / 8)) < 0.0001);

// Exercise both real implementations with their respective Cartesian APIs.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const modularContext = vm.createContext({});
const modularRoot = path.resolve(__dirname, '../../../src/js/experiments/browser/js');
for (const file of ['utils/constants.js', 'math/quadray.js']) {
    vm.runInContext(fs.readFileSync(path.join(modularRoot, file), 'utf8'), modularContext, { filename: file });
}
const BrowserQuadray = vm.runInContext('Quadray', modularContext);

for (const [label, Q, xyzOf] of [
    ['shared', Quadray, q => Object.values(q.toCartesian())],
    ['modular browser', BrowserQuadray, q => q.toCartesian()]
]) {
    const samples = [
        new Q(), new Q(1, 0, 0, 0), new Q(8, 7, 7, 7),
        new Q(-2.5, 0.25, 1.5, -0.75), new Q(0.5, -1.25, 0.75, 2)
    ];
    assert(`${label}: shifted origin has zero length`, new Q(-9, -9, -9, -9).length() === 0);
    assert(`${label}: tetrahedron edge length is two`,
        Math.abs(Q.distance(new Q(1, 0, 0, 0), new Q(0, 1, 0, 0)) - 2) < 1e-12);
    for (const [i, p] of samples.entries()) {
        const xyz = xyzOf(p);
        const shift = 2 ** 40;
        const shifted = new Q(p.a + shift, p.b + shift, p.c + shift, p.d + shift);
        assert(`${label}: sample ${i} length matches XYZ`, Math.abs(p.length() - Math.hypot(...xyz)) < 1e-12);
        assert(`${label}: sample ${i} equivalent point has zero distance`, Q.distance(p, shifted) === 0);
        assert(`${label}: sample ${i} large gauge preserves length`, Math.abs(p.length() - shifted.length()) < 1e-12);
        for (const [j, other] of samples.entries()) {
            const otherXYZ = xyzOf(other);
            const expected = Math.hypot(...xyz.map((v, axis) => v - otherXYZ[axis]));
            const record = { a: other.a, b: other.b, c: other.c, d: other.d };
            assert(`${label}: signed/fractional pair ${i},${j} matches XYZ`,
                Math.abs(Q.distance(p, other) - expected) < 1e-12);
            assert(`${label}: structural record pair ${i},${j} ignores independent gauge`,
                Math.abs(Q.distance(shifted, record) - expected) < 1e-12);
        }
    }
    // Preserve the scalar shared inverse and array-valued modular inverse.
    for (const xyz of [[0, 0, 0], [1.25, -2.5, 3.75], [-4, -2, -1], [0, 3, -2]]) {
        const restored = Q === Quadray ? Q.fromCartesian(...xyz) : Q.fromCartesian(xyz);
        const back = xyzOf(restored);
        assert(`${label}: signed Cartesian inverse ${xyz}`, back.every((v, axis) => Math.abs(v - xyz[axis]) < 1e-12));
    }
}

for (const [values, expected, shift] of [
    [[0.49, 0.49, 0.49, 0], [0, 0, 0, 0], 0.02],
    [[-1.25, -0.75, 0.25, 1.25], [0, 1, 2, 3], 2],
    [[3, 5, 2, 7], [1, 3, 0, 5], -4]
]) {
    const base = new Quadray(...values);
    const shifted = new Quadray(...values.map(v => v + shift));
    for (const q of [base, shifted]) {
        const snap = Quadray.toIVM(q);
        assert(`Canonical component snap ${values}`,
            [snap.a, snap.b, snap.c, snap.d].every((v, i) => v === expected[i]));
    }
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
