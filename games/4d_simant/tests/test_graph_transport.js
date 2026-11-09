'use strict';
const assert = require('node:assert/strict');
const { ConservativeGraphField } = require('../../4d_generic/graph_field.js');
const S = require('../js/simant_board.js');
Object.assign(globalThis, S);
const { CombatSystem } = require('../js/simant_combat.js');
const { RedColonyAI, YellowAssistAI } = require('../js/simant_ai.js');
Object.assign(globalThis, { CombatSystem, RedColonyAI, YellowAssistAI });
const sum = values => values.reduce((s, v) => s + v, 0);
const near = (a, b, tolerance = 1e-10) => assert.ok(Math.abs(a - b) <= tolerance, `${a} != ${b}`);
let passed = 0, failed = 0;
function scenario(name, run) {
    try {
        run();
        passed++;
        console.log(`PASS: ${name}`);
    } catch (error) {
        failed++;
        console.error(`FAIL: ${name}: ${error.stack}`);
    }
}

// The full degree bound is retained even after masking. No in-place input mutation.
scenario('Conservative masked transport, extrema and output independence', () => {
const edges = [[0,1], [1,2], [1,3]];
const field = new ConservativeGraphField(4, edges);
assert.equal(field.maxDegree, 3);
const initial = new Float64Array([0, 12, 0, 0]);
const next = field.step(initial, 1);
assert.notEqual(initial, next);
assert.deepEqual([...initial], [0,12,0,0]);
assert.deepEqual([...next], [4,0,4,4]);
near(sum(next), sum(initial));
assert.deepEqual([...field.step(initial, 1, null, [1,1,0,0])], [4,8,0,0]);
assert.deepEqual([...field.step([3,3,3,3], 0.9)], [3,3,3,3]);
assert.deepEqual([...field.step(initial, 0)], [...initial]);
assert.deepEqual([...new ConservativeGraphField(4, edges.slice().reverse().map(([a,b]) => [b,a])).step(initial, 1)], [...next]);
assert.deepEqual([...new ConservativeGraphField(4, [...edges, [1,0]]).step(initial, 1)], [...next]);
assert.deepEqual([...new ConservativeGraphField(2, []).step([2,5], 1)], [2,5]);
assert.throws(() => field.step(initial, -0.1), RangeError);
assert.throws(() => field.step(initial, 1.01), RangeError);
assert.throws(() => field.step(initial, 0.5, initial), TypeError);
const backing = new Float64Array(5);
assert.throws(() => field.step(backing.subarray(0,4), 0.5, backing.subarray(1,5)), TypeError);
const bounded = field.step([1,7,2,9], 0.8);
assert.ok(bounded.every(v => v >= 1 && v <= 9));
near(sum(bounded), 19);
const rounded = field.step(initial, 0.8, new Float32Array(4));
assert.ok(rounded instanceof Float32Array);
near(sum(rounded), 12, 1e-6);
});

scenario('Extreme finite transport and signed binary64 midpoint rounding', () => {
const pair = new ConservativeGraphField(2, [[0, 1]]);
const initial = new Float64Array([1e308, -1e308]);
assert.deepEqual([...pair.step(initial, 0)], [...initial]);
assert.deepEqual([...pair.step(initial, 1)], [-1e308, 1e308]);
assert.deepEqual([...pair.step(initial, 0.5)], [0, 0]);
assert.deepEqual([...initial], [1e308, -1e308]);
assert.deepEqual([...pair.step([Number.MAX_VALUE, -Number.MAX_VALUE], 1)],
    [-Number.MAX_VALUE, Number.MAX_VALUE]);
// Round exact midpoints to the even significand, including signed zero,
// the subnormal/normal transition, and the largest finite values.
const tiny = Number.MIN_VALUE;
for (const sign of [1, -1]) {
    for (const [units, rounded] of [[1, 0], [3, 2], [5, 2]]) {
        assert.deepEqual([...pair.step([sign * units * tiny, 0], 0.5)],
            [sign * rounded * tiny, sign * rounded * tiny]);
    }
    const normal = 2 ** -1022;
    assert.deepEqual([...pair.step([sign * (normal - tiny), sign * normal], 0.5)],
        [sign * normal, sign * normal]);
    const belowMaximum = Number.MAX_VALUE - 2 ** 971;
    assert.deepEqual([...pair.step([sign * Number.MAX_VALUE, sign * belowMaximum], 0.5)],
        [sign * belowMaximum, sign * belowMaximum]);
}
assert.deepEqual([...pair.step([-0, tiny], 0)], [-0, tiny]);
const supplied = new Float64Array(2);
assert.equal(pair.step(initial, 1, supplied), supplied);
assert.deepEqual([...supplied], [-1e308, 1e308]);
assert.throws(() => pair.step(initial, 0, initial), TypeError);
for (const invalid of [NaN, Infinity, -Infinity]) {
    supplied.set([11, 12]);
    assert.throws(() => pair.step([1e308, invalid], 0.5, supplied), RangeError);
    assert.deepEqual([...supplied], [11, 12]);
}
assert.deepEqual([...pair.step([2, 4], 0.5)], [3, 3]);
});

