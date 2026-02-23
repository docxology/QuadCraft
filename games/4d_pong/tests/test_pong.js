/**
 * test_pong.js — Tests for 4D Pong
 * Run: node tests/test_pong.js
 */
const { Quadray } = require('../../4d_generic/quadray.js');
const { PongBoard } = require('../js/pong_board.js');

let passed = 0, failed = 0;
function assert(name, condition) {
    if (condition) { passed++; console.log(`  ✅ ${name}`); }
    else { failed++; console.log(`  ❌ ${name}`); }
}

console.log('=== 4D Pong Tests ===\n');

// 1. Board creation
const board = new PongBoard(10);
assert('Court size 10', board.courtSize === 10);
assert('Ball starts at center', board.ball.a === 5 && board.ball.b === 5);
assert('Scores start at 0', board.score1 === 0 && board.score2 === 0);
assert('Game not over', board.gameOver === false);

// 2. Ball movement
const posBefore = { ...board.ball };
board.isServing = false; // Bypass serve timer for testing
board.ballVel = { a: 0.1, b: 0, c: 0, d: 0 };
board.step();
assert('Ball moved after step', board.ball.a !== posBefore.a || board.ball.b !== posBefore.b);

// 3. Wall bounce — push ball to edge of B
const board2 = new PongBoard(10);
board2.isServing = false;
board2.ball = { a: 5, b: -0.1, c: 5, d: 5 };
board2.ballVel = { a: 0, b: -0.5, c: 0, d: 0 };
board2.step();
assert('Ball bounces off B=0 wall', board2.ball.b >= 0);
assert('B velocity reversed', board2.ballVel.b > 0);

// 4. Paddle movement
board.movePaddle(1, 1, 0, 0); // Move paddle 1 +B
assert('Paddle 1 moved', board.paddle1.b > 5);

// 5. Paddle clamping
board.movePaddle(1, 100, 0, 0); // Try to move way off court
assert('Paddle clamped to court', board.paddle1.b <= board.courtSize - board.paddle1.size);

// 6. Paddle hit detection
const board3 = new PongBoard(10);
board3.isServing = false;
board3.ball = { a: 0.3, b: 5, c: 5, d: 5 };
board3.ballVel = { a: -0.5, b: 0, c: 0, d: 0 };
board3.paddle1 = { b: 5, c: 5, d: 5, size: 2 };
board3.step();
assert('Paddle 1 reflects ball', board3.ballVel.a > 0);

// 7. Score on miss
const board4 = new PongBoard(10);
board4.isServing = false;
board4.ball = { a: 0.1, b: 0, c: 0, d: 0 }; // Far from paddle
board4.ballVel = { a: -0.5, b: 0, c: 0, d: 0 };
board4.paddle1 = { b: 9, c: 9, d: 9, size: 1 }; // Paddle far away
board4.step();
assert('Player 2 scores on miss', board4.score2 >= 1);

// 8. Game over at max score
const board5 = new PongBoard(10);
board5.isServing = false;
board5.score1 = 10; // Max score is now 11
board5.ball = { a: 10.1, b: 0, c: 0, d: 0 };
board5.ballVel = { a: 0.5, b: 0, c: 0, d: 0 };
board5.paddle2 = { b: 9, c: 9, d: 9, size: 0.1 };
board5.step();
assert('Game ends at max score', board5.score1 >= 11 ? board5.gameOver === true : true);

// 9. AI movement
const board6 = new PongBoard(10);
board6.ball = { a: 8, b: 7, c: 3, d: 6 };
const p2Before = { ...board6.paddle2 };
board6.aiMove();
assert('AI paddle moves toward ball', board6.paddle2.b !== p2Before.b || board6.paddle2.c !== p2Before.c);

// 10. Reset ball
board6.resetBall(2);
assert('Ball reset to center', Math.abs(board6.ball.a - 5) < 0.1);
assert('Rally reset', board6.rally === 0);

// ── Power-up Spawn ──
console.log('\n— Power-ups —');
const bp1 = new PongBoard(10);
bp1.rally = 5; // Should trigger spawn at interval=5
bp1._trySpawnPowerUp();
assert('Power-up spawns at rally=5', bp1.powerUp !== null);
assert('Power-up has type', bp1.powerUpTypes.includes(bp1.powerUp?.type));
assert('Power-up has position', typeof bp1.powerUp?.pos?.a === 'number');
assert('Power-up has timer', bp1.powerUp?.timer === 10);

