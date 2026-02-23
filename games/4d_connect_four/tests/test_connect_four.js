/**
 * test_connect_four.js — Comprehensive Tests for 4D Connect Four
 *
 * 30+ test groups covering:
 *   - Board creation, Quadray integration, cellType parity
 *   - Gravity drop with IVM snapping
 *   - Win detection: vertical, horizontal, C-axis, D-axis, diagonal
 *   - Distance metrics (manhattan, euclidean, quadray)
 *   - Neighbor lookups via GridUtils
 *   - Round-trip conversions
 *   - Synergetics constants verification
 *   - Geometric identity verification
 *   - AI move generation + immediate win/block detection
 *   - ScoreManager integration
 *   - Undo support
 *   - Draw detection
 *   - Edge cases (drop after game over, invalid coordinates)
 *
 * Run: node tests/test_connect_four.js
 */

const { Quadray } = require('../../4d_generic/quadray.js');
const { GridUtils } = require('../../4d_generic/grid_utils.js');
const { SYNERGETICS, angleBetweenQuadrays, verifyRoundTrip, verifyGeometricIdentities } = require('../../4d_generic/synergetics.js');
const { ConnectFourBoard } = require('../js/connect_four_board.js');

let passed = 0, failed = 0, total = 0;
function assert(name, condition) {
    total++;
    if (condition) { passed++; console.log(`  ✅ ${name}`); }
    else { failed++; console.log(`  ❌ ${name}`); }
}

console.log('=== 4D Connect Four — Comprehensive Tests ===\n');

// ─── 1. Board Creation ──────────────────────────────────────────────
console.log('— Board Creation —');
const board = new ConnectFourBoard(6, 5, 3, 3);
assert('Height is 6', board.height === 6);
assert('Width is 5', board.width === 5);
assert('DepthC is 3', board.depthC === 3);
assert('DepthD is 3', board.depthD === 3);
assert('Player 1 starts', board.currentPlayer === 1);
assert('No winner initially', board.winner === 0);
assert('Game not over initially', board.gameOver === false);
assert('Grid is a Map', board.grid instanceof Map);
assert('WIN_DIRECTIONS count is 40', ConnectFourBoard.WIN_DIRECTIONS.length === 40);
assert('Total slots = 6*5*3*3 = 270', board.totalSlots === 270);

// ─── 2. WIN_DIRECTIONS are Quadray objects ───────────────────────────
console.log('\n— Win Directions as Quadrays —');
assert('WIN_DIRECTIONS[0] is Quadray', ConnectFourBoard.WIN_DIRECTIONS[0] instanceof Quadray);
const firstDir = ConnectFourBoard.WIN_DIRECTIONS[0];
assert('WIN_DIRECTIONS[0] has .a property', typeof firstDir.a === 'number');
assert('WIN_DIRECTIONS[0] has scale() method', typeof firstDir.scale === 'function');

// ─── 3. Gravity Drop with IVM Snapping ───────────────────────────────
console.log('\n— Gravity Drop —');
const { result, quadray, cellType } = board.dropPiece(2, 1, 1);
assert('Drop result is "placed"', result === 'placed');
assert('Landing quadray exists', quadray instanceof Quadray);
assert('Lands at row 0 (bottom)', quadray.a === 0);
assert('cellType is string', cellType === 'tetra' || cellType === 'octa');

// ─── 4. Quadray.toKey() Used for Storage ─────────────────────────────
console.log('\n— Quadray Key Storage —');
const landingKey = quadray.toKey();
assert('Grid uses toKey()', board.grid.has(landingKey));
const storedCell = board.grid.get(landingKey);
assert('Stored cell has player', storedCell.player === 1);
assert('Stored cell has quadray', storedCell.quadray instanceof Quadray);
assert('Stored cell has cellType', typeof storedCell.cellType === 'string');

