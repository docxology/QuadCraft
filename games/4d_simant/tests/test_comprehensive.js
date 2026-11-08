/**
 * test_comprehensive.js — Comprehensive integration tests for 4D SimAnt
 *
 * Covers: Board, Combat, AI, Pheromones, Quadray integration, game lifecycle,
 * colony health, population cap, food regeneration, danger pheromones,
 * scout caste, win conditions, and morale combat.
 *
 * Run: node tests/test_comprehensive.js
 */

let passed = 0, failed = 0;
const assert = (c, m) => {
    if (!c) { failed++; console.error(`❌ FAILED: ${m}`); }
    else { passed++; console.log(`✅ PASSED: ${m}`); }
};

// --- Load all modules ---
const { Quadray } = require('../../4d_generic/quadray.js');
global.Quadray = Quadray;

const { GridUtils } = require('../../4d_generic/grid_utils.js');
global.GridUtils = GridUtils;

const { SYNERGETICS, verifyRoundTrip, verifyGeometricIdentities, angleBetweenQuadrays } = require('../../4d_generic/synergetics.js');
global.SYNERGETICS = SYNERGETICS;
global.verifyRoundTrip = verifyRoundTrip;
global.verifyGeometricIdentities = verifyGeometricIdentities;
global.angleBetweenQuadrays = angleBetweenQuadrays;

const { BaseBoard } = require('../../4d_generic/base_board.js');
global.BaseBoard = BaseBoard;

// Load game modules (order matters)
const { RedColonyAI, YellowAssistAI } = require('../js/simant_ai.js');
global.RedColonyAI = RedColonyAI;
global.YellowAssistAI = YellowAssistAI;

// Set caste/faction globals before loading combat (it uses them)
global.CASTE_QUEEN = 0;
global.CASTE_WORKER = 1;
global.CASTE_SOLDIER = 2;
global.CASTE_SCOUT = 3;
global.FACTION_YELLOW = 0;
global.FACTION_RED = 1;

const { CombatSystem } = require('../js/simant_combat.js');
global.CombatSystem = CombatSystem;

const {
    SimAntBoard, Ant, TYPE_EMPTY, TYPE_DIRT, TYPE_BEDROCK, TYPE_FOOD,
    PHERO_CHANNELS, PHERO_YELLOW_FOOD, PHERO_YELLOW_HOME, PHERO_RED_FOOD,
    PHERO_RED_HOME, PHERO_YELLOW_DANGER, PHERO_RED_DANGER, MAX_ANTS_PER_FACTION
} = require('../js/simant_board.js');
global.SimAntBoard = SimAntBoard;

console.log('\n══════════════════════════════════════');
console.log('  4D SimAnt Comprehensive Test Suite');
console.log('══════════════════════════════════════\n');

// ─── Group 1: Board Initialization ───
console.log('── Board Initialization ──');
const b = new SimAntBoard(8, { seed: 31415 });
assert(GridUtils.manhattan(b.nests[0], b.nests[1]) > 3, 'Raw nests are separated');
assert(Quadray.distance(b.queens[0].toQuadray(), b.queens[1].toQuadray()) > 3, 'Projected nests are physically separated');

// ─── Group 2: Quadray Coordinate Properties ───
console.log('\n── Quadray Coordinate Integration ──');

// toQuadray method
const ant0 = b.ants[0];
const q = ant0.toQuadray();
assert(q instanceof Quadray, `Ant.toQuadray() returns Quadray instance`);
assert(q.a === ant0.a, `toQuadray().a matches ant position`);

// ─── Group 3: Queen & Caste System ───
console.log('\n── Queen & Caste System ──');
const queens = b.ants.filter(a => a.caste === 0);
assert(queens.length === 2, `2 queens (got ${queens.length})`);
assert(b.queens[0] !== null, `Yellow queen registered`);
assert(b.queens[1] !== null, `Red queen registered`);
assert(b.queens[0].alive, `Yellow queen alive`);
assert(b.queens[1].alive, `Red queen alive`);
assert(b.queens[0].hp === 200, `Queen HP is 200`);
assert(b.queens[0].faction === 0, `Yellow queen faction=0`);
assert(b.queens[1].faction === 1, `Red queen faction=1`);

