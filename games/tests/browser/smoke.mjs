import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { advance, key, state, click } from './helpers.mjs';
import { surfaces as boardSurfaces } from './board-scenarios.mjs';
import { surfaces as arcadeSurfaces } from './arcade-scenarios.mjs';
import { surfaces as simulationSurfaces } from './simulation-scenarios.mjs';
import { galleryViews, captureGalleryView } from './gallery.mjs';

const args = process.argv.slice(2);
assert(args.length === 0 || (args.length === 1 && args[0] === '--gallery') ||
    (args.length === 2 && args[0] === '--capture' && args[1].length > 0),
    'Usage: node smoke.mjs [--gallery | --capture <catalog-key>]');
const galleryMode = args[0] === '--gallery';
const captureName = args[0] === '--capture' ? args[1] : undefined;

const gamesRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const repoRoot = resolve(gamesRoot, '..');
const diagnosticsRoot = resolve(process.env.BROWSER_DIAGNOSTICS_DIR || tmpdir());
const withinRepo = relative(repoRoot, diagnosticsRoot);
assert(withinRepo !== '' && (withinRepo.startsWith(`..${sep}`) || isAbsolute(withinRepo)),
    'BROWSER_DIAGNOSTICS_DIR must be outside the repository');
await mkdir(diagnosticsRoot, { recursive: true });
const diagnostics = await mkdtemp(join(diagnosticsRoot, 'quadcraft-browser-'));
console.log(`Browser diagnostics: ${diagnostics}`);
console.log(galleryMode ? 'Mode: selected gallery capture (not the full gate)' :
    captureName ? `Mode: single capture ${captureName} (not the full gate)` : 'Mode: full thirty-game gate');
const results = [];
let server;
let browser;
let serverLog = '';

async function startServer() {
    // Exercise the production launcher server, including its real listen backlog.
    // Resource failures still fail the scenario; no navigation/request retries.
    const serve = `
from functools import partial
from http.server import test
from pathlib import Path
import sys

sys.path.insert(0, str(Path(sys.argv[1]).resolve()))
from src.server.launcher import GameHTTPServer, QuietHTTPHandler

test(HandlerClass=partial(QuietHTTPHandler, directory=sys.argv[1]),
     ServerClass=GameHTTPServer, bind="127.0.0.1", port=0)
`;
    server = spawn(process.env.PYTHON || 'python3', [
        '-I', '-u', '-c', serve, gamesRoot,
    ], { stdio: ['ignore', 'pipe', 'pipe'] });
    return new Promise((resolveURL, reject) => {
        const timer = setTimeout(() => reject(new Error('HTTP server did not announce its port')), 15_000);
        const finish = (error, url) => {
            clearTimeout(timer);
            if (error) reject(error); else resolveURL(url);
        };
        server.once('error', error => finish(error));
        server.once('exit', (code, signal) => finish(new Error(`HTTP server exited: ${code ?? signal}`)));
        const record = chunk => {
            serverLog += chunk.toString();
            const match = serverLog.match(/Serving HTTP on .* port (\d+)/);
            if (match) finish(null, `http://127.0.0.1:${match[1]}`);
        };
        server.stdout.on('data', record);
        server.stderr.on('data', record);
    });
}

async function stopServer() {
    if (!server || server.exitCode !== null || server.signalCode !== null || !server.pid) return;
    const exited = once(server, 'exit');
    server.kill('SIGTERM');
    const force = setTimeout(() => server.kill('SIGKILL'), 3_000);
    try { await exited; } finally { clearTimeout(force); }
}

// Signals still go through finally, so neither Chromium nor the HTTP child leaks.
for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, () => {
        process.exitCode = 1;
        void (async () => {
            try { await browser?.close(); } finally { await stopServer(); }
        })();
    });
}



