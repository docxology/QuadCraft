/**
 * test_entity_system.js — Tests for QuadrayEntity and EntityManager
 *
 * Tests: entity creation, movement, wrapping, collision, distance,
 * EntityManager add/remove/filter/collision detection.
 * Run: node games/tests/test_entity_system.js
 */
const path = require('path');

let passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) { passed++; console.log(`  ✅ ${msg}`); }
    else { failed++; console.error(`  ❌ ${msg}`); }
}

console.log('╔═══════════════════════════════════╗');
console.log('║   Test: Entity System Module      ║');
console.log('╚═══════════════════════════════════╝\n');

// Load dependencies
const { Quadray } = require(path.join(__dirname, '..', '..', '4d_generic', 'quadray.js'));
const { GridUtils } = require(path.join(__dirname, '..', '..', '4d_generic', 'grid_utils.js'));
global.Quadray = Quadray;
global.GridUtils = GridUtils;

const { QuadrayEntity, EntityManager } = require(path.join(__dirname, '..', '..', '4d_generic', 'entity_system.js'));

// 1. Entity creation
console.log('▸ QuadrayEntity constructor');
const e1 = new QuadrayEntity([1, 2, 3, 4], [0.1, 0, 0, 0], { type: 'ship', radius: 1.0 });
assert(e1.pos.a === 1 && e1.pos.b === 2, 'position set correctly');
assert(e1.vel.a === 0.1, 'velocity set correctly');
assert(e1.type === 'ship', 'type set correctly');
assert(e1.radius === 1.0, 'radius set correctly');
assert(e1.active === true, 'starts active');

// 2. Static entity (no velocity)
console.log('▸ Static entity (null velocity)');
const e2 = new QuadrayEntity([0, 0, 0, 0]);
assert(e2.vel.a === 0 && e2.vel.b === 0, 'null velocity defaults to zero');

// 3. Update
console.log('▸ update()');
const mover = new QuadrayEntity([0, 0, 0, 0], [1, 0, 0, 0]);
mover.update(2);
assert(mover.pos.a === 2, 'position updated by velocity * dt');

// 4. Wrap
console.log('▸ wrapPosition()');
const wrapper = new QuadrayEntity([0, 0, 0, 0], [1, 0, 0, 0]);
wrapper.pos.a = 10;
wrapper.wrapPosition(8);
assert(wrapper.pos.a === 2, 'wraps position correctly');

wrapper.pos.a = -1;
wrapper.wrapPosition(8);
assert(wrapper.pos.a === 7, 'wraps negative correctly');

// 5. Update with wrapping
console.log('▸ update() with wrapping');
const wrapMover = new QuadrayEntity([7, 0, 0, 0], [2, 0, 0, 0]);
wrapMover.update(1, 8);
assert(wrapMover.pos.a === 1, 'update wraps when size provided');

// 6. Euclidean distance
console.log('▸ euclideanDistTo()');
const a = new QuadrayEntity([0, 0, 0, 0]);
const b = new QuadrayEntity([3, 4, 0, 0]);
const dist = a.euclideanDistTo(b);
assert(Math.abs(dist - 5) < 0.001, `euclideanDistTo = ${dist.toFixed(4)} (expected 5)`);

// 7. Manhattan distance
console.log('▸ manhattanDistTo()');
const mDist = a.manhattanDistTo(b);
assert(mDist === 7, `manhattanDistTo = ${mDist} (expected 7)`);

// 8. Collision detection
console.log('▸ collidesWith()');
const c1 = new QuadrayEntity([0, 0, 0, 0], null, { radius: 2 });
const c2 = new QuadrayEntity([1, 0, 0, 0], null, { radius: 2 });
assert(c1.collidesWith(c2), 'overlapping entities collide');
const c3 = new QuadrayEntity([10, 10, 10, 10], null, { radius: 0.5 });
assert(!c1.collidesWith(c3), 'distant entities do not collide');

