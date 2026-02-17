const assert = (c, m) => { if (!c) { console.error(`❌ FAILED: ${m}`); throw new Error(m); } console.log(`✅ PASSED: ${m}`); };
if (typeof require !== 'undefined') {
    const { Quadray } = require('../../4d_generic/quadray.js');
    const { RedColonyAI } = require('../js/simant_ai.js');
    global.Quadray = Quadray;
    global.RedColonyAI = RedColonyAI;
    const { SimAntBoard, Ant, TYPE_EMPTY, TYPE_DIRT, TYPE_FOOD } = require('../js/simant_board.js');
    global.SimAntBoard = SimAntBoard; global.Ant = Ant;
}
function runTests() {
    console.log("Running 4D SimAnt Tests...");
    const b = new SimAntBoard(8);
    // Board creates: 2 queens + 10 workers = 12 ants (5 yellow workers + 5 red workers + 2 queens)
    assert(b.ants.length === 12, `12 initial ants (got ${b.ants.length})`);
    const queens = b.ants.filter(a => a.caste === 0); // CASTE_QUEEN = 0
    assert(queens.length === 2, `2 queens (got ${queens.length})`);
    const workers = b.ants.filter(a => a.caste === 1); // CASTE_WORKER = 1
    assert(workers.length === 10, `10 workers (got ${workers.length})`);
    assert(b.nests[0] !== null, "Yellow nest exists");
    assert(b.nests[1] !== null, "Red nest exists");
    assert(b.foodStored[0] === 50, "Yellow starts with 50 food");
    assert(b.foodStored[1] === 50, "Red starts with 50 food");
    assert(b.redAI !== null, "Red AI initialized");
    b.update();
    assert(b.tick === 1, "Tick increments");
    for (let i = 0; i < 100; i++) b.update();
    assert(b.tick === 101, "Multiple ticks work");
    console.log("All 4D SimAnt tests completed!");
}
if (typeof require !== 'undefined' && require.main === module) runTests();
