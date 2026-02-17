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
assert('Basis length ≈ 0.7071', Math.abs(bLen - 1 / Math.sqrt(2)) < 0.001);

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

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
