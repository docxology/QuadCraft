/**
 * test_connect_four.js — Comprehensive Tests for 4D Connect Four
 *
 * 25+ tests covering:
 *   - Board creation, Quadray integration, cellType parity
 *   - Gravity drop with IVM snapping
 *   - Win detection using IVM directions
 *   - Distance metrics (manhattan, euclidean, quadray)
 *   - Neighbor lookups via GridUtils
 *   - Round-trip conversions
 *   - Synergetics constants verification
 *   - Geometric identity verification
 *   - AI move generation
 *   - ScoreManager integration
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
console.log('\n— Horizontal Win —');
const board4 = new ConnectFourBoard(6, 5, 3, 3);
board4.dropPiece(0, 1, 1); // P1 at b=0
board4.dropPiece(0, 1, 0); // P2
board4.dropPiece(1, 1, 1); // P1 at b=1
board4.dropPiece(1, 1, 0); // P2
board4.dropPiece(2, 1, 1); // P1 at b=2
board4.dropPiece(2, 1, 0); // P2
const { result: hWin } = board4.dropPiece(3, 1, 1); // P1 at b=3
assert('Horizontal win along B axis', hWin === 'win');

// ─── 10. Move History ────────────────────────────────────────────────
console.log('\n— Move History —');
assert('Board4 has move history', board4.moveHistory.length === 7);
const lastMove = board4.moveHistory[board4.moveHistory.length - 1];
assert('Last move has quadray', lastMove.quadray instanceof Quadray);
assert('Last move has cellType', typeof lastMove.cellType === 'string');
assert('Last move has moveNum', lastMove.moveNum === 7);

// ─── 11. Distance Metrics ───────────────────────────────────────────
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

// ─── 12. Neighbor Lookups ───────────────────────────────────────────
console.log('\n— Neighbor Lookups —');
const centerQ = new Quadray(2, 2, 1, 1);
const neighbors = board5.getNeighbors(centerQ);
assert('Center has 8 IVM neighbors (all in bounds)', neighbors.length === 8);
const cornerQ = new Quadray(0, 0, 0, 0);
const cornerNeighbors = board5.getNeighbors(cornerQ);
assert('Corner has fewer in-bounds neighbors', cornerNeighbors.length < 8);

// ─── 13. getCells Returns Rich Data ──────────────────────────────────
console.log('\n— getCells Rich Data —');
const board6 = new ConnectFourBoard(6, 5, 3, 3);
board6.dropPiece(2, 1, 1);
const cells = board6.getCells();
assert('getCells returns 1 cell', cells.length === 1);
assert('Cell has quadray', cells[0].quadray instanceof Quadray);
assert('Cell has cellType', typeof cells[0].cellType === 'string');
assert('Cell has cartesian', typeof cells[0].cartesian.x === 'number');
assert('Cell has distFromOrigin', typeof cells[0].distFromOrigin === 'number');

// ─── 14. Round-Trip Conversion ──────────────────────────────────────
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

// ─── 15. Synergetics Constants ──────────────────────────────────────
console.log('\n— Synergetics Constants —');
assert('TETRA_VOL = 1', SYNERGETICS.TETRA_VOL === 1);
assert('OCTA_VOL = 4', SYNERGETICS.OCTA_VOL === 4);
assert('CUBO_VOL = 20', SYNERGETICS.CUBO_VOL === 20);
assert('S3 ≈ 1.0607', Math.abs(SYNERGETICS.S3 - Math.sqrt(9 / 8)) < 0.001);
assert('Board exposes volumeRatios', board.volumeRatios.tetra === 1);
assert('Board exposes cellVolume', typeof board.cellVolumeUnit === 'number');

// ─── 16. Geometric Identity Verification ─────────────────────────────
console.log('\n— Geometric Identities —');
const geoResults = verifyGeometricIdentities();
assert('All 8 geometric checks pass', geoResults.allPassed === true);
assert('Geometric check count = 8', geoResults.checks.length === 8);

// ─── 17. Angle Between Quadrays ──────────────────────────────────────
console.log('\n— Angle Between Quadrays —');
const angleAB = angleBetweenQuadrays(Quadray.A, Quadray.B);
assert('Angle A-B ≈ 109.47°', Math.abs(angleAB - 109.47) < 1);

// ─── 18. Board Metadata ─────────────────────────────────────────────
console.log('\n— Board Metadata —');
const meta = board6.getMetadata();
assert('Metadata has moveCount', meta.moveCount === 1);
assert('Metadata has volumeRatios', meta.volumeRatios.tetra === 1);
assert('Metadata has cellVolume', typeof meta.cellVolume === 'number');
assert('Metadata has s3', typeof meta.s3 === 'number');

// ─── 19. Valid Moves ─────────────────────────────────────────────────
console.log('\n— Valid Moves —');
const validMoves = board6.getValidMoves();
assert('Valid moves > 0', validMoves.length > 0);
assert('Valid moves has b,c,d', typeof validMoves[0].b === 'number');

// ─── 20. AI Evaluation ──────────────────────────────────────────────
console.log('\n— AI Evaluation —');
const evalScore = board6.evaluatePosition(1);
assert('Evaluation returns a number', typeof evalScore === 'number');
assert('Player 1 has positive eval (has pieces)', evalScore > 0);

// ─── 21. Reset ──────────────────────────────────────────────────────
console.log('\n— Reset —');
board6.reset();
assert('Reset clears grid', board6.grid.size === 0);
assert('Reset restores player 1', board6.currentPlayer === 1);
assert('Reset clears game over', board6.gameOver === false);
assert('Reset clears move history', board6.moveHistory.length === 0);

// ─── Summary ─────────────────────────────────────────────────────────
console.log(`\n=== Results: ${passed} passed, ${failed} failed (${total} total) ===`);
process.exit(failed > 0 ? 1 : 0);
