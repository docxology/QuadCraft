/**
 * Geometry regressions for the seven live game renderers, using shared projection.
 * Run: node games/tests/shared/test_game_renderers.js
 *
 * Geometry-only instances use the real renderer prototypes and plain coordinate
 * data; no DOM drawing context is needed and no production function is replaced.
 */
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
Object.assign(globalThis, require('../../4d_generic/projection.js'));
globalThis.GridUtils = require('../../4d_generic/grid_utils.js').GridUtils;

const renderers = [
    ['go', 'GoRenderer', '_proj', 25],
    ['hex', 'HexRenderer', '_proj', 25],
    ['lights_out', 'LightsOutRenderer', '_projectCells', 25],
    ['memory', 'MemoryRenderer', '_proj', 25],
    ['rogue', 'RogueRenderer', '_projectCells', null],
    ['sokoban', 'SokobanRenderer', '_projectAll', 30],
    ['sudoku', 'SudokuRenderer', '_proj', 20],
];
let passed = 0;
function test(name, fn) {
    fn();
    passed++;
    console.log(`PASS: ${name}`);
}
function near(actual, expected) {
    assert.ok(Number.isFinite(actual), `nonfinite screen coordinate: ${actual}`);
    assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`);
}

// Independent Cartesian basis/matrix oracle, not a call to projectQuadray or
// Quadray.toCartesian. This pins axis order, signs, perspective and screen Y.
function screen(pos, renderer, camera = renderer) {
    const basis = [[1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1]];
    const coefficients = [pos.a, pos.b, pos.c, pos.d];
    let xyz = [0, 1, 2].map(axis => basis.reduce((s, v, i) => s + v[axis] * coefficients[i], 0) / Math.sqrt(2));
    const cx = Math.cos(camera.rotX), sx = Math.sin(camera.rotX);
    const cy = Math.cos(camera.rotY), sy = Math.sin(camera.rotY);
    const matrices = [
        [[cy, 0, -sy], [0, 1, 0], [sy, 0, cy]],
        [[1, 0, 0], [0, cx, -sx], [0, sx, cx]],
    ];
    for (const matrix of matrices) xyz = matrix.map(row => row.reduce((s, v, i) => s + v * xyz[i], 0));
    const perspective = renderer.cameraDist / (renderer.cameraDist + xyz[2]);
    return {
        px: renderer.canvas.width / 2 + xyz[0] * renderer.scale * perspective,
        py: renderer.canvas.height / 2 - xyz[1] * renderer.scale * perspective,
        pScale: perspective,
    };
}
function sameScreen(actual, expected) {
    near(actual.px, expected.px);
    near(actual.py, expected.py);
    near(actual.pScale, expected.pScale);
}
function instance(Renderer, cells) {
    return Object.assign(Object.create(Renderer.prototype), {
        canvas: { width: 960, height: 640 },
        board: { cells, size: 2 },
        rotX: -0.4, rotY: 0.1, scale: 64, cameraDist: 120,
    });
}

async function run() {
    for (const [game, className, method, threshold] of renderers) {
        const Renderer = require(`../../4d_${game}/js/${game}_renderer.js`)[className];
        const cells = [
            { a: 0, b: 0, c: 0, d: 0 },
            { a: 1, b: 0, c: 0, d: 0 },
            { a: 0, b: 1, c: 0, d: 0 },
            { a: 0, b: 0, c: 1, d: 0 },
            { a: 0, b: 0, c: 0, d: 1 },
            { a: 8, b: 7, c: 7, d: 7 },
        ];
        const renderer = instance(Renderer, cells);
        const camera = { rotX: 0.63, rotY: -0.81 };
        // Rogue uses renderer state synchronized by BaseGame, not a separate camera.
        if (game === 'rogue') Object.assign(renderer, camera);

        test(`${game}: real cell projection respects camera, units and labels`, () => {
            const projected = renderer[method](cells, camera);
            projected.forEach((p, i) => {
                sameScreen(p, screen(cells[i], renderer, camera));
                for (const axis of ['a', 'b', 'c', 'd']) assert.equal(p[axis], cells[i][axis]);
            });
            sameScreen(projected[1], projected[5]); // Gauge-equivalent positions.
            if (game === 'rogue') sameScreen(renderer._projectOne(cells[1]), projected[1]);
        });

        test(`${game}: zoom, perspective and viewport use live renderer state`, () => {
            const original = renderer[method]([cells[1]], camera)[0];
            renderer.scale *= 2;
            let projected = renderer[method]([cells[1]], camera)[0];
            near(projected.px - 480, 2 * (original.px - 480));
            near(projected.py - 320, 2 * (original.py - 320));
            near(projected.pScale, original.pScale);
            renderer.cameraDist = 8;
            renderer.canvas.width = 720;
            renderer.canvas.height = 500;
            projected = renderer[method]([cells[1]], camera)[0];
            sameScreen(projected, screen(cells[1], renderer, camera));
            assert.notEqual(projected.pScale, original.pScale);
        });

        if (threshold !== null) {
            test(`${game}: hit-test picks rendered position after camera rotation`, () => {
                const picking = instance(Renderer, cells.slice(0, 5));
                const target = cells[1];
                const p = screen(target, picking, camera);
                assert.deepEqual(picking.hitTest(p.px, p.py, camera), target);
                assert.equal(picking.hitTest(-10000, -10000, camera), null);
                const rotated = { rotX: -0.2, rotY: 0.94 };
                const moved = screen(target, picking, rotated);
                assert.deepEqual(picking.hitTest(moved.px, moved.py, rotated), target);
            });
            test(`${game}: picking radius excludes the exact outer boundary`, () => {
                const picking = instance(Renderer, [cells[0]]);
                picking.board.size = 1; // Sokoban enumerates its raw board labels.
                assert.deepEqual(picking.hitTest(480 + threshold - 0.01, 320, camera), cells[0]);
                assert.equal(picking.hitTest(480 + threshold, 320, camera), null);
            });
        }
    }

    // Exercise the real Node import path after projection has loaded Quadray.
    const doom = await import(pathToFileURL(path.resolve(__dirname, '../../4d_doom/js/quadray.js')).href);
    test('Doom Node bridge preserves canonical coordinate operations', () => {
        const a = new doom.Quadray(1, 0, 0, 0);
        const shifted = new doom.Quadray(8, 7, 7, 7);
        assert.deepEqual(a.toCartesian(), shifted.toCartesian());
        assert.equal(doom.Quadray.distance(a, shifted), 0);
        const cart = a.toCartesian();
        near(cart.x, 1 / Math.sqrt(2));
        near(cart.y, 1 / Math.sqrt(2));
        near(cart.z, 1 / Math.sqrt(2));
        near(a.length(), Math.hypot(cart.x, cart.y, cart.z));
    });
    console.log(`Game renderers: ${passed} passed, 0 failed`);
}
run().catch(error => {
    console.error(error);
    console.log(`Game renderers: ${passed} passed, 1 failed`);
    process.exitCode = 1;
});
