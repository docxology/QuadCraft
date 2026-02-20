/**
 * test_grid_utils.js — Tests for GridUtils module
 *
 * Tests: grid generation, key/parseKey, neighbors, bounds, distance, shuffle, depthSort.
 * Run: node games/tests/test_grid_utils.js
 */
const path = require('path');
const { GridUtils } = require(path.join(__dirname, '..', '..', '4d_generic', 'grid_utils.js'));

let passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) { passed++; console.log(`  ✅ ${msg}`); }
    else { failed++; console.error(`  ❌ ${msg}`); }
}

console.log('╔═══════════════════════════════════╗');
console.log('║   Test: GridUtils Module          ║');
console.log('╚═══════════════════════════════════╝\n');

// 1. DIRECTIONS_8
console.log('▸ DIRECTIONS_8');
assert(GridUtils.DIRECTIONS_8.length === 8, 'has 8 directions');
assert(GridUtils.DIRECTIONS_8[0].length === 4, 'each direction has 4 components');

// 2. generateGrid
console.log('▸ generateGrid()');
const g2 = GridUtils.generateGrid(2);
assert(g2.length === 16, 'size 2 → 16 cells (2^4)');
assert(g2[0].a === 0 && g2[0].b === 0, 'first cell is (0,0,0,0)');

const g3 = GridUtils.generateGrid(3);
assert(g3.length === 81, 'size 3 → 81 cells (3^4)');

// 3. key / parseKey
console.log('▸ key() / parseKey()');
const k = GridUtils.key(1, 2, 3, 4);
assert(k === '1,2,3,4', 'key format');
const parsed = GridUtils.parseKey(k);
assert(parsed.a === 1 && parsed.b === 2 && parsed.c === 3 && parsed.d === 4, 'parseKey roundtrip');

// 4. neighbors
console.log('▸ neighbors()');
const ns = GridUtils.neighbors(1, 1, 1, 1);
assert(ns.length === 8, '8 neighbors');
assert(ns[0].a === 2 && ns[0].b === 1, '+A neighbor correct');

// 5. inBounds
console.log('▸ inBounds()');
assert(GridUtils.inBounds(0, 0, 0, 0, 3), '(0,0,0,0) in size-3');
assert(GridUtils.inBounds(2, 2, 2, 2, 3), '(2,2,2,2) in size-3');
assert(!GridUtils.inBounds(3, 0, 0, 0, 3), '(3,0,0,0) out of size-3');
assert(!GridUtils.inBounds(-1, 0, 0, 0, 3), '(-1,0,0,0) out of bounds');

// 6. boundedNeighbors
console.log('▸ boundedNeighbors()');
const bn = GridUtils.boundedNeighbors(0, 0, 0, 0, 3);
assert(bn.length === 4, 'corner has 4 bounded neighbors');
const bn2 = GridUtils.boundedNeighbors(1, 1, 1, 1, 3);
assert(bn2.length === 8, 'center has 8 bounded neighbors');

// 7. manhattan
console.log('▸ manhattan()');
const d1 = GridUtils.manhattan({ a: 0, b: 0, c: 0, d: 0 }, { a: 1, b: 1, c: 1, d: 1 });
assert(d1 === 4, 'manhattan (0,0,0,0)→(1,1,1,1) = 4');

const d2 = GridUtils.manhattan({ a: 0, b: 0, c: 0, d: 0 }, { a: 0, b: 0, c: 0, d: 0 });
assert(d2 === 0, 'manhattan same point = 0');

// 8. euclidean
console.log('▸ euclidean()');
const e1 = GridUtils.euclidean({ a: 0, b: 0, c: 0, d: 0 }, { a: 1, b: 0, c: 0, d: 0 });
assert(Math.abs(e1 - 1.0) < 0.001, 'euclidean unit distance = 1');

const e2 = GridUtils.euclidean({ a: 0, b: 0, c: 0, d: 0 }, { a: 1, b: 1, c: 1, d: 1 });
assert(Math.abs(e2 - 2.0) < 0.001, 'euclidean diagonal = 2');

// 9. depthSort
console.log('▸ depthSort()');
const cells = [
    { a: 0, b: 0, c: 0, d: 0 },
    { a: 2, b: 2, c: 2, d: 2 },
    { a: 1, b: 1, c: 1, d: 1 },
];
const sorted = GridUtils.depthSort(cells, (a, b, c, d) => ({
    x: a + b, y: c + d, scale: a + b + c + d
}));
assert(sorted[0].pScale <= sorted[1].pScale, 'sorted by ascending pScale');
assert(sorted[1].pScale <= sorted[2].pScale, 'full sort order correct');

// 10. shuffle
console.log('▸ shuffle()');
const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const original = [...arr];
GridUtils.shuffle(arr);
assert(arr.length === 10, 'shuffle preserves length');
assert(arr.sort((a, b) => a - b).join() === original.join(), 'shuffle preserves elements');

// 11. randomCoord
console.log('▸ randomCoord()');
for (let i = 0; i < 20; i++) {
    const c = GridUtils.randomCoord(4);
    assert(c.a >= 0 && c.a < 4 && c.b >= 0 && c.b < 4 &&
        c.c >= 0 && c.c < 4 && c.d >= 0 && c.d < 4,
        `randomCoord(4) trial ${i + 1} in bounds`);
}

console.log(`\n${'─'.repeat(36)}`);
console.log(`GridUtils: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
