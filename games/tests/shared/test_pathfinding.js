/**
 * test_pathfinding.js — Tests for QuadrayPathfinder module
 *
 * Tests: BFS, A* shortest path, flood fill, line of sight, cellsInRange.
 * Run: node games/tests/test_pathfinding.js
 */
const path = require('path');

let passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) { passed++; console.log(`  ✅ ${msg}`); }
    else { failed++; console.error(`  ❌ ${msg}`); }
}

console.log('╔═══════════════════════════════════╗');
console.log('║   Test: Pathfinding Module        ║');
console.log('╚═══════════════════════════════════╝\n');

// Load dependencies
const { GridUtils } = require(path.join(__dirname, '..', '..', '4d_generic', 'grid_utils.js'));
global.GridUtils = GridUtils;

const { QuadrayPathfinder } = require(path.join(__dirname, '..', '..', '4d_generic', 'pathfinding.js'));

const SIZE = 6;
const always = () => true;  // all cells walkable
const walls = new Set();    // blocked cells

function isWalkable(pos) {
    return !walls.has(GridUtils.key(pos.a, pos.b, pos.c, pos.d));
}

// 1. BFS — trivial path (same cell)
console.log('▸ BFS: same cell');
const p0 = QuadrayPathfinder.bfs(
    { a: 0, b: 0, c: 0, d: 0 },
    { a: 0, b: 0, c: 0, d: 0 },
    always, SIZE
);
assert(p0 !== null && p0.length === 1, 'same cell returns length-1 path');

// 2. BFS — adjacent cell
console.log('▸ BFS: adjacent cell');
const p1 = QuadrayPathfinder.bfs(
    { a: 0, b: 0, c: 0, d: 0 },
    { a: 1, b: 0, c: 0, d: 0 },
    always, SIZE
);
assert(p1 !== null && p1.length === 2, `adjacent path length = ${p1?.length}`);

// 3. BFS — longer path
console.log('▸ BFS: longer path');
const p2 = QuadrayPathfinder.bfs(
    { a: 0, b: 0, c: 0, d: 0 },
    { a: 3, b: 0, c: 0, d: 0 },
    always, SIZE
);
assert(p2 !== null && p2.length === 4, `path length = ${p2?.length} (expected 4)`);

// 4. BFS — with walls
console.log('▸ BFS: with walls');
walls.add(GridUtils.key(1, 0, 0, 0));
walls.add(GridUtils.key(0, 1, 0, 0));
walls.add(GridUtils.key(0, 0, 1, 0));
// Path from origin must go through +D first
const p3 = QuadrayPathfinder.bfs(
    { a: 0, b: 0, c: 0, d: 0 },
    { a: 2, b: 0, c: 0, d: 0 },
    isWalkable, SIZE
);
assert(p3 !== null && p3.length > 2, `walled path found, length = ${p3?.length}`);
walls.clear();

// 5. BFS — unreachable
console.log('▸ BFS: unreachable');
// Wall off all neighbors of origin
for (const [da, db, dc, dd] of GridUtils.DIRECTIONS_8) {
    walls.add(GridUtils.key(da < 0 ? SIZE + da : da, db < 0 ? SIZE + db : db,
        dc < 0 ? SIZE + dc : dc, dd < 0 ? SIZE + dd : dd));
}
// Actually just block all bounded neighbors
const originNeighbors = GridUtils.boundedNeighbors(0, 0, 0, 0, SIZE);
originNeighbors.forEach(n => walls.add(GridUtils.key(n.a, n.b, n.c, n.d)));
const p4 = QuadrayPathfinder.bfs(
    { a: 0, b: 0, c: 0, d: 0 },
    { a: 5, b: 5, c: 5, d: 5 },
    isWalkable, SIZE
);
assert(p4 === null, 'unreachable returns null');
walls.clear();

// 6. A* — shortest path
console.log('▸ A*: shortest path');
const a1 = QuadrayPathfinder.shortestPath(
    { a: 0, b: 0, c: 0, d: 0 },
    { a: 3, b: 0, c: 0, d: 0 },
    always, SIZE
);
assert(a1 !== null && a1.length === 4, `A* path length = ${a1?.length} (expected 4)`);

