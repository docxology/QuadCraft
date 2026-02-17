const assert = (c, m) => { if (!c) { console.error(`❌ FAILED: ${m}`); throw new Error(m); } console.log(`✅ PASSED: ${m}`); };
if (typeof require !== 'undefined') { const { Quadray } = require('../../4d_generic/quadray.js'); const { CatanBoard, ResourceType } = require('../js/catan_board.js'); global.Quadray = Quadray; global.CatanBoard = CatanBoard; global.ResourceType = ResourceType; }
function runTests() {
    console.log("Running 4D Catan Tests...");
    const b = new CatanBoard();
    assert(b.tiles.length === 19, "19 tiles on board");
    assert(b.players.length === 2, "2 players");
    assert(b.tiles.some(t => t.resource === ResourceType.DESERT), "Has desert tile");
    const dice = b.rollDice(); assert(dice[0] >= 1 && dice[0] <= 6, "Die 1 valid"); assert(dice[1] >= 1 && dice[1] <= 6, "Die 2 valid");
    const p = b.players[0];
    assert(b.buildSettlement(0, { a: 0, b: 0, c: 0, d: 0 }), "Can build settlement");
    assert(p.points === 1, "Settlement gives 1 VP");
    assert(p.resources.wood === 1, "Wood spent");
    assert(b.buildRoad(0, { a: 0, b: 0 }, { a: 1, b: 0 }), "Can build road");
    assert(p.resources.wood === 0, "Road costs wood");
    console.log("All 4D Catan tests completed!");
}
if (typeof require !== 'undefined' && require.main === module) runTests();
