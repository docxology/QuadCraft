import assert from 'node:assert/strict';
import { advance, key, state, click } from './helpers.mjs';

// Only inspect the real model and picker here; every move goes through player input.
async function target(page, kind) {
    return state(page, kind => {
        const b = game.board, r = game.renderer, canvas = game.canvas;
        const rect = canvas.getBoundingClientRect();
        const visible = p => Number.isFinite(p.x) && Number.isFinite(p.y) && p.scale > 0 &&
            p.x > 25 && p.y > 75 && p.x < canvas.width - 25 && p.y < canvas.height - 25 &&
            document.elementFromPoint(rect.left + p.x, rect.top + p.y) === canvas;
        const point = (p, extra) => ({ x: rect.left + p.x, y: rect.top + p.y, ...extra });
        if (kind === 'chess' || kind === 'checkers') {
            for (const piece of b.pieces.values()) {
                if (piece.color !== game.currentPlayer) continue;
                const moves = kind === 'chess' ? piece.getValidMoves(b) : b.getValidMoves(piece);
                if (!moves.length) continue;
                const p = r._projectQ(piece.position);
                const hit = kind === 'chess' ? r.getPositionAtScreen(p.x, p.y) :
                    r.hitTestPiece(p.x, p.y, game.currentPlayer)?.position;
                if (visible(p) && hit && b.getPieceAt(hit) === piece) {
                    return point(p, { from: piece.position.toKey(), color: piece.color });
                }
            }
        } else if (kind === 'checkers-move') {
            for (const move of game.possibleMoves) {
                const p = r._projectQ(move.to);
                if (visible(p) && r.hitTestMove(p.x, p.y, game.possibleMoves) === move) {
                    return point(p, { to: move.to.toKey(), type: move.type });
                }
            }
        } else if (kind === 'reversi') {
            for (const move of r.validMoves) {
                const p = r._projectQ(move.pos);
                if (visible(p) && r.hitTest(p.x, p.y) === move) {
                    return point(p, { pos: move.pos, flips: move.flips });
                }
            }
        } else if (kind === 'backgammon') {
            for (const move of b.getValidMoves()) {
                if (typeof move.from !== 'number' || typeof move.to !== 'number') continue;
                const p = r._projectQ(b.pointToQuadray(move.from));
                if (visible(p) && r.hitTest(p.x, p.y) === move.from) {
                    return point(p, { move, fromCount: b.points[move.from].length,
                        toCount: b.points[move.to].length, diceCount: b.dice.length, color: b.currentPlayer });
                }
            }
        } else if (kind === 'catan' || kind === 'robber') {
            for (let i = 0; i < b.tiles.length; i++) {
                const tile = b.tiles[i], p = r._projectQ(tile.toQuadray());
                if (kind === 'catan' ? !b.isValidSettlementSpot(tile.pos) : tile === b.robber) continue;
                if (visible(p) && r.hitTest(p.x, p.y)?.tile === tile) {
                    return point(p, { pos: tile.pos, index: i });
                }
            }
        } else if (kind === 'mahjong') {
            const tiles = b.getExposedTiles().filter(tile => {
                const p = r._projectQ(tile.toQuadray());
                return visible(p) && r.hitTest(p.x, p.y) === tile;
            });
            for (const tile of tiles) {
                const other = tiles.find(t => tile.matches(t));
                if (other) return [tile, other].map(t => point(r._projectQ(t.toQuadray()), {
                    index: b.tiles.indexOf(t), suit: t.suit, value: t.value,
                }));
            }
        }
        throw new Error(`No visible, unobstructed, pickable ${kind} target`);
    }, kind);
}

async function pixels(page) {
    return state(page, () => game.canvas.toDataURL());
}

async function rendering(page) {
    const image = await state(page, () => {
        const c = game.canvas, rect = c.getBoundingClientRect();
        const data = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
        let colored = 0;
        for (let i = 0; i < data.length; i += 4) {
            if (Math.max(data[i], data[i + 1], data[i + 2]) > 90) colored++;
        }
        return { colored, width: c.width, height: c.height,
            displayWidth: c.clientWidth, displayHeight: c.clientHeight, visible: rect.bottom <= innerHeight };
    });
    assert.equal(image.displayWidth, image.width, 'Canvas must not stretch horizontally');
    assert.equal(image.displayHeight, image.height, 'Canvas must not stretch vertically and break picking');
    assert.ok(image.visible, 'The playable canvas must fit in the viewport');
    assert.ok(image.colored > 500, 'The real canvas must render board geometry and pieces');
    return image.colored;
}

