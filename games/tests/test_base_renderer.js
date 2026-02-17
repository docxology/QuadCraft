/**
 * test_base_renderer.js — Tests for BaseRenderer module
 *
 * Tests: constructor, _project fallback, _drawAxes, _clearCanvas, _drawHUD, shape drawing.
 * Run: node games/tests/test_base_renderer.js
 */
const path = require('path');
const { BaseRenderer } = require(path.join(__dirname, '..', '4d_generic', 'base_renderer.js'));

let passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) { passed++; console.log(`  ✅ ${msg}`); }
    else { failed++; console.error(`  ❌ ${msg}`); }
}

console.log('╔═══════════════════════════════════╗');
console.log('║   Test: BaseRenderer Module       ║');
console.log('╚═══════════════════════════════════╝\n');

// --- Mock canvas ---
function mockCanvas(w = 400, h = 400) {
    const ops = [];
    return {
        width: w, height: h,
        getContext: () => ({
            fillStyle: '', strokeStyle: '', lineWidth: 0,
            font: '', textAlign: '',
            fillRect: (x, y, w, h) => ops.push({ op: 'fillRect', x, y, w, h }),
            fillText: (t, x, y) => ops.push({ op: 'fillText', t, x, y }),
            beginPath: () => ops.push({ op: 'beginPath' }),
            arc: (x, y, r) => ops.push({ op: 'arc', x, y, r }),
            fill: () => ops.push({ op: 'fill' }),
            moveTo: (x, y) => ops.push({ op: 'moveTo', x, y }),
            lineTo: (x, y) => ops.push({ op: 'lineTo', x, y }),
            closePath: () => ops.push({ op: 'closePath' }),
            stroke: () => ops.push({ op: 'stroke' }),
        }),
        _ops: ops
    };
}

// 1. Constructor defaults
console.log('▸ Constructor defaults');
const c1 = mockCanvas();
const r1 = new BaseRenderer(c1, {});
assert(r1.scale === 35, 'default scale = 35');
assert(r1.cameraDist === 5, 'default cameraDist = 5');
assert(r1.bgColor === '#0f172a', 'default bgColor');
assert(r1.fontFamily === 'monospace', 'default fontFamily');

// 2. Custom options
console.log('▸ Custom options');
const r2 = new BaseRenderer(c1, {}, { scale: 50, cameraDist: 10, bgColor: '#000' });
assert(r2.scale === 50, 'custom scale = 50');
assert(r2.cameraDist === 10, 'custom cameraDist = 10');
assert(r2.bgColor === '#000', 'custom bgColor');

// 3. _project fallback (no global projectQuadray)
console.log('▸ _project() fallback');
const c3 = mockCanvas(400, 400);
const r3 = new BaseRenderer(c3, {}, { scale: 10 });
const p = r3._project(1, 0, 0, 0);
assert(typeof p.x === 'number', '_project returns x');
assert(typeof p.y === 'number', '_project returns y');
assert(typeof p.scale === 'number', '_project returns scale');
assert(p.x === 200, 'origin-centered x');
assert(p.scale === 1, 'fallback scale = 1');

// 4. _project with non-zero coords
console.log('▸ _project non-zero');
const p2 = r3._project(0, 1, 0, 0);
const p3 = r3._project(0, 0, 1, 0);
assert(p2.x !== p3.x || p2.y !== p3.y, 'different coords → different positions');

// 5. _clearCanvas
console.log('▸ _clearCanvas()');
const c5 = mockCanvas();
const r5 = new BaseRenderer(c5, {});
r5._clearCanvas();
const rectOp = c5._ops.find(o => o.op === 'fillRect');
assert(rectOp !== undefined, '_clearCanvas calls fillRect');
assert(rectOp.w === 400 && rectOp.h === 400, 'fills full canvas');

// 6. _drawHUD
console.log('▸ _drawHUD()');
const c6 = mockCanvas();
const r6 = new BaseRenderer(c6, {});
r6._drawHUD(['Line 1', 'Line 2']);
const textOps = c6._ops.filter(o => o.op === 'fillText');
assert(textOps.length === 2, 'draws 2 text lines');
assert(textOps[0].t === 'Line 1', 'first line correct');
assert(textOps[1].t === 'Line 2', 'second line correct');

// 7. _drawCircle
console.log('▸ _drawCircle()');
const c7 = mockCanvas();
const r7 = new BaseRenderer(c7, {});
r7._drawCircle(100, 100, 10, '#ff0000');
const arcOp = c7._ops.find(o => o.op === 'arc');
assert(arcOp !== undefined, '_drawCircle calls arc');
assert(arcOp.x === 100 && arcOp.y === 100, 'correct center');

// 8. _drawDiamond
console.log('▸ _drawDiamond()');
const c8 = mockCanvas();
const r8 = new BaseRenderer(c8, {});
r8._drawDiamond(50, 50, 5, '#00ff00', '#000');
const moveOps = c8._ops.filter(o => o.op === 'moveTo');
assert(moveOps.length === 1, 'diamond starts with moveTo');
const lineOps = c8._ops.filter(o => o.op === 'lineTo');
assert(lineOps.length === 3, 'diamond has 3 lineTo calls');

// 9. render() base method
console.log('▸ render() base');
const c9 = mockCanvas();
const r9 = new BaseRenderer(c9, {});
r9.render(); // Should not throw
assert(c9._ops.length > 0, 'render produces draw operations');

// 10. _drawAxes with no global
console.log('▸ _drawAxes() no global');
const c10 = mockCanvas();
const r10 = new BaseRenderer(c10, {});
try { r10._drawAxes(); passed++; console.log('  ✅ _drawAxes does not throw without global'); }
catch { failed++; console.error('  ❌ _drawAxes threw'); }

console.log(`\n${'─'.repeat(36)}`);
console.log(`BaseRenderer: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
