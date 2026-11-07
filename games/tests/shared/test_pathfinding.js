/** Behavioral regressions for the physical IVM graph and raw-label range APIs.
 * Run: node games/tests/shared/test_pathfinding.js
 */
const { GridUtils } = require('../../4d_generic/grid_utils.js');
global.GridUtils = GridUtils;
const { QuadrayPathfinder } = require('../../4d_generic/pathfinding.js');
let passed = 0, failed = 0;
function assert(condition, message) {
    if (condition) { passed++; console.log(`  ✅ ${message}`); }
    else { failed++; console.error(`  ❌ ${message}`); }
}
const SIZE = 5;
const origin = { a: 0, b: 0, c: 0, d: 0 };
const adjacent = { a: 2, b: 1, c: 1, d: 0 };
const goal = { a: 4, b: 0, c: 0, d: 0 };
const key = p => `${p.a},${p.b},${p.c},${p.d}`;
const always = () => true;

// Independent spatial oracle: embedding without its common 1/sqrt(2) scale.
// Kissing-sphere edges have squared length 8 in these integer XYZ units.
const xyz = p => [p.a - p.b - p.c + p.d, p.a - p.b + p.c - p.d, p.a + p.b - p.c - p.d];
function isEdge(a, b) {
    const x = xyz(a), y = xyz(b);
    return x.reduce((sum, value, i) => sum + (value - y[i]) ** 2, 0) === 8;
}
const cells = [];
for (let a = 0; a < SIZE; a++) for (let b = 0; b < SIZE; b++)
    for (let c = 0; c < SIZE; c++) for (let d = 0; d < SIZE; d++)
        if (Math.min(a, b, c, d) === 0) cells.push({ a, b, c, d });
const adjacency = new Map(cells.map(p => [key(p), cells.filter(n => isEdge(p, n))]));
function oracleDistances(start, walls = new Set()) {
    const distances = new Map([[key(start), 0]]), queue = [start];
    for (let i = 0; i < queue.length; i++) {
        const current = queue[i];
        for (const next of adjacency.get(key(current))) {
            if (walls.has(key(next)) || distances.has(key(next))) continue;
            distances.set(key(next), distances.get(key(current)) + 1);
            queue.push(next);
        }
    }
    return distances;
}
function validPath(path, start, end, walls = new Set()) {
    return path !== null && key(path[0]) === key(start) && key(path[path.length - 1]) === key(end) &&
        path.every((p, i) => !walls.has(key(p)) && (i === 0 || isEdge(path[i - 1], p)));
}
const expected = oracleDistances(origin);
assert(expected.get(key(adjacent)) === 1 && expected.get(key(goal)) === 3,
    'spatial oracle gives one-step neighbor and three-step axial target');
for (const target of [origin, adjacent, goal]) {
    const bfs = QuadrayPathfinder.bfs(origin, target, always, SIZE);
    const astar = QuadrayPathfinder.shortestPath(origin, target, always, SIZE);
    assert(validPath(bfs, origin, target) && bfs.length === expected.get(key(target)) + 1,
        `BFS shortest physical path to ${key(target)}`);
    assert(validPath(astar, origin, target) && astar.length === expected.get(key(target)) + 1,
        `A* shortest physical path to ${key(target)}`);
}

// A single raw coefficient-axis step changes the FCC coset; it is not an IVM edge.
for (let residue = 1; residue < 4; residue++) {
    const target = { a: residue, b: 0, c: 0, d: 0 };
    assert(QuadrayPathfinder.bfs(origin, target, always, SIZE) === null,
        `BFS cannot reach component-sum-mod4 class ${residue}`);
    assert(QuadrayPathfinder.shortestPath(origin, target, always, SIZE) === null,
        `A* cannot reach component-sum-mod4 class ${residue}`);
}
const filled = QuadrayPathfinder.floodFill(origin, always, SIZE);
assert(filled.length === expected.size && filled.every(p => expected.has(key(p))),
    'flood fill equals independently embedded reachable component, not size^4 labels');
assert(filled.every(p => (p.a + p.b + p.c + p.d) % 4 === 0), 'flood fill stays on origin FCC coset');
const zeroCoset = cells.filter(p => (p.a + p.b + p.c + p.d) % 4 === 0);
assert(expected.size === zeroCoset.length, 'all bounded origin-coset cells are spatially connected');
assert(QuadrayPathfinder.floodFill(origin, always, SIZE, 10).length === 10, 'flood-fill limit is exact');

// Block the unique midpoint of a straight two-step segment: shortest route must detour.
const straightGoal = { a: 4, b: 2, c: 2, d: 0 };
const walls = new Set([key(adjacent)]);
const detourDistances = oracleDistances(origin, walls);
const detour = QuadrayPathfinder.bfs(origin, straightGoal, p => !walls.has(key(p)), SIZE);
assert(validPath(detour, origin, straightGoal, walls) && detour.length === detourDistances.get(key(straightGoal)) + 1 && detour.length > 3,
    'BFS takes the shortest spatial detour around a blocked midpoint');