async function pick(page, kind) {
    return state(page, kind => {
        const b = game.board, r = game.renderer, canvas = game.canvas;
        const rect = canvas.getBoundingClientRect();
        let candidates;
        if (kind === 'connect_four') candidates = r.projectedColumns.map(c => ({ ...c, x: c.px, y: c.py }));
        else if (kind === 'minesweeper') candidates = r.projectedCells.map(c => ({ ...c, x: c.px, y: c.py }));
        else if (kind === 'minecraft') candidates = b.getVisibleBlocks().map(c => ({ ...c, ...r._projectQ(c.pos) }));
        else candidates = b.cells.map(c => ({ ...c, ...r._project(c.a, c.b, c.c, c.d) }));
        for (const candidate of candidates) {
            const { x, y } = candidate;
            if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error('Non-finite projection');
            if (x < 30 || y < 30 || x > canvas.width - 30 || y > canvas.height - 30) continue;
            if (document.elementFromPoint(rect.left + x, rect.top + y) !== canvas) continue;
            const hit = r.hitTest(x, y, game.camera);
            if (!hit) continue;
            if (kind === 'sudoku' && b.isGiven(hit)) continue;
            if (kind === 'memory' && !b.getValue(hit)) continue;
            if (kind === 'go' && (b.getCell(hit) !== 0 ||
                !GridUtils.boundedNeighbors(hit.a, hit.b, hit.c, hit.d, b.size).length)) continue;
            if (kind === 'hex' && b.getCell(hit) !== 0) continue;
            if (kind === 'connect_four' && !(hit.b > 0 && hit.c > 0 && hit.d > 0)) continue;
            if (kind === 'minesweeper' && (b.revealed.has(b.key(hit.a, hit.b, hit.c, hit.d)) ||
                b.flagged.has(b.key(hit.a, hit.b, hit.c, hit.d)))) continue;
            return { x: rect.left + x, y: rect.top + y,
                cell: { a: hit.a, b: hit.b, c: hit.c, d: hit.d } };
        }
        throw new Error(`No visible, unobstructed, pickable ${kind} cell`);
    }, kind);
}

async function go(page) {
    const point = await pick(page, 'go');
    await click(page, point);
    assert.equal(await state(page, () => game.board.moveCount), 1);
    assert.equal(await state(page, c => game.board.getCell(c), point.cell), 1);
    await key(page, 'n');
    assert.equal(await state(page, () => game.board.moveCount), 0);
    assert.equal(await state(page, c => game.board.getCell(c), point.cell), 0);
}
async function hex(page) {
    await click(page, await pick(page, 'hex'));
    assert.equal(await state(page, () => game.board.moveCount), 1);
    const before = await state(page, () => ({ x: game.camera.rotX, y: game.camera.rotY, scale: game.renderer.scale }));
    const point = await pick(page, 'hex');
    await page.keyboard.down('Shift');
    await page.mouse.move(point.x, point.y);
    await page.mouse.down();
    await page.mouse.move(point.x + 60, point.y + 30, { steps: 3 });
    await page.mouse.up();
    await page.keyboard.up('Shift');
    await advance(page);
    const after = await state(page, () => ({ x: game.camera.rotX, y: game.camera.rotY }));
    assert.notDeepEqual(after, { x: before.x, y: before.y }, 'Shift-drag must rotate the real camera');
    await page.mouse.wheel(0, -120);
    await advance(page);
    assert.notEqual(await state(page, () => game.renderer.scale), before.scale);
    const target = await pick(page, 'hex');
    await click(page, target);
    assert.equal(await state(page, () => game.board.moveCount), 2, 'Picking must still work after rotation and zoom');
    assert.equal(await state(page, c => game.board.getCell(c), target.cell), 2);
}
async function lightsOut(page) {
    const point = await pick(page, 'lights_out');
    const before = await state(page, c => game.board.getCell(c), point.cell);
    await click(page, point);
    assert.equal(await state(page, () => game.board.moveCount), 1);
    assert.notEqual(await state(page, c => game.board.getCell(c), point.cell), before);
}
async function memory(page) {
    const point = await pick(page, 'memory');
    await click(page, point);
    assert.equal(await state(page, c => game.board.isRevealed(c), point.cell), true);
    assert.equal(await state(page, () => game.board.selected.length), 1);
}
async function sudoku(page) {
    const point = await pick(page, 'sudoku');
    const value = await state(page, c => game.board.solution.get(game.board.key(c.a, c.b, c.c, c.d)), point.cell);
    await key(page, String(value));
    await click(page, point);
    assert.equal(await state(page, c => game.board.getCell(c), point.cell), value);
    assert.equal(await state(page, () => game.board.moveCount), 1);
    assert.equal(await state(page, () => game.board.errors), 0);
    await key(page, '0');
    assert.equal(await state(page, c => game.board.getCell(c), point.cell), 0);
}
async function sokoban(page) {
    // A real board fixture guarantees key 1 has a legal step, independent of the random level.
    await state(page, () => {
        const b = game.board;
        b.setCell(b.player, CELL.EMPTY);
        b.player = { a: 0, b: 0, c: 0, d: 0 };
        const target = { a: 0, b: 1, c: 1, d: 2 };
        b.walls.delete(b.key(0, 0, 0, 0));
        b.walls.delete(b.key(0, 1, 1, 2));
        b.setCell(b.player, CELL.PLAYER);
        b.setCell(target, CELL.EMPTY);
    });
    await key(page, '1');
    assert.equal(await state(page, () => game.board.moveCount), 1);
    assert.deepEqual(await state(page, () => game.board.player), { a: 0, b: 1, c: 1, d: 2 });
}

