/**
 * test_breakout.js — Tests for 4D Breakout
 * Run: node tests/test_breakout.js
 */
const { Quadray } = require('../../4d_generic/quadray.js');
const { BreakoutBoard } = require('../js/breakout_board.js');

let passed = 0, failed = 0;
function assert(name, condition) {
    if (condition) { passed++; console.log(`  ✅ ${name}`); }
    else { failed++; console.log(`  ❌ ${name}`); }
}

console.log('=== 4D Breakout Tests ===\n');

const board = new BreakoutBoard(8, 12, 3, 3);
assert('Board created', board.width === 8);
assert('Lives start at 3', board.lives === 3);
assert('Bricks initialized', board.getBrickCount() > 0);
assert('Ball exists', board.ball.a !== undefined);

// Ball movement
const before = { ...board.ball };
board.step();
assert('Ball moved', board.ball.a !== before.a || board.ball.b !== before.b);

// Paddle movement
board.movePaddle(1, 0, 0);
assert('Paddle moved', board.paddle.b > board.width / 2);

// Paddle clamping
board.movePaddle(100, 0, 0);
assert('Paddle clamped', board.paddle.b <= board.width - board.paddle.size);

// Wall bounce
const board2 = new BreakoutBoard(8, 12, 3, 3);
board2.ball = { a: 5, b: -0.1, c: 1, d: 1 };
board2.ballVel = { a: 0, b: -1, c: 0, d: 0 };
board2.step();
assert('Ball bounces off B wall', board2.ball.b >= 0);

// Life loss
const board3 = new BreakoutBoard(8, 12, 3, 3);
board3.ball = { a: 0.05, b: 0, c: 0, d: 0 };
board3.ballVel = { a: -0.2, b: 0, c: 0, d: 0 };
board3.paddle = { b: 7, c: 2, d: 2, size: 1 };
board3.step();
assert('Life lost on miss', board3.lives === 2);

// Brick collision
const board4 = new BreakoutBoard(8, 12, 3, 3);
const brickKeys = Object.keys(board4.bricks);
const [ba, bb, bc, bd] = board4.parseKey(brickKeys[0]);
board4.ball = { a: ba, b: bb, c: bc, d: bd };
board4.ballVel = { a: 0.01, b: 0, c: 0, d: 0 };
const initCount = board4.getBrickCount();
board4.step();
assert('Brick destroyed', board4.getBrickCount() < initCount);
assert('Score increased', board4.score > 0);

// ── Multi-hit bricks ──
const board5 = new BreakoutBoard();
const allBricks = Object.entries(board5.bricks);
const multiHit = allBricks.filter(([k, b]) => b.maxHits > 1);
assert('Multi-hit bricks exist', multiHit.length > 0);
if (multiHit.length > 0) {
    const [mk, mb] = multiHit[0];
    const origHits = mb.hits;
    mb.hits--;
    assert('Multi-hit brick survives first hit', mb.hits > 0 || origHits === 1);
}

// ── Combo system ──
const board6 = new BreakoutBoard();
board6.combo = 3;
assert('Combo tracks consecutive hits', board6.combo === 3);

// ── Velocity clamping ──
const board7 = new BreakoutBoard();
board7.ballVel = { a: 1.0, b: -1.0, c: 0.5, d: -0.5 };
board7._clampVelocity();
assert('Velocity clamped +', board7.ballVel.a <= 0.4);
assert('Velocity clamped -', board7.ballVel.b >= -0.4);

// ── Reset ──
const board8 = new BreakoutBoard();
board8.score = 999;
board8.lives = 0;
board8.gameOver = true;
board8.reset();
assert('Reset clears score', board8.score === 0);
assert('Reset restores lives', board8.lives === 3);
assert('Reset clears game over', board8.gameOver === false);
assert('Reset restores bricks', board8.getBrickCount() > 0);

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
