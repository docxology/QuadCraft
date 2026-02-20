/**
 * test_camera.js — Tests for shared CameraController module
 *
 * Tests CameraController class from 4d_generic/camera.js
 *
 * Run: node games/tests/test_camera.js
 */
const { CameraController } = require('../../4d_generic/camera.js');

let passed = 0, failed = 0;
function assert(name, condition) {
    if (condition) { passed++; console.log(`  ✅ PASSED: ${name}`); }
    else { failed++; console.log(`  ❌ FAILED: ${name}`); }
}

console.log('=== Shared Camera Controller Tests ===\n');

// Mock canvas with addEventListener
function mockCanvas() {
    const listeners = {};
    return {
        addEventListener: (event, handler) => {
            if (!listeners[event]) listeners[event] = [];
            listeners[event].push(handler);
        },
        fire: (event, data) => {
            (listeners[event] || []).forEach(fn => fn(data));
        }
    };
}

// 1. Constructor defaults
const canvas1 = mockCanvas();
const cam1 = new CameraController(canvas1);
assert('Default rotX = 0.5', cam1.rotX === 0.5);
assert('Default rotY = 0.7', cam1.rotY === 0.7);
assert('Default isDragging = false', cam1.isDragging === false);
assert('Default mode = shift-drag', cam1.mode === 'shift-drag');

// 2. Constructor with options
const canvas2 = mockCanvas();
const cam2 = new CameraController(canvas2, {
    mode: 'left-drag', sensitivity: 0.01, clampX: 1.5
});
assert('Custom mode = left-drag', cam2.mode === 'left-drag');
assert('Custom sensitivity = 0.01', cam2.sensitivity === 0.01);
assert('Custom clampX = 1.5', cam2.clampX === 1.5);

// 3. Left-drag mode starts dragging on button 0
const canvas3 = mockCanvas();
const cam3 = new CameraController(canvas3, { mode: 'left-drag' });
canvas3.fire('mousedown', { button: 0, clientX: 100, clientY: 200 });
assert('Left-drag: dragging after left click', cam3.isDragging === true);

// 4. Mouse up stops dragging
canvas3.fire('mouseup', {});
assert('Left-drag: not dragging after mouseup', cam3.isDragging === false);

// 5. Shift-drag mode requires shift or right-click
const canvas4 = mockCanvas();
const cam4 = new CameraController(canvas4, { mode: 'shift-drag' });
canvas4.fire('mousedown', { button: 0, shiftKey: false, preventDefault: () => { } });
assert('Shift-drag: no drag on plain left click', cam4.isDragging === false);
canvas4.fire('mousedown', { button: 2, shiftKey: false, preventDefault: () => { } });
assert('Shift-drag: drag on right click', cam4.isDragging === true);

// 6. Mouse move updates rotation
canvas4.fire('mousemove', { clientX: 110, clientY: 205 });
assert('Rotation updated after drag', cam4.rotY !== 0.7 || cam4.rotX !== 0.5);

// 7. clampX limits rotX
const canvas5 = mockCanvas();
const cam5 = new CameraController(canvas5, { mode: 'left-drag', clampX: 0.1 });
cam5.isDragging = true;
cam5.lastMouse = { x: 0, y: 0 };
canvas5.fire('mousemove', { clientX: 0, clientY: 9999 });
assert('rotX clamped to ±0.1', Math.abs(cam5.rotX) <= 0.1 + 0.001);

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
