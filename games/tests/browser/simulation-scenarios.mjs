import assert from 'node:assert/strict';
import { advance, key, state, canvasPixels } from './helpers.mjs';

async function twenty48(page) {
    // A legal raw-label IVM merge; the action must come from the real keyboard binding.
    await state(page, () => {
        for (const cell of game.board.cells) game.board.setCell(cell, 0);
        game.board.setCell({ a: 0, b: 0, c: 0, d: 0 }, 2);
        game.board.setCell({ a: 0, b: 1, c: 1, d: 2 }, 2);
    });
    await advance(page);
    const before = await canvasPixels(page);
    await key(page, 'p');
    const paused = await state(page, () => ({
        tiles: game.board.cells.map(cell => game.board.getCell(cell)),
        moves: game.board.moveCount, score: game.scoring.score,
    }));
    await key(page, '1');
    assert.deepEqual(await state(page, () => ({
        tiles: game.board.cells.map(cell => game.board.getCell(cell)),
        moves: game.board.moveCount, score: game.scoring.score,
    })), paused, 'Paused direction input must preserve tiles, moves and score');
    await key(page, 'p');
    await key(page, '1');
    assert.equal(await state(page, () => game.board.getCell({ a: 0, b: 1, c: 1, d: 2 })), 4);
    assert.equal(await state(page, () => game.board.moveCount), 1);
    assert.equal(await state(page, () => game.scoring.score), 4);
    assert.notEqual(await canvasPixels(page), before, 'Merged tile must be rendered');
    await key(page, 'r');
    assert.equal(await state(page, () => game.board.moveCount), 0);
    assert.equal(await state(page, () => game.scoring.score), 0);
    assert.equal(await state(page, () => game.board.cells.filter(c => game.board.getCell(c) > 0).length), 2);
    return { controls: ['P: pause/resume', '1: merge', 'R: reset'], transition: 'paused input ignored, two 2 tiles merge to 4 and reset' };
}

async function life(page) {
    await key(page, 'p');
    await state(page, () => {
        const b = game.board;
        b.cells.clear();
        for (const q of [[3,3,3,3], [3,3,3,4], [3,3,4,3], [3,4,3,3], [4,3,3,3], [0,0,4,7]])
            b.set(...q, true);
        game.renderer.render();
    });
    const before = await canvasPixels(page);
    const generation = await state(page, () => game.board.generation);
    await page.locator('#stepBtn').click();
    assert.equal(await state(page, () => game.board.generation), generation + 1);
    assert.equal(await state(page, () => game.board.isAlive(0, 0, 4, 7)), false, 'An isolated raw cell dies');
    assert(await state(page, () => game.board.cells.size) > 0, 'The five-cell cluster must evolve, not merely clear');
    assert.notEqual(await canvasPixels(page), before, 'Paused single-step must redraw actual living cells');
    await advance(page, 600);
    assert.equal(await state(page, () => game.board.generation), generation + 1, 'Pause stops automatic generations');
    const speed = await state(page, () => game.speed);
    await key(page, 'ArrowUp');
    assert.equal(await state(page, () => game.speed), speed - 50);
    await key(page, 'p');
    await advance(page, 600);
    assert(await state(page, () => game.board.generation) > generation + 1);
    // Rotation-independent fit must include even the formerly behind-camera corner.
    const box = await page.locator('#gameCanvas').boundingBox();
    await page.keyboard.down('Shift');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 120, box.y + box.height / 2 + 70, { steps: 4 });
    await page.mouse.up();
    await page.keyboard.up('Shift');
    await advance(page);
    assert.equal(await state(page, () => {
        for (const a of [0,7]) for (const b of [0,7]) for (const c of [0,7]) for (const d of [0,7]) {
            const p = game.renderer._project(a,b,c,d);
            if (!(p.scale > 0 && p.x >= 0 && p.x <= game.canvas.width && p.y >= 0 && p.y <= game.canvas.height)) return false;
        }
        return true;
    }), true, 'Full raw board extent must remain in front of camera and on canvas after rotation');
    await key(page, 'r');
    await key(page, 'p');
    assert(await state(page, () => game.board.cells.size) > 0, 'Reseed must restore a visible live population');
    return { controls: ['P: pause/resume', 'Step: evolve', 'ArrowUp: speed', 'Shift-drag: rotate', 'R: reseed'],
        transition: 'birth/death, paused redraw, automatic generations and reseed' };
}