async function snake(page) {
    await page.locator('#btnNew').click();
    const before = await state(page, () => ({
        head: game.board.head, direction: game.board.direction.name,
    }));
    await key(page, 'w');
    await advance(page, 250);
    const moved = await state(page, () => ({
        head: game.board.head, direction: game.board.direction.name, over: game.board.gameOver,
    }));
    assert.notEqual(moved.head, before.head, 'The real animation loop must advance Snake');
    assert.notEqual(moved.direction, before.direction, 'Keyboard input must turn the moving snake');
    assert.equal(moved.over, false);

    await page.locator('#btnPause').click();
    const pausedHead = await state(page, () => game.board.head);
    await advance(page, 450);
    assert.equal(await state(page, () => game.board.head), pausedHead, 'Pause must stop movement');

    const camera = await state(page, () => ({ x: game.camera.rotX, y: game.camera.rotY }));
    const box = await page.locator('#gameCanvas').boundingBox();
    await page.keyboard.down('Shift');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 90, box.y + box.height / 2 + 45, { steps: 3 });
    await page.mouse.up();
    await page.keyboard.up('Shift');
    assert.notDeepEqual(await state(page, () => ({ x: game.camera.rotX, y: game.camera.rotY })), camera);

    await page.locator('#btnPause').click();
    await advance(page, 250);
    assert.notEqual(await state(page, () => game.board.head), pausedHead, 'Rotated gameplay must resume');
    assert.equal(await state(page, () => game.board.gameOver), false);
}

