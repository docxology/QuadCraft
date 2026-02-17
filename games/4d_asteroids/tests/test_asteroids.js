const assert = (c, m) => { if (!c) { console.error(`❌ FAILED: ${m}`); throw new Error(m); } console.log(`✅ PASSED: ${m}`); };
if (typeof require !== 'undefined') {
    const { Quadray } = require('../../4d_generic/quadray.js');
    const { AsteroidsBoard, AsteroidsEntity } = require('../js/asteroids_board.js');
    global.Quadray = Quadray; global.AsteroidsBoard = AsteroidsBoard; global.AsteroidsEntity = AsteroidsEntity;
}
function runTests() {
    console.log("Running 4D Asteroids Tests...");
    const b = new AsteroidsBoard(8);
    assert(b.entities.length > 0, "Entities exist after init");
    assert(b.ship, "Ship exists");
    assert(b.lives === 3, "Starts with 3 lives");
    assert(b.score === 0, "Score starts at 0");
    const asteroids = b.entities.filter(e => e.type === 'asteroid');
    assert(asteroids.length === 6, "6 initial asteroids");

    // Movement wrapping
    const e = new AsteroidsEntity([7.9, 0, 0, 0], [1, 0, 0, 0], 0.1, 'bullet');
    e.update(0.5, 8);
    assert(e.pos.a < 8, "Position wraps within bounds");
    assert(e.pos.a > 0.0, "Position wrapped correctly (should be ~0.4)");

    // Thrust & Speed Cap
    b.thrust([1, 0, 0, 0], 10); // Massive thrust
    const speed = Math.sqrt(b.ship.vel.a ** 2 + b.ship.vel.b ** 2 + b.ship.vel.c ** 2 + b.ship.vel.d ** 2);
    assert(speed <= 2.001, `Speed capped at max (got ${speed})`);

    // Shoot (creates bullet offset from ship)
    const bulletCount = b.entities.length;
    b.shoot([1, 0, 0, 0]);
    assert(b.entities.length === bulletCount + 1, "Shooting adds entity");
    const bullet = b.entities[b.entities.length - 1];
    assert(bullet.type === 'bullet', "Entity is bullet");

    // Collision Logic (Mock)
    const b2 = new AsteroidsBoard(8);
    // Force a collision by placing an asteroid directly on top of the ship
    const rock = new AsteroidsEntity(
        [b2.ship.pos.a, b2.ship.pos.b, b2.ship.pos.c, b2.ship.pos.d],
        [0, 0, 0, 0],
        0.5,
        'asteroid'
    );
    b2.entities.push(rock);

    // Ensure lives are high enough to not game over immediately (though board default is 3)
    b2.lives = 3;

    // Run update to trigger collision detection
    b2.update(0.016);

    assert(b2.ship.alive === false, "Ship destroyed on collision");
    assert(b2.lives === 2, `Lives decremented (expected 2, got ${b2.lives})`);

    console.log("All 4D Asteroids tests completed!");
}
if (typeof require !== 'undefined' && require.main === module) runTests();