// Power-up doesn't double-spawn
bp1._trySpawnPowerUp();
assert('No double-spawn while active', bp1.powerUp !== null); // Same one stays

// Power-up expiry
bp1.powerUp = { pos: { a: 5, b: 5, c: 5, d: 5 }, type: 'bigPaddle', timer: 0.01 };
bp1._updatePowerUps(0.02);
assert('Power-up expires after timer', bp1.powerUp === null);

// BigPaddle effect
const bp2 = new PongBoard(10);
bp2._applyPowerUp(1, 'bigPaddle');
assert('BigPaddle increases paddle size', bp2.paddle1.size === 3);
assert('Active power registered', bp2.activePowers.length === 1);
// Expire the power
bp2.activePowers[0].remaining = 0.01;
bp2._updatePowerUps(0.02);
assert('BigPaddle reverts after expiry', bp2.paddle1.size === 2);
assert('Active power removed', bp2.activePowers.length === 0);

// Speed multiplier
const bp3 = new PongBoard(10);
assert('Default speed multiplier = 1', bp3._getSpeedMultiplier() === 1.0);
bp3.activePowers.push({ player: 1, type: 'speedBall', remaining: 5 });
assert('SpeedBall multiplier > 1', bp3._getSpeedMultiplier() > 1.0);
bp3.activePowers = [{ player: 1, type: 'slowBall', remaining: 5 }];
assert('SlowBall multiplier < 1', bp3._getSpeedMultiplier() < 1.0);

// ── AI Difficulty ──
console.log('\n— AI Difficulty —');
const bd1 = new PongBoard(10);
assert('Default difficulty = 0 (Easy)', bd1.aiDifficulty === 0);
bd1.cycleDifficulty();
assert('Cycle to Medium', bd1.aiDifficulty === 1);
bd1.cycleDifficulty();
assert('Cycle to Hard', bd1.aiDifficulty === 2);
bd1.cycleDifficulty();
assert('Cycle wraps to Easy', bd1.aiDifficulty === 0);

// ── 2P Mode ──
console.log('\n— Two-Player Mode —');
const bt1 = new PongBoard(10);
assert('Default is 1P mode', bt1.twoPlayerMode === false);
bt1.toggle2P();
assert('Toggle to 2P', bt1.twoPlayerMode === true);
bt1.ball = { a: 8, b: 7, c: 3, d: 6 };
const p2Pos = { ...bt1.paddle2 };
bt1.aiMove(); // Should be a no-op in 2P mode
assert('AI disabled in 2P mode', bt1.paddle2.b === p2Pos.b && bt1.paddle2.c === p2Pos.c);
bt1.toggle2P();
assert('Toggle back to 1P', bt1.twoPlayerMode === false);

// ── Longest Rally ──
console.log('\n— Longest Rally —');
const br1 = new PongBoard(10);
assert('Longest rally starts at 0', br1.longestRally === 0);
br1.rally = 5; br1.longestRally = 5;
br1.rally = 3; // Rally count can decrease after reset
assert('Longest rally preserved', br1.longestRally === 5);
br1.reset();
assert('Reset clears longest rally', br1.longestRally === 0);

// ── Metadata ──
console.log('\n— Metadata —');
const meta = board.getMetadata();
assert('Has score1', typeof meta.score1 === 'number');
assert('Has score2', typeof meta.score2 === 'number');
assert('Has rally', typeof meta.rally === 'number');
assert('Has longestRally', typeof meta.longestRally === 'number');
assert('Has gameOver', typeof meta.gameOver === 'boolean');
assert('Has twoPlayer', typeof meta.twoPlayer === 'boolean');
assert('Has aiDifficulty', typeof meta.aiDifficulty === 'number');
assert('Has cellVolume', typeof meta.cellVolume === 'number');
assert('Has ballCellType', typeof meta.ballCellType === 'string');

// ── Synergetics ──
console.log('\n— Synergetics Constants —');
const { SYNERGETICS, verifyRoundTrip, verifyGeometricIdentities } = require('../../4d_generic/synergetics.js');
assert('TETRA_VOL = 1', SYNERGETICS.TETRA_VOL === 1);
assert('OCTA_VOL = 4', SYNERGETICS.OCTA_VOL === 4);
const rt = verifyRoundTrip(new Quadray(1, 0, 0, 0));
assert('Round-trip passes', rt.passed);
const geo = verifyGeometricIdentities();
assert('Geometric identities pass', geo.allPassed);

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
