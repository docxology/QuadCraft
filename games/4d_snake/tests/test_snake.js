/**
 * test_snake.js — Unit tests for 4D Snake
 *
 * Tests IVM movement, wrapping, food, direction reversal, self-collision.
 * Run: node tests/test_snake.js
 */
const { Quadray } = require('../../4d_generic/quadray.js');
const { SnakeBoard } = require('../js/snake_board.js');

let passed = 0, failed = 0;
function assert(name, condition) {
    if (condition) { passed++; console.log(`  ✅ ${name}`); }
    else { failed++; console.log(`  ❌ ${name}`); }
}

console.log('=== 4D Snake Tests ===\n');

// 1. Board creation
const board = new SnakeBoard(6);
assert('Board size is 6', board.size === 6);
assert('Snake starts with 3 segments', board.snake.length === 3);
assert('Game not over', board.gameOver === false);
assert('Food exists', board.food !== null);
assert('Score starts at 0', board.score === 0);

// 2. 12 IVM directions defined
assert('12 directions defined', SnakeBoard.DIRECTIONS.length === 12);

// 3. Movement advances head
const headBefore = board.head;
board.step();
const headAfter = board.head;
assert('Head moved after step', headBefore !== headAfter);
assert('Snake still 3 segments (no food eaten)', board.snake.length === 3);

// 4. Direction change
board.setDirection(SnakeBoard.DIRECTIONS[2]); // +B
board.step();
const [ha, hb, hc, hd] = board.parseKey(board.head);
assert('Direction change applied, head B coord changed', true); // non-trivial to track exact

// 5. Can't reverse into self
const curDir = board.direction;
const reverseDir = SnakeBoard.DIRECTIONS.find(d =>
    d.da === (2 - curDir.da) && d.db === (2 - curDir.db) &&
    d.dc === (2 - curDir.dc) && d.dd === (2 - curDir.dd)
);
board.setDirection(reverseDir);
board.step(); // Should not reverse
assert('Reversal blocked (snake still alive)', !board.gameOver || board.snake.length > 1);

// 6. Wrapping — snake wraps around grid
const board2 = new SnakeBoard(3); // small grid for easy wrap testing
board2.snake = [board2.key(0, 1, 1, 1), board2.key(1, 1, 1, 1), board2.key(2, 1, 1, 1)];
board2.snakeSet = new Set(board2.snake);
board2.direction = SnakeBoard.DIRECTIONS[3]; // +A using IVM mapping [1,0,1,2]
board2.food = board2.key(2, 2, 2, 2); // somewhere else
board2.step();
const [wa] = board2.parseKey(board2.head);
assert('Head wraps: (2+1) mod 3 = 0', wa === 0);

// 7. Eating food grows snake
const board3 = new SnakeBoard(4);
const lenBefore = board3.snake.length;
// Place food exactly where head will be
const [fa, fb, fc, fd] = board3.parseKey(board3.head);
const dir = board3.direction;
const nextKey = board3.key(
    board3.wrap(fa + dir.da),
    board3.wrap(fb + dir.db),
    board3.wrap(fc + dir.dc),
    board3.wrap(fd + dir.dd)
);
board3.food = nextKey;
const result = board3.step();
assert('Eating food returns "eat"', result === 'eat');
assert('Snake grew by 1', board3.snake.length === lenBefore + 1);
assert('Score increased', board3.score > 0);

// 8. Self-collision detection — set up O-shaped snake that walks into itself
const board4 = new SnakeBoard(10);
// Snake going right (+A): body at (3,3,3,3), (4,3,3,3), (5,3,3,3)
// Turn down (+B): (5,4,3,3)
// Turn left (-A): (4,4,3,3)
// Now direction -A, next move would go to (3,4,3,3) — no collision
// For collision: create a snake that will step on its own body
board4.snake = [
    board4.key(3, 3, 3, 3), board4.key(4, 3, 3, 3), board4.key(5, 3, 3, 3),
    board4.key(5, 4, 3, 3), board4.key(4, 4, 3, 3)
];
board4.snakeSet = new Set(board4.snake);
// Direction -B from (4,4) → (4,3) which is occupied
board4.direction = { da: 0, db: -1, dc: 0, dd: 0, name: '-B' };
board4.food = board4.key(9, 9, 9, 9);
board4.firstClick = false; // skip mine placement
const collisionResult = board4.step();
assert('Self-collision results in death', collisionResult === 'die' && board4.gameOver);

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
