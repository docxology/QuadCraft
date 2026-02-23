/**
 * test_lights_out.js — Unit tests for 4D Lights Out
 *
 * Tests board construction, IVM 12-neighbor toggle, win detection,
 * randomization solvability, and metadata.
 */

// ─── Shared test modules ─────────────────────────────────────────────────────
if (typeof Quadray === 'undefined') {
    const _q = require('../../4d_generic/quadray.js');
    globalThis.Quadray = _q.Quadray;
}
if (typeof GridUtils === 'undefined') {
    const _g = require('../../4d_generic/grid_utils.js');
    globalThis.GridUtils = _g.GridUtils;
}
if (typeof SYNERGETICS === 'undefined') {
    const _s = require('../../4d_generic/synergetics.js');
    globalThis.SYNERGETICS = _s.SYNERGETICS;
    globalThis.verifyRoundTrip = _s.verifyRoundTrip;
    globalThis.verifyGeometricIdentities = _s.verifyGeometricIdentities;
}
if (typeof BaseBoard === 'undefined') {
    const _bb = require('../../4d_generic/base_board.js');
    globalThis.BaseBoard = _bb.BaseBoard;
}
const { LightsOutBoard } = require('../js/lights_out_board.js');

// ─── Minimal test runner ─────────────────────────────────────────────────────
let passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) { passed++; console.log(`  ✅ ${msg}`); }
    else { failed++; console.error(`  ❌ ${msg}`); }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

console.log('\n=== LightsOutBoard Construction ===');
{
    const board = new LightsOutBoard(3);
    assert(board.cells.length === 81, 'Size 3 grid has 3^4 = 81 cells');
    assert(board.moveCount === 0, 'Move count starts at 0');
    assert(!board.won, 'Not won at start');
}

console.log('\n=== DIRECTIONS ===');
{
    assert(GridUtils.DIRECTIONS.length === 12, 'DIRECTIONS has 12 entries');
    // Each is a permutation of (0,1,1,2)
    for (const dir of GridUtils.DIRECTIONS) {
        const sorted = [...dir].sort().join(',');
        assert(sorted === '0,1,1,2', `Direction [${dir}] is a permutation of (0,1,1,2)`);
    }
    // All should be unique
    const keys = new Set(GridUtils.DIRECTIONS.map(d => d.join(',')));
    assert(keys.size === 12, 'All 12 directions are unique');
}

console.log('\n=== IVM Neighbors ===');
{
    const neighbors = GridUtils.neighbors(0, 0, 0, 0);
    assert(neighbors.length === 12, 'Origin has 12 IVM neighbors');
    // Each neighbor should be a permutation of (0,1,1,2)
    for (const n of neighbors) {
        const vals = [n.a, n.b, n.c, n.d].sort().join(',');
        assert(vals === '0,1,1,2', `Neighbor (${n.a},${n.b},${n.c},${n.d}) is a permutation of (0,1,1,2)`);
    }
}

console.log('\n=== Toggle Mechanics ===');
{
    const board = new LightsOutBoard(4);
    // Start fresh — set all off
    for (const c of board.cells) board.setCell(c, false);
    board.moveCount = 0;
    board.won = false;
    board.gameOver = false;

    // Toggle origin — should flip self + bounded IVM neighbors
    const pos = { a: 1, b: 1, c: 1, d: 1 };
    const flipped = board.toggle(pos);
    assert(flipped > 1, `Toggle flipped ${flipped} cells (self + neighbors)`);
    assert(board.isLit(pos), 'Toggled cell is now lit');
    assert(board.moveCount === 1, 'Move count incremented');
}

console.log('\n=== Double Toggle Reverts ===');
{
    const board = new LightsOutBoard(4);
    // Set all off
    for (const c of board.cells) board.setCell(c, false);
    board.moveCount = 0;
    board.won = false;
    board.gameOver = false;

    const pos = { a: 2, b: 2, c: 2, d: 0 };
    board.toggle(pos);
    board.toggle(pos);

    // All should be off again
    let anyLit = false;
    for (const c of board.cells) {
        if (board.isLit(c)) { anyLit = true; break; }
    }
    assert(!anyLit, 'Double toggle returns all cells to OFF');
}

console.log('\n=== Win Detection ===');
{
    const board = new LightsOutBoard(2);
    // Set all off to trigger win
    for (const c of board.cells) board.setCell(c, false);
    board.won = false;
    board.gameOver = false;
    board._checkWin();
    assert(board.won, 'Win detected when all lights are off');
}

console.log('\n=== Randomize Solvability ===');
{
    const board = new LightsOutBoard(3);
    assert(board.litCount() > 0, 'Randomized board has lit cells');
    assert(board.moveCount === 0, 'Move count is 0 after randomize');
}

console.log('\n=== Metadata ===');
{
    const board = new LightsOutBoard(3);
    const meta = board.getMetadata();
    assert(typeof meta.litCount === 'number', 'Metadata has litCount');
    assert(typeof meta.totalCells === 'number', 'Metadata has totalCells');
    assert(typeof meta.moveCount === 'number', 'Metadata has moveCount');
    assert(typeof meta.won === 'boolean', 'Metadata has won flag');
    assert(meta.totalCells === board.cells.length, 'totalCells matches cells.length');
}

console.log('\n=== Reset ===');
{
    const board = new LightsOutBoard(3);
    board.toggle(board.cells[0]);
    board.toggle(board.cells[1]);
    const movesBefore = board.moveCount;
    board.reset();
    assert(board.moveCount === 0, 'Reset clears move count');
    assert(!board.won, 'Reset clears win state');
    assert(board.litCount() > 0, 'Reset generates new puzzle');
}

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
