const assert = (c, m) => { if (!c) { console.error(`❌ FAILED: ${m}`); throw new Error(m); } console.log(`✅ PASSED: ${m}`); };
if (typeof require !== 'undefined') { const { Quadray } = require('../../4d_generic/quadray.js'); const { BackgammonBoard } = require('../js/backgammon_board.js'); global.Quadray = Quadray; global.BackgammonBoard = BackgammonBoard; }
function runTests() {
    console.log("Running 4D Backgammon Tests...");
    const b = new BackgammonBoard();
    const total = (c) => b.points.reduce((s, p) => s + p.filter(x => x === c).length, 0) + b.bar[c] + b.borne[c];
    assert(total('white') === 15, "White has 15 stones");
    assert(total('black') === 15, "Black has 15 stones");
    assert(b.currentPlayer === 'white', "White starts");
    const dice = b.rollDice();
    assert(dice[0] >= 1 && dice[0] <= 6, "Die 1 is 1-6");
    assert(dice[1] >= 1 && dice[1] <= 6, "Die 2 is 1-6");
    const moves = b.getValidMoves();
    assert(moves.length > 0, "Valid moves exist after roll");
    const q = b.pointToQuadray(0);
    assert(q instanceof Quadray, "Point maps to Quadray");
    assert(!b.isGameOver(), "Game not over at start");
    console.log("All 4D Backgammon tests completed!");
}
if (typeof require !== 'undefined' && require.main === module) runTests();
