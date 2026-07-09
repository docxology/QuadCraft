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
// 369 canonical (min-component==0) cells at size=5, not the raw 5^4=625 —
// HexBoard dedupes degenerate same-point tuples like (1,1,1,1)==(0,0,0,0).
assert('369 canonical cells (size 5)', b.cells.length === 369);
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
// Red connects a=0 to a=size-1. Build a *genuine* IVM-adjacent path (via
// GridUtils.boundedNeighbors, the same traversal _checkWin uses) rather than
// an arbitrary a=0,1,2 column — those three cells are not necessarily
// 12-neighbor-adjacent under the (0,1,1,2)-permutation direction set.
const b4 = new HexBoard(3);
const key4 = (c) => b4.key(c.a, c.b, c.c, c.d);
const cellSet4 = new Set(b4.cells.map(key4));
const start4 = b4.cells.find(c => c.a === 0 && c.b === 0 && c.c === 0 && c.d === 0);
const parent4 = new Map();
const visited4 = new Set([key4(start4)]);
const queue4 = [start4];
let end4 = null;
while (queue4.length) {
    const cur = queue4.shift();
    if (cur.a === b4.size - 1) { end4 = cur; break; }
    for (const n of GridUtils.boundedNeighbors(cur.a, cur.b, cur.c, cur.d, b4.size)) {
        const k = key4(n);
        if (cellSet4.has(k) && !visited4.has(k)) { visited4.add(k); parent4.set(k, cur); queue4.push(n); }
    }
}
const path4 = [];
for (let c = end4; c; c = parent4.get(key4(c))) path4.unshift(c);
const pathKeys4 = new Set(path4.map(key4));
for (const redCell of path4) {
    if (b4.winner) break;
    if (b4.turns.currentPlayer !== 'red') {
        const blueCell = b4.cells.find(c => b4.getCell(c) === HEX.EMPTY && !pathKeys4.has(key4(c)));
        b4.place(blueCell);
    }
    b4.place(redCell);
}
assert('Genuine IVM-adjacent path found', path4.length > 1 && end4 !== null);
assert('Red wins by connecting a=0 to a=size-1', b4.winner === 'red');

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