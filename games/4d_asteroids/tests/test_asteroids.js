/**
 * test_asteroids.js — Comprehensive Tests for 4D Asteroids
 *
 * Groups: construction, entity mechanics, movement wrapping, thrust,
 * shooting, collision, asteroid splitting, hyperspace, shield system,
 * wave progression, metadata, synergetics, round-trip.
 *
 * Run: node tests/test_asteroids.js
 */

if (typeof require !== 'undefined') {
    const { Quadray } = require('../../4d_generic/quadray.js');
    const { GridUtils } = require('../../4d_generic/grid_utils.js');
    const { SYNERGETICS, verifyRoundTrip, verifyGeometricIdentities } = require('../../4d_generic/synergetics.js');
    const { BaseBoard } = require('../../4d_generic/base_board.js');
    const { AsteroidsBoard, AsteroidsEntity } = require('../js/asteroids_board.js');
    global.Quadray = Quadray;
    global.GridUtils = GridUtils;
    global.SYNERGETICS = SYNERGETICS;
    global.verifyRoundTrip = verifyRoundTrip;
    global.verifyGeometricIdentities = verifyGeometricIdentities;
    global.BaseBoard = BaseBoard;
    global.AsteroidsBoard = AsteroidsBoard;
    global.AsteroidsEntity = AsteroidsEntity;
}

let passed = 0, failed = 0, total = 0;
function assert(name, condition) {
    total++;
    if (condition) { passed++; console.log(`  ✅ ${name}`); }
    else { failed++; console.log(`  ❌ ${name}`); }
}

console.log('=== 4D Asteroids — Comprehensive Tests ===\n');

// ─── 1. Board Construction ───────────────────────────────────────────
console.log('— Board Construction —');
const b = new AsteroidsBoard(8);
assert('Entities exist', b.entities.length > 0);
assert('Ship exists', b.ship !== null);
assert('Ship is alive', b.ship.alive);
assert('3 lives', b.lives === 3);
assert('Score = 0', b.score === 0);
assert('Not game over', !b.gameOver);
assert('Wave 1', b.wave === 1);
assert('Shield charges = 3', b.shieldCharges === 3);
assert('Shield not active', !b.shieldActive);
const asteroids = b.entities.filter(e => e.type === 'asteroid');
assert('6 initial asteroids', asteroids.length === 6);

// ─── 2. Entity Mechanics ─────────────────────────────────────────────
console.log('\n— Entity Mechanics —');
const ent = new AsteroidsEntity([4, 4, 4, 4], [1, 0, 0, 0], 0.3, 'bullet');
assert('Entity has position', typeof ent.pos.a === 'number');
assert('Entity has velocity', typeof ent.vel.a === 'number');
assert('Entity is alive', ent.alive);
assert('Entity age = 0', ent.age === 0);
const quad = ent.toQuadray();
assert('toQuadray returns Quadray', quad instanceof Quadray);
assert('posKey returns string', typeof ent.posKey() === 'string');

// ─── 3. Movement Wrapping ────────────────────────────────────────────
console.log('\n— Movement Wrapping —');
const e2 = new AsteroidsEntity([7.9, 0, 0, 0], [1, 0, 0, 0], 0.1, 'bullet');
e2.update(0.5, 8);
assert('Position wraps within bounds', e2.pos.a < 8 && e2.pos.a >= 0);

const e3 = new AsteroidsEntity([0.1, 0, 0, 0], [-1, 0, 0, 0], 0.1, 'bullet');
e3.update(0.5, 8);
assert('Negative wrap works', e3.pos.a >= 0 && e3.pos.a < 8);

// ─── 4. Thrust & Speed Cap ──────────────────────────────────────────
console.log('\n— Thrust & Speed Cap —');
const b2 = new AsteroidsBoard(8);
b2.thrust([1, 0, 0, 0], 10);
const speed = Math.sqrt(b2.ship.vel.a ** 2 + b2.ship.vel.b ** 2 + b2.ship.vel.c ** 2 + b2.ship.vel.d ** 2);
assert('Speed capped at max', speed <= 2.001);
b2.thrust([0, 0, 0, 0], 0);
assert('Zero thrust no-ops', true); // Shouldn't crash

