/**
 * BaseBoard state and raw-label boundary regressions.
 * Physical IVM neighbor geometry is exercised independently in test_grid_utils.js.
 * Run: node games/tests/shared/test_base_board.js
 */
const assert = require('node:assert/strict');
Object.assign(globalThis, require('../../4d_generic/quadray.js'));
Object.assign(globalThis, require('../../4d_generic/grid_utils.js'));
const { BaseBoard } = require('../../4d_generic/base_board.js');

let passed = 0, failed = 0;
function test(name, run) {
    try {
        run();
        passed++;
        console.log(`PASS: ${name}`);
    } catch (error) {
        failed++;
        console.error(`FAIL: ${name}\n${error.stack}`);
    }
}

test('raw board slots remain independent even for gauge-equivalent points', () => {
    const board = new BaseBoard(4, { verify: false });
    const origin = { a: 0, b: 0, c: 0, d: 0 };
    const alias = { a: 1, b: 1, c: 1, d: 1 };
    board.setCell(origin, 'stone');
    board.setCell(alias, 'water');
    board.setCell(origin, 'grass');
    assert.equal(board.getCell(origin), 'grass');
    assert.equal(board.getCell(alias), 'water');
});

test('raw component bounds include the last cell and exclude either outside face', () => {
    const board = new BaseBoard(4, { verify: false });
    assert.equal(board.inBounds({ a: 3, b: 3, c: 3, d: 3 }), true);
    for (const axis of ['a', 'b', 'c', 'd']) {
        const lower = { a: 1, b: 1, c: 1, d: 1, [axis]: -1 };
        const upper = { a: 1, b: 1, c: 1, d: 1, [axis]: 4 };
        assert.equal(board.inBounds(lower), false, `${axis}: negative face`);
        assert.equal(board.inBounds(upper), false, `${axis}: upper face`);
    }
});

test('wrapping handles negative labels and labels beyond one period', () => {
    const board = new BaseBoard(4, { verify: false });
    assert.equal(board.wrap(-1), 3);
    assert.equal(board.wrap(17), 1);
});

test('reset discards occupied slots and completed-game state', () => {
    const board = new BaseBoard(4, { verify: false });
    const origin = { a: 0, b: 0, c: 0, d: 0 };
    const alias = { a: 1, b: 1, c: 1, d: 1 };
    board.setCell(origin, 'stone');
    board.setCell(alias, 'water');
    board.score = 42;
    board.gameOver = true;
    board.reset();
    assert.equal(board.getCell(origin), null);
    assert.equal(board.getCell(alias), null);
    assert.equal(board.score, 0);
    assert.equal(board.gameOver, false);
});

console.log(`BaseBoard: ${passed} passed, ${failed} failed`);
process.exitCode = failed ? 1 : 0;