const workers = b.ants.filter(a => a.caste === 1);
assert(workers.length === 10, `10 workers (got ${workers.length})`);
assert(workers[0].hp === 20, `Worker HP is 20`);

// ─── Group 4: Grid Operations ───
console.log('\n── Grid Operations ──');
const nestIdx = b.idx(...['a', 'b', 'c', 'd'].map(k => b.nests[0][k]));
assert(nestIdx !== -1, `Yellow nest index is valid`);
assert(b.grid[nestIdx] === TYPE_EMPTY, `Yellow nest cell is EMPTY (dug room)`);

// Out-of-bounds
assert(b.idx(-1, 0, 0, 0) === -1, `OOB returns -1`);
assert(b.idx(8, 0, 0, 0) === -1, `OOB size returns -1`);

// coords round-trip
const c = b.coords(nestIdx);
assert(['a','b','c','d'].every(k => c[k] === b.nests[0][k]), 'coords() retains the actual raw nest label');

// getCell / setCell
const testPos = { a: 1, b: 1, c: 1, d: 1 };
b.setCell(testPos, TYPE_FOOD);
assert(b.getCell(testPos) === TYPE_FOOD, `setCell/getCell round-trip`);
b.setCell(testPos, TYPE_DIRT); // restore

// ─── Group 5: Simulation Update ───
console.log('\n── Simulation Update ──');
b.update();
assert(b.tick === 1, `Tick increments to 1`);
for (let i = 0; i < 49; i++) b.update();
assert(b.tick === 50, `50 ticks completed`);

// Ants should still be alive at tick 50
const aliveAnts = b.ants.filter(a => a.alive);
assert(aliveAnts.length > 0, `Some ants still alive at tick 50 (${aliveAnts.length})`);

// ─── Group 6: Combat System ───
console.log('\n── Combat System ──');
const cb = new SimAntBoard(6);
// Place a yellow soldier near a red worker
cb.spawnAnt(3, 3, 3, 3, FACTION_YELLOW, CASTE_SOLDIER);
const yellowSoldier = cb.ants[cb.ants.length - 1];
cb.spawnAnt(3, 3, 3, 4, FACTION_RED, CASTE_WORKER);
const redWorker = cb.ants[cb.ants.length - 1];

const prevHp = redWorker.hp;
CombatSystem.resolveCombat(cb);
assert(redWorker.hp < prevHp || !redWorker.alive, `Combat deals damage (hp was ${prevHp}, now ${redWorker.hp})`);

// ─── Group 7: Red Colony AI ───
console.log('\n── Red Colony AI ──');
const aiBoard = new SimAntBoard(8);

const prevRedAnts = aiBoard.ants.filter(a => a.faction === 1).length;
const redFoodBefore = aiBoard.foodStored[1];
aiBoard.redAI.update();
const newRedAnts = aiBoard.ants.filter(a => a.faction === 1).length;
assert(newRedAnts === prevRedAnts + 1, 'Early red AI purchases one worker');
assert(aiBoard.foodStored[1] === redFoodBefore - 10, 'AI worker purchase debits ten food');
const recruited = aiBoard.ants[aiBoard.ants.length - 1];
assert(recruited.caste === CASTE_WORKER && recruited.faction === FACTION_RED &&
    GridUtils.manhattan(recruited, aiBoard.queens[1]) === 0, 'AI recruits a worker at its current queen');

