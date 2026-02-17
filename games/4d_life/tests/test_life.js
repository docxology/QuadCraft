const assert = (c, m) => { if (!c) { console.error(`❌ FAILED: ${m}`); throw new Error(m); } console.log(`✅ PASSED: ${m}`); };
if (typeof require !== 'undefined') {
    const { Quadray } = require('../../4d_generic/quadray.js');
    const { LifeBoard } = require('../js/life_board.js');
    global.Quadray = Quadray; global.LifeBoard = LifeBoard;
}
function runTests() {
    console.log("Running 4D Life Tests...");
    const b = new LifeBoard(8);
    assert(b.cells.size === 0, "Board starts empty");
    b.seedRandom(30);
    assert(b.cells.size > 0, "Seed populates cells");
    assert(b.generation === 0, "Generation starts at 0");
    const before = b.cells.size;
    b.step();
    assert(b.generation === 1, "Generation increments");
    // Neighbor counting
    b.cells.clear();
    b.set(0, 0, 0, 0, true);
    assert(b.isAlive(0, 0, 0, 0), "Cell is alive after set");
    assert(b.countNeighbors(0, 0, 0, 0) === 0, "Isolated cell has 0 neighbors");
    b.set(1, 0, 0, 0, true);
    assert(b.countNeighbors(0, 0, 0, 0) === 1, "Adjacent cell gives 1 neighbor");
    // Wrapping
    b.cells.clear();
    b.set(7, 7, 7, 7, true);
    assert(b.countNeighbors(0, 0, 0, 0) === 1, "Wrapping neighbor detected");
    console.log("All 4D Life tests completed!");
    if (typeof window !== 'undefined' && window.updateSummary) window.updateSummary();
}
if (typeof require !== 'undefined' && require.main === module) {
    runTests();
} else if (typeof window !== 'undefined') {
    // Run in browser
    runTests();
}
