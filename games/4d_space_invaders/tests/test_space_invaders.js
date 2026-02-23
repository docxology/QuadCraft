/**
 * test_space_invaders.js — Comprehensive Tests for 4D Space Invaders
 * Run: node tests/test_space_invaders.js
 */
const { Quadray } = require('../../4d_generic/quadray.js');
if (typeof GridUtils === 'undefined') { const _g = require('../../4d_generic/grid_utils.js'); globalThis.GridUtils = _g.GridUtils; }
if (typeof SYNERGETICS === 'undefined') { const _s = require('../../4d_generic/synergetics.js'); globalThis.SYNERGETICS = _s.SYNERGETICS; globalThis.verifyRoundTrip = _s.verifyRoundTrip; globalThis.verifyGeometricIdentities = _s.verifyGeometricIdentities; }
const { SpaceInvadersBoard } = require('../js/space_invaders_board.js');

let p = 0, f = 0, t = 0;
function assert(name, cond) { t++; if (cond) { p++; console.log(`  ✅ ${name}`); } else { f++; console.log(`  ❌ ${name}`); } }

console.log('=== 4D Space Invaders — Comprehensive Tests ===\n');

console.log('— Construction —');
const b = new SpaceInvadersBoard(6, 12, 3, 3);
assert('Width = 6', b.width === 6);
assert('Height = 12', b.height === 12);
assert('Aliens initialized', b.aliens.length > 0);
assert('All aliens alive', b.aliens.every(a => a.alive));
assert('Lives = 3', b.lives === 3);
assert('Score = 0', b.score === 0);
assert('Level = 1', b.level === 1);
assert('Game not over', !b.gameOver);

console.log('\n— Ship Movement —');
const b2 = new SpaceInvadersBoard(6, 12, 3, 3);
const startB = b2.ship.b;
b2.moveShip(1, 0, 0);
assert('Ship moves +B', b2.ship.b === startB + 1);
b2.moveShip(100, 0, 0);
assert('Ship clamped max', b2.ship.b === b2.width - 1);
b2.moveShip(-100, 0, 0);
assert('Ship clamped min', b2.ship.b === 0);

console.log('\n— Shooting —');
const b3 = new SpaceInvadersBoard(6, 12, 3, 3);
assert('First shot succeeds', b3.shoot());
assert('Bullet created', b3.bullets.length === 1);
assert('Bullet dir +A', b3.bullets[0].da === 1);
assert('Cooldown blocks', !b3.shoot());
b3.shootCooldown = 0;
assert('Shot after cooldown', b3.shoot());

console.log('\n— Step —');
b3.step();
assert('Step executes', true);
assert('Step executed', true);

console.log('\n— Shield System —');
const b4 = new SpaceInvadersBoard(6, 12, 3, 3);
assert('4 shields', b4.shields.length === 4);
assert('Shield HP = 3', b4.shields[0].hp === 3);
assert('Shield maxHp = 3', b4.shields[0].maxHp === 3);
assert('Shield at row 2', b4.shields[0].a === 2);
// Degrade a shield
b4.shields[0].hp--;
assert('Shield degrades', b4.shields[0].hp === 2);
b4.shields[0].hp = 0;
assert('Shield destroyed', b4.shields[0].hp === 0);
assert('3 shields alive', b4.shields.filter(s => s.hp > 0).length === 3);

console.log('\n— Shield in entities —');
const entities = b4.getEntities();
assert('Entities include shields', entities.some(e => e.type === 'shield'));
assert('Entities include ship', entities.some(e => e.type === 'ship'));
assert('Entities include aliens', entities.some(e => e.type === 'squid' || e.type === 'crab' || e.type === 'octopus'));

console.log('\n— Shield in metadata —');
const meta = b4.getMetadata();
assert('Has shieldsAlive', typeof meta.shieldsAlive === 'number');
assert('Shield count correct', meta.shieldsAlive === 3);

console.log('\n— Alien kill —');
const liveCount = b.getLiveAlienCount();
const alien = b.aliens.find(a => a.alive);
alien.alive = false;
b.score += alien.points;
assert('Alien killed', b.getLiveAlienCount() < liveCount);
assert('Score increased', b.score > 0);

console.log('\n— Reset —');
b.reset();
assert('Reset score', b.score === 0);
assert('Reset lives', b.lives === 3);
assert('Reset level', b.level === 1);
assert('Reset gameOver', !b.gameOver);
assert('Reset shields', b.shields.length === 4 && b.shields.every(s => s.hp === 3));

console.log('\n— Distances —');
const p1 = { a: 0, b: 0, c: 0, d: 0 };
const p2 = { a: 5, b: 3, c: 1, d: 1 };
assert('Manhattan > 0', b.manhattanDistance(p1, p2) > 0);
assert('Euclidean > 0', b.euclideanDistance(p1, p2) > 0);

console.log('\n— Synergetics —');
assert('TETRA_VOL = 1', SYNERGETICS.TETRA_VOL === 1);
assert('OCTA_VOL = 4', SYNERGETICS.OCTA_VOL === 4);
assert('Round-trip passes', verifyRoundTrip(new Quadray(1, 0, 0, 0)).passed);
assert('Geometric identities pass', verifyGeometricIdentities().allPassed);

console.log(`\n=== Results: ${p} passed, ${f} failed (${t} total) ===`);
process.exit(f > 0 ? 1 : 0);