// ─── Group 8: Pheromone System (6-channel) ───
console.log('\n── Pheromone System (6-channel) ──');
const pb = new SimAntBoard(6);
const testAnt = new Ant(3, 3, 3, 3, 0, 1);
pb.dropPheromone(testAnt, PHERO_YELLOW_FOOD, 10.0);
const pIdx = pb.idx(3, 3, 3, 3);
assert(pb.pheromones[pIdx * PHERO_CHANNELS + PHERO_YELLOW_FOOD] === 10.0, `Pheromone dropped at YellowFood channel`);
assert(pb.pheromones[pIdx * PHERO_CHANNELS + PHERO_YELLOW_HOME] === 0, `YellowHome channel is 0`);
assert(pb.pheromones[pIdx * PHERO_CHANNELS + PHERO_YELLOW_DANGER] === 0, `YellowDanger channel is 0`);
pb.tick = 5; // Evaporation-only event; full transport runs every ten ticks.
pb.diffusePheromones();
assert(pb.pheromones[pIdx * PHERO_CHANNELS + PHERO_YELLOW_FOOD] < 10.0, `Pheromone decays after diffusion`);
assert(pb.pheromones[pIdx * PHERO_CHANNELS + PHERO_YELLOW_FOOD] > 9.0, `Pheromone decay is gradual`);

// Danger pheromone
pb.emitDanger(3, 3, 3, 3, FACTION_YELLOW, 25.0);
assert(pb.pheromones[pIdx * PHERO_CHANNELS + PHERO_YELLOW_DANGER] === 25.0, `Danger pheromone emitted correctly`);
pb.emitDanger(3, 3, 3, 3, FACTION_RED, 15.0);
assert(pb.pheromones[pIdx * PHERO_CHANNELS + PHERO_RED_DANGER] === 15.0, `Red danger pheromone emitted correctly`);

// ─── Group 9: Synergetics Integration ───
console.log('\n── Synergetics Integration ──');
assert(typeof SYNERGETICS.S3 === 'number', `SYNERGETICS.S3 defined`);
assert(Math.abs(SYNERGETICS.S3 - 1.0606601717798212) < 0.001, `S3 constant correct`);
assert(b.cellVolumeUnit > 0, `Cell volume > 0 (${b.cellVolumeUnit})`);
assert(b.volumeRatios.tetra === 1, `Tetra volume ratio = 1`);
assert(b.volumeRatios.octa === 4, `Octa volume ratio = 4`);
assert(b.volumeRatios.cubo === 20, `Cubo volume ratio = 20`);

const geoResults = verifyGeometricIdentities();
assert(geoResults.allPassed, `All geometric identities pass (${geoResults.checks.filter(c => c.passed).length}/${geoResults.checks.length})`);

const rt = verifyRoundTrip(new Quadray(3, 3, 3, 3));
assert(rt.passed, `Round-trip passes for (3,3,3,3)`);

// ─── Group 10: Metadata & HUD Data ───
console.log('\n── Metadata & HUD ──');
const meta = b.getMetadata();
assert(meta.tick === 50, `Metadata tick = 50`);
assert(typeof meta.yellowAnts === 'number', `yellowAnts count available`);
assert(typeof meta.redAnts === 'number', `redAnts count available`);
assert(typeof meta.tunnelPercent === 'string', `tunnelPercent is formatted string`);
assert(meta.volumeRatios.tetra === 1, `Meta volume ratios correct`);
assert(typeof meta.gameOver === 'boolean', `gameOver is boolean`);
assert(typeof meta.yellowHealth === 'number', `yellowHealth is number`);
assert(typeof meta.redHealth === 'number', `redHealth is number`);
assert(meta.yellowHealth >= 0 && meta.yellowHealth <= 100, `Yellow health in 0-100 range (${meta.yellowHealth})`);
assert(typeof meta.winner === 'number', `winner field exists`);
assert(typeof meta.stats === 'object', `stats object exists`);
assert(typeof meta.foodIncome === 'object', `foodIncome exists`);
assert(meta.popCap === MAX_ANTS_PER_FACTION, `Pop cap in metadata (${meta.popCap})`);