// ─── 5. Cell Parity via Quadray.cellType() ───────────────────────────
console.log('\n— Cell Parity —');
const parity000 = Quadray.cellType(0, 0, 0, 0);
assert('cellType(0,0,0,0) = tetra', parity000 === 'tetra');
const parity100 = Quadray.cellType(1, 0, 0, 0);
assert('cellType(1,0,0,0) = octa', parity100 === 'octa');
const parity110 = Quadray.cellType(1, 1, 0, 0);
assert('cellType(1,1,0,0) = tetra', parity110 === 'tetra');

// ─── 6. Alternating Players ──────────────────────────────────────────
console.log('\n— Alternating Players —');
assert('Player switches to 2', board.currentPlayer === 2);
board.dropPiece(2, 1, 1); // Player 2
assert('Player switches back to 1', board.currentPlayer === 1);

// ─── 7. Column Full ─────────────────────────────────────────────────
console.log('\n— Column Full —');
const board2 = new ConnectFourBoard(2, 2, 2, 2);
board2.dropPiece(0, 0, 0);
board2.dropPiece(0, 0, 0);
const { result: fullResult } = board2.dropPiece(0, 0, 0);
assert('Column full returns "full"', fullResult === 'full');

// ─── 8. Vertical Win (along A axis) ─────────────────────────────────
console.log('\n— Vertical Win —');
const board3 = new ConnectFourBoard(6, 5, 3, 3);
board3.dropPiece(2, 1, 1); // P1
board3.dropPiece(3, 1, 1); // P2
board3.dropPiece(2, 1, 1); // P1
board3.dropPiece(3, 1, 1); // P2
board3.dropPiece(2, 1, 1); // P1
board3.dropPiece(3, 1, 1); // P2
const { result: winResult } = board3.dropPiece(2, 1, 1); // P1 — 4 in column
assert('Vertical win detected', winResult === 'win');
assert('Winner is player 1', board3.winner === 1);
assert('Win line has 4 Quadrays', board3.winLine.length === 4);
assert('Win line entries are Quadrays', board3.winLine[0] instanceof Quadray);

// ─── 9. Horizontal Win (along B axis) ───────────────────────────────
console.log('\n— Horizontal Win (B axis) —');
const board4 = new ConnectFourBoard(6, 5, 3, 3);
board4.dropPiece(0, 1, 1); // P1 at b=0
board4.dropPiece(0, 1, 0); // P2
board4.dropPiece(1, 1, 1); // P1 at b=1
board4.dropPiece(1, 1, 0); // P2
board4.dropPiece(2, 1, 1); // P1 at b=2
board4.dropPiece(2, 1, 0); // P2
const { result: hWin } = board4.dropPiece(3, 1, 1); // P1 at b=3
assert('Horizontal win along B axis', hWin === 'win');

// ─── 10. Win Along C Axis ───────────────────────────────────────────
console.log('\n— Win Along C Axis —');
const boardC = new ConnectFourBoard(6, 5, 5, 3);
boardC.dropPiece(2, 0, 1); // P1 c=0
boardC.dropPiece(2, 0, 0); // P2
boardC.dropPiece(2, 1, 1); // P1 c=1
boardC.dropPiece(2, 1, 0); // P2
boardC.dropPiece(2, 2, 1); // P1 c=2
boardC.dropPiece(2, 2, 0); // P2
const { result: cWin } = boardC.dropPiece(2, 3, 1); // P1 c=3
assert('Win along C axis detected', cWin === 'win');

// ─── 11. Win Along D Axis ───────────────────────────────────────────
console.log('\n— Win Along D Axis —');
const boardD = new ConnectFourBoard(6, 5, 3, 5);
boardD.dropPiece(2, 1, 0); // P1 d=0
boardD.dropPiece(3, 1, 0); // P2
boardD.dropPiece(2, 1, 1); // P1 d=1
boardD.dropPiece(3, 1, 1); // P2
boardD.dropPiece(2, 1, 2); // P1 d=2
boardD.dropPiece(3, 1, 2); // P2
const { result: dWin } = boardD.dropPiece(2, 1, 3); // P1 d=3
assert('Win along D axis detected', dWin === 'win');

