import assert from 'node:assert/strict';
import { advance, key, state } from './helpers.mjs';

// Read real canvas pixels near a real projected entity, not a substitute renderer.
async function visible(page, position) {
    const result = await state(page, q => {
        const r = game.renderer, c = game.canvas;
        const p = r._project(q.a, q.b, q.c, q.d);
        if (![p.x, p.y, p.scale].every(Number.isFinite) || p.scale <= 0 ||
            p.x < 20 || p.y < 20 || p.x >= c.width - 20 || p.y >= c.height - 20) {
            throw new Error(`Entity is not visibly projected: ${JSON.stringify(p)}`);
        }
        const pixels = r.ctx.getImageData(Math.round(p.x) - 16, Math.round(p.y) - 16, 33, 33).data;
        let colored = 0;
        for (let i = 0; i < pixels.length; i += 4) {
            if (Math.max(pixels[i], pixels[i + 1], pixels[i + 2]) > 100 &&
                Math.max(pixels[i], pixels[i + 1], pixels[i + 2]) - Math.min(pixels[i], pixels[i + 1], pixels[i + 2]) > 30) colored++;
        }
        return { x: p.x, y: p.y, scale: p.scale, colored };
    }, position);
    assert(result.colored > 0, 'The projected entity neighborhood must contain rendered color');
    return result;
}

async function hold(page, name, ms) {
    await page.keyboard.down(name);
    await advance(page, ms);
    await page.keyboard.up(name);
}

async function asteroids(page) {
    const before = await state(page, () => ({ pos: { ...game.board.ship.pos }, image: game.canvas.toDataURL() }));
    await hold(page, 'd', 192);
    const after = await state(page, () => ({ pos: game.board.ship.pos, vel: game.board.ship.vel, image: game.canvas.toDataURL() }));
    assert(after.vel.a > 0, 'D thrust must accelerate the ship');
    assert.notDeepEqual(after.pos, before.pos);
    assert.notEqual(after.image, before.image, 'Thrust must change the real canvas');
    await key(page, 'Space');
    const bullets = await state(page, () => game.board.entities.filter(e => e.alive && e.type === 'bullet').map(e => ({ ...e.pos })));
    assert(bullets.length > 0, 'Space must fire a live projectile');
    const rendered = await visible(page, bullets[0]);
    await key(page, 'v');
    assert.equal(await state(page, () => game.board.shieldActive), true);
    await key(page, 'p');
    const frozen = await state(page, () => ({ ...game.board.ship.pos }));
    await advance(page, 320);
    assert.deepEqual(await state(page, () => game.board.ship.pos), frozen, 'Pause must stop physics');
    await key(page, 'p');
    const waveBase = await state(page, () => game.board.waveBaseAsteroids);
    const thrustSamples = [];
    for (const sample of [
        { axis: 'c', keys: [] },
        { axis: 'c', keys: ['w', 's'] },
        { axis: 'a', keys: ['a', 'd'] },
        { axis: 'c', keys: ['w', 's', 'a', 'd', 'q', 'e'] },
    ]) {
        await state(page, axis => {
            game.board.waveBaseAsteroids = 0;
            game.reset();
            game.board.entities = [game.board.ship];
            game.board.ship.vel[axis] = 2;
        }, sample.axis);
        for (const name of sample.keys) await page.keyboard.down(name);
        await advance(page, 32);
        for (const name of sample.keys) await page.keyboard.up(name);
        const actual = await state(page, () => ({
            vel: { ...game.board.ship.vel }, pos: { ...game.board.ship.pos }, age: game.board.ship.age,
        }));
        const ticks = Math.round(actual.age / 0.016);
        assert(ticks > 0 && Math.abs(actual.age - ticks * 0.016) < 1e-12,
            'Held-input samples must advance real fixed controller ticks');
        const expectedVel = { a: 0, b: 0, c: 0, d: 0 };
        const expectedPos = { a: 4, b: 4, c: 4, d: 4 };
        expectedVel[sample.axis] = 2;
        for (let tick = 0; tick < ticks; tick++) {
            if (sample.keys.includes('q')) {
                expectedVel.b += 0.3;
                expectedVel.d += 0.3;
            }
            const speed = Math.hypot(...Object.values(expectedVel));
            for (const axis of ['a', 'b', 'c', 'd']) {
                if (speed > 2) expectedVel[axis] *= 2 / speed;
                expectedPos[axis] += expectedVel[axis] * 0.016;
            }
        }
        for (const axis of ['a', 'b', 'c', 'd']) {
            assert(Math.abs(actual.vel[axis] - expectedVel[axis]) < 1e-11,
                `Held ${sample.keys.join('+') || 'coast'} must add raw acceleration before the speed cap`);
            assert(Math.abs(actual.pos[axis] - expectedPos[axis]) < 1e-11,
                'Real-loop displacement must follow the settled raw velocity');
        }
        thrustSamples.push({ ...sample, ticks, velocity: actual.vel });
    }
    await state(page, value => { game.board.waveBaseAsteroids = value; game.reset(); }, waveBase);
    return { controls: 'D thrust, Space fire, V shield, P pause/resume, saturated W+S/A+D and combined thrust', projectile: rendered, thrustSamples };
}