// 9. posKey
console.log('▸ posKey()');
const pk = new QuadrayEntity([1.3, 2.7, 0.1, 3.9]);
const key = pk.posKey();
assert(key === '1,3,0,4', `posKey rounds = ${key}`);

// 10. toQuadray
console.log('▸ toQuadray()');
const qe = new QuadrayEntity([1, 2, 3, 4]);
const q = qe.toQuadray();
assert(q instanceof Quadray && q.a === 1, 'toQuadray returns Quadray instance');

// 11. setVelocity
console.log('▸ setVelocity()');
const sv = new QuadrayEntity([0, 0, 0, 0]);
sv.setVelocity([5, 6, 7, 8]);
assert(sv.vel.a === 5 && sv.vel.d === 8, 'setVelocity updates all components');

// 12. clampSpeed
console.log('▸ clampSpeed()');
const fast = new QuadrayEntity([0, 0, 0, 0], [10, 0, 0, 0]);
fast.clampSpeed(5);
const speed = Math.sqrt(fast.vel.a ** 2 + fast.vel.b ** 2 + fast.vel.c ** 2 + fast.vel.d ** 2);
assert(Math.abs(speed - 5) < 0.001, `clamped speed = ${speed.toFixed(4)}`);

// 13. destroy
console.log('▸ destroy()');
const mortal = new QuadrayEntity([0, 0, 0, 0]);
mortal.destroy();
assert(mortal.active === false, 'destroy sets active to false');

// --- EntityManager ---

// 14. Manager add/count
console.log('▸ EntityManager add/count');
const mgr = new EntityManager();
mgr.add(new QuadrayEntity([0, 0, 0, 0], null, { type: 'ship' }));
mgr.add(new QuadrayEntity([1, 0, 0, 0], null, { type: 'asteroid' }));
mgr.add(new QuadrayEntity([2, 0, 0, 0], null, { type: 'asteroid' }));
assert(mgr.count === 3, 'count is 3');

// 15. getByType
console.log('▸ getByType()');
assert(mgr.getByType('asteroid').length === 2, '2 asteroids');
assert(mgr.getByType('ship').length === 1, '1 ship');

// 16. removeInactive
console.log('▸ removeInactive()');
mgr.entities[1].destroy();
const removed = mgr.removeInactive();
assert(removed === 1, '1 entity removed');
assert(mgr.count === 2, 'count now 2');

// 17. Manager update
console.log('▸ EntityManager update()');
const mgr2 = new EntityManager();
mgr2.add(new QuadrayEntity([0, 0, 0, 0], [1, 0, 0, 0], { type: 'bullet' }));
mgr2.update(1, 10);
assert(mgr2.entities[0].pos.a === 1, 'manager update moves entities');

// 18. Collision detection
console.log('▸ checkCollisions()');
const mgr3 = new EntityManager();
mgr3.add(new QuadrayEntity([0, 0, 0, 0], null, { type: 'ship', radius: 1 }));
mgr3.add(new QuadrayEntity([0.5, 0, 0, 0], null, { type: 'rock', radius: 1 }));
let collisions = 0;
mgr3.checkCollisions('ship', 'rock', () => collisions++);
assert(collisions === 1, 'detected 1 collision');

// 19. nearest
console.log('▸ nearest()');
const mgr4 = new EntityManager();
mgr4.add(new QuadrayEntity([10, 10, 10, 10], null, { type: 'target' }));
mgr4.add(new QuadrayEntity([1, 0, 0, 0], null, { type: 'target' }));
const near = mgr4.nearest({ a: 0, b: 0, c: 0, d: 0 }, 'target');
assert(near.pos.a === 1, 'nearest returns closest entity');

// 20. clear
console.log('▸ clear()');
mgr4.clear();
assert(mgr4.count === 0, 'clear empties manager');

// Cleanup
delete global.Quadray;
delete global.GridUtils;

console.log(`\n${'─'.repeat(36)}`);
console.log(`EntitySystem: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