const ring = new Set(adjacency.get(key(origin)).map(key));
assert(QuadrayPathfinder.bfs(origin, goal, p => !ring.has(key(p)), SIZE) === null, 'blocking all twelve neighbors isolates origin');
assert(QuadrayPathfinder.floodFill(origin, p => !ring.has(key(p)), SIZE).length === 1, 'isolated flood fill contains only origin');

// Adversarial blocked map: raw Manhattan prefers the three-edge corridor via A,B
// before the two-edge route via M. All cells outside these five are walls.
const midpoint = { a: 2, b: 0, c: 1, d: 1 };
const corridorA = { a: 1, b: 0, c: 2, d: 1 };
const corridorB = { a: 3, b: 0, c: 3, d: 2 };
const corridorGoal = { a: 4, b: 0, c: 2, d: 2 };
const corridor = [origin, midpoint, corridorA, corridorB, corridorGoal];
const corridorKeys = new Set(corridor.map(key));
const corridorWalls = new Set(cells.filter(p => !corridorKeys.has(key(p))).map(key));
const corridorWalkable = p => corridorKeys.has(key(p));

// Bellman-Ford over independently embedded edges: no production neighbors,
// heuristic, or pathfinder is involved in the expected minimum-cost result.
function oracleCost(cost) {
    const distances = new Map(corridor.map(p => [key(p), Infinity]));
    distances.set(key(origin), 0);
    for (let pass = 1; pass < corridor.length; pass++) {
        for (const p of corridor) for (const n of corridor) {
            if (!isEdge(p, n)) continue;
            const candidate = distances.get(key(p)) + cost(n);
            if (candidate < distances.get(key(n))) distances.set(key(n), candidate);
        }
    }
    return distances.get(key(corridorGoal));
}
const pathCost = (route, cost) => route.slice(1).reduce((sum, p) => sum + cost(p), 0);
const unitCost = () => 1;
const corridorPath = QuadrayPathfinder.shortestPath(origin, corridorGoal, corridorWalkable, SIZE);
assert(validPath(corridorPath, origin, corridorGoal, corridorWalls) &&
    pathCost(corridorPath, unitCost) === oracleCost(unitCost) && oracleCost(unitCost) === 2,
    'A* rejects the Manhattan-attractive detour and minimizes actual blocked-map cost');
const fractionalCosts = new Map([
    [key(origin), 0], [key(midpoint), 0.02], [key(corridorA), 0.01],
    [key(corridorB), 0.04], [key(corridorGoal), 0.01],
]);
const fractionalCost = p => fractionalCosts.get(key(p));
const weightedPath = QuadrayPathfinder.shortestPath(origin, corridorGoal, corridorWalkable, SIZE, fractionalCost);
assert(validPath(weightedPath, origin, corridorGoal, corridorWalls) &&
    Math.abs(pathCost(weightedPath, fractionalCost) - oracleCost(fractionalCost)) < 1e-12,
    'Custom fractional entry costs match the independent shortest-cost oracle');
const freeCost = p => key(p) === key(midpoint) ? 0.5 : 0;
const freePath = QuadrayPathfinder.shortestPath(origin, corridorGoal, corridorWalkable, SIZE, freeCost);
assert(validPath(freePath, origin, corridorGoal, corridorWalls) &&
    pathCost(freePath, freeCost) === oracleCost(freeCost) && oracleCost(freeCost) === 0,
    'Custom zero-cost edges can make the longer physical route cheapest');

// These APIs intentionally use raw coefficient rays/ranges, not physical IVM hops.
const ray = QuadrayPathfinder.lineOfSight(origin, { da: 1, db: 0, dc: 0, dd: 0 }, () => false, SIZE);
assert(ray.length === SIZE - 1 && ray.every((p, i) => p.a === i + 1 && p.b === 0 && p.c === 0 && p.d === 0), 'raw axis ray retains label semantics');
const blockedRay = QuadrayPathfinder.lineOfSight(origin, { da: 1, db: 0, dc: 0, dd: 0 }, p => p.a === 3, SIZE);
assert(blockedRay.length === 2, 'ray excludes blocking label');
assert(QuadrayPathfinder.lineOfSight(origin, { da: 1, db: 0, dc: 0, dd: 0 }, () => false, SIZE, 2).length === 2, 'ray honors maximum range');
const center = { a: 2, b: 2, c: 2, d: 2 };
const labelRange = QuadrayPathfinder.cellsInRange(center, 1, SIZE);
assert(labelRange.length === 8 && labelRange.every(p => Math.abs(p.a - 2) + Math.abs(p.b - 2) + Math.abs(p.c - 2) + Math.abs(p.d - 2) === 1), 'raw Manhattan radius one contains eight coefficient-axis labels, not IVM neighbors');
const labelRange2 = QuadrayPathfinder.cellsInRange(center, 2, SIZE);
assert(labelRange2.length === 40 && labelRange2.every(p => {
    const d = Math.abs(p.a - 2) + Math.abs(p.b - 2) + Math.abs(p.c - 2) + Math.abs(p.d - 2);
    return d > 0 && d <= 2;
}), 'raw Manhattan radius two contains forty labels');

delete global.GridUtils;
console.log(`Pathfinding: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
