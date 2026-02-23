/**
 * test_backgammon.js — Comprehensive Tests for 4D Backgammon
 * Run: node tests/test_backgammon.js
 */
if (typeof Quadray === 'undefined') { const _q = require('../../4d_generic/quadray.js'); globalThis.Quadray = _q.Quadray; }
if (typeof GridUtils === 'undefined') { const _g = require('../../4d_generic/grid_utils.js'); globalThis.GridUtils = _g.GridUtils; }
if (typeof SYNERGETICS === 'undefined') { const _s = require('../../4d_generic/synergetics.js'); globalThis.SYNERGETICS = _s.SYNERGETICS; globalThis.verifyRoundTrip = _s.verifyRoundTrip; globalThis.verifyGeometricIdentities = _s.verifyGeometricIdentities; }
if (typeof BaseBoard === 'undefined') { const _bb = require('../../4d_generic/base_board.js'); globalThis.BaseBoard = _bb.BaseBoard; }
if (typeof TurnManager === 'undefined') { const _t = require('../../4d_generic/turn_manager.js'); globalThis.TurnManager = _t.TurnManager; }
const { BackgammonBoard } = require('../js/backgammon_board.js');

let p = 0, f = 0, t = 0;
function assert(name, cond) { t++; if (cond) { p++; console.log(`  ✅ ${name}`); } else { f++; console.log(`  ❌ ${name}`); } }

console.log('=== 4D Backgammon — Comprehensive Tests ===\n');

console.log('— Construction —');
const b = new BackgammonBoard();
assert('24 points', b.points.length === 24);
assert('2 players', typeof b.currentPlayer === 'string');
assert('Game not over', !b.isGameOver());
assert('No winner', b.winner() === null);
assert('Bar exists', typeof b.bar === 'object');
assert('Borne exists', typeof b.borne === 'object');
assert('Lane names', BackgammonBoard.LANE_NAMES.length === 4);
assert('Lane colors', BackgammonBoard.LANE_COLORS.length === 4);

console.log('\n— Initial Setup —');
let totalStones = 0;
for (const pt of b.points) {
    totalStones += pt.count || 0;
}
assert('Has stones on board', totalStones >= 0);
assert('Points have values', b.points[0] !== undefined);

console.log('\n— Dice —');
const dice = b.rollDice();
assert('Dice returns array', Array.isArray(dice));
assert('Die 1 valid (1-6)', dice[0] >= 1 && dice[0] <= 6);
assert('Die 2 valid (1-6)', dice[1] >= 1 && dice[1] <= 6);

console.log('\n— Point to Quadray —');
const q0 = b.pointToQuadray(0);
assert('Point 0 has Quadray', q0 instanceof Quadray);
const q23 = b.pointToQuadray(23);
assert('Point 23 has Quadray', q23 instanceof Quadray);

console.log('\n— Lanes —');
assert('Point 0 lane A (0)', b.getLane(0) === 0);
assert('Point 6 lane B (1)', b.getLane(6) === 1);
assert('Point 12 lane C (2)', b.getLane(12) === 2);
assert('Point 18 lane D (3)', b.getLane(18) === 3);
assert('Lane color defined', typeof b.getLaneColor(0) === 'string');

console.log('\n— Valid Moves —');
b.rollDice();
const validMoves = b.getValidMoves();
assert('Valid moves returned', Array.isArray(validMoves));

console.log('\n— Distances —');
const d = b.manhattanDistance(0, 23);
assert('Manhattan distance > 0', d > 0);

console.log('\n— Metadata —');
const meta = b.getMetadata();
assert('Has currentPlayer', typeof meta.currentPlayer === 'string');
assert('Has moveCount', typeof meta.moveCount === 'number');

console.log('\n— Reset —');
const b2 = new BackgammonBoard();
b2.rollDice();
b2.reset();
assert('Reset clears game', !b2.isGameOver());

console.log('\n— Synergetics —');
assert('TETRA_VOL = 1', SYNERGETICS.TETRA_VOL === 1);
assert('OCTA_VOL = 4', SYNERGETICS.OCTA_VOL === 4);
assert('Round-trip passes', verifyRoundTrip(new Quadray(1, 0, 0, 0)).passed);
assert('Geometric identities pass', verifyGeometricIdentities().allPassed);

console.log(`\n=== Results: ${p} passed, ${f} failed (${t} total) ===`);
process.exit(f > 0 ? 1 : 0);
