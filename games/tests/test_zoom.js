/**
 * test_zoom.js — Tests for shared zoom module
 *
 * Tests setupZoom() from 4d_generic/zoom.js
 *
 * Run: node games/tests/test_zoom.js
 */
const { setupZoom } = require('../4d_generic/zoom.js');

let passed = 0, failed = 0;
function assert(name, condition) {
    if (condition) { passed++; console.log(`  ✅ PASSED: ${name}`); }
    else { failed++; console.log(`  ❌ FAILED: ${name}`); }
}

console.log('=== Shared Zoom Module Tests ===\n');

// Mock canvas
function mockCanvas() {
    const listeners = {};
    return {
        addEventListener: (event, handler, opts) => {
            if (!listeners[event]) listeners[event] = [];
            listeners[event].push(handler);
        },
        fire: (event, data) => {
            (listeners[event] || []).forEach(fn => fn({ ...data, preventDefault: () => { } }));
        }
    };
}

// 1. setupZoom is a function
assert('setupZoom is a function', typeof setupZoom === 'function');

// 2. Zoom in increases scale
const canvas1 = mockCanvas();
const renderer1 = { scale: 50 };
setupZoom(canvas1, renderer1);
canvas1.fire('wheel', { deltaY: -100 });
assert('Zoom in increases scale', renderer1.scale > 50);

// 3. Zoom out decreases scale
const canvas2 = mockCanvas();
const renderer2 = { scale: 50 };
setupZoom(canvas2, renderer2);
canvas2.fire('wheel', { deltaY: 100 });
assert('Zoom out decreases scale', renderer2.scale < 50);

// 4. Scale clamped to min
const canvas3 = mockCanvas();
const renderer3 = { scale: 11 };
setupZoom(canvas3, renderer3, { min: 10, max: 120 });
for (let i = 0; i < 100; i++) canvas3.fire('wheel', { deltaY: 100 });
assert('Scale clamped to min', renderer3.scale >= 10);

// 5. Scale clamped to max
const canvas4 = mockCanvas();
const renderer4 = { scale: 119 };
setupZoom(canvas4, renderer4, { min: 10, max: 120 });
for (let i = 0; i < 100; i++) canvas4.fire('wheel', { deltaY: -100 });
assert('Scale clamped to max', renderer4.scale <= 120);

// 6. Custom zoom factors
const canvas5 = mockCanvas();
const renderer5 = { scale: 50 };
setupZoom(canvas5, renderer5, { zoomIn: 2.0, zoomOut: 0.5 });
canvas5.fire('wheel', { deltaY: -1 });
assert('Custom zoomIn factor applied', Math.abs(renderer5.scale - 100) < 0.01);

// 7. Custom min/max
const canvas6 = mockCanvas();
const renderer6 = { scale: 50 };
setupZoom(canvas6, renderer6, { min: 40, max: 60 });
for (let i = 0; i < 50; i++) canvas6.fire('wheel', { deltaY: 100 });
assert('Custom min honored', renderer6.scale >= 40);

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