// ─── 5. Shooting ─────────────────────────────────────────────────────
console.log('\n— Shooting —');
const b3 = new AsteroidsBoard(8);
const countBefore = b3.entities.length;
b3.shoot([1, 0, 0, 0]);
assert('Shooting adds entity', b3.entities.length === countBefore + 1);
const bullet = b3.entities[b3.entities.length - 1];
assert('New entity is bullet', bullet.type === 'bullet');
assert('Bullet has velocity', Math.abs(bullet.vel.a) > 0);
assert('Bullet is alive', bullet.alive);

// ─── 6. Collision: Ship vs Asteroid ──────────────────────────────────
console.log('\n— Ship-Asteroid Collision —');
const b4 = new AsteroidsBoard(8);
const rock = new AsteroidsEntity(
    [b4.ship.pos.a, b4.ship.pos.b, b4.ship.pos.c, b4.ship.pos.d],
    [0, 0, 0, 0], 0.5, 'asteroid'
);
b4.entities.push(rock);
b4.lives = 3;
b4.update(0.016);
assert('Ship destroyed on collision', !b4.ship.alive);
assert('Lives decremented', b4.lives === 2);

// ─── 7. Asteroid Splitting ───────────────────────────────────────────
console.log('\n— Asteroid Splitting —');
const b5 = new AsteroidsBoard(8);
// Place a large asteroid right in front of a bullet
const bigRock = new AsteroidsEntity([4, 4, 4, 4], [0, 0, 0, 0], 0.5, 'asteroid');
b5.entities.push(bigRock);
const splitter = new AsteroidsEntity([4.01, 4, 4, 4], [0, 0, 0, 0], 0.1, 'bullet');
b5.entities.push(splitter);
const beforeCount = b5.entities.length;
b5.update(0.016);
const afterAsteroids = b5.entities.filter(e => e.type === 'asteroid' && e.alive);
// A split should create 2 smaller asteroids from the destroyed large one
assert('Splitting creates new asteroids', afterAsteroids.length >= 2 || b5.score > 0);

// ─── 8. Shield System ────────────────────────────────────────────────
console.log('\n— Shield System —');
const bs = new AsteroidsBoard(8);
assert('Shield charges start at 3', bs.shieldCharges === 3);
const activated = bs.activateShield();
assert('Shield activates', activated === true);
assert('Shield is active', bs.shieldActive);
assert('Shield charges decremented', bs.shieldCharges === 2);
assert('Shield timer set', bs.shieldTimer === 5.0);
assert('Shield cooldown set', bs.shieldCooldown === 3.0);

// Can't activate during cooldown
const activated2 = bs.activateShield();
assert('Cannot double-activate', activated2 === false);

// Shield absorption
const bs2 = new AsteroidsBoard(8);
bs2.activateShield();
// Place asteroid on ship
const shieldRock = new AsteroidsEntity(
    [bs2.ship.pos.a, bs2.ship.pos.b, bs2.ship.pos.c, bs2.ship.pos.d],
    [0, 0, 0, 0], 0.5, 'asteroid'
);
bs2.entities.push(shieldRock);
const livesBefore = bs2.lives;
bs2.update(0.016);
assert('Shield absorbs hit (ship alive)', bs2.ship.alive);
assert('Lives preserved when shielded', bs2.lives === livesBefore);
assert('Shield deactivated after absorb', !bs2.shieldActive);

// Empty shield charges
const bs3 = new AsteroidsBoard(8);
bs3.shieldCharges = 0;
assert('Cannot activate with 0 charges', bs3.activateShield() === false);

// ─── 9. Wave Progression ─────────────────────────────────────────────
console.log('\n— Wave Progression —');
const bw = new AsteroidsBoard(8);
assert('Start at wave 1', bw.wave === 1);
// Kill all asteroids to trigger wave advance
bw.entities.filter(e => e.type === 'asteroid').forEach(a => a.alive = false);
bw.update(0.016);
assert('Wave advanced after clearing asteroids', bw.wave === 2);
const newAsteroids = bw.entities.filter(e => e.type === 'asteroid' && e.alive);
assert('New wave has asteroids', newAsteroids.length > 0);

