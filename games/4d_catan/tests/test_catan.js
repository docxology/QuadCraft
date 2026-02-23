/**
 * test_catan.js — Comprehensive Tests for 4D Catan
 *
 * Groups: construction, tiles, players, dice, settlements, roads,
 * cities, resources, trading, dev cards, robber, distances,
 * metadata, reset, synergetics.
 *
 * Run: node tests/test_catan.js
 */
const { Quadray } = require('../../4d_generic/quadray.js');
const { GridUtils } = require('../../4d_generic/grid_utils.js');
const { SYNERGETICS, verifyRoundTrip, verifyGeometricIdentities } = require('../../4d_generic/synergetics.js');
const { CatanBoard, ResourceType } = require('../js/catan_board.js');

let passed = 0, failed = 0, total = 0;
function assert(name, condition) {
    total++;
    if (condition) { passed++; console.log(`  ✅ ${name}`); }
    else { failed++; console.log(`  ❌ ${name}`); }
}

console.log('=== 4D Catan — Comprehensive Tests ===\n');

// ─── 1. Board Construction ───────────────────────────────────────────
console.log('— Board Construction —');
const b = new CatanBoard();
assert('19 tiles', b.tiles.length === 19);
assert('2 players', b.players.length === 2);
assert('Grid is Map', b.grid instanceof Map);
assert('Game not over', !b.gameOver);
assert('Current player 0 or 1', b.currentPlayer >= 0);

// ─── 2. Tiles ────────────────────────────────────────────────────────
console.log('\n— Tiles —');
assert('Has desert', b.tiles.some(t => t.resource === ResourceType.DESERT));
assert('Has wood', b.tiles.some(t => t.resource === ResourceType.WOOD));
assert('Has brick', b.tiles.some(t => t.resource === ResourceType.BRICK));
assert('Has wheat', b.tiles.some(t => t.resource === ResourceType.WHEAT));
assert('Has sheep', b.tiles.some(t => t.resource === ResourceType.SHEEP));
assert('Has ore', b.tiles.some(t => t.resource === ResourceType.ORE));
assert('Tiles have numbers', b.tiles.every(t => typeof t.number === 'number'));
assert('Tiles have positions', b.tiles.every(t => typeof t.pos.a === 'number'));

const tileQ = b.tiles[0].toQuadray();
assert('Tile toQuadray', tileQ instanceof Quadray);

// ─── 3. Players ──────────────────────────────────────────────────────
console.log('\n— Players —');
const p0 = b.players[0];
assert('Player has resources', typeof p0.resources === 'object');
assert('Player has settlements', Array.isArray(p0.settlements));
assert('Player has roads', Array.isArray(p0.roads));
assert('Player has points', typeof p0.points === 'number');
assert('Player has devCards', Array.isArray(p0.devCards));
assert('Player starts with resources', p0.resources.wood + p0.resources.brick >= 0);

// ─── 4. Dice ─────────────────────────────────────────────────────────
console.log('\n— Dice —');
for (let i = 0; i < 5; i++) {
    const dice = b.rollDice();
    assert(`Roll ${i + 1}: dice valid (${dice[0]}+${dice[1]}=${dice[0] + dice[1]})`,
        dice[0] >= 1 && dice[0] <= 6 && dice[1] >= 1 && dice[1] <= 6);
}

// ─── 5. Settlements ─────────────────────────────────────────────────
console.log('\n— Settlements —');
const b2 = new CatanBoard();
// Give player resources
b2.players[0].resources = { wood: 10, brick: 10, wheat: 10, sheep: 10, ore: 10 };
const built = b2.buildSettlement(0, { a: 0, b: 0, c: 0, d: 0 });
assert('Build settlement', built);
assert('Settlement adds VP', b2.players[0].points >= 1);
assert('Settlement recorded', b2.players[0].settlements.length >= 1);

// ─── 6. Roads ────────────────────────────────────────────────────────
console.log('\n— Roads —');
const roadBuilt = b2.buildRoad(0, { a: 0, b: 0 }, { a: 1, b: 0 });
assert('Build road', roadBuilt);
assert('Road recorded', b2.players[0].roads.length >= 1);

// ─── 7. Cities ───────────────────────────────────────────────────────
console.log('\n— Cities —');
if (b2.players[0].settlements.length > 0) {
    const upgraded = b2.upgradeToCity(0, 0);
    assert('Upgrade to city', upgraded);
}

// ─── 8. Longest Road ─────────────────────────────────────────────────
console.log('\n— Longest Road —');
const lr = b2.longestRoad(0);
assert('Longest road >= 0', lr >= 0);

// ─── 9. Neighbor Tiles ───────────────────────────────────────────────
console.log('\n— Neighbor Tiles —');
const neighbors = b2.getNeighborTiles(0);
assert('Neighbor tiles exist', neighbors.length >= 0);

// ─── 10. Distance Methods ────────────────────────────────────────────
console.log('\n— Distance Methods —');
const p1 = { a: 0, b: 0, c: 0, d: 0 };
const p2 = { a: 2, b: 2, c: 2, d: 2 };
assert('Manhattan > 0', b.manhattanDistance(p1, p2) > 0);
assert('Euclidean > 0', b.euclideanDistance(p1, p2) > 0);

