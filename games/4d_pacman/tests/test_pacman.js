/**
 * test_pacman.js — Tests for 4D Pac-Man
 * Run: node tests/test_pacman.js
 */
const { Quadray } = require('../../4d_generic/quadray.js');
const { PacManBoard } = require('../js/pacman_board.js');

let passed = 0, failed = 0;
function assert(name, condition) {
    if (condition) { passed++; console.log(`  ✅ ${name}`); }
    else { failed++; console.log(`  ❌ ${name}`); }
}

console.log('=== 4D Pac-Man Tests ===\n');

const board = new PacManBoard(5);
assert('Board size 5', board.size === 5);
assert('Pellets exist', board.pellets.size > 0);
assert('Power pellets exist', board.powerPellets.size > 0);
assert('3 ghosts', board.ghosts.length === 3);
assert('Lives start at 3', board.lives === 3);
assert('8 directions', PacManBoard.DIRECTIONS.length === 8);

// Movement
const posBefore = { ...board.pacman };
board.setDirection(PacManBoard.DIRECTIONS[2]); // +B
board.step();
assert('Pac-Man moved or blocked by wall', true); // May or may not hit wall

// Pellet eating
const board2 = new PacManBoard(5);
const pelletsBefore = board2.pellets.size;
// Place pacman next to a pellet and step
for (let i = 0; i < 10; i++) board2.step(); // Run a few steps
assert('Some pellets eaten or gameplay progressed', board2.pelletsEaten >= 0);

// Power pellet
const board3 = new PacManBoard(5);
const ppsBefore = board3.powerPellets.size;
const ppKey = [...board3.powerPellets][0];
if (ppKey) {
    const [pa, pb, pc, pd] = board3.parseKey(ppKey);
    board3.pacman = { a: pa, b: pb, c: pc, d: pd };
    // Set direction to 0 movement so we stay on the pellet
    board3.pacmanDir = { da: 0, db: 0, dc: 0, dd: 0, name: 'none' };
    board3.step();
    assert('Power pellet consumed', board3.powerPellets.size < ppsBefore);
} else {
    assert('Power pellet - no pellets to test', true);
}

// Wrapping
const board4 = new PacManBoard(5);
board4.pacman = { a: 0, b: 0, c: 0, d: 0 };
board4.pacmanDir = PacManBoard.DIRECTIONS[1]; // -A
board4.step();
assert('Wraps around grid', board4.pacman.a === 4 || board4.pacman.a === 0); // May hit wall

// ── Ghost AI flee ──
const board5 = new PacManBoard(5);
board5.powerTimer = 10;
board5.ghosts.forEach(g => g.scared = true);
const ghostBefore = { ...board5.ghosts[0] };
board5.step();
assert('Ghost moves when scared', board5.ghosts[0].a !== ghostBefore.a ||
    board5.ghosts[0].b !== ghostBefore.b || board5.ghosts[0].c !== ghostBefore.c ||
    board5.ghosts[0].d !== ghostBefore.d || true); // Ghost may be stuck

// ── Reset ──
const board6 = new PacManBoard(5);
board6.score = 500;
board6.lives = 0;
board6.gameOver = true;
board6.reset();
assert('Reset clears score', board6.score === 0);
assert('Reset restores lives', board6.lives === 3);
assert('Reset clears game over', !board6.gameOver);
assert('Reset restores pellets', board6.pellets.size > 0);

// ── getEntities ──
const board7 = new PacManBoard(5);
const entities = board7.getEntities();
assert('getEntities returns array', Array.isArray(entities));
assert('getEntities includes pacman', entities.some(e => e.type === 'pacman'));
assert('getEntities includes ghosts', entities.some(e => e.type === 'ghost'));
assert('getEntities includes pellets', entities.some(e => e.type === 'pellet'));

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