async function simant(page) {
    await key(page, 'p');
    const before = await state(page, () => ({ food: game.board.foodStored[0], ants: game.board.ants.length, tick: game.board.tick }));
    await advance(page, 450);
    assert.equal(await state(page, () => game.board.tick), before.tick);
    await key(page, 'e');
    assert.equal(await state(page, () => game.board.foodStored[0]), before.food - 15);
    assert.equal(await state(page, () => game.board.ants.length), before.ants + 1);
    assert.equal(await state(page, () => game.board.ants.at(-1).caste), 3);
    await key(page, 'a');
    assert.equal(await state(page, () => game.board.yellowAssistEnabled), true);
    await key(page, '3');
    assert.equal(await state(page, () => game.loop.tickRate), 50);
    const pixels = await canvasPixels(page);
    await key(page, 'p');
    await advance(page, 300);
    assert(await state(page, () => game.board.tick) > before.tick);
    assert.notEqual(await canvasPixels(page), pixels, 'Purchased scout and colony evolution must redraw');
    const labels = await state(page, () => game.renderer.showLabels);
    const rendered = await canvasPixels(page);
    await key(page, 'l');
    assert.equal(await state(page, () => game.renderer.showLabels), !labels);
    assert.notEqual(await canvasPixels(page), rendered, 'Coordinate labels must actually render');
    // Resizing clears Canvas even while time is paused. Match the actual
    // queen sprites at their projected world positions, not a HUD pixel count.
    await key(page, 'p');
    const model = () => ({
        tick: game.board.tick, food: [...game.board.foodStored], score: game.scoring.score,
        ants: game.board.ants.map(a => ({ a: a.a, b: a.b, c: a.c, d: a.d,
            energy: a.energy, hp: a.hp, carrying: a.carrying, alive: a.alive })),
    });
    const queens = () => game.board.queens.map(queen => {
        const r = game.renderer, c = game.canvas;
        const p = r._projectQ(queen.a, queen.b, queen.c, queen.d);
        const visible = Number.isFinite(p.x) && Number.isFinite(p.y) && p.scale > 0 &&
            p.x > 0 && p.x < c.width && p.y > 0 && p.y < c.height;
        if (!visible) return { faction: queen.faction, visible, matchedSpritePixels: 0 };
        const sprite = r.sprites[queen.faction === 0 ? 'queen_yellow' : 'queen_red'];
        const color = sprite.getContext('2d').getImageData(sprite.width / 2, sprite.height / 2, 1, 1).data;
        const radius = Math.ceil(sprite.width * p.scale / 2);
        const x = Math.max(0, Math.floor(p.x) - radius), y = Math.max(0, Math.floor(p.y) - radius);
        const width = Math.min(c.width - x, radius * 2), height = Math.min(c.height - y, radius * 2);
        const pixels = c.getContext('2d').getImageData(x, y, width, height).data;
        let matchedSpritePixels = 0;
        for (let i = 0; i < pixels.length; i += 4) {
            if (pixels[i] === color[0] && pixels[i + 1] === color[1] &&
                pixels[i + 2] === color[2] && pixels[i + 3] === color[3]) matchedSpritePixels++;
        }
        return { faction: queen.faction, visible, matchedSpritePixels };
    });
    const beforeResize = await state(page, model);
    const beforeQueens = await state(page, queens);
    assert(beforeQueens.every(q => q.visible && q.matchedSpritePixels > 20),
        'Both colony queen landmarks must be visibly painted before resize');
    // Observe calls to the real streams without consuming or replacing outcomes.
    await state(page, () => {
        const rng = game.board.rng, random = Math.random;
        let boardCalls = 0, cosmeticCalls = 0;
        game.board.rng = () => { boardCalls++; return rng(); };
        Math.random = () => { cosmeticCalls++; return random(); };
        window.simantResizeRandomProbe = () => {
            game.board.rng = rng;
            Math.random = random;
            return { boardCalls, cosmeticCalls };
        };
    });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.screenshot({ fullPage: true });
    const randomUsage = await state(page, () => {
        const usage = window.simantResizeRandomProbe();
        delete window.simantResizeRandomProbe;
        return usage;
    });
    assert.deepEqual(randomUsage, { boardCalls: 0, cosmeticCalls: 0 }, 'Paused resize must not advance RNG streams');
    assert.deepEqual(await state(page, model), beforeResize,
        'Paused resize must preserve colony ticks, positions, health, energy, carrying, food and score');
    const afterQueens = await state(page, queens);
    assert(afterQueens.every(q => q.visible && q.matchedSpritePixels > 20),
        'Paused resize must repaint both projected colony queen landmarks, not just HTML/HUD panels');
    const scene = { beforeQueens, afterQueens, randomUsage, pausedTick: beforeResize.tick };
    return { controls: ['P: pause/resume', 'E: scout', 'A: assist', '3: fast', 'L: labels'],
        transition: 'resource-funded scout purchase, live colony ticks and paused resize repaint', scene };
}

