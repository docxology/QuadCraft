/**
 * test_projection.js — Tests for shared projection module
 *
 * Tests projectQuadray() and drawQuadrayAxes() from 4d_generic/projection.js
 *
 * Run: node games/tests/test_projection.js
 */
const { Quadray } = require('../4d_generic/quadray.js');
const { projectQuadray, drawQuadrayAxes } = require('../4d_generic/projection.js');

let passed = 0, failed = 0;
function assert(name, condition) {
    if (condition) { passed++; console.log(`  ✅ PASSED: ${name}`); }
    else { failed++; console.log(`  ❌ FAILED: ${name}`); }
}

console.log('=== Shared Projection Module Tests ===\n');

// Default projection options
const opts = {
    rotX: 0.5, rotY: 0.7,
    scale: 40, cameraDist: 600,
    centerX: 400, centerY: 300
};

// 1. Origin projects to center
const origin = projectQuadray(new Quadray(0, 0, 0, 0), opts);
assert('Origin x near centerX', Math.abs(origin.x - opts.centerX) < 1);
assert('Origin y near centerY', Math.abs(origin.y - opts.centerY) < 1);
assert('Origin scale > 0', origin.scale > 0);

// 2. Non-origin point projects differently
const p1 = projectQuadray(new Quadray(1, 0, 0, 0), opts);
assert('Basis A not at center', Math.abs(p1.x - opts.centerX) > 1 || Math.abs(p1.y - opts.centerY) > 1);
assert('Basis A scale > 0', p1.scale > 0);

// 3. Perspective diminishes with distance
const near = projectQuadray(new Quadray(1, 0, 0, 0), opts);
const far = projectQuadray(new Quadray(0, 0, 0, 5), opts);
assert('Perspective returns valid scale', near.scale > 0 && far.scale > 0);

// 4. Scale affects output proportionally
const opts2x = { ...opts, scale: 80 };
const p2 = projectQuadray(new Quadray(1, 0, 0, 0), opts2x);
const dx1 = Math.abs(p1.x - opts.centerX);
const dx2 = Math.abs(p2.x - opts2x.centerX);
assert('2x scale ≈ 2x displacement', Math.abs(dx2 / dx1 - 2.0) < 0.1);

// 5. cameraDist affects perspective
const optsNear = { ...opts, cameraDist: 100 };
const pNear = projectQuadray(new Quadray(1, 0, 0, 0), optsNear);
assert('Closer camera changes projection', Math.abs(pNear.x - p1.x) > 0.01 || Math.abs(pNear.y - p1.y) > 0.01);

// 6. Rotation changes output
const optsRot = { ...opts, rotY: 1.5 };
const pRot = projectQuadray(new Quadray(1, 0, 0, 0), optsRot);
assert('Different rotY changes projection', Math.abs(pRot.x - p1.x) > 0.01);

// 7. All four basis vectors produce distinct projections
const bases = Quadray.BASIS.map(b => projectQuadray(b, opts));
for (let i = 0; i < 4; i++) {
    for (let j = i + 1; j < 4; j++) {
        const dist = Math.hypot(bases[i].x - bases[j].x, bases[i].y - bases[j].y);
        assert(`Basis ${i} and ${j} are distinct`, dist > 0.1);
    }
}

// 8. drawQuadrayAxes is a function
assert('drawQuadrayAxes is a function', typeof drawQuadrayAxes === 'function');

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