// ─── Group 11: Reset ───
console.log('\n── Reset ──');
b.reset();
assert(b.tick === 0, `Reset: tick=0`);
assert(b.ants.length === 12, `Reset: 12 ants again`);
assert(b.foodStored[0] === 50, `Reset: food restored`);
assert(b.gameOver === false, `Reset: gameOver=false`);
assert(b.winner === -1, `Reset: winner=-1`);
assert(b.stats.yellowKills === 0, `Reset: yellowKills=0`);

// ─── Group 12: Neighbor & GridUtils Integration ───
console.log('\n── Neighbor/GridUtils Integration ──');
const neighbors = b.getNeighborCoords(3, 3, 3, 3);
assert(neighbors.length === 8 && neighbors.every(n => GridUtils.manhattan(n, {a:3,b:3,c:3,d:3}) === 1), 'Eight raw unit neighbors');
assert(neighbors.every(n => b.getNeighborCoords(n.a,n.b,n.c,n.d).some(r => r.a === 3 && r.b === 3 && r.c === 3 && r.d === 3)), 'Each movement has its reverse');

const validNeighbors = b.getNeighbors(3, 3, 3, 3);
assert(validNeighbors.length > 0, `Valid neighbors > 0`);
assert(validNeighbors.every(i => i >= 0 && i < b.volume), `All neighbor indices in bounds`);

const dist = GridUtils.manhattan({ a: 0, b: 0, c: 0, d: 0 }, { a: 1, b: 1, c: 1, d: 1 });
assert(dist === 4, `Manhattan distance (0,0,0,0)→(1,1,1,1) = 4`);

// ─── Group 13: Extended Simulation ───
console.log('\n── Extended Simulation ──');
const extBoard = new SimAntBoard(10, { seed: 9231 });
for (let i = 0; i < 200; i++) extBoard.update();
assert(extBoard.tick === 200 || extBoard.gameOver, 'Simulation reaches tick 200 or ends without stale ticks');
const extMeta = extBoard.getMetadata();
assert(extMeta.yellowAnts === extBoard.ants.filter(a => a.alive && a.faction === FACTION_YELLOW).length,
    'HUD yellow count matches surviving colony membership');
assert(extMeta.redAnts === extBoard.ants.filter(a => a.alive && a.faction === FACTION_RED).length,
    'HUD red count matches surviving colony membership');

// ─── Group 14: Food Regeneration ───
console.log('\n── Food Regeneration ──');
const regenBoard = new SimAntBoard(8, { seed: 72 });
regenBoard.grid.fill(TYPE_DIRT);
regenBoard.ants = regenBoard.queens.slice();
regenBoard.redAI = null;
regenBoard.tick = 199;
regenBoard.update(); // Actual tick-200 dispatch must generate food from dirt.
let foodAfterRegen = 0;
for (let i = 0; i < regenBoard.grid.length; i++) {
    if (regenBoard.grid[i] === TYPE_FOOD) foodAfterRegen++;
}
assert(foodAfterRegen > 0, 'Scheduled regeneration produces real food from an all-dirt board');

// ─── Group 15: Population Cap ───
console.log('\n── Population Cap ──');
const capBoard = new SimAntBoard(6);
assert(MAX_ANTS_PER_FACTION === 60, `MAX_ANTS_PER_FACTION is 60`);
assert(!capBoard.atPopCap(0), `Yellow not at pop cap initially`);
assert(!capBoard.atPopCap(1), `Red not at pop cap initially`);
assert(typeof capBoard.antCount(0) === 'number', `antCount() returns number`);
assert(capBoard.antCount(0) > 0, `Yellow has ants initially`);

// Spawn until cap
const queen = capBoard.queens[0];
let spawned = 0;
for (let i = 0; i < 100; i++) {
    const a = capBoard.spawnAnt(queen.a, queen.b, queen.c, queen.d, 0, CASTE_WORKER);
    if (a) spawned++;
}
assert(capBoard.atPopCap(0), `Yellow hits pop cap after mass spawning`);
const atCapResult = capBoard.spawnAnt(queen.a, queen.b, queen.c, queen.d, 0, CASTE_WORKER);
assert(atCapResult === null, `Spawning at cap returns null`);