async function rogue(page) {
    await state(page, () => {
        const b = game.board;
        for (const c of b.cells) b.setCell(c, TILE.FLOOR);
        b.enemies = []; b.items = [];
        b.player = { a: 0, b: 0, c: 0, d: 0 };
        b.setCell(b.player, TILE.PLAYER);
        b.explored.clear(); b._computeFOV();
    });
    assert.equal(await state(page, () => game.board.isVisible({ a: 0, b: 3, c: 3, d: 6 })), true,
        'Unobstructed FOV must extend beyond adjacent cells');
    await advance(page);
    const region = () => {
        const p = game.renderer._project(0, 3, 3, 6);
        return Array.from(game.canvas.getContext('2d').getImageData(Math.round(p.x) - 8, Math.round(p.y) - 8, 16, 16).data);
    };
    const openPixels = await state(page, region);
    await state(page, () => {
        const b = game.board;
        b.setCell({ a: 0, b: 1, c: 1, d: 2 }, TILE.WALL);
        b.explored.clear(); b._computeFOV();
    });
    await advance(page);
    assert.equal(await state(page, () => game.board.isVisible({ a: 0, b: 3, c: 3, d: 6 })), false);
    assert.notDeepEqual(await state(page, region), openPixels, 'FOV occlusion must change real rendered pixels');
    await state(page, () => {
        const b = game.board;
        b.setCell({ a: 0, b: 1, c: 1, d: 2 }, TILE.FLOOR);
        b.player = { a: 2, b: 1, c: 1, d: 0 };
        b.explored.clear(); b._computeFOV();
    });
    assert.equal(await state(page, () => game.board.isVisible({ a: 0, b: 0, c: 0, d: 0 })), true,
        'FOV rays must survive common-offset gauge crossings');
    const count = await state(page, () => game.board.moveCount);
    await key(page, 'w');
    assert.deepEqual(await state(page, () => game.board.player), { a: 0, b: 0, c: 0, d: 0 });
    assert.equal(await state(page, () => game.board.moveCount), count + 1);
    for (const binding of ['h', 'Shift+KeyH', 't', 'Shift+KeyT', 'f', 'Shift+KeyF', 'm', 'Shift+KeyM']) {
        const action = binding.at(-1).toLowerCase();
        await state(page, () => {
            game.board.hp = 10; game.board.potions = 3;
            game.board.scrolls = { teleport: 3, fireball: 3, mapping: 3 };
        });
        await key(page, binding);
        const remaining = await state(page, action => action === 'h' ? game.board.potions :
            game.board.scrolls[{ t: 'teleport', f: 'fireball', m: 'mapping' }[action]], action);
        assert.equal(remaining, 2, `${binding} must dispatch exactly once`);
    }
    for (const binding of ['n', 'Shift+KeyN']) {
        await state(page, () => { game.board.hp = 1; game.board.moveCount = 7; });
        await key(page, binding);
        assert.equal(await state(page, () => game.board.moveCount), 0);
        assert.equal(await state(page, () => game.board.hp === game.board.maxHp), true);
    }
}
async function minesweeper(page) {
    const point = await pick(page, 'minesweeper');
    await click(page, point, { button: 'right' });
    assert.equal(await state(page, () => game.board.flagged.size), 1);
    assert.equal(await state(page, () => game.board.revealed.size), 0);
    await click(page, point, { button: 'right' });
    assert.equal(await state(page, () => game.board.flagged.size), 0);
    await click(page, point);
    assert.equal(await state(page, () => game.board.gameOver), false, 'First reveal must be safe');
    assert.equal(await state(page, c => game.board.revealed.has(game.board.key(c.a, c.b, c.c, c.d)), point.cell), true);
    assert.equal(await state(page, () => [...game.board.flagged].some(k => game.board.revealed.has(k))), false);
}
async function connectFour(page) {
    const moves = () => game.board.moveCount;
    const turn = () => game.board.currentPlayer;
    await click(page, await pick(page, 'connect_four'));
    assert.equal(await state(page, moves), 1);
    await key(page, 'u');
    assert.equal(await state(page, moves), 0);
    await key(page, 'a');
    for (const resetKey of ['n', 'r']) {
        await click(page, await pick(page, 'connect_four'));
        assert.equal(await state(page, () => game.aiThinking), true);
        await key(page, resetKey);
        await advance(page, 500);
        assert.equal(await state(page, moves), 0, `${resetKey} must cancel pending AI`);
        assert.equal(await state(page, turn), 1);
        assert.equal(await state(page, () => game.aiThinking), false);
    }
    await click(page, await pick(page, 'connect_four'));
    await key(page, 'a');
    await advance(page, 500);
    assert.equal(await state(page, moves), 1, 'Disabling AI must cancel its queued reply');
    assert.equal(await state(page, turn), 2);
    await key(page, 'n');
    await key(page, 'a');
    await click(page, await pick(page, 'connect_four'));
    await advance(page, 500);
    assert.equal(await state(page, moves), 2, 'Virtual clock must execute the actual AI callback');
    await key(page, 'u');
    assert.equal(await state(page, moves), 0, 'Undo a completed human/AI pair');
    assert.equal(await state(page, turn), 1);
    await click(page, await pick(page, 'connect_four'));
    await key(page, 'u');
    await advance(page, 500);
    assert.equal(await state(page, moves), 0, 'Undo while AI is pending must cancel it');
    assert.equal(await state(page, turn), 1);
    for (const winner of [1, 2]) {
        await key(page, 'n');
        await state(page, winner => {
            const b = game.board;
            for (let i = 0; i < (winner === 1 ? 7 : 8); i++) {
                const player = b.currentPlayer;
                const column = player === winner ? 2 : winner === 1 ? 3 : [0, 1, 3, 4][Math.floor(i / 2)];
                b.dropPiece(column, 1, 1);
            }
        }, winner);
        assert.equal(await state(page, () => game.board.winner), winner);
        await key(page, 'u');
        assert.equal(await state(page, moves), 6, `Undo winner ${winner} back to a human decision point`);
        assert.equal(await state(page, turn), 1);
        assert.equal(await state(page, () => game.board.gameOver), false);
    }
    await key(page, 'n');
    const aliases = await state(page, () => {
        const b = game.board;
        b.dropPiece(0, 0, 0); b.dropPiece(1, 1, 1); b.dropPiece(1, 1, 1);
        return [...b.grid.keys()];
    });
    assert.equal(aliases.length, 3);
    assert(aliases.includes('0,0,0,0') && aliases.includes('1,1,1,1'), 'Raw alias slots must remain independent');
    await key(page, 'u');
    assert.equal(await state(page, moves), 2, 'Undo a human move, not an unconditional pair');
    assert.equal(await state(page, () => game.board.grid.has('0,0,0,0')), true);
    assert.equal(await state(page, () => game.board.grid.has('0,1,1,1')), true);
    assert.equal(await state(page, () => game.board.grid.has('1,1,1,1')), false);
}
async function minecraft(page) {
    const before = await state(page, () => game.board.blocks.size);
    const point = await pick(page, 'minecraft');
    await page.keyboard.down('Alt');
    await click(page, point);
    await page.keyboard.up('Alt');
    assert.equal(await state(page, () => game.board.blocks.size), before - 1);
    assert.equal(await state(page, () => game.board.blocksRemoved), 1);
    await key(page, '3');
    assert.equal(await state(page, () => game.board.selectedBlock), 3);
    await page.locator('#verifyBtn').click();
    assert.equal(await page.locator('#verifyList .verify-fail').count(), 0);
    assert.equal(await page.locator('#verifyList .verify-result').count(), 10, 'Nine real math checks plus summary');
}
async function towerDefense(page) {
    const point = await state(page, () => {
        const r = game.renderer, b = game.board, rect = game.canvas.getBoundingClientRect();
        for (const q of r._getGridNodes()) {
            if (b.path.some(w => Quadray.distance(q, w) < 0.1)) continue;
            const p = r._projectQ(q);
            if (p.x < 30 || p.y < 30 || p.x > game.canvas.width - 30 || p.y > game.canvas.height - 30) continue;
            const x = rect.left + p.x, y = rect.top + p.y;
            if (document.elementFromPoint(x, y) === game.canvas) return { x, y };
        }
        throw new Error('No visible buildable tower node');
    });
    const gold = await state(page, () => game.board.gold);
    await page.mouse.move(point.x, point.y);
    await click(page, point);
    assert.equal(await state(page, () => game.board.towers.length), 1);
    assert(await state(page, () => game.board.gold) < gold);
    await key(page, '2');
    assert.equal(await state(page, () => game.selectedTowerType), 'octa');
    await page.getByRole('button', { name: 'Verify Math', exact: true }).click();
    const checks = await page.locator('#verifyResult').innerText();
    assert.equal(checks.split('\n').filter(line => line.startsWith('PASS ')).length, 8);
    assert(!checks.includes('FAIL'));
}
async function doom(page) {
    await page.locator('#startBtn').click();
    const capture = await state(page, async () => ({
        succeeded: await game.mouseLookRequest,
        active: document.pointerLockElement === game.canvas,
        error: game.mouseLookError,
    }));
    assert.equal(capture.succeeded, capture.active, 'Mouse capture status must reflect the actual browser');
    if (!capture.active) {
        assert.equal(await page.locator('#mouseLookStatus').isVisible(), true,
            'Denied mouse capture must be reported visibly, not silently ignored');
    }
    console.log(`Doom mouse capture: ${JSON.stringify(capture)}`);
    await advance(page);
    const before = await state(page, () => ({ a: game.player.a, b: game.player.b }));
    await page.keyboard.down('w');
    await advance(page, 160);
    await page.keyboard.up('w');
    const after = await state(page, () => ({ a: game.player.a, b: game.player.b }));
    assert.notDeepEqual(after, before, 'Real WASD input must move the Doom player');
    assert.equal(await state(page, () => game.geometryVerification.allPassed), true);

    let firing = { exercised: false, reason: 'Native pointer lock denied' };
    if (capture.active) {
        await state(page, () => {
            game.enemies = [];
            game.player.weapons[2] = true;
            game.player.ammo.cells = 100;
        });
        await page.keyboard.press('3');
        await state(page, () => {
            game.lastTime = performance.now();
            game.accumulatorSeconds = 0;
            game.player.cooldown = 0;
        });
        await page.mouse.down();
        await advance(page, 250);
        const held = await state(page, () => {
            game.settleTime(performance.now());
            return game.player.ammo.cells;
        });
        assert.equal(held, 96, 'Initial plasma shot plus three five-tick cooldown shots');
        await page.mouse.up();
        await advance(page, 250);
        assert.equal(await state(page, () => game.player.ammo.cells), held,
            'Release and the following click must stop automatic fire without a duplicate shot');

        await page.keyboard.press('1');
        await state(page, () => {
            game.player.ammo.bullets = 50;
            game.player.cooldown = 0;
            game.player.muzzleFlash = 0;
            game.accumulatorSeconds = 0;
            game.simulationTickCount = 0;
            game.lastTime = performance.now() - 240;
        });
        await page.mouse.down();
        await advance(page, 10);
        const late = await state(page, () => {
            game.settleTime(performance.now());
            return { bullets: game.player.ammo.bullets,
                cooldown: game.player.cooldown, flash: game.player.muzzleFlash };
        });
        assert.deepEqual(late, { bullets: 49, cooldown: 11, flash: 3 },
            'A newly created shot must not age through the preceding stalled frame');
        await page.mouse.up();
        assert.equal(await state(page, () => game.player.ammo.bullets), 49);
        firing = { exercised: true, heldCells: held, lateShot: late };
    }

    // Only time/state is arranged; actual key listeners, map, player and physics run.
    await state(page, () => {
        game.player.alive = false;
        game.player.hp = 0;
        game.accumulatorSeconds = 0;
        game.simulationTickCount = 0;
        game.lastTime = performance.now() - 240;
    });
    await page.keyboard.press('r');
    await page.keyboard.down('w');
    const replacement = await state(page, () => ({ a: game.player.a, b: game.player.b }));
    await advance(page, 10);
    const young = await state(page, () => {
        game.settleTime(performance.now());
        return { a: game.player.a, b: game.player.b, ticks: game.simulationTickCount };
    });
    assert.deepEqual(young, { ...replacement, ticks: 0 },
        'Replacement world must receive only its ten-millisecond lifetime');
    await advance(page, 7);
    const firstTick = await state(page, () => {
        game.settleTime(performance.now());
        return { a: game.player.a, b: game.player.b, ticks: game.simulationTickCount };
    });
    assert.equal(firstTick.ticks, 1);
    assert(Math.abs(firstTick.a - replacement.a - 0.06) < 1e-10);
    assert.equal(firstTick.b, replacement.b);
    await page.keyboard.up('w');
    return { pointerLock: capture.active ? 'active' : 'denied',
        pointerLockError: capture.error, firing, respawnClock: { young, firstTick } };
}