async function chess(page) {
    const piece = await target(page, 'chess');
    await click(page, piece);
    assert.equal(await state(page, () => game.selectedPiece?.position.toKey()), piece.from);
    assert.ok(await state(page, () => game.renderer.validMoves.length) > 0);
    await key(page, 'Escape');
    assert.equal(await state(page, () => game.selectedPiece), null);
    await click(page, piece);
    const move = await state(page, () => ({ to: game.renderer.validMoves[0].toKey(),
        count: game.board.pieces.size, capture: !!game.board.getPieceAt(game.renderer.validMoves[0]) }));
    await key(page, '1');
    assert.equal(await state(page, () => game.moveHistory.length), 1);
    assert.equal(await state(page, () => game.currentPlayer), 'black');
    assert.deepEqual(await state(page, to => {
        const p = game.board.pieces.get(to);
        return { color: p?.color, key: p?.position.toKey(), count: game.board.pieces.size };
    }, move.to), { color: 'white', key: move.to, count: move.count - Number(move.capture) });
    assert.equal(await page.locator('.move-entry').count(), 1);
    return { controls: 'Click piece, Escape, click piece, 1', from: piece.from, to: move.to,
        coloredPixels: await rendering(page) };
}

async function checkers(page) {
    const piece = await target(page, 'checkers');
    await click(page, piece);
    assert.equal(await state(page, () => game.selectedPiece?.position.toKey()), piece.from);
    const move = await target(page, 'checkers-move');
    const before = await pixels(page);
    await click(page, move);
    assert.equal(await state(page, () => game.board.moveCount), 1);
    assert.equal(await state(page, () => game.currentPlayer), 'black');
    assert.equal(await state(page, to => game.board.pieces.get(to)?.color, move.to), 'red');
    assert.equal(await state(page, from => game.board.pieces.has(from), piece.from), false);
    assert.notEqual(await pixels(page), before, 'Moving the checker must change the rendered board');
    return { controls: 'Click red piece, click highlighted destination', from: piece.from, to: move.to,
        type: move.type, coloredPixels: await rendering(page) };
}

async function reversi(page) {
    // Reset after a real move exercises the separate controller turn history, not just the board.
    await click(page, await target(page, 'reversi'));
    await key(page, 'r');
    assert.equal(await state(page, () => game.board.moveCount), 0);
    assert.equal(await state(page, () => game.turnManager.currentPlayer), 'black');
    assert.equal(await state(page, () => game.turnManager.moveHistory.length), 0);
    const move = await target(page, 'reversi'), before = await pixels(page);
    const counts = await state(page, () => ({ black: game.board.count('black'), white: game.board.count('white') }));
    await click(page, move);
    assert.equal(await state(page, () => game.board.moveCount), 1);
    assert.equal(await state(page, c => game.board.getCell(c), move.pos), 'black');
    assert.ok(move.flips.length > 0);
    for (const pos of move.flips) assert.equal(await state(page, c => game.board.getCell(c), pos), 'black');
    assert.equal(await state(page, () => game.board.count('black')), counts.black + 1 + move.flips.length);
    assert.equal(await state(page, () => game.board.count('white')), counts.white - move.flips.length);
    assert.notEqual(await pixels(page), before, 'Placement and flips must be rendered');
    return { controls: 'Click legal move, R, click legal move', pos: move.pos, flipped: move.flips.length,
        coloredPixels: await rendering(page) };
}

