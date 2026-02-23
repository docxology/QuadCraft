/**
 * test_reversi.js — Comprehensive Tests for 4D Reversi
 * Run: node tests/test_reversi.js
 */
if (typeof Quadray === 'undefined') { const _q = require('../../4d_generic/quadray.js'); globalThis.Quadray = _q.Quadray; }
if (typeof GridUtils === 'undefined') { const _g = require('../../4d_generic/grid_utils.js'); globalThis.GridUtils = _g.GridUtils; }
if (typeof SYNERGETICS === 'undefined') { const _s = require('../../4d_generic/synergetics.js'); globalThis.SYNERGETICS = _s.SYNERGETICS; globalThis.angleBetweenQuadrays = _s.angleBetweenQuadrays; globalThis.verifyRoundTrip = _s.verifyRoundTrip; globalThis.verifyGeometricIdentities = _s.verifyGeometricIdentities; }
if (typeof BaseBoard === 'undefined') { const _bb = require('../../4d_generic/base_board.js'); globalThis.BaseBoard = _bb.BaseBoard; }
const { ReversiBoard, ReversiColor } = require('../js/reversi_board.js');

let p = 0, f = 0, t = 0;
function assert(name, cond) { t++; if (cond) { p++; console.log(`  ✅ ${name}`); } else { f++; console.log(`  ❌ ${name}`); } }

console.log('=== 4D Reversi — Comprehensive Tests ===\n');

console.log('— Construction —');
const b = new ReversiBoard(4);
assert('Size = 4', b.size === 4);
assert('Grid exists', b.grid instanceof Map);
assert('Game not over', !b.gameOver);
assert('BLACK defined', ReversiColor.BLACK === 'black');
assert('WHITE defined', ReversiColor.WHITE === 'white');

console.log('\n— Initial Setup —');
const blackCount = b.count(ReversiColor.BLACK);
const whiteCount = b.count(ReversiColor.WHITE);
assert('Black has 2 initial', blackCount === 2);
assert('White has 2 initial', whiteCount === 2);
assert('Total 4 discs', blackCount + whiteCount === 4);

console.log('\n— Valid Moves —');
const blackMoves = b.getValidMoves(ReversiColor.BLACK);
assert('Black has valid moves', blackMoves.length > 0);
assert('Moves have pos', typeof blackMoves[0].pos === 'object');
assert('Moves have flips', Array.isArray(blackMoves[0].flips));

console.log('\n— Placement —');
const b2 = new ReversiBoard(4);
const moves = b2.getValidMoves(ReversiColor.BLACK);
if (moves.length > 0) {
    const result = b2.place(moves[0].pos, ReversiColor.BLACK);
    assert('Place succeeds', result);
    assert('Black increases', b2.count(ReversiColor.BLACK) > 2);
    assert('Move recorded', b2.moveCount >= 1);
}

console.log('\n— AI Opponent —');
const bAI = new ReversiBoard(4);
const aiResult = bAI.aiMove(ReversiColor.BLACK);
assert('AI returns result', aiResult !== null);
assert('AI has pos', typeof aiResult.pos === 'object');
assert('AI has flips', typeof aiResult.flips === 'number');
assert('Black increased after AI', bAI.count(ReversiColor.BLACK) > 2);
const countBefore = bAI.count(ReversiColor.WHITE);
const aiResult2 = bAI.aiMove(ReversiColor.WHITE);
if (aiResult2) assert('White AI moves', bAI.count(ReversiColor.WHITE) > countBefore);

console.log('\n— Invalid placement —');
const b3 = new ReversiBoard(4);
// Place on occupied
const occupied = b3.allPositions().find(p => b3.getCell(p) !== null);
if (occupied) assert('Cannot place on occupied', !b3.place(occupied, ReversiColor.BLACK));

console.log('\n— Grid —');
assert('Grid is Map', b3.grid instanceof Map);

console.log('\n— All Positions —');
const allPos = b.allPositions();
assert('256 positions (4^4)', allPos.length === 256);

console.log('\n— Distances —');
const p1 = new Quadray(0, 0, 0, 0);
const p2 = new Quadray(2, 2, 2, 2);
assert('Manhattan > 0', b.manhattanDistance(p1, p2) > 0);
assert('Euclidean > 0', b.euclideanDistance(p1, p2) > 0);

console.log('\n— Metadata —');
const meta = b.getMetadata();
assert('Has blackCount', typeof meta.blackCount === 'number');
assert('Has whiteCount', typeof meta.whiteCount === 'number');
assert('Has moveCount', typeof meta.moveCount === 'number');

console.log('\n— Reset —');
b2.reset();
assert('Reset clears moves', b2.moveCount === 0);
assert('Reset restores initial', b2.count(ReversiColor.BLACK) === 2);
assert('Reset clears gameOver', !b2.gameOver);

console.log('\n— Synergetics —');
assert('TETRA_VOL = 1', SYNERGETICS.TETRA_VOL === 1);
assert('OCTA_VOL = 4', SYNERGETICS.OCTA_VOL === 4);
assert('Round-trip passes', verifyRoundTrip(new Quadray(1, 0, 0, 0)).passed);
assert('Geometric identities pass', verifyGeometricIdentities().allPassed);

console.log(`\n=== Results: ${p} passed, ${f} failed (${t} total) ===`);
process.exit(f > 0 ? 1 : 0);
