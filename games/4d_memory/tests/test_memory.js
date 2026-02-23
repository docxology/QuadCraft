/**
 * test_memory.js — Comprehensive Tests for 4D Memory
 * Run: node tests/test_memory.js
 */
if (typeof Quadray === 'undefined') { const _q = require('../../4d_generic/quadray.js'); globalThis.Quadray = _q.Quadray; }
if (typeof GridUtils === 'undefined') { const _g = require('../../4d_generic/grid_utils.js'); globalThis.GridUtils = _g.GridUtils; }
if (typeof SYNERGETICS === 'undefined') { const _s = require('../../4d_generic/synergetics.js'); globalThis.SYNERGETICS = _s.SYNERGETICS; globalThis.verifyRoundTrip = _s.verifyRoundTrip; globalThis.verifyGeometricIdentities = _s.verifyGeometricIdentities; }
if (typeof BaseBoard === 'undefined') { const _bb = require('../../4d_generic/base_board.js'); globalThis.BaseBoard = _bb.BaseBoard; }
if (typeof TurnManager === 'undefined') { const _t = require('../../4d_generic/turn_manager.js'); globalThis.TurnManager = _t.TurnManager; }
const { MemoryBoard } = require('../js/memory_board.js');

let p = 0, f = 0, t = 0;
function assert(name, cond) { t++; if (cond) { p++; console.log(`  ✅ ${name}`); } else { f++; console.log(`  ❌ ${name}`); } }

console.log('=== 4D Memory — Comprehensive Tests ===\n');

console.log('— Construction —');
const b = new MemoryBoard(3);
assert('81 cells (3^4)', b.cells.length === 81);
assert('Moves start at 0', b.moveCount === 0);
assert('Scores start at 0', b.scores.player1 === 0 && b.scores.player2 === 0);
assert('Values map exists', b.values instanceof Map);
assert('Matched set empty', b.matched.size === 0);
assert('Game not over', !b.gameOver);

console.log('\n— Card Values —');
const vals = [...b.values.values()];
assert('Values assigned', vals.length === 81);
const nonZero = vals.filter(v => v > 0);
assert('Has card values', nonZero.length > 0);
// Pairs check
const counts = {};
for (const v of nonZero) counts[v] = (counts[v] || 0) + 1;
assert('Cards come in pairs', Object.values(counts).every(c => c === 2));

console.log('\n— Flip —');
const b2 = new MemoryBoard(3);
const card = b2.cells.find(c => b2.getValue(c) > 0);
if (card) {
    assert('Can flip card', b2.flip(card));
    assert('Flipped card revealed', b2.isRevealed(card));
    assert('Cannot re-flip', !b2.flip(card));
}

console.log('\n— Matching —');
const b3 = new MemoryBoard(3);
// Find a matching pair
let pair = null;
for (let i = 0; i < b3.cells.length && !pair; i++) {
    for (let j = i + 1; j < b3.cells.length && !pair; j++) {
        if (b3.getValue(b3.cells[i]) > 0 && b3.getValue(b3.cells[i]) === b3.getValue(b3.cells[j])) {
            pair = [b3.cells[i], b3.cells[j]];
        }
    }
}
if (pair) {
    b3.flip(pair[0]);
    b3.flip(pair[1]);
    assert('Matched pair', b3.isMatched(pair[0]) && b3.isMatched(pair[1]));
    assert('Score incremented', b3.scores.player1 > 0 || b3.scores.player2 > 0);
    assert('Move counted', b3.moveCount === 1);
}

console.log('\n— Metadata —');
const meta = b.getMetadata();
assert('Has scores', typeof meta.scores === 'object');
assert('Has currentPlayer', typeof meta.currentPlayer === 'string');
assert('Has matched', typeof meta.matched === 'number');
assert('Has totalPairs', typeof meta.totalPairs === 'number');
assert('Has moveCount', typeof meta.moveCount === 'number');

console.log('\n— Reset —');
const b4 = new MemoryBoard(3);
b4.flip(b4.cells[0]);
b4.reset();
assert('Reset clears moves', b4.moveCount === 0);
assert('Reset clears scores', b4.scores.player1 === 0);
assert('Reset clears gameOver', !b4.gameOver);

console.log('\n— Synergetics —');
assert('TETRA_VOL = 1', SYNERGETICS.TETRA_VOL === 1);
assert('OCTA_VOL = 4', SYNERGETICS.OCTA_VOL === 4);
assert('Round-trip passes', verifyRoundTrip(new Quadray(1, 0, 0, 0)).passed);
assert('Geometric identities pass', verifyGeometricIdentities().allPassed);

console.log(`\n=== Results: ${p} passed, ${f} failed (${t} total) ===`);
process.exit(f > 0 ? 1 : 0);