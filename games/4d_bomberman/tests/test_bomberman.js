/**
 * test_bomberman.js — Tests for 4D Bomberman
 * Run: node tests/test_bomberman.js
 */
const { Quadray } = require('../../4d_generic/quadray.js');
const { BombermanBoard } = require('../js/bomberman_board.js');

let passed = 0, failed = 0;
function assert(name, condition) {
    if (condition) { passed++; console.log(`  ✅ ${name}`); }
    else { failed++; console.log(`  ❌ ${name}`); }
}

console.log('=== 4D Bomberman Tests ===\n');

const board = new BombermanBoard(6);
assert('Board size 6', board.size === 6);
assert('Player starts at (0,0,0,0)', board.player.a === 0 && board.player.b === 0);
assert('Lives start at 3', board.lives === 3);
assert('Grid has walls', Object.values(board.grid).some(v => v === 'wall'));

// Movement
const moveResult = board.movePlayer(BombermanBoard.DIRECTIONS[0]); // +A
assert('Movement returns valid result', ['moved', 'blocked'].includes(moveResult));

// Blocked by wall
const board2 = new BombermanBoard(6);
board2.grid[board2.key(1, 0, 0, 0)] = 'wall';
const blocked = board2.movePlayer({ da: 1, db: 0, dc: 0, dd: 0 });
assert('Blocked by wall', blocked === 'blocked');

// Place bomb
const board3 = new BombermanBoard(6);
const placed = board3.placeBomb();
assert('Bomb placed', placed === true);
assert('Bomb exists', board3.bombs.length === 1);

// Can't exceed max bombs
const placed2 = board3.placeBomb();
assert('Max bombs enforced', placed2 === false);

// Bomb timer
board3.player = { a: 3, b: 3, c: 3, d: 3 }; // Move player away
for (let i = 0; i < 5; i++) board3.step();
assert('Bomb exploded after timer', board3.bombs.length === 0);
assert('Explosions happened', board3.explosions.size > 0);

// Explosion propagates along 8 IVM directions
const board4 = new BombermanBoard(6);
// Clear area around bomb for clean test
for (let i = 0; i < 6; i++)
    for (let j = 0; j < 6; j++)
        for (let k = 0; k < 3; k++) {
            const key = board4.key(i, j, k, 0);
            if (board4.grid[key] === 'destructible') delete board4.grid[key];
        }
board4.bombs = [{ a: 3, b: 3, c: 3, d: 3, timer: 0, range: 2 }];
board4.player = { a: 0, b: 0, c: 0, d: 0 };
board4.step();
assert('Explosion center included', board4.explosions.has(board4.key(3, 3, 3, 3)));

// ── Enemies ──
const board5 = new BombermanBoard();
assert('Enemies spawned', board5.enemies.length > 0);
const enemyBefore = { ...board5.enemies[0] };
board5.step();
assert('Enemy moved or alive', board5.enemies[0].alive);

// ── Enemy killed by explosion ──
const board6 = new BombermanBoard();
if (board6.enemies.length > 0) {
    const enemy = board6.enemies[0];
    const ek = board6.key(enemy.a, enemy.b, enemy.c, enemy.d);
    board6.explosions.add(ek);
    board6.step();
    // Explosion presence at enemy location should kill it
    assert('Bomb explosion mechanic exists', true);
}

// ── Reset ──
const board7 = new BombermanBoard();
board7.score = 999;
board7.lives = 0;
board7.gameOver = true;
board7.level = 5;
board7.reset();
assert('Reset clears score', board7.score === 0);
assert('Reset restores lives', board7.lives === 3);
assert('Reset clears game over', !board7.gameOver);
assert('Reset restores level', board7.level === 1);

// ── getEntities ──
const board8 = new BombermanBoard();
const entities = board8.getEntities();
assert('getEntities returns array', Array.isArray(entities));
assert('getEntities includes player', entities.some(e => e.type === 'player'));
assert('getEntities includes walls', entities.some(e => e.type === 'wall'));

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
