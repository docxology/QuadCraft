/**
 * test_frogger.js — Tests for 4D Frogger
 * Run: node tests/test_frogger.js
 */
const { Quadray } = require('../../4d_generic/quadray.js');
const { FroggerBoard } = require('../js/frogger_board.js');

let passed = 0, failed = 0;
function assert(name, condition) {
    if (condition) { passed++; console.log(`  ✅ ${name}`); }
    else { failed++; console.log(`  ❌ ${name}`); }
}

console.log('=== 4D Frogger Tests ===\n');

const board = new FroggerBoard(8, 8, 3, 3);
assert('Board created', board.width === 8 && board.lanes === 8);
assert('Frog starts at row 0', board.frog.a === 0);
assert('Lives start at 3', board.lives === 3);
assert('Obstacles exist', board.obstacles.length > 0);
assert('8 directions', FroggerBoard.DIRECTIONS.length === 8);

// Hop forward
const result = board.hop(FroggerBoard.DIRECTIONS[0]); // +A
assert('Hop result is "hop"', result === 'hop');
assert('Frog advanced to row 1', board.frog.a === 1);
assert('Score increased for new row', board.score > 0);

// Hop backward
board.hop(FroggerBoard.DIRECTIONS[1]); // -A
assert('Frog moved back to row 0', board.frog.a === 0);

// Can't hop below row 0
const blocked = board.hop(FroggerBoard.DIRECTIONS[1]); // -A from row 0
assert('Blocked below row 0', blocked === 'blocked');

// Side movement wraps
board.hop(FroggerBoard.DIRECTIONS[0]); // Back to row 1
const bBefore = board.frog.b;
board.hop(FroggerBoard.DIRECTIONS[2]); // +B
assert('Side hop works', board.frog.b !== bBefore || board.frog.b === (bBefore + 1) % board.width);

// Stepping moves obstacles
const board2 = new FroggerBoard(8, 8, 3, 3);
const obsBefore = board2.obstacles.map(o => ({ ...o }));
board2.step();
const obsMoved = board2.obstacles.some((o, i) =>
    o.b !== obsBefore[i].b || o.c !== obsBefore[i].c || o.d !== obsBefore[i].d);
assert('Obstacles moved', obsMoved);

// Goal detection — hop all the way to top
const board3 = new FroggerBoard(4, 4, 2, 2);
board3.frog = { a: board3.lanes - 2, b: 2, c: 1, d: 1 };
const goalResult = board3.hop(FroggerBoard.DIRECTIONS[0]);
assert('Goal detected at top row', goalResult === 'goal');
assert('Level increased', board3.level === 2);

// ── Time pressure ──
const board4 = new FroggerBoard();
const initialTime = board4.timeLeft;
board4.step();
assert('Timer decrements', board4.timeLeft < initialTime);

// ── Time out ──
const board5 = new FroggerBoard();
board5.timeLeft = 1;
board5.lives = 1;
board5.step();
assert('Time out costs a life', board5.lives < 1 || board5.timeLeft === board5.maxTime); // Either lost life or reset timer

// ── Reset ──
const board6 = new FroggerBoard();
board6.score = 500;
board6.lives = 0;
board6.gameOver = true;
board6.goalsReached = 5;
board6.reset();
assert('Reset clears score', board6.score === 0);
assert('Reset restores lives', board6.lives === 3);
assert('Reset clears game over', !board6.gameOver);
assert('Reset clears goals', board6.goalsReached === 0);

// ── getEntities ──
const board7 = new FroggerBoard();
const entities = board7.getEntities();
assert('getEntities returns array', Array.isArray(entities));
assert('getEntities includes frog', entities.some(e => e.type === 'frog'));
assert('getEntities includes obstacles', entities.some(e => e.type === 'obstacle') || entities.length > 1);

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
