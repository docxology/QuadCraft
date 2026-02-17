const assert = (c, m) => { if (!c) { console.error(`❌ FAILED: ${m}`); throw new Error(m); } console.log(`✅ PASSED: ${m}`); };
if (typeof require !== 'undefined') { const { Quadray } = require('../../4d_generic/quadray.js'); const { MahjongBoard, MahjongTile } = require('../js/mahjong_board.js'); global.Quadray = Quadray; global.MahjongBoard = MahjongBoard; global.MahjongTile = MahjongTile; }
function runTests() {
    console.log("Running 4D Mahjong Tests...");
    const b = new MahjongBoard();
    assert(b.tiles.length === 144, "144 tiles on board");
    assert(b.remainingTiles() === 144, "All tiles remaining at start");
    assert(b.score === 0, "Score starts at 0");
    const exposed = b.getExposedTiles();
    assert(exposed.length > 0, "Some tiles are exposed");
    // Check pairs exist in pool
    const counts = {}; for (const t of b.tiles) { const k = `${t.suit}:${t.value}`; counts[k] = (counts[k] || 0) + 1; }
    assert(Object.values(counts).every(c => c % 2 === 0), "All tiles come in pairs");
    // Matching
    const hint = b.getHint();
    if (hint) { b.select(hint[0]); b.select(hint[1]); assert(b.score >= 10, "Matching pair scores >= 10"); assert(b.remainingTiles() === 142, "2 tiles removed"); }
    else { console.log("  (No hint available — shuffle-dependent)"); }
    console.log("All 4D Mahjong tests completed!");
}
if (typeof require !== 'undefined' && require.main === module) runTests();
