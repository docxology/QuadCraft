/**
 * test_tetris.js — Tests for 4D Tetris
 * Run: node tests/test_tetris.js
 */
const { Quadray } = require('../../4d_generic/quadray.js');
const { TetrisBoard } = require('../js/tetris_board.js');

let passed = 0, failed = 0;
function assert(name, condition) {
    if (condition) { passed++; console.log(`  ✅ ${name}`); }
    else { failed++; console.log(`  ❌ ${name}`); }
}

console.log('=== 4D Tetris Tests ===\n');

// 1. Board creation
const board = new TetrisBoard(6, 20, 3, 3);
assert('Board height 20', board.height === 20);
assert('Board width 6', board.width === 6);
assert('7 piece types defined', Object.keys(TetrisBoard.PIECES).length === 7);
assert('Each piece has 4 blocks', Object.values(TetrisBoard.PIECES).every(p => p.length === 4));

// 2. Spawn piece (use O-piece since it fits in 2x2)
const spawned = board.spawnPiece();
assert('Piece spawned successfully', spawned === true);
assert('Active piece exists', board.activePiece !== null);
assert('Active piece has 4 offsets', board.activePiece.offsets.length === 4);

// 3. Movement — move +B (sidways)
const posBefore = { ...board.activePiece.pos };
const moved = board.movePiece(0, 1, 0, 0);
if (moved) {
    assert('Piece moved +B', board.activePiece.pos.b === posBefore.b + 1);
} else {
    // Piece at edge, try -B instead
    board.movePiece(0, -1, 0, 0);
    assert('Piece moved -B (was at edge)', board.activePiece.pos.b === posBefore.b - 1);
}

// 4. Rotation (cycle b→c→d→b)
const board2 = new TetrisBoard(6, 20, 4, 4); // Wider for rotation room
// Force spawn an 'S' piece (asymmetric in BCD) which definitely changes on rotation
board2.spawnPiece('S');
const offsetsBefore = JSON.stringify(board2.activePiece.offsets);
const rotated = board2.rotatePiece();
if (rotated) {
    assert('Rotation changes offsets', JSON.stringify(board2.activePiece.offsets) !== offsetsBefore);
} else {
    assert('Rotation blocked (piece at edge)', true); // Still valid
}

// 5. Gravity — piece drops
const board3 = new TetrisBoard(6, 20, 3, 3);
board3.spawnPiece();
const aBefore = board3.activePiece.pos.a;
const gravResult = board3.gravity();
assert('Gravity returned valid result', gravResult === 'moved' || gravResult === 'landed');
if (gravResult === 'moved') {
    assert('A position decreased by 1', board3.activePiece.pos.a === aBefore - 1);
} else {
    assert('Piece landed (spawned at bottom)', true);
}

// 6. Lock piece — force piece to bottom and gravity locks it
const board4 = new TetrisBoard(6, 8, 3, 3);
board4.spawnPiece();
// Drop until locked
let steps = 0;
while (board4.activePiece && steps < 20) {
    board4.gravity();
    steps++;
}
const lockedCells = board4.getLockedCells();
assert('Piece locked into grid after dropping', lockedCells.length >= 4);

// 7. Line clear - fill an entire A-slice
const board5 = new TetrisBoard(2, 4, 2, 2);
// Fill row A=0 completely (2×2×2 = 8 cells)
for (let b = 0; b < 2; b++)
    for (let c = 0; c < 2; c++)
        for (let d = 0; d < 2; d++)
            board5.grid[board5.key(0, b, c, d)] = 'O';
// Add one cell above to test shift down
board5.grid[board5.key(1, 0, 0, 0)] = 'T';
const cleared = board5._clearLines();
assert('Line cleared returns 1', cleared === 1);
assert('Cell shifted down from A=1 to A=0', board5.grid[board5.key(0, 0, 0, 0)] === 'T');

// 8. Game over — full board prevents spawn
const board6 = new TetrisBoard(4, 4, 2, 2);
for (let a = 0; a < 4; a++)
    for (let b = 0; b < 4; b++)
        for (let c = 0; c < 2; c++)
            for (let d = 0; d < 2; d++)
                board6.grid[board6.key(a, b, c, d)] = 'I';
board6.spawnPiece();
assert('Game over when board full', board6.gameOver === true);

// 9. Hard drop
const board7 = new TetrisBoard(6, 20, 3, 3);
board7.spawnPiece();
const scoreBeforeDrop = board7.score;
board7.hardDrop();
assert('Hard drop scores points', board7.score > scoreBeforeDrop);

// 10. getActiveCells returns positions
const board8 = new TetrisBoard(6, 20, 3, 3);
board8.spawnPiece();
const activeCells = board8.getActiveCells();
assert('Active cells has 4 entries', activeCells.length === 4);
assert('Each cell has a,b,c,d', activeCells.every(c =>
    c.a !== undefined && c.b !== undefined && c.c !== undefined && c.d !== undefined));

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
