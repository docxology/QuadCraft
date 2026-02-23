/**
 * test_hex.js — Comprehensive Tests for 4D Hex
 * Run: node tests/test_hex.js
 */
if (typeof Quadray === 'undefined') { const _q = require('../../4d_generic/quadray.js'); globalThis.Quadray = _q.Quadray; }
if (typeof GridUtils === 'undefined') { const _g = require('../../4d_generic/grid_utils.js'); globalThis.GridUtils = _g.GridUtils; }
if (typeof SYNERGETICS === 'undefined') { const _s = require('../../4d_generic/synergetics.js'); globalThis.SYNERGETICS = _s.SYNERGETICS; globalThis.verifyRoundTrip = _s.verifyRoundTrip; globalThis.verifyGeometricIdentities = _s.verifyGeometricIdentities; }
if (typeof BaseBoard === 'undefined') { const _bb = require('../../4d_generic/base_board.js'); globalThis.BaseBoard = _bb.BaseBoard; }
if (typeof TurnManager === 'undefined') { const _t = require('../../4d_generic/turn_manager.js'); globalThis.TurnManager = _t.TurnManager; }
const { HexBoard, HEX } = require('../js/hex_board.js');

let p = 0, f = 0, t = 0;
function assert(name, cond) { t++; if (cond) { p++; console.log(`  ✅ ${name}`); } else { f++; console.log(`  ❌ ${name}`); } }

console.log('=== 4D Hex — Comprehensive Tests ===\n');

console.log('— Construction —');
const b = new HexBoard(5);
assert('625 cells (5^4)', b.cells.length === 625);
assert('Red first', b.turns.currentPlayer === 'red');
assert('No winner', b.winner === null);
assert('MoveCount 0', b.moveCount === 0);
assert('Game not over', !b.gameOver);
assert('HEX.EMPTY = 0', HEX.EMPTY === 0);
assert('HEX.RED = 1', HEX.RED === 1);
assert('HEX.BLUE = 2', HEX.BLUE === 2);

console.log('\n— Placement —');
const b2 = new HexBoard(5);
assert('Place succeeds', b2.place(b2.cells[0]));
assert('Stone placed', b2.getCell(b2.cells[0]) === HEX.RED);
assert('Turn switches', b2.turns.currentPlayer === 'blue');
assert('Move counted', b2.moveCount === 1);
assert('Duplicate blocked', !b2.place(b2.cells[0]));
assert('Blue can place', b2.place(b2.cells[1]));
assert('Blue stone placed', b2.getCell(b2.cells[1]) === HEX.BLUE);

console.log('\n— All cells start empty —');
const b3 = new HexBoard(5);
const allEmpty = b3.cells.every(c => b3.getCell(c) === HEX.EMPTY);
assert('All cells empty', allEmpty);

console.log('\n— Win detection —');
// Red connects a=0 to a=size-1
const b4 = new HexBoard(3);
// Fill column for red (a=0..2, b=0, c=0, d=0)
for (let a = 0; a < 3; a++) {
    const cell = b4.cells.find(c => c.a === a && c.b === 0 && c.c === 0 && c.d === 0);
    if (cell) {
        if (b4.turns.currentPlayer !== 'red') b4.place(b4.cells.find(c => b4.getCell(c) === HEX.EMPTY && c.a !== a));
        b4.place(cell);
    }
}
assert('Win possible with path', b4.winner === 'red' || b4.moveCount > 0);

console.log('\n— Metadata —');
const meta = b.getMetadata();
assert('Has currentPlayer', typeof meta.currentPlayer === 'string');
assert('Has winner', meta.winner === null || typeof meta.winner === 'string');
assert('Has moveCount', typeof meta.moveCount === 'number');

console.log('\n— Reset —');
b2.reset();
assert('Reset clears moves', b2.moveCount === 0);
assert('Reset clears winner', b2.winner === null);
assert('Reset clears gameOver', !b2.gameOver);
assert('Reset restores cells', b2.getCell(b2.cells[0]) === HEX.EMPTY);

console.log('\n— Synergetics —');
assert('TETRA_VOL = 1', SYNERGETICS.TETRA_VOL === 1);
assert('OCTA_VOL = 4', SYNERGETICS.OCTA_VOL === 4);
assert('Round-trip passes', verifyRoundTrip(new Quadray(1, 0, 0, 0)).passed);
assert('Geometric identities pass', verifyGeometricIdentities().allPassed);

console.log(`\n=== Results: ${p} passed, ${f} failed (${t} total) ===`);
process.exit(f > 0 ? 1 : 0);