async function backgammon(page) {
    const box = await page.locator('#gameCanvas').boundingBox();
    await click(page, { x: box.x + box.width / 2, y: box.y + box.height / 2 });
    assert.ok(await state(page, () => game.board.dice.every(d => d >= 1 && d <= 6)));
    const picked = await target(page, 'backgammon'), before = await pixels(page);
    await click(page, picked);
    assert.equal(await state(page, () => game.board.moveHistory.length), 1);
    assert.equal(await state(page, i => game.board.points[i].length, picked.move.from), picked.fromCount - 1);
    assert.equal(await state(page, i => game.board.points[i].length, picked.move.to), picked.toCount + 1);
    assert.equal(await state(page, i => game.board.points[i].at(-1), picked.move.to), picked.color);
    assert.equal(await state(page, () => game.board.dice.length), picked.diceCount - 1);
    assert.deepEqual(await state(page, () => {
        const m = game.board.moveHistory[0].move; return { from: m.from, to: m.to, die: m.die };
    }), picked.move);
    assert.equal(await state(page, () => game.board.getMetadata().totalStones), 30);
    assert.notEqual(await pixels(page), before, 'The moved stone and consumed die must render');
    return { controls: 'Click canvas to roll, click occupied legal source', move: picked.move,
        coloredPixels: await rendering(page) };
}

async function catan(page) {
    await page.locator('#rollBtn').click();
    await advance(page);
    assert.ok(await state(page, () => game.board.dice.every(d => d >= 1 && d <= 6)));
    if (await state(page, () => game.phase === TurnPhase.ROBBER)) {
        const robber = await target(page, 'robber');
        await click(page, robber);
        assert.equal(await state(page, () => game.board.tiles.indexOf(game.board.robber)), robber.index);
    }
    assert.equal(await state(page, () => game.phase), 'trade');
    await page.getByRole('button', { name: 'Settlement', exact: true }).click();
    await advance(page);
    assert.equal(await state(page, () => game.buildMode), 'settlement');
    const picked = await target(page, 'catan');
    const before = await state(page, () => ({ resources: { ...game.board.players[0].resources },
        points: game.board.players[0].points, count: game.board.players[0].settlements.length }));
    const image = await pixels(page);
    await click(page, picked);
    const after = await state(page, () => ({ resources: game.board.players[0].resources,
        points: game.board.players[0].points, settlements: game.board.players[0].settlements,
        mode: game.buildMode }));
    assert.equal(after.settlements.length, before.count + 1);
    assert.deepEqual(after.settlements.at(-1), { ...picked.pos, isCity: false });
    for (const resource of ['wood', 'brick', 'wheat', 'sheep']) {
        assert.equal(after.resources[resource], before.resources[resource] - 1);
    }
    assert.equal(after.points, before.points + 1);
    assert.equal(after.mode, null);
    assert.match(await page.locator('#logArea').innerText(), /Built settlement!/);
    assert.notEqual(await pixels(page), image, 'Building a settlement must visibly mark the board');
    return { controls: 'Roll Dice button, optional robber click, Settlement button, tile click',
        pos: picked.pos, points: after.points, coloredPixels: await rendering(page) };
}

async function mahjong(page) {
    assert.equal(await state(page, () => game.board.remainingTiles()), 144);
    await key(page, 'h');
    assert.equal(await state(page, () => game.renderer.hintTiles.length), 2);
    assert.equal(await state(page, () => game.renderer.hintTiles.every(t => game.board.isExposed(t))), true);
    const pair = await target(page, 'mahjong');
    const before = await pixels(page);
    await click(page, pair[0]);
    assert.equal(await state(page, () => game.board.tiles.indexOf(game.board.selected)), pair[0].index);
    await click(page, pair[1]);
    assert.equal(await state(page, () => game.board.remainingTiles()), 142);
    assert.equal(await state(page, () => game.board.moves), 1);
    assert.equal(await state(page, () => game.board.selected), null);
    assert.ok(await state(page, () => game.board.score) >= 10);
    assert.equal(await state(page, () => game.scoring.score === game.board.score), true);
    assert.equal(await state(page, pair => pair.every(p => game.board.tiles[p.index].matched), pair), true);
    assert.notEqual(await pixels(page), before, 'Matching tiles must disappear from the real render');
    return { controls: 'H hint, click two exposed matching tiles', suit: pair[0].suit, value: pair[0].value,
        remaining: 142, coloredPixels: await rendering(page) };
}

export const surfaces = [
    ['chess', chess], ['checkers', checkers], ['reversi', reversi],
    ['backgammon', backgammon], ['catan', catan], ['mahjong', mahjong],
];