// 7. A* — same cell
console.log('▸ A*: same cell');
const a0 = QuadrayPathfinder.shortestPath(
    { a: 2, b: 2, c: 2, d: 2 },
    { a: 2, b: 2, c: 2, d: 2 },
    always, SIZE
);
assert(a0 !== null && a0.length === 1, 'A* same cell');

// 8. A* with cost function
console.log('▸ A*: with cost function');
const expensive = (pos) => pos.b > 0 ? 10 : 1;  // moving in B is expensive
const a2 = QuadrayPathfinder.shortestPath(
    { a: 0, b: 0, c: 0, d: 0 },
    { a: 2, b: 0, c: 0, d: 0 },
    always, SIZE, expensive
);
assert(a2 !== null, 'A* with cost fn finds path');

// 9. Flood fill
console.log('▸ floodFill: open space');
const f1 = QuadrayPathfinder.floodFill(
    { a: 2, b: 2, c: 2, d: 2 },
    always, SIZE
);
assert(f1.length === SIZE ** 4, `flood fill covers entire grid = ${f1.length}`);

// 10. Flood fill with limit
console.log('▸ floodFill: with maxCells');
const f2 = QuadrayPathfinder.floodFill(
    { a: 0, b: 0, c: 0, d: 0 },
    always, SIZE, 10
);
assert(f2.length === 10, `flood fill stopped at 10 = ${f2.length}`);

// 11. Flood fill with walls
console.log('▸ floodFill: with walls');
// Create a wall ring around origin
const neighbors = GridUtils.boundedNeighbors(0, 0, 0, 0, SIZE);
neighbors.forEach(n => walls.add(GridUtils.key(n.a, n.b, n.c, n.d)));
const f3 = QuadrayPathfinder.floodFill(
    { a: 0, b: 0, c: 0, d: 0 },
    isWalkable, SIZE
);
assert(f3.length === 1, `walled flood fill = ${f3.length} (only origin)`);
walls.clear();

// 12. Line of sight
console.log('▸ lineOfSight: open');
const los1 = QuadrayPathfinder.lineOfSight(
    { a: 0, b: 0, c: 0, d: 0 },
    { da: 1, db: 0, dc: 0, dd: 0 },
    () => false, SIZE
);
assert(los1.length === SIZE - 1, `open LoS length = ${los1.length} (expected ${SIZE - 1})`);

// 13. Line of sight — blocked
console.log('▸ lineOfSight: blocked');
const los2 = QuadrayPathfinder.lineOfSight(
    { a: 0, b: 0, c: 0, d: 0 },
    { da: 1, db: 0, dc: 0, dd: 0 },
    (pos) => pos.a === 3,  // wall at a=3
    SIZE
);
assert(los2.length === 2, `blocked LoS length = ${los2.length} (expected 2: a=1,a=2)`);

// 14. Line of sight — maxRange
console.log('▸ lineOfSight: maxRange');
const los3 = QuadrayPathfinder.lineOfSight(
    { a: 0, b: 0, c: 0, d: 0 },
    { da: 1, db: 0, dc: 0, dd: 0 },
    () => false, SIZE, 2
);
assert(los3.length === 2, `range-limited LoS = ${los3.length}`);

// 15. cellsInRange
console.log('▸ cellsInRange()');
const inRange = QuadrayPathfinder.cellsInRange(
    { a: 2, b: 2, c: 2, d: 2 }, 1, SIZE
);
assert(inRange.length === 8, `cells in range 1 = ${inRange.length} (expected 8 IVM neighbors)`);

// 16. cellsInRange — larger
console.log('▸ cellsInRange: range 2');
const inRange2 = QuadrayPathfinder.cellsInRange(
    { a: 3, b: 3, c: 3, d: 3 }, 2, SIZE
);
assert(inRange2.length > 8, `cells in range 2 = ${inRange2.length} (expected > 8)`);
// All should be within range
const allInRange = inRange2.every(p => {
    const d = Math.abs(p.a - 3) + Math.abs(p.b - 3) + Math.abs(p.c - 3) + Math.abs(p.d - 3);
    return d <= 2 && d > 0;
});
assert(allInRange, 'all cells within manhattan distance 2');

// Cleanup
delete global.GridUtils;

console.log(`\n${'─'.repeat(36)}`);
console.log(`Pathfinding: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