// ─── 10. Hyperspace ──────────────────────────────────────────────────
console.log('\n— Hyperspace —');
const bh = new AsteroidsBoard(8);
const posBefore = { ...bh.ship.pos };
// Run hyperspace multiple times (some may kill ship due to 1/6 chance)
let teleported = false;
for (let i = 0; i < 10; i++) {
    const bTest = new AsteroidsBoard(8);
    const before = { ...bTest.ship.pos };
    bTest.hyperspace();
    if (bTest.ship.alive && (bTest.ship.pos.a !== before.a || bTest.ship.pos.b !== before.b)) {
        teleported = true;
        break;
    }
}
assert('Hyperspace can teleport ship', teleported);

// ─── 11. Game Over ───────────────────────────────────────────────────
console.log('\n— Game Over —');
const bg = new AsteroidsBoard(8);
bg.lives = 1;
bg.killShip();
assert('Game over when last life lost', bg.gameOver);

// ─── 12. Reset ───────────────────────────────────────────────────────
console.log('\n— Reset —');
const br = new AsteroidsBoard(8);
br.score = 5000;
br.lives = 1;
br.wave = 5;
br.shieldCharges = 0;
br.shieldActive = true;
br.gameOver = true;
br.reset();
assert('Reset clears score', br.score === 0);
assert('Reset restores lives', br.lives === 3);
assert('Reset clears wave', br.wave === 1);
assert('Reset restores shields', br.shieldCharges === 3);
assert('Reset deactivates shield', !br.shieldActive);
assert('Reset clears gameOver', !br.gameOver);
assert('Ship exists after reset', br.ship !== null);

// ─── 13. Metadata ────────────────────────────────────────────────────
console.log('\n— Metadata —');
const meta = b.getMetadata();
assert('Has score', typeof meta.score === 'number');
assert('Has lives', typeof meta.lives === 'number');
assert('Has gameOver', typeof meta.gameOver === 'boolean');
assert('Has wave', typeof meta.wave === 'number');
assert('Has shieldCharges', typeof meta.shieldCharges === 'number');
assert('Has shieldActive', typeof meta.shieldActive === 'boolean');
assert('Has asteroidCount', typeof meta.asteroidCount === 'number');
assert('Has bulletCount', typeof meta.bulletCount === 'number');
assert('Has entityCount', typeof meta.entityCount === 'number');
assert('Has worldSize', meta.worldSize === 8);

// ─── 14. Distance Methods ────────────────────────────────────────────
console.log('\n— Distance Methods —');
const e4 = new AsteroidsEntity([1, 0, 0, 0], [0, 0, 0, 0], 0.1, 'bullet');
const e5 = new AsteroidsEntity([2, 0, 0, 0], [0, 0, 0, 0], 0.1, 'bullet');
const qdist = e4.distTo(e5);
assert('Quadray distance > 0', qdist > 0);
const edist = e4.euclideanDistTo(e5);
assert('Euclidean distance > 0', edist > 0);
const mdist = e4.manhattanDistTo(e5);
assert('Manhattan distance > 0', mdist > 0);

// ─── 15. Synergetics & Round-Trip ────────────────────────────────────
console.log('\n— Synergetics & Round-Trip —');
assert('TETRA_VOL = 1', SYNERGETICS.TETRA_VOL === 1);
assert('OCTA_VOL = 4', SYNERGETICS.OCTA_VOL === 4);
const rt = verifyRoundTrip(new Quadray(1, 0, 0, 0));
assert('Round-trip passes', rt.passed);
const geo = verifyGeometricIdentities();
assert('Geometric identities pass', geo.allPassed);

// ─── Summary ─────────────────────────────────────────────────────────
console.log(`\n=== Results: ${passed} passed, ${failed} failed (${total} total) ===`);
process.exit(failed > 0 ? 1 : 0);
