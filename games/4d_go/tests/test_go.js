/**
 * test_go.js — Comprehensive Tests for 4D Go
 * Run: node tests/test_go.js
 */
if (typeof Quadray === 'undefined') { const _q = require('../../4d_generic/quadray.js'); globalThis.Quadray = _q.Quadray; }
if (typeof GridUtils === 'undefined') { const _g = require('../../4d_generic/grid_utils.js'); globalThis.GridUtils = _g.GridUtils; }
if (typeof SYNERGETICS === 'undefined') { const _s = require('../../4d_generic/synergetics.js'); globalThis.SYNERGETICS = _s.SYNERGETICS; globalThis.verifyRoundTrip = _s.verifyRoundTrip; globalThis.verifyGeometricIdentities = _s.verifyGeometricIdentities; }
if (typeof BaseBoard === 'undefined') { const _bb = require('../../4d_generic/base_board.js'); globalThis.BaseBoard = _bb.BaseBoard; }
if (typeof TurnManager === 'undefined') { const _t = require('../../4d_generic/turn_manager.js'); globalThis.TurnManager = _t.TurnManager; }
const { GoBoard, STONE } = require('../js/go_board.js');

let p = 0, f = 0, t = 0;
function assert(name, cond) { t++; if (cond) { p++; console.log(`  ✅ ${name}`); } else { f++; console.log(`  ❌ ${name}`); } }

console.log('=== 4D Go — Comprehensive Tests ===\n');

console.log('— Construction —');
const b = new GoBoard(5);
assert('625 cells (5^4)', b.cells.length === 625);
assert('Black first', b.turns.currentPlayer === 'black');
assert('MoveCount 0', b.moveCount === 0);
assert('Captures start at 0', b.captured.black === 0 && b.captured.white === 0);
assert('STONE.EMPTY = 0', STONE.EMPTY === 0);
assert('STONE.BLACK = 1', STONE.BLACK === 1);
assert('STONE.WHITE = 2', STONE.WHITE === 2);

console.log('\n— Stone Placement —');
const b2 = new GoBoard(5);
const c = b2.cells[100];
assert('Can place stone', b2.place(c));
assert('Stone is black', b2.getCell(c) === STONE.BLACK);
assert('Turn switches to white', b2.turns.currentPlayer === 'white');
assert('Move counted', b2.moveCount === 1);

console.log('\n— Duplicate Placement —');
assert('Cannot place on occupied', !b2.place(c));

console.log('\n— White placement —');
const c2 = b2.cells[200];
assert('White can place', b2.place(c2));
assert('Stone is white', b2.getCell(c2) === STONE.WHITE);
assert('Turn back to black', b2.turns.currentPlayer === 'black');

console.log('\n— Liberties —');
assert('12 IVM directions', GridUtils.DIRECTIONS.length === 12);
const nbrs = GridUtils.boundedNeighbors(2, 2, 2, 2, 5);
assert('Has IVM neighbors', nbrs.length > 0 && nbrs.length <= 12);

console.log('\n— Pass —');
const b3 = new GoBoard(5);
const before = b3.turns.currentPlayer;
b3.pass();
assert('Pass switches turn', b3.turns.currentPlayer !== before);
assert('Pass increments moveCount', b3.moveCount === 1);

console.log('\n— All cells start empty —');
const b4 = new GoBoard(5);
assert('All empty', b4.cells.every(c => b4.getCell(c) === STONE.EMPTY));

console.log('\n— Metadata —');
const meta = b.getMetadata();
assert('Has currentPlayer', typeof meta.currentPlayer === 'string');
assert('Has captured', typeof meta.captured === 'object');
assert('Has moveCount', typeof meta.moveCount === 'number');

console.log('\n— Reset —');
b2.reset();
assert('Reset clears moves', b2.moveCount === 0);
assert('Reset clears captures', b2.captured.black === 0);
assert('Reset restores black', b2.turns.currentPlayer === 'black');
assert('Reset clears cells', b2.getCell(c) === STONE.EMPTY);

console.log('\n— Synergetics —');
assert('TETRA_VOL = 1', SYNERGETICS.TETRA_VOL === 1);
assert('OCTA_VOL = 4', SYNERGETICS.OCTA_VOL === 4);
assert('Round-trip passes', verifyRoundTrip(new Quadray(1, 0, 0, 0)).passed);
assert('Geometric identities pass', verifyGeometricIdentities().allPassed);

console.log(`\n=== Results: ${p} passed, ${f} failed (${t} total) ===`);
process.exit(f > 0 ? 1 : 0);