// ─── Group 16: Colony Health ───
console.log('\n── Colony Health ──');
const healthBoard = new SimAntBoard(8);
const yHealth = healthBoard.colonyHealth(0);
const rHealth = healthBoard.colonyHealth(1);
assert(yHealth >= 0 && yHealth <= 100, `Yellow health valid (${yHealth})`);
assert(rHealth >= 0 && rHealth <= 100, `Red health valid (${rHealth})`);
assert(yHealth > 0, `Yellow health > 0 with queen alive`);

// Health drops to 0 if queen dies
healthBoard.queens[0].alive = false;
assert(healthBoard.colonyHealth(0) === 0, `Health = 0 when queen dead`);

// ─── Group 17: Conservative Pheromone Transport ───
console.log('\n── Conservative Pheromone Transport ──');
const diffBoard = new SimAntBoard(6, { seed: 37 });
diffBoard.grid.fill(TYPE_EMPTY);
const diffAnt = new Ant(3, 3, 3, 3, 0, 1);
diffBoard.dropPheromone(diffAnt, PHERO_YELLOW_FOOD, 50.0);
diffBoard.tick = 10;
diffBoard.diffusePheromones();
assert(Math.abs(diffBoard.fieldTotals()[0] - 49) < 1e-5, 'Transport conserves mass before explicit 2% evaporation');
assert(diffBoard.pheromones.every(v => v >= 0 && v <= 50), 'Transport preserves nonnegativity and maximum principle');

// ─── Group 18: Danger Pheromone ───
console.log('\n── Danger Pheromone ──');
const dangerBoard = new SimAntBoard(6);
dangerBoard.emitDanger(3, 3, 3, 3, FACTION_YELLOW, 20.0);
const dIdx = dangerBoard.idx(3, 3, 3, 3);
assert(dangerBoard.pheromones[dIdx * PHERO_CHANNELS + PHERO_YELLOW_DANGER] === 20.0, `Yellow danger emitted`);
assert(dangerBoard.pheromones[dIdx * PHERO_CHANNELS + PHERO_RED_DANGER] === 0, `Red danger not affected`);
dangerBoard.emitDanger(3, 3, 3, 3, FACTION_RED, 15.0);
assert(dangerBoard.pheromones[dIdx * PHERO_CHANNELS + PHERO_RED_DANGER] === 15.0, `Red danger emitted`);


// ─── Group 19: Morale Combat ───
console.log('\n── Morale Combat ──');
const moraleBoard = new SimAntBoard(6);
// Spawn cluster of yellow soldiers
for (let i = 0; i < 4; i++) {
    moraleBoard.spawnAnt(3, 3, 3, 3, FACTION_YELLOW, CASTE_SOLDIER);
}
// Spawn isolated red worker nearby
moraleBoard.spawnAnt(3, 3, 3, 4, FACTION_RED, CASTE_WORKER);
const isolatedRed = moraleBoard.ants[moraleBoard.ants.length - 1];
const hpBefore = isolatedRed.hp;
CombatSystem.resolveCombat(moraleBoard);
assert(isolatedRed.hp < hpBefore || !isolatedRed.alive, `Morale-boosted combat deals damage`);

// ─── Group 20: AI Phases ───
console.log('\n── AI Phases ──');
const phaseBoard = new SimAntBoard(8);
const ai = phaseBoard.redAI;
assert(ai.phase === 1, `AI starts in phase 1`);
// Fill with ants to trigger phase changes
phaseBoard.foodStored[1] = 1000;
for (let i = 0; i < 50; i++) {
    ai.update();
}
assert(ai.phase > 1, `AI advances past phase 1 after spawning (phase=${ai.phase})`);

