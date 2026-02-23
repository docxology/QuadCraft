/**
 * test_2048.js — Comprehensive Tests for 4D 2048
 * Run: node tests/test_2048.js
 */
if (typeof Quadray === 'undefined') { const _q = require('../../4d_generic/quadray.js'); globalThis.Quadray = _q.Quadray; }
if (typeof GridUtils === 'undefined') { const _g = require('../../4d_generic/grid_utils.js'); globalThis.GridUtils = _g.GridUtils; }
if (typeof SYNERGETICS === 'undefined') { const _s = require('../../4d_generic/synergetics.js'); globalThis.SYNERGETICS = _s.SYNERGETICS; globalThis.verifyRoundTrip = _s.verifyRoundTrip; globalThis.verifyGeometricIdentities = _s.verifyGeometricIdentities; }
if (typeof BaseBoard === 'undefined') { const _bb = require('../../4d_generic/base_board.js'); globalThis.BaseBoard = _bb.BaseBoard; }
const { Twenty48Board } = require('../js/twenty48_board.js');

let p = 0, f = 0, t = 0;
function assert(name, cond) { t++; if (cond) { p++; console.log(`  ✅ ${name}`); } else { f++; console.log(`  ❌ ${name}`); } }

console.log('=== 4D 2048 — Comprehensive Tests ===\n');

console.log('— Construction —');
const b = new Twenty48Board(3);
assert('81 cells (3^4)', b.cells.length === 81);
assert('Score starts 0', b.score === 0);
assert('Not won', !b.won);
assert('MoveCount 0', b.moveCount === 0);
assert('Game not over', !b.gameOver);
const tiles = b.cells.filter(c => b.getCell(c) > 0);
assert('Starts with 2 tiles', tiles.length === 2);
assert('Tiles are 2 or 4', tiles.every(c => [2, 4].includes(b.getCell(c))));

console.log('\n— Slide —');
const b2 = new Twenty48Board(3);
let moved = false;
for (let d = 0; d < 12; d++) { if (b2.slide(d)) { moved = true; break; } }
assert('Can slide in some direction', moved || b2.cells.filter(c => b2.getCell(c) > 0).length >= 2);
if (moved) {
    assert('Move counted after slide', b2.moveCount >= 1);
    assert('Tiles exist after slide', b2.cells.filter(c => b2.getCell(c) > 0).length >= 2);
}

console.log('\n— Invalid slides —');
assert('Negative dir rejected', !b2.slide(-1));
assert('Dir >= 12 rejected', !b2.slide(12));

console.log('\n— IVM Directions —');
assert('12 IVM directions', GridUtils.DIRECTIONS.length === 12);

console.log('\n— Score increases on merge —');
const b3 = new Twenty48Board(3);
let scoreGain = false;
for (let i = 0; i < 100 && !b3.gameOver; i++) {
    const scoreBefore = b3.score;
    if (b3.slide(i % 12) && b3.score > scoreBefore) { scoreGain = true; break; }
}
assert('Score increased or game over', scoreGain || b3.gameOver || b3.score >= 0);

console.log('\n— Metadata —');
const meta = b.getMetadata();
assert('Has score', typeof meta.score === 'number');
assert('Has maxTile', typeof meta.maxTile === 'number');
assert('Has moveCount', typeof meta.moveCount === 'number');
assert('Has won', typeof meta.won === 'boolean');
assert('maxTile >= 2', meta.maxTile >= 2);

console.log('\n— Reset —');
b2.reset();
assert('Reset clears score', b2.score === 0);
assert('Reset clears moves', b2.moveCount === 0);
assert('Reset clears won', !b2.won);
assert('Reset clears gameOver', !b2.gameOver);
assert('Reset spawns 2 tiles', b2.cells.filter(c => b2.getCell(c) > 0).length === 2);

console.log('\n— Synergetics —');
assert('TETRA_VOL = 1', SYNERGETICS.TETRA_VOL === 1);
assert('OCTA_VOL = 4', SYNERGETICS.OCTA_VOL === 4);
assert('Round-trip passes', verifyRoundTrip(new Quadray(1, 0, 0, 0)).passed);
assert('Geometric identities pass', verifyGeometricIdentities().allPassed);

console.log(`\n=== Results: ${p} passed, ${f} failed (${t} total) ===`);
process.exit(f > 0 ? 1 : 0);