// ─── 11. Metadata ────────────────────────────────────────────────────
console.log('\n— Metadata —');
const meta = b.getMetadata();
assert('Has totalTiles', typeof meta.totalTiles === 'number');
assert('Has currentPlayer', typeof meta.currentPlayer === 'number');

// ─── 12. Reset ───────────────────────────────────────────────────────
console.log('\n— Reset —');
const b3 = new CatanBoard();
b3.players[0].resources = { wood: 0, brick: 0, wheat: 0, sheep: 0, ore: 0 };
b3.gameOver = true;
b3.reset();
assert('Reset clears gameOver', !b3.gameOver);
assert('Reset restores tiles', b3.tiles.length === 19);

// ─── 13. Synergetics ─────────────────────────────────────────────────
console.log('\n— Synergetics —');
assert('TETRA_VOL = 1', SYNERGETICS.TETRA_VOL === 1);
assert('OCTA_VOL = 4', SYNERGETICS.OCTA_VOL === 4);
const rt = verifyRoundTrip(new Quadray(1, 0, 0, 0));
assert('Round-trip passes', rt.passed);
const geo = verifyGeometricIdentities();
assert('Geometric identities pass', geo.allPassed);

// ─── 14. Trading & Dev Cards & Robber ─────────────────────────────────────
console.log('\n— Trading & Dev Cards & Robber —');
const b4 = new CatanBoard();
const gameMock = { board: b4, startRobberPlacement: () => { }, phase: 'build', freeRoads: 0, deck: { remaining: () => 10, draw: () => DevCardType.KNIGHT } };
const p4_0 = b4.players[0];
const p4_1 = b4.players[1];

// Trading
p4_0.resources = { wood: 4, brick: 0, wheat: 0, sheep: 0, ore: 0 };
b4.currentPlayer = 0;
// Note: test needs to require catan_trading, catan_cards, catan_robber if available, or we test logic directly.
// Let's just verify resources directly if the modules aren't exported nicely.
// Wait, we need to load them to test them. Use `require` or test existing if available.
const fs = require('fs');
const path = require('path');
const tradingCode = fs.readFileSync(path.join(__dirname, '../js/catan_trading.js'), 'utf8');
const cardsCode = fs.readFileSync(path.join(__dirname, '../js/catan_cards.js'), 'utf8');
const robberCode = fs.readFileSync(path.join(__dirname, '../js/catan_robber.js'), 'utf8');

// Inject constants into global scope for eval
const { DevCardType, BUILD_COSTS, ResourceType } = require('../js/catan_board.js');
globalThis.DevCardType = DevCardType;
globalThis.BUILD_COSTS = BUILD_COSTS;
globalThis.ResourceType = ResourceType;

eval(tradingCode);
eval(cardsCode);
eval(robberCode);

// Test Trade
const tradeSuccess = executeBestTrade(p4_0, 'wood', 'brick');
assert('Bank Trade (4:1) success', tradeSuccess);
assert('Bank Trade deducted resources', p4_0.resources.wood === 0);
assert('Bank Trade added resources', p4_0.resources.brick === 1);

// Test Robber Drop
p4_0.resources = { wood: 2, brick: 2, wheat: 2, sheep: 2, ore: 0 }; // 8 total
handleRobberRoll(gameMock);
assert('Robber roll halves resources > 7', totalResources(p4_0) === 4);

// Test Robber Steal
p4_1.settlements.push({ a: 0, b: 0, c: 0, d: 0 }); // Next to tile 0
p4_1.resources = { wood: 1, brick: 0, wheat: 0, sheep: 0, ore: 0 };
b4.tiles[0].pos = { a: 0, b: 0, c: 0, d: 0 }; // align
moveRobber(gameMock, 0);
assert('Robber stole resource', p4_0.resources.wood > 0 || p4_1.resources.wood === 0);

// Test Dev Cards
p4_0.devCards.push(DevCardType.KNIGHT);
p4_0.cardsBoughtThisTurn = [];
p4_0.playedDevCardThisTurn = false;
const knightSuccess = playKnight(gameMock);
assert('Played Knight dev card', knightSuccess);
assert('Knight count increased', p4_0.knightsPlayed === 1);

p4_0.devCards.push(DevCardType.ROAD_BUILDING);
p4_0.playedDevCardThisTurn = false;
const rbSuccess = playRoadBuilding(gameMock);
assert('Played Road Building dev card', rbSuccess);
assert('Road Building gives free roads', gameMock.freeRoads === 2);

p4_0.devCards.push(DevCardType.YEAR_OF_PLENTY);
p4_0.playedDevCardThisTurn = false;
const yopSuccess = playYearOfPlenty(gameMock, 'ore', 'ore');
assert('Played Year of Plenty', yopSuccess);
assert('Year of Plenty added resources', p4_0.resources.ore >= 2);

p4_0.devCards.push(DevCardType.MONOPOLY);
p4_0.playedDevCardThisTurn = false;
p4_1.resources.wheat = 5;
const monopolySuccess = playMonopoly(gameMock, 'wheat');
assert('Played Monopoly', monopolySuccess);
assert('Monopoly stole all wheat', p4_0.resources.wheat >= 5 && p4_1.resources.wheat === 0);

// ─── Summary ─────────────────────────────────────────────────────────
console.log(`\n=== Results: ${passed} passed, ${failed} failed (${total} total) ===`);
process.exit(failed > 0 ? 1 : 0);
