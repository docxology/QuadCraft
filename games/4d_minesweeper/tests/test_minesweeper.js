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
assert('65 distinct physical cells in canonical extent 3', board.totalCells === 65 &&
    new Set(board.getCells().map(c => c.quadray.toKey())).size === 65);
assert('Game not over initially', board.gameOver === false);

// Neighbor queries accept gauge-equivalent representatives of the origin.
const neighbors = board.getNeighborKeys(1, 1, 1, 1);
assert('Shifted origin has the same twelve neighbors', neighbors.length === 12 &&
    neighbors.slice().sort().join(';') === board.getNeighborKeys(0, 0, 0, 0).sort().join(';'));

// 3. Corner cell (0,0,0,0)
const cornerNeighbors = board.getNeighborKeys(0, 0, 0, 0);
assert('Corner (0,0,0,0) has neighbors', cornerNeighbors.length > 0);

// 4. Edge cell (1,0,0,0)
const edgeNeighbors = board.getNeighborKeys(1, 0, 0, 0);
assert('Edge (1,0,0,0) has neighbors', edgeNeighbors.length > 0);

// 5. Mine placement on first click (need larger grid so safe zone doesn't fill it)
const board2 = new MinesweeperBoard(5, 0.15);
board2.reveal(0, 0, 0, 0); // First click triggers mine placement
assert('First click reveals cell', board2.revealed.size > 0);
assert('First click cell is not a mine', !board2.mines.has(board2.key(0, 0, 0, 0)));
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
// Reveal all cells to trigger win
board5._forEachCell((a, b, c, d) => board5.reveal(a, b, c, d));
assert('Win detected with 0 mines', board5.won === true);
assert('Game over on win', board5.gameOver === true);

// 9. getCells returns proper structure
const board6 = new MinesweeperBoard(2, 0.1);
const cells = board6.getCells();
assert('getCells returns all 15 canonical physical cells', cells.length === 15);
assert('Each cell has state property', cells.every(c => typeof c.state === 'string'));
assert('Each cell has coords', cells.every(c => c.a !== undefined && c.d !== undefined));

// 10. Neighbor cache correctness
const board7 = new MinesweeperBoard(3, 0.0);
board7.mines.add(board7.key(0, 0, 0, 0));
board7.mines.add(board7.key(0, 1, 1, 2)); // Valid IVM neighbor
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
const farCount = board7.neighborCache.get(board7.key(0, 2, 2, 0));
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

// Reinitializing a level must regenerate only distinct physical cells.
board2.size = 3;
board2.initBoard();
assert('Regenerated level clears state and uses canonical enumeration',
    board2.totalCells === 65 && board2.mines.size === 0 && board2.revealed.size === 0 &&
    board2.getCells().every(c => Math.min(c.a, c.b, c.c, c.d) === 0));
assert('Noncanonical label cannot reveal an overlapping cell', board2.reveal(1, 1, 1, 1) === 'invalid' &&
    board2.revealed.size === 0 && board2.firstClick);
board2.toggleFlag(1, 1, 1, 1);
assert('Noncanonical label cannot create an independent flag', board2.flagged.size === 0);
board2.reveal(0, 1, 1, 2);
assert('Mine placement and cached counts cover only physical cells',
    board2.neighborCache.size === 65 && [...board2.mines].every(k => Math.min(...board2.parseKey(k)) === 0));
assert('Normalized boundary adjacency is reciprocal',
    board2.getNeighborKeys(0, 1, 1, 2).includes('1,1,0,2') &&
    board2.getNeighborKeys(1, 1, 0, 2).includes('0,1,1,2'));

// A flag in the first-click safe zone must survive automatic zero-cell flooding.
const safeFlag = new MinesweeperBoard(3, 0.1);
const flaggedNeighbor = safeFlag.key(0, 1, 1, 2);
safeFlag.toggleFlag(0, 1, 1, 2);
const originalRandom = Math.random;
try {
    Math.random = () => 0;
    safeFlag.reveal(0, 0, 0, 0);
} finally {
    Math.random = originalRandom;
}
assert('First-click flood leaves the flagged safe neighbor hidden',
    !safeFlag.mines.has(flaggedNeighbor) && safeFlag.flagged.has(flaggedNeighbor) &&
    !safeFlag.revealed.has(flaggedNeighbor) && safeFlag.getCell(new Quadray(0, 1, 1, 2)) === 'flagged');
assert('Non-loss play keeps revealed and flagged sets disjoint',
    !safeFlag.won && !safeFlag.gameOver && [...safeFlag.revealed].every(k => !safeFlag.flagged.has(k)));
const beforeFlagReveal = safeFlag.revealed.size;
assert('Flagged flooded neighbor still rejects direct reveal',
    safeFlag.reveal(0, 1, 1, 2) === 'flagged' && safeFlag.revealed.size === beforeFlagReveal);
safeFlag.toggleFlag(0, 1, 1, 2);
safeFlag.reveal(0, 1, 1, 2);
assert('Removing the flag permits revealing the safe neighbor',
    safeFlag.revealed.has(flaggedNeighbor) && !safeFlag.flagged.has(flaggedNeighbor));
assert('Score counts revealed safe cells, not skipped flags', safeFlag.score === safeFlag.revealed.size);

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
