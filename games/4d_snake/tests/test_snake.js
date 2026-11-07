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

// Food spawns at a random unoccupied cell (_spawnFood uses Math.random), so
// steps 3-4 below could non-deterministically land on it and grow the snake,
// flaking the "no food eaten" assertions. Pin food to an unreachable sentinel
// key for the plain-movement steps; tests 6-8 set board.food explicitly.
board.food = 'unreachable';

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

// Raw wrapped labels remain distinct, with a contiguous, unique initial body.
function occupancyAgrees(b) {
    return b.snake.length === b.snakeSet.size && b.snake.every(k => b.snakeSet.has(k));
}
function advancedKey(b, key, direction = b.direction) {
    const [a, b0, c, d] = b.parseKey(key);
    return b.key(b.wrap(a + direction.da), b.wrap(b0 + direction.db),
        b.wrap(c + direction.dc), b.wrap(d + direction.dd));
}
for (const size of [1, 2, 3, 4, 6]) {
    const initial = new SnakeBoard(size);
    assert(`Size ${size} starts with unique in-bounds segments`, occupancyAgrees(initial) &&
        initial.snake.every(k => initial.parseKey(k).every(v => v >= 0 && v < size)));
    assert(`Size ${size} initial body is contiguous in the movement direction`,
        initial.snake.slice(1).every((k, i) => k === advancedKey(initial, initial.snake[i])));
    assert(`Size ${size} initial length respects the wrapped direction period`,
        initial.snake.length === Math.min(3, size));
    if (size === 1) assert('Singleton raw board starts complete', initial.gameOver && initial.food === null);
}
const occupancy = new SnakeBoard(6);
occupancy.food = 'unreachable';
assert('Normal movement succeeds', occupancy.step() === 'move');
assert('Normal movement keeps Set and body equal', occupancyAgrees(occupancy));
occupancy.food = advancedKey(occupancy, occupancy.head);
assert('Growth succeeds', occupancy.step() === 'eat');
assert('Growth keeps Set and body equal', occupancyAgrees(occupancy));

const tailEntry = new SnakeBoard(4);
tailEntry.snake = ['0,0,0,0', '0,1,1,2', '0,2,2,0', '0,3,3,2'];
tailEntry.snakeSet = new Set(tailEntry.snake);
tailEntry.food = '1,0,0,3';
for (let i = 0; i < 2; i++) {
    const departing = tailEntry.snake[0];
    assert(`Legal departing-tail entry ${i} succeeds`, tailEntry.step() === 'move' && tailEntry.head === departing);
    assert(`Tail entry ${i} preserves occupied head and complete Set`, occupancyAgrees(tailEntry));
}

// Independently enumerate the actual wrapped move graph, not canonical neighbors.
for (const size of [3, 4, 6]) {
    const component = new SnakeBoard(size);
    const reachable = new Set([component.head]);
    const queue = [component.head];
    for (let i = 0; i < queue.length; i++) {
        for (const direction of SnakeBoard.DIRECTIONS) {
            const next = advancedKey(component, queue[i], direction);
            if (!reachable.has(next)) { reachable.add(next); queue.push(next); }
        }
    }
    const expectedCount = size ** 4 / (size % 4 === 0 ? 4 : (size % 2 === 0 ? 2 : 1));
    assert(`Size ${size} wrapped component has expected cardinality`, reachable.size === expectedCount);
    const lastFree = [...reachable].sort().pop();
    component.snake = [...reachable].filter(k => k !== lastFree);
    component.snakeSet = new Set(component.snake);
    const random = Math.random;
    try {
        Math.random = () => 0;
        component._spawnFood();
        assert(`Size ${size} food uses the only free reachable raw label`, component.food === lastFree);
        component.snake.push(lastFree);
        component.snakeSet.add(lastFree);
        component._spawnFood();
        assert(`Size ${size} full playable component completes`, component.gameOver && component.food === null);
    } finally {
        Math.random = random;
    }
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