// ─── Group 21: Scout Caste ───
console.log('\n── Scout Caste ──');
const scoutBoard = new SimAntBoard(6);
const sc = scoutBoard.spawnAnt(3, 3, 3, 3, FACTION_YELLOW, CASTE_SCOUT);
assert(sc !== null, `Scout spawned successfully`);
assert(sc.caste === CASTE_SCOUT, `Scout has correct caste`);
assert(sc.hp === 15, `Scout HP is 15`);
assert(sc.maxHp === 15, `Scout maxHp is 15`);

// ─── Group 22: Win Conditions ───
console.log('\n── Win Conditions ──');
const winBoard = new SimAntBoard(8);
assert(winBoard.gameOver === false, `Game not over initially`);
assert(winBoard.winner === -1, `No winner initially`);

// Kill Red queen → Yellow wins
winBoard.queens[1].alive = false;
winBoard._checkEndConditions();
assert(winBoard.gameOver === true, `Game over when Red queen dies`);
assert(winBoard.winner === 0, `Yellow wins when Red queen dies`);

// ─── Group 23: Yellow Assist AI ───
console.log('\n── Yellow Assist AI ──');
const assistB = new SimAntBoard(8);
assistB.yellowAssistEnabled = true;
const yAI = new YellowAssistAI(assistB);
const yAntsBefore = assistB.ants.filter(a => a.faction === 0).length;
const assistFoodBefore = assistB.foodStored[0];
yAI.update();
const yAntsAfter = assistB.ants.filter(a => a.faction === 0).length;
assert(yAntsAfter === yAntsBefore + 1 && assistB.foodStored[0] === assistFoodBefore - 10,
    'Yellow assist purchases one worker for ten food');
assert(assistB.ants.filter(a => a.faction === 0 && a.caste === CASTE_WORKER).slice(0,-1)
    .every(a => a.state === 'foraging'), 'Yellow assist sends existing idle workers foraging');

// ─── Group 24: Tunnel Set Tracking ───
console.log('\n── Tunnel Set Tracking ──');
const tunnelBoard = new SimAntBoard(8);
assert(tunnelBoard.tunnelSet instanceof Set, `tunnelSet is a Set`);
assert(tunnelBoard.tunnelSet.size > 0, `Tunnel set has entries from initial dig (${tunnelBoard.tunnelSet.size})`);
const nestKey = GridUtils.key(...['a', 'b', 'c', 'd'].map(k => tunnelBoard.nests[0][k]));
assert(tunnelBoard.tunnelSet.has(nestKey), `Nest position is in tunnel set`);

// ─── Group 25: Combat Statistics ───
console.log('\n── Combat Statistics ──');
const statBoard = new SimAntBoard(6);
assert(statBoard.stats.yellowKills === 0, `Initial yellow kills = 0`);
assert(statBoard.stats.redKills === 0, `Initial red kills = 0`);
assert(statBoard.stats.yellowDeaths === 0, `Initial yellow deaths = 0`);
assert(statBoard.stats.redDeaths === 0, `Initial red deaths = 0`);
assert(statBoard.stats.yellowFoodCollected === 0, `Initial yellow food collected = 0`);

// ─── Group 26: Previous Position Tracking ───
console.log('\n── Previous Position Tracking ──');
const animBoard = new SimAntBoard(8);
const testWorker = animBoard.ants.find(a => a.caste === CASTE_WORKER && a.alive);
assert(testWorker !== undefined, `Found a worker for animation test`);
assert(testWorker.prevA === testWorker.a, `prevA initialized to current position`);
const animationStart = {a:testWorker.a,b:testWorker.b,c:testWorker.c,d:testWorker.d};
animBoard.update();
assert(['a','b','c','d'].every(k => testWorker[`prev${k.toUpperCase()}`] === animationStart[k]),
    'Animation retains the full pre-decision raw position');

// ═══ Summary ═══
console.log('\n══════════════════════════════════════');
console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
console.log('══════════════════════════════════════\n');

if (failed > 0) process.exit(1);
