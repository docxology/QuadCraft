const assert = (c, m) => { if (!c) { console.error(`❌ FAILED: ${m}`); throw new Error(m); } console.log(`✅ PASSED: ${m}`); };
if (typeof require !== 'undefined') {
    const { Quadray } = require('../../4d_generic/quadray.js');
    const { ReversiBoard, ReversiColor } = require('../js/reversi_board.js');
    global.Quadray = Quadray; global.ReversiBoard = ReversiBoard; global.ReversiColor = ReversiColor;
}
function runTests() {
    console.log("Running 4D Reversi Tests...");
    // Setup
    const board = new ReversiBoard(4);
    assert(board.grid.size === 4, "Initial board has 4 discs");
    assert(board.count('black') === 2, "2 black discs initially");
    assert(board.count('white') === 2, "2 white discs initially");
    // Valid moves exist
    const moves = board.getValidMoves(ReversiColor.BLACK);
    assert(moves.length > 0, "Black has valid opening moves");
    // Placement flips
    const move = moves[0];
    const before = board.count('black');
    board.place(move.pos, ReversiColor.BLACK);
    assert(board.count('black') > before, "Placing disc increases count");
    assert(board.getAt(move.pos) === 'black', "Placed disc is on board");
    // Flipped discs
    for (const f of move.flips) {
        assert(board.getAt(f) === 'black', "Flipped disc is now black");
    }
    // Directions count
    assert(ReversiBoard.DIRECTIONS.length === 80, "80 directions in 4D");
    // Board boundaries
    assert(board.isValid(new Quadray(0, 0, 0, 0)), "Origin is valid");
    assert(board.isValid(new Quadray(3, 3, 3, 3)), "Max corner is valid");
    assert(!board.isValid(new Quadray(4, 0, 0, 0)), "Out of bounds detected");
    console.log("All 4D Reversi tests completed!");
}
if (typeof require !== 'undefined' && require.main === module) runTests();