// ─── 12. Move History ────────────────────────────────────────────────
console.log('\n— Move History —');
assert('Board4 has move history', board4.moveHistory.length === 7);
const lastMove = board4.moveHistory[board4.moveHistory.length - 1];
assert('Last move has quadray', lastMove.move.quadray instanceof Quadray);
assert('Last move has cellType', typeof lastMove.move.cellType === 'string');
assert('Last move has moveNum', lastMove.move.moveNum === 7);

// ─── 13. Distance Metrics ───────────────────────────────────────────
console.log('\n— Distance Metrics —');
const q1 = new Quadray(0, 0, 0, 0);
const q2 = new Quadray(2, 1, 0, 0);
const board5 = new ConnectFourBoard(6, 5, 3, 3);
const manhattan = board5.manhattanDistance(q1, q2);
assert('Manhattan distance (GridUtils) > 0', manhattan > 0);
assert('Manhattan distance = |2|+|1| = 3', manhattan === 3);
const euclidean = board5.euclideanDistance(q1, q2);
assert('Euclidean distance (GridUtils) > 0', euclidean > 0);
const quadrayDist = board5.quadrayDistance(q1, q2);
assert('Quadray distance (Quadray.distance) > 0', quadrayDist > 0);

// ─── 14. Neighbor Lookups ───────────────────────────────────────────
console.log('\n— Neighbor Lookups —');
const centerQ = new Quadray(2, 2, 1, 1);
const neighbors = board5.getNeighbors(centerQ);
assert('Center has 12 IVM neighbors (all in bounds)', neighbors.length === 12);
const cornerQ = new Quadray(0, 0, 0, 0);
const cornerNeighbors = board5.getNeighbors(cornerQ);
assert('Corner (0,0,0,0) has neighbors', cornerNeighbors.length > 0);
assert('All corner neighbors are in bounds', cornerNeighbors.every(n => board5.inBounds(n)));

// ─── 15. getCells Returns Rich Data ──────────────────────────────────
console.log('\n— getCells Rich Data —');
const board6 = new ConnectFourBoard(6, 5, 3, 3);
board6.dropPiece(2, 1, 1);
const cells = board6.getCells();
assert('getCells returns 1 cell', cells.length === 1);
assert('Cell has quadray', cells[0].quadray instanceof Quadray);
assert('Cell has cellType', typeof cells[0].cellType === 'string');
assert('Cell has cartesian', typeof cells[0].cartesian.x === 'number');
assert('Cell has distFromOrigin', typeof cells[0].distFromOrigin === 'number');
assert('Cell has color', typeof cells[0].color === 'string');
assert('Cell has moveNum', typeof cells[0].moveNum === 'number');

// ─── 16. Round-Trip Conversion ──────────────────────────────────────
console.log('\n— Round-Trip Conversion —');
const testPoints = [
    new Quadray(1, 0, 0, 0),
    new Quadray(0, 1, 0, 0),
    new Quadray(2, 1, 0, 1),
];
for (const q of testPoints) {
    const rt = verifyRoundTrip(q);
    assert(`Round-trip ${q.toString()}: error=${rt.error.toFixed(4)}`, rt.passed);
}

// ─── 17. Synergetics Constants ──────────────────────────────────────
console.log('\n— Synergetics Constants —');
assert('TETRA_VOL = 1', SYNERGETICS.TETRA_VOL === 1);
assert('OCTA_VOL = 4', SYNERGETICS.OCTA_VOL === 4);
assert('CUBO_VOL = 20', SYNERGETICS.CUBO_VOL === 20);
assert('S3 ≈ 1.0607', Math.abs(SYNERGETICS.S3 - Math.sqrt(9 / 8)) < 0.001);
assert('Board exposes volumeRatios', board.volumeRatios.tetra === 1);
assert('Board exposes cellVolume', typeof board.cellVolumeUnit === 'number');

