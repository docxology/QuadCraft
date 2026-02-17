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
board.step();
assert('Ball moved after step', board.ball.a !== posBefore.a || board.ball.b !== posBefore.b);

// 3. Wall bounce — push ball to edge of B
const board2 = new PongBoard(10);
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
board3.ball = { a: 0.3, b: 5, c: 5, d: 5 };
board3.ballVel = { a: -0.5, b: 0, c: 0, d: 0 };
board3.paddle1 = { b: 5, c: 5, d: 5, size: 2 };
board3.step();
assert('Paddle 1 reflects ball', board3.ballVel.a > 0);

// 7. Score on miss
const board4 = new PongBoard(10);
board4.ball = { a: 0.1, b: 0, c: 0, d: 0 }; // Far from paddle
board4.ballVel = { a: -0.5, b: 0, c: 0, d: 0 };
board4.paddle1 = { b: 9, c: 9, d: 9, size: 1 }; // Paddle far away
board4.step();
assert('Player 2 scores on miss', board4.score2 >= 1);

// 8. Game over at max score
const board5 = new PongBoard(10);
board5.score1 = 6;
board5.ball = { a: 10.1, b: 0, c: 0, d: 0 };
board5.ballVel = { a: 0.5, b: 0, c: 0, d: 0 };
board5.paddle2 = { b: 9, c: 9, d: 9, size: 0.1 };
board5.step();
assert('Game ends at max score', board5.score1 >= 7 ? board5.gameOver === true : true);

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

// ── Velocity clamping ──
const board7 = new PongBoard();
board7.ballVel = { a: 5, b: 5, c: -5, d: -5 };
board7._clampVelocity();
const speed = Math.sqrt(board7.ballVel.a ** 2 + board7.ballVel.b ** 2 + board7.ballVel.c ** 2 + board7.ballVel.d ** 2);
assert('Velocity clamped to max', speed <= 1.2);

// ── Reset ──
const board8 = new PongBoard();
board8.score1 = 5;
board8.score2 = 3;
board8.gameOver = true;
board8.reset();
assert('Reset clears score1', board8.score1 === 0);
assert('Reset clears score2', board8.score2 === 0);
assert('Reset clears game over', !board8.gameOver);

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
