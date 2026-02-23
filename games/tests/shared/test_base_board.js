/**
 * test_base_board.js — Tests for BaseBoard module
 *
 * Tests: constructor, grid operations, distance functions, angle,
 * _verifyIntegrity, getMetadata, wrap, forEachCell, DIRECTIONS.
 * Run: node games/tests/test_base_board.js
 */
const path = require('path');

let passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) { passed++; console.log(`  ✅ ${msg}`); }
    else { failed++; console.error(`  ❌ ${msg}`); }
}

console.log('╔═══════════════════════════════════╗');
console.log('║   Test: BaseBoard Module          ║');
console.log('╚═══════════════════════════════════╝\n');

// Load dependencies
const { Quadray } = require(path.join(__dirname, '..', '..', '4d_generic', 'quadray.js'));
const { GridUtils } = require(path.join(__dirname, '..', '..', '4d_generic', 'grid_utils.js'));
global.Quadray = Quadray;
global.GridUtils = GridUtils;

// Load synergetics if available
try {
    const syn = require(path.join(__dirname, '..', '..', '4d_generic', 'synergetics.js'));
    global.SYNERGETICS = syn.SYNERGETICS;
    global.angleBetweenQuadrays = syn.angleBetweenQuadrays;
    global.verifyRoundTrip = syn.verifyRoundTrip;
    global.verifyGeometricIdentities = syn.verifyGeometricIdentities;
} catch (e) {
    console.log('  ⚠ synergetics.js not loaded — some tests skipped');
}

const { BaseBoard } = require(path.join(__dirname, '..', '..', '4d_generic', 'base_board.js'));

// 1. Constructor
console.log('▸ Constructor');
const board = new BaseBoard(4, { lives: 5, level: 2, name: 'TestBoard' });
assert(board.size === 4, 'size is 4');
assert(board.lives === 5, 'lives is 5');
assert(board.level === 2, 'level is 2');
assert(board.gameOver === false, 'gameOver starts false');
assert(board.score === 0, 'score starts 0');
assert(board.grid instanceof Map, 'grid is a Map');
assert(board._boardName === 'TestBoard', 'name is TestBoard');

// 2. Key management
console.log('▸ key() / parseKey()');
const k = board.key(1, 2, 3, 4);
assert(k === '1,2,3,4', 'key generates correct string');
const p = board.parseKey(k);
assert(p.a === 1 && p.b === 2 && p.c === 3 && p.d === 4, 'parseKey round-trips');

// 3. Cell access
console.log('▸ getCell() / setCell()');
const pos = { a: 1, b: 2, c: 0, d: 0 };
assert(board.getCell(pos) === null, 'empty cell returns null');
board.setCell(pos, 'food');
assert(board.getCell(pos) === 'food', 'setCell then getCell');

// 4. inBounds
console.log('▸ inBounds()');
assert(board.inBounds({ a: 0, b: 0, c: 0, d: 0 }) === true, 'origin in bounds');
assert(board.inBounds({ a: 3, b: 3, c: 3, d: 3 }) === true, 'max corner in bounds');
assert(board.inBounds({ a: 4, b: 0, c: 0, d: 0 }) === false, 'out of bounds');
assert(board.inBounds({ a: -1, b: 0, c: 0, d: 0 }) === false, 'negative out of bounds');

// 5. Neighbors
console.log('▸ getNeighbors()');
const center = { a: 2, b: 2, c: 2, d: 2 };
const neighbors = board.getNeighbors(center);
assert(neighbors.length === 8, 'center has 8 neighbors (all in bounds)');
const edgeNeighbors = board.getNeighbors({ a: 0, b: 0, c: 0, d: 0 });
assert(edgeNeighbors.length === 4, 'origin has 4 in-bounds neighbors');

// 6. getAllNeighbors
console.log('▸ getAllNeighbors()');
const allN = board.getAllNeighbors(center);
assert(allN.length === 8, 'always 8 neighbors regardless of bounds');

// 7. Distance functions
console.log('▸ Distance functions');
const q1 = { a: 0, b: 0, c: 0, d: 0 };
const q2 = { a: 2, b: 1, c: 0, d: 0 };
const manhattan = board.manhattanDistance(q1, q2);
assert(manhattan === 3, `manhattanDistance = ${manhattan} (expected 3)`);
const euclidean = board.euclideanDistance(q1, q2);
assert(Math.abs(euclidean - Math.sqrt(5)) < 0.001, `euclideanDistance ≈ √5`);