async function invaders(page) {
    const before = await state(page, () => ({ ...game.board.ship }));
    const pixels = await canvasPixels(page);
    await page.keyboard.down('ArrowRight');
    await page.keyboard.down('ArrowUp');
    await advance(page, 130);
    await page.keyboard.up('ArrowRight');
    await page.keyboard.up('ArrowUp');
    const moved = await state(page, () => ({ ...game.board.ship }));
    assert(moved.b > before.b && moved.c > before.c, 'Held keys must move ship on two board axes');
    await key(page, 'Space');
    assert(await state(page, () => game.board.bullets.some(b => b.owner === 'player')), 'Space must create a real moving projectile');
    assert.notEqual(await canvasPixels(page), pixels, 'Ship movement and shot must be rendered');
    await key(page, 'p');
    const frozen = await state(page, () => game.board.stepCount);
    await advance(page, 400);
    assert.equal(await state(page, () => game.board.stepCount), frozen);
    await key(page, 'p');
    await advance(page, 200);
    assert(await state(page, () => game.board.stepCount) > frozen);
    return { controls: ['held Right+Up: ship', 'Space: fire', 'P: pause/resume'], transition: 'ship movement, live projectile, frozen/resumed formation' };
}

async function tetris(page) {
    const before = await state(page, () => ({ ...game.board.activePiece.pos }));
    const pixels = await canvasPixels(page);
    await key(page, 'ArrowLeft');
    assert.equal(await state(page, () => game.board.activePiece.pos.b), before.b - 1);
    await advance(page, 600);
    assert(await state(page, () => game.board.activePiece.pos.a) < before.a, 'Real gravity must advance the piece');
    await key(page, 'Space');
    assert.equal(await state(page, () => game.board.getLockedCells().length), 4);
    assert(await state(page, () => game.board.score) > 0);
    assert.notEqual(await canvasPixels(page), pixels, 'Falling, locked and respawned pieces must render');
    await key(page, 'p');
    const frozen = await state(page, () => game.board.activePiece.pos);
    await advance(page, 700);
    assert.deepEqual(await state(page, () => game.board.activePiece.pos), frozen);
    await key(page, 'p');
    await advance(page, 600);
    assert(await state(page, () => game.board.activePiece.pos.a) < frozen.a);
    return { controls: ['Left: move', 'Space: hard drop', 'P: pause/resume'], transition: 'gravity, four locked cells, scoring and respawn' };
}

export const surfaces = [['2048', twenty48], ['life', life], ['simant', simant], ['space_invaders', invaders], ['tetris', tetris]];
