/**
 * test_sudoku.js — Comprehensive Tests for 4D Sudoku
 * Run: node tests/test_sudoku.js
 */
if (typeof Quadray === 'undefined') { const _q = require('../../4d_generic/quadray.js'); globalThis.Quadray = _q.Quadray; }
if (typeof GridUtils === 'undefined') { const _g = require('../../4d_generic/grid_utils.js'); globalThis.GridUtils = _g.GridUtils; }
if (typeof SYNERGETICS === 'undefined') { const _s = require('../../4d_generic/synergetics.js'); globalThis.SYNERGETICS = _s.SYNERGETICS; globalThis.verifyRoundTrip = _s.verifyRoundTrip; globalThis.verifyGeometricIdentities = _s.verifyGeometricIdentities; }
if (typeof BaseBoard === 'undefined') { const _bb = require('../../4d_generic/base_board.js'); globalThis.BaseBoard = _bb.BaseBoard; }
const { SudokuBoard } = require('../js/sudoku_board.js');

let p = 0, f = 0, t = 0;
function assert(name, cond) { t++; if (cond) { p++; console.log(`  ✅ ${name}`); } else { f++; console.log(`  ❌ ${name}`); } }

console.log('=== 4D Sudoku — Comprehensive Tests ===\n');

console.log('— Construction —');
const b = new SudokuBoard(4);
assert('256 cells (4^4)', b.cells.length === 256);
assert('Has givens', b.given.size > 0);
assert('MoveCount 0', b.moveCount === 0);
assert('Errors 0', b.errors === 0);
assert('Not won', !b.won);
assert('Game not over', !b.gameOver);
assert('Solution map exists', b.solution instanceof Map);

console.log('\n— Given protection —');
const given = b.cells.find(c => b.isGiven(c));
if (given) {
    assert('Given cell identified', true);
    assert('Cannot overwrite given', !b.place(given, 9));
}

console.log('\n— Placement —');
const b2 = new SudokuBoard(4);
const empty = b2.cells.find(c => !b2.isGiven(c) && (b2.getCell(c) || 0) === 0);
if (empty) {
    assert('Can place value', b2.place(empty, 1));
    assert('Move counted', b2.moveCount === 1);
    assert('Value stored', b2.getCell(empty) === 1);
    // Place 0 to clear
    b2.place(empty, 0);
    assert('Can clear cell', (b2.getCell(empty) || 0) === 0);
}

console.log('\n— IVM Constraints —');
assert('12 IVM directions', GridUtils.DIRECTIONS.length === 12);
const nbrs = GridUtils.boundedNeighbors(1, 1, 1, 1, 4);
assert('Has IVM neighbors', nbrs.length > 0);

console.log('\n— Metadata —');
const meta = b.getMetadata();
assert('Has filled count', typeof meta.filled === 'number');
assert('Has total count', typeof meta.total === 'number');
assert('Has moveCount', typeof meta.moveCount === 'number');
assert('Has errors', typeof meta.errors === 'number');
assert('Has won', typeof meta.won === 'boolean');

console.log('\n— Reset —');
const b3 = new SudokuBoard(4);
const e2 = b3.cells.find(c => !b3.isGiven(c));
if (e2) b3.place(e2, 1);
b3.reset();
assert('Reset clears moves', b3.moveCount === 0);
assert('Reset clears errors', b3.errors === 0);
assert('Reset clears won', !b3.won);
assert('Reset clears gameOver', !b3.gameOver);
assert('Givens preserved', b3.given.size > 0);

console.log('\n— Synergetics —');
assert('TETRA_VOL = 1', SYNERGETICS.TETRA_VOL === 1);
assert('OCTA_VOL = 4', SYNERGETICS.OCTA_VOL === 4);
assert('Round-trip passes', verifyRoundTrip(new Quadray(1, 0, 0, 0)).passed);
assert('Geometric identities pass', verifyGeometricIdentities().allPassed);

console.log(`\n=== Results: ${p} passed, ${f} failed (${t} total) ===`);
process.exit(f > 0 ? 1 : 0);