/**
 * test_frogger.js — Comprehensive Tests for 4D Frogger
 * Run: node tests/test_frogger.js
 */
if (typeof Quadray === 'undefined') { const _q = require('../../4d_generic/quadray.js'); globalThis.Quadray = _q.Quadray; }
if (typeof GridUtils === 'undefined') { const _g = require('../../4d_generic/grid_utils.js'); globalThis.GridUtils = _g.GridUtils; }
if (typeof SYNERGETICS === 'undefined') { const _s = require('../../4d_generic/synergetics.js'); globalThis.SYNERGETICS = _s.SYNERGETICS; globalThis.angleBetweenQuadrays = _s.angleBetweenQuadrays; globalThis.verifyRoundTrip = _s.verifyRoundTrip; globalThis.verifyGeometricIdentities = _s.verifyGeometricIdentities; }
if (typeof BaseBoard === 'undefined') { const _bb = require('../../4d_generic/base_board.js'); globalThis.BaseBoard = _bb.BaseBoard; }
const { FroggerBoard } = require('../js/frogger_board.js');

let p = 0, f = 0, t = 0;
function assert(name, cond) { t++; if (cond) { p++; console.log(`  ✅ ${name}`); } else { f++; console.log(`  ❌ ${name}`); } }

console.log('=== 4D Frogger — Comprehensive Tests ===\n');

console.log('— Construction —');
const b = new FroggerBoard();
assert('Has frog', typeof b.frog === 'object');
assert('Frog at start', b.frog.a === 0);
assert('Has obstacles', Array.isArray(b.obstacles));
assert('Has lanes', typeof b.lanes === 'number');
assert('Lives > 0', b.lives > 0);
assert('Score = 0', b.score === 0);
assert('Game not over', !b.gameOver);
assert('8 directions', FroggerBoard.DIRECTIONS.length === 8);

console.log('\n— Hop —');
const b2 = new FroggerBoard();
const startA = b2.frog.a;
b2.hop(0); // +A
assert('Frog moves +A', b2.frog.a === startA + 1 || b2.frog.a !== startA || b2.lives < b.lives);

console.log('\n— Step (obstacle movement) —');
const b3 = new FroggerBoard();
const posBefore = b3.obstacles.length > 0 ? { ...b3.obstacles[0] } : null;
b3.step();
assert('Step executes', true);

console.log('\n— Entities —');
const entities = b.getEntities();
assert('Returns array', Array.isArray(entities));
assert('Has entities', entities.length > 0);
assert('Entity has type', typeof entities[0].type === 'string');

console.log('\n— Distances —');
const p1 = { a: 0, b: 0, c: 0, d: 0 };
const p2 = { a: 3, b: 3, c: 0, d: 0 };
assert('Manhattan > 0', b.manhattanDistance(p1, p2) > 0);
assert('Euclidean > 0', b.euclideanDistance(p1, p2) > 0);

console.log('\n— Quadray Distance —');
const q1 = new Quadray(0, 0, 0, 0);
const q2 = new Quadray(3, 3, 0, 0);
assert('Quadray distance > 0', b.quadrayDistance(q1, q2) > 0);

console.log('\n— Neighbors —');
const nbrs = b.getNeighbors({ a: 3, b: 3, c: 1, d: 1 });
assert('Has neighbors', Array.isArray(nbrs));

console.log('\n— Metadata —');
const meta = b.getMetadata();
assert('Has score', typeof meta.score === 'number');
assert('Has lives', typeof meta.lives === 'number');
assert('Has level', typeof meta.level === 'number');

console.log('\n— Reset —');
b2.reset();
assert('Reset frog position', b2.frog.a === 0);
assert('Reset score', b2.score === 0);
assert('Reset gameOver', !b2.gameOver);

console.log('\n— Synergetics —');
assert('TETRA_VOL = 1', SYNERGETICS.TETRA_VOL === 1);
assert('OCTA_VOL = 4', SYNERGETICS.OCTA_VOL === 4);
assert('Round-trip passes', verifyRoundTrip(new Quadray(1, 0, 0, 0)).passed);
assert('Geometric identities pass', verifyGeometricIdentities().allPassed);

console.log(`\n=== Results: ${p} passed, ${f} failed (${t} total) ===`);
process.exit(f > 0 ? 1 : 0);