async function bitmap(page, filename) {
    const data = await state(page, () => {
        const c = game.canvas, pixels = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
        let nonBackgroundPixels = 0;
        for (let i = 0; i < pixels.length; i += 4) {
            if (pixels[i] !== pixels[0] || pixels[i + 1] !== pixels[1] ||
                pixels[i + 2] !== pixels[2] || pixels[i + 3] !== pixels[3]) nonBackgroundPixels++;
        }
        return { width: c.width, height: c.height, nonBackgroundPixels, png: c.toDataURL('image/png') };
    });
    const { png, ...details } = data;
    await writeFile(join(diagnostics, filename), Buffer.from(png.split(',')[1], 'base64'));
    return { ...details, screenshot: filename };
}

const surfaces = [
    ['go', go], ['hex', hex], ['lights_out', lightsOut], ['memory', memory],
    ['rogue', rogue], ['sokoban', sokoban], ['sudoku', sudoku], ['doom', doom],
    ['snake', snake],
    ['minesweeper', minesweeper], ['connect_four', connectFour],
    ['tower_defense', towerDefense], ['minecraft', minecraft],
    ...boardSurfaces, ...arcadeSurfaces, ...simulationSurfaces,
];
try {
    assert.equal(surfaces.length, 30, 'Every catalog game must have a live scenario');
    assert.equal(new Set(surfaces.map(([name]) => name)).size, 30, 'Duplicate scenarios must not hide missing games');
    const selected = galleryMode
        ? galleryViews.map(view => surfaces.find(([name]) => name === view.name))
        : captureName ? surfaces.filter(([name]) => name === captureName) : surfaces;
    assert(selected.every(Boolean), 'Every gallery selection must have an existing live scenario');
    assert(selected.length > 0, 'Capture requires an existing catalog key');
    const url = await startServer();
    browser = await chromium.launch({ headless: true }); // Missing runtime is a hard failure, never a skip.
    for (const [name, exercise] of selected) {
        const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
        const page = await context.newPage();
        page.setDefaultTimeout(10_000);
        const log = [], errors = [];
        page.on('console', message => {
            log.push(`[${message.type()}] ${message.text()}`);
            // Chromium may request its optional default icon, absent from these apps.
            if (message.type() === 'error' && !message.location().url.endsWith('/favicon.ico')) {
                errors.push(message.text());
            }
        });
        page.on('pageerror', error => errors.push(error.stack || String(error)));
        page.on('requestfailed', request => errors.push(`${request.url()}: ${request.failure()?.errorText}`));
        page.on('response', response => {
            if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) {
                errors.push(`HTTP ${response.status()}: ${response.url()}`);
            }
        });
        await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
        try {
            // Only randomness/time are controlled. DOM, Canvas, renderer, camera, input,
            // board methods and animation frames are the actual application objects.
            await page.addInitScript(() => {
                let seed = 0x51434146;
                Math.random = () => {
                    seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
                    return (seed >>> 0) / 4294967296;
                };
            });
            const epoch = new Date('2026-01-01T00:00:00Z');
            await page.clock.install({ time: epoch });
            await page.clock.pauseAt(new Date(epoch.getTime() + 1000));
            const response = await page.goto(`${url}/4d_${name}/`, { waitUntil: 'load' });
            assert.equal(response.status(), 200);
            await page.bringToFront();
            await advance(page);
            await page.screenshot({ path: join(diagnostics, `${name}-initial.png`), fullPage: true });
            const details = await exercise(page);
            await advance(page);
            assert.deepEqual(errors, [], `${name}: browser runtime/resource errors`);
            const rendering = captureName
                ? { beforeScreenshot: await bitmap(page, `${name}-bitmap-before.png`) } : undefined;
            await page.screenshot({ path: join(diagnostics, `${name}.png`), fullPage: true });
            if (rendering) rendering.afterScreenshot = await bitmap(page, `${name}-bitmap-after.png`);
            const gallery = galleryMode
                ? { ...await captureGalleryView(page, name, join(diagnostics, `${name}-canvas.png`)),
                    canvasScreenshot: `${name}-canvas.png` }
                : undefined;
            await context.tracing.stop();
            results.push({ name, passed: true, initialScreenshot: `${name}-initial.png`,
                screenshot: `${name}.png`, ...details, ...(gallery ? { gallery } : {}),
                ...(rendering ? { rendering } : {}) });
            console.log(`PASS ${name}`);
        } catch (error) {
            results.push({ name, passed: false, screenshot: `${name}-failure.png`, trace: `${name}-trace.zip`,
                error: error.stack || String(error), runtimeErrors: errors });
            console.error(`FAIL ${name}: ${error.stack || error}`);
            try { await page.screenshot({ path: join(diagnostics, `${name}-failure.png`), fullPage: true }); }
            catch (captureError) { log.push(`Screenshot failed: ${captureError}`); }
            await context.tracing.stop({ path: join(diagnostics, `${name}-trace.zip`) });
        } finally {
            await writeFile(join(diagnostics, `${name}-console.txt`), [...log, ...errors].join('\n'));
            await context.close();
        }
    }
    assert.equal(results.filter(result => !result.passed).length, 0, 'One or more browser surfaces failed');
    assert.equal(results.length, galleryMode ? galleryViews.length : captureName ? 1 : 30);
} catch (error) {
    await writeFile(join(diagnostics, 'harness-error.txt'), error.stack || String(error));
    console.error(error.stack || error);
    process.exitCode = 1;
} finally {
    try { await browser?.close(); } finally { await stopServer(); }
    await writeFile(join(diagnostics, 'server.log'), serverLog);
    await writeFile(join(diagnostics, 'results.json'), JSON.stringify(results, null, 2));
    if (galleryMode || captureName) {
        await writeFile(join(diagnostics, 'capture.json'), JSON.stringify({
            schema: 1, mode: galleryMode ? 'selected-gallery' : 'single-game-capture',
            complete: process.exitCode !== 1,
            browserVersion: browser?.version(), seed: '0x51434146',
            epoch: '2026-01-01T00:00:00Z', viewport: { width: 1440, height: 1000 },
            selection: galleryMode ? galleryViews.map(view => view.name) : [captureName], results,
        }, null, 2));
    }
}