async function bomberman(page) {
    await key(page, 'ArrowUp');
    assert.deepEqual(await state(page, () => game.board.player), { a: 1, b: 0, c: 0, d: 0 });
    await key(page, 'Space');
    const bomb = await state(page, () => game.board.bombs[0]);
    assert(bomb && bomb.timer > 0, 'Space must place a ticking bomb');
    assert.equal(await state(page, () => game.board.activeBombs), 1);
    const rendered = await visible(page, bomb);
    // Escape in two independent raw axes; neither blast ray reaches (1,1,1,0).
    await key(page, 'ArrowRight');
    await key(page, 'e');
    assert.deepEqual(await state(page, () => game.board.player), { a: 1, b: 1, c: 1, d: 0 });
    const steps = await state(page, () => game.board.stepCount);
    // Stop on the actual explosion tick so the screenshot captures its rendering.
    for (let i = 0; i < 12 && await state(page, () => game.board.bombs.length); i++) await advance(page, 100);
    assert.equal(await state(page, () => game.board.bombs.length), 0);
    assert.equal(await state(page, () => game.board.activeBombs), 0);
    assert(await state(page, () => game.board.stepCount) > steps);
    assert(await state(page, () => game.board.explosions.size) > 0, 'Bomb fuse must generate real blast cells');
    assert.equal(await state(page, () => game.board.lives), 3, 'Escaping across axes must avoid the blast');
    await visible(page, bomb);
    return { controls: 'Up, Space, Right, E', bomb: rendered, explosionCells: await state(page, () => game.board.explosions.size) };
}

async function pacman(page) {
    const choice = await state(page, () => {
        const b = game.board;
        const keys = ['ArrowUp', 'ArrowDown', 'ArrowRight', 'ArrowLeft', 'e', 'q', 'x', 'z'];
        for (let i = 0; i < keys.length; i++) {
            const d = PacManBoard.DIRECTIONS[i], p = b.pacman;
            const target = { a: b.wrap(p.a + d.da), b: b.wrap(p.b + d.db), c: b.wrap(p.c + d.dc), d: b.wrap(p.d + d.dd) };
            const k = b.key(target.a, target.b, target.c, target.d);
            if (!b.walls.has(k) && b.pellets.has(k)) return { key: keys[i], target, k, eaten: b.pelletsEaten, score: b.score };
        }
        throw new Error('No real pellet reachable with a bound movement key');
    });
    const before = await state(page, () => game.canvas.toDataURL());
    await key(page, choice.key);
    // One fixed grid tick, regardless of the runner's initial sub-tick phase.
    for (let i = 0; i < 3 && await state(page, k => game.board.pellets.has(k), choice.k); i++) await advance(page, 50);
    assert.equal(await state(page, k => game.board.pellets.has(k), choice.k), false);
    assert(await state(page, () => game.board.pelletsEaten) > choice.eaten);
    assert(await state(page, () => game.board.score) >= choice.score + 10);
    assert.notEqual(await state(page, () => game.canvas.toDataURL()), before);
    const rendered = await visible(page, await state(page, () => game.board.pacman));
    await page.locator('#btnPause').click();
    assert.equal(await state(page, () => game.loop.paused), true);
    const frozen = await state(page, () => ({ ...game.board.pacman }));
    await advance(page, 450);
    assert.deepEqual(await state(page, () => game.board.pacman), frozen);
    await page.locator('#btnPause').click();
    return { controls: `${choice.key}, Pause button`, pellet: choice.target, pacman: rendered };
}

