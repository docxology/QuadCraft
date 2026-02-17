/**
 * test_minesweeper.js — Unit tests for 4D Minesweeper
 *
 * Tests IVM adjacency, mine placement, flood-fill, flagging, and win detection.
 * Run: node tests/test_minesweeper.js
 */
const { Quadray } = require('../../4d_generic/quadray.js');
const { MinesweeperBoard } = require('../js/minesweeper_board.js');

let passed = 0, failed = 0;
function assert(name, condition) {
    if (condition) { passed++; console.log(`  ✅ ${name}`); }
    else { failed++; console.log(`  ❌ ${name}`); }
}

console.log('=== 4D Minesweeper Tests ===\n');

// 1. Board creation
const board = new MinesweeperBoard(3, 0.1);
assert('Board created with size 3', board.size === 3);
assert('Total cells = 3^4 = 81', board.totalCells === 81);
assert('Game not over initially', board.gameOver === false);

// 2. IVM neighbor count — center cell (1,1,1,1) should have 80 neighbors
const neighbors = board.getNeighborKeys(1, 1, 1, 1);
assert('Center cell (1,1,1,1) has 80 neighbors', neighbors.length === 80);

// 3. Corner cell (0,0,0,0) — only neighbors with coords ≥ 0
const cornerNeighbors = board.getNeighborKeys(0, 0, 0, 0);
assert('Corner (0,0,0,0) has 15 neighbors (2^4-1)', cornerNeighbors.length === 15);

// 4. Edge cell (1,0,0,0) — 2*2*2*3 - 1 = 23 neighbors
const edgeNeighbors = board.getNeighborKeys(1, 0, 0, 0);
assert('Edge (1,0,0,0) has 23 neighbors', edgeNeighbors.length === 23);

// 5. Mine placement on first click (need larger grid so safe zone doesn't fill it)
const board2 = new MinesweeperBoard(5, 0.15);
board2.reveal(2, 2, 2, 2); // First click triggers mine placement
assert('First click reveals cell', board2.revealed.size > 0);
assert('First click cell is not a mine', !board2.mines.has(board2.key(2, 2, 2, 2)));
assert('Mines were placed', board2.mines.size > 0);

// 6. Flagging
const board3 = new MinesweeperBoard(3, 0.1);
board3.toggleFlag(0, 0, 0, 0);
assert('Flag placed', board3.flagged.has(board3.key(0, 0, 0, 0)));
board3.toggleFlag(0, 0, 0, 0);
assert('Flag removed on second toggle', !board3.flagged.has(board3.key(0, 0, 0, 0)));

// 7. Flagged cell cannot be revealed
const board4 = new MinesweeperBoard(3, 0.0);
board4.toggleFlag(0, 0, 0, 0);
const result = board4.reveal(0, 0, 0, 0);
assert('Flagged cell returns "flagged"', result === 'flagged');

// 8. Win detection — reveal all non-mine cells
const board5 = new MinesweeperBoard(2, 0.0); // size 2, no mines
board5.totalMines = 0;
board5.reveal(0, 0, 0, 0); // Should flood-fill everything
assert('Win detected with 0 mines', board5.won === true);
assert('Game over on win', board5.gameOver === true);

// 9. getCells returns proper structure
const board6 = new MinesweeperBoard(2, 0.1);
const cells = board6.getCells();
assert('getCells returns all 16 cells (2^4)', cells.length === 16);
assert('Each cell has state property', cells.every(c => typeof c.state === 'string'));
assert('Each cell has coords', cells.every(c => c.a !== undefined && c.d !== undefined));

// 10. Neighbor cache correctness
const board7 = new MinesweeperBoard(3, 0.0);
board7.mines.add(board7.key(0, 0, 0, 0));
board7.mines.add(board7.key(0, 0, 0, 1));
// Recalculate cache
board7._forEachCell((a, b, c, d) => {
    const k = board7.key(a, b, c, d);
    let cnt = 0;
    for (const nk of board7.getNeighborKeys(a, b, c, d)) {
        if (board7.mines.has(nk)) cnt++;
    }
    board7.neighborCache.set(k, cnt);
});
const adjCount = board7.neighborCache.get(board7.key(0, 0, 0, 0));
assert('Cell adjacent to mine has count ≥ 1', adjCount >= 1);
const farCount = board7.neighborCache.get(board7.key(2, 2, 2, 2));
assert('Far cell from mines has count 0', farCount === 0);

// 11. Scoring
// Revealing a safe cell should increase score.
const board8 = new MinesweeperBoard(3, 0.0);
const initialScore = board8.score;
board8.reveal(0, 0, 0, 0);
assert('Score increases after reveal', board8.score > initialScore);

// 12. Loss condition
// Hitting a mine should set game over and not set won.
const board9 = new MinesweeperBoard(2, 0.0);
// Force place a mine
board9.mines.add(board9.key(0, 0, 0, 0));
board9.firstClick = false; // Prevent mine placement logic from clearing it
const resultLoss = board9.reveal(0, 0, 0, 0);
assert('Hitting mine returns "mine"', resultLoss === 'mine');
assert('Game over after hitting mine', board9.gameOver === true);
assert('Game not won after hitting mine', board9.won === false);

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
