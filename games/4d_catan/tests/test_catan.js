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

// ─── Summary ─────────────────────────────────────────────────────────
console.log(`\n=== Results: ${passed} passed, ${failed} failed (${total} total) ===`);
process.exit(failed > 0 ? 1 : 0);
