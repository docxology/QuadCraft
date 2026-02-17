/**
 * test_space_invaders.js — Tests for 4D Space Invaders
 * Run: node tests/test_space_invaders.js
 */
const { Quadray } = require('../../4d_generic/quadray.js');
const { SpaceInvadersBoard } = require('../js/space_invaders_board.js');

let passed = 0, failed = 0;
function assert(name, condition) {
    if (condition) { passed++; console.log(`  ✅ ${name}`); }
    else { failed++; console.log(`  ❌ ${name}`); }
}

console.log('=== 4D Space Invaders Tests ===\n');

const board = new SpaceInvadersBoard(6, 12, 3, 3);
assert('Board created', board.width === 6);
assert('Aliens initialized', board.aliens.length > 0);
assert('All aliens alive', board.aliens.every(a => a.alive));
assert('Lives start at 3', board.lives === 3);

// Ship movement
board.moveShip(1, 0, 0);
assert('Ship moved +B', board.ship.b > Math.floor(board.width / 2));

// Ship clamping
board.moveShip(100, 0, 0);
assert('Ship clamped', board.ship.b <= board.width - 1);

// Shooting
const bulletsBefore = board.bullets.length;
board.shoot();
assert('Bullet created', board.bullets.length === bulletsBefore + 1);
assert('Bullet direction is +A', board.bullets[board.bullets.length - 1].da === 1);

// Step advances bullets
board.step();
assert('Bullet advanced', board.bullets.some(b => b.a > 1));

// Alien count
const liveCount = board.getLiveAlienCount();
assert('Live alien count matches', liveCount === board.aliens.filter(a => a.alive).length);

// Kill an alien directly
const alien = board.aliens.find(a => a.alive);
alien.alive = false;
board.score += alien.points;
assert('Alien killed', board.getLiveAlienCount() < liveCount);
assert('Score increased', board.score > 0);

// ── Reset ──
const board5 = new SpaceInvadersBoard();
board5.score = 500;
board5.lives = 0;
board5.gameOver = true;
board5.level = 5;
board5.reset();
assert('Reset clears score', board5.score === 0);
assert('Reset restores lives', board5.lives === 3);
assert('Reset clears game over', !board5.gameOver);
assert('Reset restores level', board5.level === 1);

// ── Shoot cooldown ──
const board6 = new SpaceInvadersBoard();
assert('First shot succeeds', board6.shoot());
assert('Cooldown blocks second shot', !board6.shoot());
board6.shootCooldown = 0;
assert('Shot after cooldown succeeds', board6.shoot());

// ── getEntities ──
const board7 = new SpaceInvadersBoard();
const entities = board7.getEntities();
assert('getEntities returns array', Array.isArray(entities));
assert('getEntities includes aliens', entities.some(e => e.type === 'squid' || e.type === 'crab' || e.type === 'octopus'));
assert('getEntities includes ship', entities.some(e => e.type === 'ship'));

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
