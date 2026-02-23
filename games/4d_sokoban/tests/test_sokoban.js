/**
 * test_sokoban.js — Unit tests for 4D Sokoban
 */
if (typeof Quadray === 'undefined') { const _q = require('../../4d_generic/quadray.js'); globalThis.Quadray = _q.Quadray; }
if (typeof GridUtils === 'undefined') { const _g = require('../../4d_generic/grid_utils.js'); globalThis.GridUtils = _g.GridUtils; }
if (typeof SYNERGETICS === 'undefined') { const _s = require('../../4d_generic/synergetics.js'); globalThis.SYNERGETICS = _s.SYNERGETICS; globalThis.verifyRoundTrip = _s.verifyRoundTrip; globalThis.verifyGeometricIdentities = _s.verifyGeometricIdentities; }
if (typeof BaseBoard === 'undefined') { const _bb = require('../../4d_generic/base_board.js'); globalThis.BaseBoard = _bb.BaseBoard; }
const { SokobanBoard, CELL } = require('../js/sokoban_board.js');

let passed = 0, failed = 0;
function assert(cond, msg) { if (cond) { passed++; console.log(`  ✅ ${msg}`); } else { failed++; console.error(`  ❌ ${msg}`); } }

console.log('\n=== SokobanBoard Construction ===');
{ const b = new SokobanBoard(5); assert(b.size === 5, 'Size is 5'); assert(b.player !== null, 'Player placed'); assert(b.boxes.length > 0, 'Boxes placed'); assert(b.goals.length === b.boxes.length, 'Goals match boxes'); assert(b.moveCount === 0, 'Moves start at 0'); assert(!b.won, 'Not won'); }

console.log('\n=== CELL Types ===');
{ assert(CELL.EMPTY === 0, 'EMPTY = 0'); assert(CELL.WALL === 1, 'WALL = 1'); assert(CELL.BOX === 2, 'BOX = 2'); assert(CELL.GOAL === 3, 'GOAL = 3'); }

console.log('\n=== Player Movement ===');
{ const b = new SokobanBoard(5); const oldPlayer = { ...b.player }; let moved = false; for (let d = 0; d < 12; d++) { if (b.move(d)) { moved = true; break; } } assert(moved, 'Player can move in at least one direction'); assert(b.moveCount === 1, 'Move count incremented'); }

console.log('\n=== Invalid Direction ===');
{ const b = new SokobanBoard(5); assert(!b.move(-1), 'Negative direction rejected'); assert(!b.move(12), 'Direction 12 rejected'); assert(!b.move(100), 'Direction 100 rejected'); }

console.log('\n=== 12 IVM Directions ===');
{ assert(GridUtils.DIRECTIONS.length === 12, 'Uses 12 IVM directions'); for (const d of GridUtils.DIRECTIONS) { const s = [...d].sort().join(','); assert(s === '0,1,1,2', `Direction [${d}] is perm of (0,1,1,2)`); } }

console.log('\n=== Metadata ===');
{ const b = new SokobanBoard(5); const m = b.getMetadata(); assert(typeof m.moveCount === 'number', 'Has moveCount'); assert(typeof m.pushCount === 'number', 'Has pushCount'); assert(typeof m.boxesOnGoals === 'number', 'Has boxesOnGoals'); assert(typeof m.totalBoxes === 'number', 'Has totalBoxes'); }

console.log('\n=== Reset ===');
{ const b = new SokobanBoard(5); b.move(0); b.reset(); assert(b.moveCount === 0, 'Reset clears moves'); assert(!b.won, 'Reset clears win'); }

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