scenario('High-degree convex transport survives accumulated extreme flux', () => {
// Each leaf is roundEven(magnitude * (degree - 2) / degree). These
// binary64 fixtures come from that exact rational, not an edge-flux sum.
const cases = [
    [11, Number.MAX_VALUE / 2, 7.35419918807311e307],
    [11, Number.MAX_VALUE / 2 - 2 ** 970, 7.354199188073109e307],
    [18, Number.MAX_VALUE / 2, 7.989747266054737e307],
    [18, Number.MAX_VALUE / 2 - 2 ** 970, 7.989747266054736e307],
];
for (const [degree, magnitude, leaf] of cases) {
    const edges = Array.from({length: degree}, (_, i) => [0, i + 1]);
    const star = new ConservativeGraphField(degree + 1, edges);
    for (const sign of [1, -1]) {
        const values = new Float64Array(degree + 1).fill(sign * magnitude);
        values[0] = -sign * magnitude;
        const expected = [sign * magnitude, ...Array(degree).fill(sign * leaf)];
        const supplied = new Float64Array(degree + 1);
        assert.equal(star.step(values, 1, supplied), supplied);
        assert.deepEqual([...supplied], expected);
        const reversed = new ConservativeGraphField(degree + 1,
            edges.slice().reverse().map(([a, b]) => [b, a]));
        assert.deepEqual([...reversed.step(values, 1)], expected);
        // Only one incident edge remains. Keep the full-degree coefficient:
        // the center becomes -leaf, not a full exchange with its neighbor.
        const active = new Uint8Array(degree + 1);
        active[0] = active[1] = 1;
        assert.deepEqual([...star.step(values, 1, null, active)],
            [-sign * leaf, sign * leaf, ...Array(degree - 1).fill(sign * magnitude)]);
        active.fill(0);
        assert.deepEqual([...star.step(values, 1, null, active)], [...values]);
        assert.deepEqual([...values],
            [-sign * magnitude, ...Array(degree).fill(sign * magnitude)]);
    }
}
});

scenario('Underflowing degree-12 coupling retains masked transported values', () => {
const tiny = Number.MIN_VALUE;
const edges = Array.from({length: 12}, (_, i) => [0, i + 1]);
const star = new ConservativeGraphField(14, edges); // site 13 is isolated
// Power-of-two scaling is exact here; only the final division rounds.
const transferred = (1e308 * tiny) / 12;
for (const sign of [1, -1]) {
    const values = new Float64Array(14);
    values[0] = sign * 1e308;
    values[13] = -7;
    const expected = [sign * 1e308, ...Array(12).fill(sign * transferred), -7];
    assert.deepEqual([...star.step(values, tiny)], expected);
    const reversed = new ConservativeGraphField(14, edges.slice().reverse().map(([a, b]) => [b, a]));
    assert.deepEqual([...reversed.step(values, tiny)], expected);
    const active = new Uint8Array(14);
    active[0] = active[1] = 1;
    assert.deepEqual([...star.step(values, tiny, null, active)],
        [sign * 1e308, sign * transferred, ...Array(11).fill(0), -7]);
    // Retain stored values and the full degree, not an active-degree divisor.
    active.fill(0);
    assert.deepEqual([...star.step(values, 1, null, active)], [...values]);
}
});

// Every bounded raw label is reachable, with inverse unit moves at the boundary too.
scenario('Reversible raw reachability and distinct nest geometry at bounded sizes', () => {
const board = new S.SimAntBoard(6, {seed: 2026});
const seen = new Set([0]);
const queue = [0];
for (let k = 0; k < queue.length; k++) {
    const q = board.coords(queue[k]);
    for (const n of board.getNeighbors(q.a,q.b,q.c,q.d)) {
        const r = board.coords(n);
        assert.ok(board.getNeighbors(r.a,r.b,r.c,r.d).includes(queue[k]));
        if (!seen.has(n)) { seen.add(n); queue.push(n); }
    }
}
assert.equal(seen.size, board.volume);
assert.equal(board.getNeighborCoords(2,2,2,2).length, 8);
assert.ok(GridUtils.manhattan(...board.nests) > 0);
assert.ok(Quadray.distance(...board.queens.map(q => q.toQuadray())) > 0);
for (const size of [2,3,4,8,12]) {
    const b = new S.SimAntBoard(size, {seed: 1});
    assert.ok(b.nests.every(q => b.idx(q.a,q.b,q.c,q.d) >= 0));
    assert.ok(GridUtils.manhattan(...b.nests) > 0);
    assert.ok(Quadray.distance(...b.queens.map(q => q.toQuadray())) > 0);
}
});