if (typeof Quadray.distance === 'function') {
    const qr1 = new Quadray(0, 0, 0, 0);
    const qr2 = new Quadray(2, 1, 0, 0);
    const qDist = board.quadrayDistance(qr1, qr2);
    assert(typeof qDist === 'number' && qDist > 0, `quadrayDistance = ${qDist.toFixed(4)}`);
}

// 8. angleBetween
console.log('▸ angleBetween()');
if (typeof angleBetweenQuadrays === 'function') {
    const from = new Quadray(0, 0, 0, 0);
    const to1 = new Quadray(1, 0, 0, 0);
    const to2 = new Quadray(0, 1, 0, 0);
    const angle = board.angleBetween(from, to1, to2);
    assert(typeof angle === 'number' && angle > 0, `angleBetween = ${angle.toFixed(2)}°`);
} else {
    const angle = board.angleBetween({}, {}, {});
    assert(angle === 0, 'angleBetween returns 0 without synergetics');
}

// 9. Metadata
console.log('▸ getMetadata() / _baseMetadata()');
board.score = 42;
board.lives = 3;
board.level = 5;
const meta = board.getMetadata();
assert(meta.score === 42, 'metadata has score');
assert(meta.lives === 3, 'metadata has lives');
assert(meta.level === 5, 'metadata has level');
assert(meta.gameOver === false, 'metadata has gameOver');
assert(meta.size === 4, 'metadata has size');

// 10. DIRECTIONS
console.log('▸ DIRECTIONS');
assert(BaseBoard.DIRECTIONS.length === 12, '12 IVM directions');
assert(BaseBoard.DIRECTIONS[0].da === 0 && BaseBoard.DIRECTIONS[0].db === 1, 'First direction is valid');

// 11. NAMED_DIRECTIONS
console.log('▸ NAMED_DIRECTIONS');
const named = BaseBoard.NAMED_DIRECTIONS;
assert(named.length === 8, '8 named directions');
assert(named[0].name === '+A' && named[0].da === 1, 'first named direction is +A');

// 12. wrap()
console.log('▸ wrap()');
assert(board.wrap(5) === 1, 'wrap(5) on size 4 = 1');
assert(board.wrap(-1) === 3, 'wrap(-1) on size 4 = 3');
assert(board.wrap(0) === 0, 'wrap(0) = 0');

// 13. forEachCell()
console.log('▸ forEachCell()');
let cellCount = 0;
board.forEachCell(() => cellCount++);
assert(cellCount === 256, `forEachCell visits 4^4 = 256 cells (got ${cellCount})`);

// 14. generateGrid()
console.log('▸ generateGrid()');
const grid = board.generateGrid();
assert(grid.length === 256, `generateGrid returns 256 positions`);

// 15. reset()
console.log('▸ reset()');
board.score = 100;
board.gameOver = true;
board.setCell({ a: 0, b: 0, c: 0, d: 0 }, 'test');
board.reset();
assert(board.score === 0, 'score reset');
assert(board.gameOver === false, 'gameOver reset');
assert(board.grid.size === 0, 'grid cleared');

// 16. Subclass pattern
console.log('▸ Subclass pattern');
class TestBoard extends BaseBoard {
    constructor() {
        super(3, { verify: false, name: 'TestSubclass' });
        this.custom = 'hello';
    }
    getMetadata() {
        return { ...this._baseMetadata(), custom: this.custom };
    }
}
const sub = new TestBoard();
assert(sub.size === 3, 'subclass size');
assert(sub.custom === 'hello', 'subclass custom field');
const subMeta = sub.getMetadata();
assert(subMeta.custom === 'hello', 'subclass metadata merges');
assert(subMeta.score === 0, 'subclass inherits base metadata');

// Cleanup
delete global.Quadray;
delete global.GridUtils;
delete global.SYNERGETICS;
delete global.angleBetweenQuadrays;
delete global.verifyRoundTrip;
delete global.verifyGeometricIdentities;

console.log(`\n${'─'.repeat(36)}`);
console.log(`BaseBoard: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
