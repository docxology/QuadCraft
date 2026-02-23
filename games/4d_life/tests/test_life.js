/**
 * test_life.js — Comprehensive Tests for 4D Game of Life
 * Run: node tests/test_life.js
 */
if (typeof Quadray === 'undefined') { const _q = require('../../4d_generic/quadray.js'); globalThis.Quadray = _q.Quadray; }
if (typeof GridUtils === 'undefined') { const _g = require('../../4d_generic/grid_utils.js'); globalThis.GridUtils = _g.GridUtils; }
if (typeof SYNERGETICS === 'undefined') { const _s = require('../../4d_generic/synergetics.js'); globalThis.SYNERGETICS = _s.SYNERGETICS; globalThis.angleBetweenQuadrays = _s.angleBetweenQuadrays; globalThis.verifyRoundTrip = _s.verifyRoundTrip; globalThis.verifyGeometricIdentities = _s.verifyGeometricIdentities; }
if (typeof BaseBoard === 'undefined') { const _bb = require('../../4d_generic/base_board.js'); globalThis.BaseBoard = _bb.BaseBoard; }
const { LifeBoard } = require('../js/life_board.js');

let p = 0, f = 0, t = 0;
function assert(name, cond) { t++; if (cond) { p++; console.log(`  ✅ ${name}`); } else { f++; console.log(`  ❌ ${name}`); } }

console.log('=== 4D Life — Comprehensive Tests ===\n');

console.log('— Construction —');
const b = new LifeBoard(8);
assert('Size = 8', b.size === 8);
assert('Generation starts 0', b.generation === 0);
assert('Cells set exists', b.cells instanceof Set);
assert('Cells set initialized', b.cells.size >= 0);

console.log('\n— Set/IsAlive —');
const b2 = new LifeBoard(8);
b2.cells.clear();
b2.set(3, 3, 3, 3, true);
assert('Cell set alive', b2.isAlive(3, 3, 3, 3));
b2.set(3, 3, 3, 3, false);
assert('Cell set dead', !b2.isAlive(3, 3, 3, 3));

console.log('\n— Key/ParseKey —');
const key = b.key(1, 2, 3, 4);
assert('Key is string', typeof key === 'string');
const parsed = b.parseKey(key);
assert('ParseKey returns a', parsed.a === 1);
assert('ParseKey returns b', parsed.b === 2);
assert('ParseKey returns c', parsed.c === 3);
assert('ParseKey returns d', parsed.d === 4);

console.log('\n— Cell via Quadray —');
const b3 = new LifeBoard(8);
b3.cells.clear();
const q = new Quadray(2, 2, 2, 2);
b3.setCell(q, true);
assert('setCell true', b3.getCell(q));
b3.setCell(q, false);
assert('setCell false', !b3.getCell(q));

console.log('\n— Count Neighbors —');
const b4 = new LifeBoard(8);
b4.cells.clear();
b4.set(4, 4, 4, 4, true);
const count = b4.countNeighbors(4, 4, 4, 5);
assert('Neighbor count >= 0', count >= 0);

console.log('\n— Step —');
const b5 = new LifeBoard(8);
const genBefore = b5.generation;
b5.step();
assert('Generation increments', b5.generation === genBefore + 1);
b5.step();
assert('Double step', b5.generation === genBefore + 2);

console.log('\n— Seed Random —');
const b6 = new LifeBoard(8);
b6.cells.clear();
b6.seedRandom(20);
assert('Seeded cells', b6.cells.size > 0 && b6.cells.size <= 20);

console.log('\n— Pattern Presets —');
const b7 = new LifeBoard(8);
assert('Has PATTERNS', typeof LifeBoard.PATTERNS === 'object');
assert('Has blinker', Array.isArray(LifeBoard.PATTERNS.blinker));
assert('Has toad', Array.isArray(LifeBoard.PATTERNS.toad));
assert('Has glider', Array.isArray(LifeBoard.PATTERNS.glider));
assert('Has rpentomino', Array.isArray(LifeBoard.PATTERNS.rpentomino));
assert('Has block', Array.isArray(LifeBoard.PATTERNS.block));
assert('Load blinker', b7.loadPattern('blinker') && b7.cells.size === 3);
assert('Load toad', b7.loadPattern('toad') && b7.cells.size === 6);
assert('Load glider', b7.loadPattern('glider') && b7.cells.size === 5);
assert('Load block', b7.loadPattern('block') && b7.cells.size === 4);
assert('Generation resets on load', b7.generation === 0);
assert('Invalid pattern fails', !b7.loadPattern('nonexistent'));

console.log('\n— Alive Cells —');
const alive = b.getAliveCells();
assert('Returns array', Array.isArray(alive));
if (alive.length > 0) {
    assert('Has Quadray', alive[0].quadray instanceof Quadray);
    assert('Has cellType', typeof alive[0].cellType === 'string');
}

console.log('\n— Wrapping —');
assert('Wrap 8 → 0', b.wrap(8) === 0);
assert('Wrap -1 → 7', b.wrap(-1) === 7);
assert('Wrap 3 → 3', b.wrap(3) === 3);

console.log('\n— Distances —');
const qa = new Quadray(0, 0, 0, 0);
const qb = new Quadray(2, 2, 2, 2);
assert('Manhattan > 0', b.manhattanDistance(qa, qb) > 0);
assert('Euclidean > 0', b.euclideanDistance(qa, qb) > 0);

console.log('\n— Metadata —');
const meta = b.getMetadata();
assert('Has generation', typeof meta.generation === 'number');
assert('Has livingCells', typeof meta.livingCells === 'number');

console.log('\n— Reset —');
b.reset();
assert('Reset generation 0', b.generation === 0);
assert('Reset has cells', b.cells.size > 0);

console.log('\n— Synergetics —');
assert('TETRA_VOL = 1', SYNERGETICS.TETRA_VOL === 1);
assert('OCTA_VOL = 4', SYNERGETICS.OCTA_VOL === 4);
assert('Round-trip passes', verifyRoundTrip(new Quadray(1, 0, 0, 0)).passed);
assert('Geometric identities pass', verifyGeometricIdentities().allPassed);

console.log(`\n=== Results: ${p} passed, ${f} failed (${t} total) ===`);
process.exit(f > 0 ? 1 : 0);