// Projected aliases cannot fight across raw space; distinct colocated allies count.
scenario('Combat distinguishes raw aliases and counts colocated allies by identity', () => {
const combat = new S.SimAntBoard(12, {seed: 9});
combat.ants = combat.queens.slice();
Object.assign(combat.queens[0], {a:3,b:3,c:3,d:3});
Object.assign(combat.queens[1], {a:8,b:8,c:8,d:8});
near(Quadray.distance(...combat.queens.map(q => q.toQuadray())), 0);
CombatSystem.resolveCombat(combat);
assert.deepEqual(combat.queens.map(q => q.hp), [200,200]);
const actor = combat.queens[0];
const ally = combat.spawnAnt(actor.a,actor.b,actor.c,actor.d,0,S.CASTE_WORKER);
assert.equal(CombatSystem.countAlliesNear(combat.ants, actor, 0, 0), 1);
assert.notEqual(actor, ally);
const enemy = combat.spawnAnt(actor.a+1,actor.b,actor.c,actor.d,1,S.CASTE_SOLDIER);
CombatSystem.resolveCombat(combat);
assert.ok(enemy.hp < enemy.maxHp);
});

// Isolated field event: source, cap, decay and final Float32 rounding are accounted.
scenario('Board source, saturation, evaporation and storage-rounding accounting', () => {
const mass = new S.SimAntBoard(6, {seed: 3});
mass.grid.fill(S.TYPE_EMPTY);
const source = {a:2,b:2,c:2,d:2};
mass.dropPheromone(source, 0, 120);
mass.tick = 10;
mass.diffusePheromones();
near(mass.fieldTotals()[0], 98, 1e-5);
const stats = mass.fieldStats;
near(mass.fieldTotals()[0], stats.sources[0] - stats.saturationLoss[0] - stats.evaporationLoss[0] + stats.roundingDelta[0], 1e-10);
assert.equal(stats.saturationLoss[0], 20);
assert.ok(mass.pheromones.every(v => v >= 0 && v <= 100));
});

// No transport through an inactive vertex; reopening food permeability is live.
scenario('Live permeability masks and survival below the display threshold', () => {
const mass = new S.SimAntBoard(6, {seed: 3});
mass.tick = 10;
mass.grid.fill(S.TYPE_BEDROCK);
mass.pheromones.fill(0);
const si = mass.idx(2,2,2,2), ni = mass.idx(3,2,2,2);
mass.grid[si] = S.TYPE_EMPTY;
mass.pheromones[si*6] = 10;
mass.diffusePheromones();
near(mass.pheromones[si*6], 9.8, 1e-6);
assert.equal(mass.pheromones[ni*6], 0);
mass.grid[ni] = S.TYPE_FOOD;
mass.diffusePheromones();
assert.ok(mass.pheromones[ni*6] > 0);
// No sub-threshold cutoff: small positive values survive evaporation.
mass.tick = 5;
mass.pheromones[si*6] = 0.01;
mass.diffusePheromones();
assert.ok(mass.pheromones[si*6] > 0);
});

// Cosmetic/global RNG consumption cannot affect seeded actual board evolution.
scenario('Seeded evolution and reset ignore cosmetic random consumption', () => {
const first = new S.SimAntBoard(8, {seed: 412});
const second = new S.SimAntBoard(8, {seed: 412});
for (let k = 0; k < 80; k++) {
    first.update();
    for (let j = 0; j < 20; j++) Math.random();
    second.update();
}
assert.deepEqual(first.grid, second.grid);
assert.deepEqual(first.pheromones, second.pheromones);
assert.deepEqual(first.ants, second.ants);
assert.deepEqual(first.foodStored, second.foodStored);
first.reset(); second.reset();
assert.deepEqual(first.grid, second.grid);
assert.deepEqual(first.ants, second.ants);
});

// Ended worlds ignore stale updates/combat and purchases; tactical pause allows buying.
scenario('Tactical-pause purchases and terminal-world immutability', () => {
const first = new S.SimAntBoard(8, {seed: 412});
globalThis.BaseGame = require('../../4d_generic/base_game.js').BaseGame;
const { SimAntGame } = require('../js/simant_game.js');
const context = {board: first};
context.paused = true;
const count = first.ants.length;
SimAntGame.prototype.buyUnit.call(context, 'worker');
assert.equal(first.ants.length, count+1);
first.queens[0].alive = false;
first.queens[1].alive = false;
first._checkEndConditions();
assert.equal(first.winner, -1);
const snapshot = JSON.stringify({tick:first.tick,ants:first.ants,food:first.foodStored,field:[...first.pheromones]});
first.update();
CombatSystem.resolveCombat(first);
SimAntGame.prototype.buyUnit.call(context, 'worker');
assert.equal(JSON.stringify({tick:first.tick,ants:first.ants,food:first.foodStored,field:[...first.pheromones]}), snapshot);
});
console.log(`RESULTS: ${passed} passed, ${failed} failed`);
if (failed) process.exitCode = 1;