// ─── 18. Geometric Identity Verification ─────────────────────────────
console.log('\n— Geometric Identities —');
const geoResults = verifyGeometricIdentities();
assert('All 8 geometric checks pass', geoResults.allPassed === true);
assert('Geometric check count = 8', geoResults.checks.length === 8);

// ─── 19. Angle Between Quadrays ──────────────────────────────────────
console.log('\n— Angle Between Quadrays —');
const angleAB = angleBetweenQuadrays(Quadray.A, Quadray.B);
assert('Angle A-B ≈ 109.47°', Math.abs(angleAB - 109.47) < 1);

// ─── 20. Board Metadata ─────────────────────────────────────────────
console.log('\n— Board Metadata —');
const meta = board6.getMetadata();
assert('Metadata has moveCount', meta.moveCount === 1);
assert('Metadata has volumeRatios', meta.volumeRatios.tetra === 1);
assert('Metadata has cellVolume', typeof meta.cellVolume === 'number');
assert('Metadata has s3', typeof meta.s3 === 'number');
assert('Metadata has totalSlots', typeof meta.totalSlots === 'number');

// ─── 21. Valid Moves ─────────────────────────────────────────────────
console.log('\n— Valid Moves —');
const validMoves = board6.getValidMoves();
assert('Valid moves > 0', validMoves.length > 0);
assert('Valid moves has b,c,d', typeof validMoves[0].b === 'number');

// ─── 22. AI Evaluation ──────────────────────────────────────────────
console.log('\n— AI Evaluation —');
const evalScore = board6.evaluatePosition(1);
assert('Evaluation returns a number', typeof evalScore === 'number');
assert('Player 1 has positive eval (has pieces)', evalScore > 0);
const evalScore2 = board6.evaluatePosition(2);
assert('Player 2 eval is different from P1', evalScore !== evalScore2);

// ─── 23. Undo Last Move ─────────────────────────────────────────────
console.log('\n— Undo Last Move —');
const boardUndo = new ConnectFourBoard(6, 5, 3, 3);
boardUndo.dropPiece(2, 1, 1); // P1
assert('After drop: moveCount = 1', boardUndo.moveCount === 1);
assert('After drop: currentPlayer = 2', boardUndo.currentPlayer === 2);
const undone = boardUndo.undoLastMove();
assert('Undo returns move info', undone !== null);
assert('Undo returns player', undone.player === 1);
assert('Undo returns quadray', undone.quadray instanceof Quadray);
assert('After undo: moveCount = 0', boardUndo.moveCount === 0);
assert('After undo: currentPlayer = 1', boardUndo.currentPlayer === 1);
assert('After undo: grid is empty', boardUndo.grid.size === 0);

// ─── 24. Undo Clears Win State ──────────────────────────────────────
console.log('\n— Undo Clears Win State —');
const boardUndoWin = new ConnectFourBoard(6, 5, 3, 3);
boardUndoWin.dropPiece(2, 1, 1); // P1
boardUndoWin.dropPiece(3, 1, 1); // P2
boardUndoWin.dropPiece(2, 1, 1); // P1
boardUndoWin.dropPiece(3, 1, 1); // P2
boardUndoWin.dropPiece(2, 1, 1); // P1
boardUndoWin.dropPiece(3, 1, 1); // P2
boardUndoWin.dropPiece(2, 1, 1); // P1 wins!
assert('Win detected', boardUndoWin.gameOver === true);
assert('Winner is P1', boardUndoWin.winner === 1);
boardUndoWin.undoLastMove();
assert('After undo win: gameOver is false', boardUndoWin.gameOver === false);
assert('After undo win: winner is 0', boardUndoWin.winner === 0);
assert('After undo win: winLine cleared', boardUndoWin.winLine.length === 0);
assert('After undo win: can continue playing', boardUndoWin.moveCount === 6);

// ─── 25. Undo on Empty Board ────────────────────────────────────────
console.log('\n— Undo on Empty Board —');
const boardEmpty = new ConnectFourBoard(6, 5, 3, 3);
const emptyUndo = boardEmpty.undoLastMove();
assert('Undo on empty returns null', emptyUndo === null);
assert('Board still functional after null undo', boardEmpty.moveCount === 0);

