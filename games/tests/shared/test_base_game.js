/** Fixed-clock regressions through BaseGame and actual Asteroids free flight. */
const assert = require('node:assert/strict');
Object.assign(globalThis, require('../../4d_generic/game_loop.js'));
Object.assign(globalThis, require('../../4d_generic/input_controller.js'));
const { BaseGame } = require('../../4d_generic/base_game.js');
const { AsteroidsBoard, AsteroidsEntity } = require('../../4d_asteroids/js/asteroids_board.js');

class FlightGame extends BaseGame {
    constructor(tickRate = 16) {
        const board = new AsteroidsBoard(32, { seed: 17 });
        board.entities = [board.ship, new AsteroidsEntity([8, 0, 0, 0], [0, 0, 0, 0], 0.01, 'asteroid')];
        board.ship.vel.a = 1;
        super(null, null, board, null, { tickRate });
        // Real lifecycle callback: explicit frames end without enqueueing a RAF.
        // No canvas, scheduler substitutes, or simulation substitutes are involved.
        this.loop.render = () => this.loop.stop();
    }
    update(dt) { this.board.update(dt); }
    frame(timestamp) {
        this.loop.paused = false;
        this.loop._loop(timestamp);
    }
}

let passed = 0, failed = 0;
function check(name, test) {
    try { test(); passed++; console.log('PASS: ' + name); }
    catch (error) { failed++; console.error('FAIL: ' + name, error); }
}
function near(value, expected) { assert.ok(Math.abs(value - expected) < 1e-11, `${value} != ${expected}`); }

check('BaseGame clock advances physical seconds, not milliseconds', () => {
    const game = new FlightGame(50);
    game.frame(125);
    near(game.board.ship.pos.a, 16.1);
    near(game.board.ship.age, 0.1);
    near(game.loop.accumulator, 25);
});
check('partitioned frames and catch-up have identical actual trajectories', () => {
    const regular = new FlightGame(), lagged = new FlightGame();
    for (let time = 16; time <= 192; time += 16) regular.frame(time);
    lagged.frame(192);
    assert.deepEqual(regular.board.ship.pos, lagged.board.ship.pos);
    near(lagged.board.ship.age, 0.192);
});
check('250ms clamp and fractional frame remainder belong to one clock', () => {
    const game = new FlightGame();
    game.frame(1000);
    near(game.board.ship.age, 0.24);
    near(game.loop.accumulator, 10);
    game.frame(1006);
    near(game.board.ship.age, 0.256);
    near(game.loop.accumulator, 0);
});
check('stopped frames cannot advance simulation or consume the remainder', () => {
    const game = new FlightGame();
    game.frame(23);
    const before = { ...game.board.ship.pos };
    game.loop._loop(5000);
    assert.deepEqual(game.board.ship.pos, before);
    near(game.loop.accumulator, 7);
    assert.equal(game.loop.animationId, null);
});
check('stopping from a tick halts catch-up without additional updates', () => {
    const loop = new GameLoop({ tickRate: 16, update: dt => { elapsed += dt; loop.stop(); } });
    let elapsed = 0;
    loop._loop(192);
    near(elapsed, 0.016);
    near(loop.accumulator, 176);
    assert.equal(loop.animationId, null);
});
check('actual end-state HUD distinguishes remaining and exhausted lives', () => {
    const game = new FlightGame();
    game.board.score = 42;
    assert.match(game._getHUDState().text, /42/);
    game.board.lives = 1; game.board.killShip();
    assert.match(game._getHUDState().text, /GAME OVER/);
});

console.log(`${passed} passed, ${failed} failed`);
process.exitCode = failed ? 1 : 0;