async function pong(page) {
    const before = await state(page, () => ({ paddle: { ...game.board.paddle1 }, ball: { ...game.board.ball }, image: game.canvas.toDataURL() }));
    await hold(page, 'ArrowRight', 160);
    assert(await state(page, () => game.board.paddle1.b) > before.paddle.b);
    await key(page, 't');
    assert.equal(await state(page, () => game.board.twoPlayerMode), true);
    const second = await state(page, () => game.board.paddle2.c);
    await hold(page, 'i', 160);
    assert(await state(page, () => game.board.paddle2.c) > second, 'I must move the actual second paddle');
    for (let i = 0; i < 15 && await state(page, () => game.board.isServing); i++) await advance(page, 64);
    await advance(page, 32);
    assert.equal(await state(page, () => game.board.isServing), false);
    assert.notDeepEqual(await state(page, () => game.board.ball), before.ball, 'Serve timer must launch the ball');
    assert.notEqual(await state(page, () => game.canvas.toDataURL()), before.image);
    return { controls: 'Right, T two-player, I second paddle', ball: await visible(page, await state(page, () => game.board.ball)) };
}

async function breakout(page) {
    const before = await state(page, () => ({ paddle: { ...game.board.paddle }, ball: { ...game.board.ball }, image: game.canvas.toDataURL(), bricks: game.board.getBrickCount() }));
    await hold(page, 'ArrowRight', 80);
    await hold(page, 'e', 60);
    assert(await state(page, () => game.board.paddle.b) > before.paddle.b);
    assert(await state(page, () => game.board.paddle.d) > before.paddle.d);
    assert.notDeepEqual(await state(page, () => game.board.ball), before.ball);
    // Let the natural ball trajectory reach the actual brick field.
    for (let i = 0; i < 40 && await state(page, () => game.board.score) === 0; i++) await advance(page, 100);
    assert(await state(page, () => game.board.score) > 0, 'The running ball must hit and score against real bricks');
    assert(await state(page, () => game.board.getBrickCount()) <= before.bricks);
    assert.notEqual(await state(page, () => game.canvas.toDataURL()), before.image);
    return { controls: 'Right and E paddle movement', score: await state(page, () => game.board.score), ball: await visible(page, await state(page, () => game.board.ball)) };
}

async function frogger(page) {
    const before = await state(page, () => ({ frog: { ...game.board.frog }, obstacles: game.board.obstacles.map(o => ({ ...o })), time: game.board.timeLeft, image: game.canvas.toDataURL() }));
    // Leave the center depth slice before entering traffic.
    await key(page, 'e');
    await key(page, 'x');
    await key(page, 'ArrowUp');
    assert.deepEqual(await state(page, () => game.board.frog), { a: 1, b: before.frog.b, c: 2, d: 2 });
    assert.equal(await state(page, () => game.board.maxRow), 1);
    assert.equal(await state(page, () => game.board.score), 10);
    assert.equal(await state(page, () => game.board.lives), 3);
    assert(await state(page, () => game.board.timeLeft) < before.time);
    assert.notDeepEqual(await state(page, () => game.board.obstacles), before.obstacles, 'Traffic must advance through the real loop');
    assert.notEqual(await state(page, () => game.canvas.toDataURL()), before.image);
    return { controls: 'E, X depth hops, Up forward', frog: await visible(page, await state(page, () => game.board.frog)) };
}

export const surfaces = [
    ['asteroids', asteroids], ['bomberman', bomberman], ['pacman', pacman],
    ['pong', pong], ['breakout', breakout], ['frogger', frogger],
];