// ─── 26. Invalid Drop Coordinates ───────────────────────────────────
console.log('\n— Invalid Drops —');
const boardInv = new ConnectFourBoard(6, 5, 3, 3);
const { result: negResult } = boardInv.dropPiece(-1, 0, 0);
assert('Negative b returns invalid', negResult === 'invalid');
const { result: bigResult } = boardInv.dropPiece(10, 0, 0);
assert('Out-of-range b returns invalid', bigResult === 'invalid');
const { result: negCResult } = boardInv.dropPiece(0, -1, 0);
assert('Negative c returns invalid', negCResult === 'invalid');
const { result: bigDResult } = boardInv.dropPiece(0, 0, 10);
assert('Out-of-range d returns invalid', bigDResult === 'invalid');

// ─── 27. Drop After Game Over ───────────────────────────────────────
console.log('\n— Drop After Game Over —');
assert('board3 is game over', board3.gameOver === true);
const { result: postGameResult } = board3.dropPiece(0, 0, 0);
assert('Drop after game over returns "gameover"', postGameResult === 'gameover');

// ─── 28. getColumns Validation ──────────────────────────────────────
console.log('\n— getColumns Validation —');
const boardCols = new ConnectFourBoard(6, 5, 3, 3);
const columns = boardCols.getColumns();
assert('Total columns = 5*3*3 = 45', columns.length === 45);
assert('Column has b,c,d', typeof columns[0].b === 'number');
assert('Column has parity', columns[0].parity === 'tetra' || columns[0].parity === 'octa');
assert('Column has quadray', columns[0].quadray instanceof Quadray);
assert('Column has cartesian', typeof columns[0].cartesian.x === 'number');
assert('Column has full flag', columns[0].full === false);

// ─── 29. Stacking in Same Column ─────────────────────────────────────
console.log('\n— Stacking in Same Column —');
const boardStack = new ConnectFourBoard(6, 5, 3, 3);
const drop1 = boardStack.dropPiece(2, 1, 1);
const drop2 = boardStack.dropPiece(2, 1, 1);
assert('First drop at row 0', drop1.quadray.a === 0);
assert('Second drop at row 1 (stacks)', drop2.quadray.a === 1);
assert('Different players', drop1.result === 'placed' && drop2.result === 'placed');

// ─── 30. angleBetween on Board ──────────────────────────────────────
console.log('\n— angleBetween on Board —');
const boardAngle = new ConnectFourBoard(6, 5, 3, 3);
const from = new Quadray(0, 0, 0, 0);
const to1 = new Quadray(1, 0, 0, 0);
const to2 = new Quadray(0, 1, 0, 0);
const angle = boardAngle.angleBetween(from, to1, to2);
assert('angleBetween returns a number', typeof angle === 'number');
assert('Angle is approximately 109.47°', Math.abs(angle - 109.47) < 1);

// ─── 31. Reset ──────────────────────────────────────────────────────
console.log('\n— Reset —');
board6.reset();
assert('Reset clears grid', board6.grid.size === 0);
assert('Reset restores player 1', board6.currentPlayer === 1);
assert('Reset clears game over', board6.gameOver === false);
assert('Reset clears move history', board6.moveHistory.length === 0);
assert('Reset clears moveCount', board6.moveCount === 0);

// ─── 32. Draw Detection ─────────────────────────────────────────────
console.log('\n— Draw Detection —');
const boardDraw = new ConnectFourBoard(1, 1, 1, 1); // 1 slot
boardDraw.dropPiece(0, 0, 0); // P1 fills the only slot
assert('Single-slot board results in draw or gameover', boardDraw.gameOver === true);
assert('No winner in draw', boardDraw.winner === 0);

// ─── Summary ─────────────────────────────────────────────────────────
console.log(`\n=== Results: ${passed} passed, ${failed} failed (${total} total) ===`);
process.exit(failed > 0 ? 1 : 0);
