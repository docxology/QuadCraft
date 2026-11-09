/** Actual Asteroids kernel regressions; Node and real-Canvas browser entrypoints. */
if (typeof require !== 'undefined') {
    Object.assign(globalThis, require('../../4d_generic/quadray.js'));
    Object.assign(globalThis, require('../../4d_generic/grid_utils.js'));
    Object.assign(globalThis, require('../../4d_generic/synergetics.js'));
    Object.assign(globalThis, require('../../4d_generic/base_board.js'));
    Object.assign(globalThis, require('../../4d_generic/base_renderer.js'));
    Object.assign(globalThis, require('../../4d_generic/game_loop.js'));
    Object.assign(globalThis, require('../../4d_generic/input_controller.js'));
    Object.assign(globalThis, require('../../4d_generic/base_game.js'));
    Object.assign(globalThis, require('../../4d_generic/score_manager.js'));
    Object.assign(globalThis, require('../../4d_generic/projection.js'));
    Object.assign(globalThis, require('../js/asteroids_board.js'));
    Object.assign(globalThis, require('../js/asteroids_renderer.js'));
    Object.assign(globalThis, require('../js/asteroids_game.js'));
}

(async function () {
    let passed = 0, failed = 0;
    function check(name, test) {
        try { test(); passed++; console.log('PASS: ' + name); }
        catch (error) { failed++; console.error('FAIL: ' + name, error); }
    }
    function assert(condition, message) {
        if (!condition) throw new Error(message);
    }
    function near(actual, expected, tolerance = 1e-11) {
        assert(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);
    }
    const entity = (pos, vel, radius, type) => new AsteroidsEntity(pos, vel, radius, type);
    function board() {
        const b = new AsteroidsBoard(8, { seed: 7 });
        b.ship.alive = false;
        b.entities = [];
        return b;
    }
    function safeShipBoard() {
        const b = new AsteroidsBoard(8, { seed: 7 });
        b.entities = [b.ship, entity([2, 0, 0, 0], [0, 0, 0, 0], 0.01, 'asteroid')];
        return b;
    }
    function snapshot(b) {
        return JSON.stringify(b.entities.map(e => ({ pos: e.pos, vel: e.vel, radius: e.radius, type: e.type })));
    }
    function kernelGame() {
        let game;
        if (typeof document !== 'undefined') {
            game = new AsteroidsGame(document.getElementById('gameCanvas'), document.getElementById('hud'));
            game.board = safeShipBoard();
        } else {
            // The actual BaseGame constructor and Asteroids update/input methods,
            // with the browser-only renderer construction deliberately omitted.
            game = Reflect.construct(BaseGame, [null, null, safeShipBoard(), null, { tickRate: 16 }], AsteroidsGame);
            game.scoring = new ScoreManager({ lives: 3, levelThreshold: 1000 });
            game._lastBoardScore = 0;
        }
        // A real loop lifecycle callback permits explicit frames without a fake RAF.
        game.loop.render = () => game.loop.stop();
        return game;
    }
    function frames(game, intervals) {
        let timestamp = 0;
        game.loop.lastTime = 0;
        for (const interval of intervals) {
            timestamp += interval;
            game.loop.paused = false;
            game.loop._loop(timestamp);
        }
    }

    check('continuous positive and negative multi-period wrapping', () => {
        const e = entity([7.9, 0.1, 3, 4], [33, -33, 0, 0], 0.1, 'bullet');
        e.update(0.5, 8);
        near(e.pos.a, 0.4); near(e.pos.b, 7.6); near(e.age, 0.5);
    });
    check('held thrust retains 16ms acceleration tuning and speed cap', () => {
        const game = kernelGame();
        game.input.activeKeys.add('d');
        frames(game, [16]);
        near(game.board.ship.vel.a, 0.3);
        near(game.board.ship.pos.a, 4.0048);
        game.loop.paused = false;
        for (let i = 0; i < 20; i++) game.update(0.016);
        near(game.board.ship.vel.a, 2);
    });
    check('opposing held inputs preserve saturated raw velocity and coasting displacement', () => {
        for (const [axis, keys] of [['c', ['w', 's']], ['a', ['a', 'd']]]) {
            const coast = kernelGame(), held = kernelGame();
            coast.board.ship.vel[axis] = held.board.ship.vel[axis] = 2;
            keys.forEach(key => held.input.activeKeys.add(key));
            frames(coast, [16]); frames(held, [16]);
            for (const component of ['a', 'b', 'c', 'd']) {
                near(held.board.ship.vel[component], coast.board.ship.vel[component]);
                near(held.board.ship.pos[component], coast.board.ship.pos[component]);
            }
            near(held.board.ship.vel[axis], 2);
        }
    });
    check('simultaneous raw-axis thrust is capped once after vector addition', () => {
        const game = kernelGame();
        game.board.ship.vel.c = 2;
        for (const key of ['w', 's', 'a', 'd', 'q', 'e']) game.input.activeKeys.add(key);
        frames(game, [16]);
        const scale = 2 / Math.hypot(0.3, 2, 0.3);
        near(game.board.ship.vel.a, 0);
        near(game.board.ship.vel.b, 0.3 * scale);
        near(game.board.ship.vel.c, 2 * scale);
        near(game.board.ship.vel.d, 0.3 * scale);
        near(Math.hypot(...Object.values(game.board.ship.vel)), 2);
        for (const component of ['a', 'b', 'c', 'd']) {
            near(game.board.ship.pos[component], 4 + game.board.ship.vel[component] * 0.016);
        }
    });
    check('real fixed-loop partition and lag equivalence', () => {
        const regular = kernelGame(), lagged = kernelGame();
        regular.input.activeKeys.add('d'); lagged.input.activeKeys.add('d');
        frames(regular, Array(12).fill(16)); frames(lagged, [192]);
        assert(snapshot(regular.board) === snapshot(lagged.board), 'render partition changed simulation');
        near(regular.board.ship.age, 0.192);
        const clamped = kernelGame();
        clamped.board.ship.vel.a = 0.4;
        frames(clamped, [1000]);
        near(clamped.board.ship.age, 0.24);
        near(clamped.board.ship.pos.a, 4.096);
        near(clamped.loop.accumulator, 10);
    });
    check('paused controller rejects fire, hyperspace, shield and ticks', () => {
        const game = kernelGame();
        game.loop.stop();
        const before = snapshot(game.board);
        for (const key of [' ', 'Shift', 'v']) game.input.actions.get(key)();
        game.update(0.016);
        assert(snapshot(game.board) === before && game.board.shieldCharges === 3, 'pause mutated gameplay');
    });
    check('swept grazing hit is invariant to splitting the free-flight step', () => {
        function run(steps) {
            const b = board();
            const rock = entity([4, 4, 4, 4], [0, 0, 0, 0], 0.05, 'asteroid');
            const bullet = entity([3.9, 4, 4.025, 3.975], [4, 0, 0, 0], 0.01, 'bullet');
            b.entities = [rock, bullet];
            for (const dt of steps) b.update(dt);
            assert(!rock.alive && !bullet.alive, 'grazing intersection missed');
            return b.score;
        }
        assert(run([0.05]) === 100 && run([0.025, 0.025]) === 100, 'partition changed hit');
    });
    check('periodic seam and long multi-period swept hits', () => {
        const b = board();
        const rock = entity([7.95, 0, 0, 0], [0, 0, 0, 0], 0.1, 'asteroid');
        const bullet = entity([0.05, 0, 0, 0], [0, 0, 0, 0], 0.1, 'bullet');
        b.entities = [rock, bullet]; b.update(0.016);
        assert(b.score === 100, 'seam overlap missed');
        const long = board();
        const target = entity([0.1, 0, 0, 0], [0, 0, 0, 0], 0.02, 'asteroid');
        const shot = entity([7.8, 0, 0, 0], [1000, 0, 0, 0], 0.01, 'bullet');
        long.entities = [target, shot]; long.update(0.05);
        assert(long.score === 100 && !shot.alive, 'uncapped image search missed first seam');
        assert(long.particles[0].pos.a === target.pos.a, 'impact event lost target position');
    });
    check('tangent sphere contact is not lost to coordinate roundoff', () => {
        const b = board();
        const target = entity([4, 4, 4, 4], [0, 0, 0, 0], 0.05, 'asteroid');
        const shot = entity([3.9, 4, 4.03, 3.97], [4, 0, 0, 0], 0.01, 'bullet');
        b.entities = [target, shot]; b.update(0.05);
        assert(b.score === 100, 'tangent contact missed');
    });
    check('BCC nearest image differs from raw componentwise minima', () => {
        const b = board();
        const first = { a: 3, b: 3, c: 0, d: 0 }, second = { a: 0, b: 0, c: 3, d: 3 };
        near(b.distanceBetween(first, second), Math.sqrt(8));
        const rock = entity([3, 3, 0, 0], [0, 0, 0, 0], 0.2, 'asteroid');
        const shot = entity([0, 0, 3, 3], [0, 0, 0, 0], 2.7, 'bullet');
        b.entities = [rock, shot]; b.update(0.016);
        assert(b.score === 100, 'true periodic physical overlap missed');
        near(b.distanceBetween(first, { a: 5, b: 5, c: 2, d: 2 }), 0);
    });
    check('nearest-image method agrees with independent exhaustive raw periods', () => {
        const b = board(), random = GridUtils.createSeededRng(912);
        for (let sample = 0; sample < 20; sample++) {
            const first = [random() * 8, random() * 8, random() * 8, random() * 8];
            const second = [random() * 8, random() * 8, random() * 8, random() * 8];
            const q = new Quadray(...first);
            let minimum = Infinity;
            // Legal raw deltas are in (-8,8)^4. These raw image representatives
            // include each possible nearest BCC point, with a spare period.
            for (let a = -2; a <= 2; a++) for (let c = -2; c <= 2; c++)
                for (let d = -2; d <= 2; d++) for (let e = -2; e <= 2; e++) {
                    minimum = Math.min(minimum, Quadray.distance(q, new Quadray(
                        second[0] + 8 * a, second[1] + 8 * c,
                        second[2] + 8 * d, second[3] + 8 * e)));
                }
            near(b.distanceBetween(q, new Quadray(...second)), minimum);
        }
    });
    check('competing projectiles resolve globally by impact time', () => {
        const b = board();
        const first = entity([4.4, 4, 4, 4], [0, 0, 0, 0], 0.03, 'asteroid');
        const second = entity([4.8, 4, 4, 4], [0, 0, 0, 0], 0.03, 'asteroid');
        const late = entity([4, 4, 4, 4], [4, 0, 0, 0], 0.01, 'bullet');
        const early = entity([4.3, 4, 4, 4], [4, 0, 0, 0], 0.01, 'bullet');
        b.entities = [first, second, late, early]; b.update(0.25);
        assert(!first.alive && !second.alive && !late.alive && !early.alive && b.score === 200,
            'stored first projectile stole the early projectile target');
        near(early.pos.a, 4.4 - 0.04 / Math.sqrt(1.5));
        near(late.pos.a, 4.8 - 0.04 / Math.sqrt(1.5));
    });
    check('earliest target wins over UFO type and storage order', () => {
        const b = board();
        const far = entity([4.6, 4, 4, 4], [0, 0, 0, 0], 0.05, 'ufo');
        const close = entity([4.3, 4, 4, 4], [0, 0, 0, 0], 0.05, 'asteroid');
        const shot = entity([4, 4, 4, 4], [4, 0, 0, 0], 0.01, 'bullet');
        b.entities = [far, close, shot]; b.update(0.2);
        assert(!close.alive && far.alive && b.score === 100, 'later UFO stole earlier impact');
    });
    check('moving ship uses relative swept collision through a seam', () => {
        const b = safeShipBoard();
        b.ship.pos = { a: 7.5, b: 0, c: 0, d: 0 };
        b.ship.vel = { a: 20, b: 0, c: 0, d: 0 };
        const rock = entity([0.2, 0, 0, 0], [-4, 0, 0, 0], 0.05, 'asteroid');
        b.entities = [b.ship, rock]; b.update(0.05);
        assert(!b.ship.alive && b.lives === 2, 'ship tunneled through seam target');
    });
    check('splits originate at impact and fragments drift for remaining time', () => {
        const b = board();
        const rock = entity([4.7, 4, 4, 4], [0, 0, 0, 0], 0.4, 'asteroid');
        b.entities = [rock, entity([4, 4, 4, 4], [4, 0, 0, 0], 0.1, 'bullet')];
        b.update(0.2);
        const fragments = b.entities.filter(e => e.type === 'asteroid');
        assert(fragments.length === 2 && fragments.every(e => e.radius === 0.24 && e.age > 0), 'fragments lost residual flight');
        assert(b.score === 100, 'split score wrong');
    });
    check('UFO elapsed remainder also advances newly fired bullets', () => {
        const b = board();
        const ufo = entity([2, 0, 0, 0], [0, 0, 0, 0], 0.05, 'ufo');
        ufo.timer = 1.99;
        b.entities = [ufo, entity([3, 0, 0, 0], [0, 0, 0, 0], 0.01, 'asteroid')];
        b.update(0.05);
        near(ufo.timer, 0.04);
        near(b.entities.find(e => e.type === 'ufo_bullet').age, 0.04);
    });
    check('projectile lifetime truncates its collision trajectory', () => {
        const b = board();
        const shot = entity([4, 4, 4, 4], [4, 0, 0, 0], 0.01, 'bullet'); shot.age = 1.99;
        const target = entity([4.15, 4, 4, 4], [0, 0, 0, 0], 0.01, 'asteroid');
        b.entities = [shot, target]; b.update(0.05);
        assert(!shot.alive && target.alive && b.score === 0, 'expired bullet still collided');
    });
    check('shield absorption, elapsed expiration and end-state command ownership', () => {
        const b = safeShipBoard();
        assert(b.activateShield(), 'shield activation failed');
        b.entities.push(entity([4, 4, 4, 4], [0, 0, 0, 0], 0.1, 'asteroid'));
        b.update(0.016);
        assert(b.ship.alive && b.lives === 3 && !b.shieldActive && b.shieldCharges === 2, 'absorption changed');
        b.update(3); assert(b.activateShield(), 'cooldown remainder lost');
        b.update(5); assert(!b.shieldActive, 'shield failed to expire');
        b.lives = 1; b.killShip();
        const before = snapshot(b); b.thrust([1, 0, 0, 0]); b.shoot([1, 0, 0, 0]); b.hyperspace(); b.update(2);
        assert(b.gameOver && !b.activateShield() && snapshot(b) === before, 'ended world mutated');
    });
    check('seeded stream and reset are independent of global cosmetic draws', () => {
        const first = new AsteroidsBoard(8, { seed: 42 }), second = new AsteroidsBoard(8, { seed: 42 });
        const initial = snapshot(first);
        for (let i = 0; i < 1000; i++) Math.random();
        first.spawnUFO(); second.spawnUFO();
        assert(snapshot(first) === snapshot(second), 'global random consumers perturbed simulation');
        first.reset(); assert(snapshot(first) === initial, 'reset did not replay initial seed');
    });

    // Real elapsed time must not advance a paused/dead world or a reset world.
    const waiting = safeShipBoard(), reset = safeShipBoard();
    waiting.killShip(); reset.killShip(); reset.reset(); reset.ship.pos.a = 1;
    await new Promise(resolve => setTimeout(resolve, 1550));
    check('respawn is simulation-owned, membership survives cleanup, reset cancels old state', () => {
        assert(!waiting.ship.alive && reset.ship.pos.a === 1, 'wall-clock callback mutated world');
        for (let i = 0; i < 60; i++) { const e = entity([0, 0, 0, 0], [0, 0, 0, 0], 0.1, 'bullet'); e.alive = false; waiting.entities.push(e); }
        waiting.update(1.49);
        assert(!waiting.ship.alive && waiting.entities.includes(waiting.ship), 'dead ship lost ownership');
        waiting.update(0.01);
        assert(waiting.ship.alive && waiting.entities.filter(e => e === waiting.ship).length === 1, 'respawn missing or duplicated ship');
        near(waiting.ship.pos.a, 4);
    });

    if (typeof document !== 'undefined') {
        check('real Canvas legal high-depth rendering and render-independent seed stream', () => {
            const b = safeShipBoard(), twin = safeShipBoard();
            const renderer = new AsteroidsRenderer(document.getElementById('gameCanvas'), b);
            b.entities.push(entity([0, 0, 7, 7], [0, 0, 0, 0], 0.1, 'bullet'));
            for (const [rx, ry] of [[0.5, 0.7], [0, 0], [Math.PI, Math.PI / 2], [-2, 5]]) {
                renderer.rotX = rx; renderer.rotY = ry;
                for (let mask = 0; mask < 16; mask++) {
                    const p = renderer._project(mask & 1 ? 8 : 0, mask & 2 ? 8 : 0, mask & 4 ? 8 : 0, mask & 8 ? 8 : 0);
                    assert(Number.isFinite(p.x) && Number.isFinite(p.y) && p.scale > 0, 'legal corner behind camera');
                    assert(p.x >= 0 && p.x <= 800 && p.y >= 0 && p.y <= 600, 'corner outside fitted canvas');
                }
                renderer.render(); // Actual Canvas arc calls; no fake context.
            }
            b.entities.pop(); b.spawnUFO(); twin.spawnUFO();
            assert(snapshot(b) === snapshot(twin), 'actual renderer perturbed board RNG');
        });
    }
    const summary = `${passed} passed, ${failed} failed`;
    console.log(summary);
    globalThis.asteroidsTestResults = { passed, failed };
    if (typeof document !== 'undefined') document.getElementById('results').textContent = summary;
    if (typeof process !== 'undefined') process.exitCode = failed ? 1 : 0;
})().catch(error => {
    console.error(error);
    if (typeof process !== 'undefined') process.exitCode = 1;
});
