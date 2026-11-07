/** Controller regressions using real board/search/input logic and a deterministic clock.
 * Run: node games/4d_connect_four/tests/test_connect_four_game.js
 */
const assert = require('node:assert/strict');

Object.assign(globalThis, require('../../4d_generic/base_game.js'));
Object.assign(globalThis, require('../../4d_generic/base_renderer.js'));
Object.assign(globalThis, require('../../4d_generic/input_controller.js'));
Object.assign(globalThis, require('../../4d_generic/game_loop.js'));
Object.assign(globalThis, require('../../4d_generic/score_manager.js'));
Object.assign(globalThis, require('../js/connect_four_board.js'));
Object.assign(globalThis, require('../js/connect_four_renderer.js'));
const { ConnectFourGame } = require('../js/connect_four_game.js');

class Clock {
    constructor() {
        this.now = 0;
        this.nextId = 1;
        this.timers = new Map();
        this.frames = new Map();
    }
    setTimeout(callback, delay) {
        const id = this.nextId++;
        this.timers.set(id, { callback, due: this.now + delay });
        return id;
    }
    advance(milliseconds) {
        const end = this.now + milliseconds;
        for (;;) {
            const next = [...this.timers].filter(([, timer]) => timer.due <= end)
                .sort((a, b) => a[1].due - b[1].due || a[0] - b[0])[0];
            if (!next) break;
            const [id, timer] = next;
            this.now = timer.due;
            this.timers.delete(id);
            timer.callback();
        }
        this.now = end;
    }
}

let clock;
const originals = {
    setTimeout, clearTimeout,
    requestAnimationFrame: globalThis.requestAnimationFrame,
    cancelAnimationFrame: globalThis.cancelAnimationFrame,
    random: Math.random,
};
globalThis.setTimeout = (callback, delay) => clock.setTimeout(callback, delay);
globalThis.clearTimeout = id => clock.timers.delete(id);
globalThis.requestAnimationFrame = callback => {
    const id = clock.nextId++;
    clock.frames.set(id, callback);
    return id;
};
globalThis.cancelAnimationFrame = id => clock.frames.delete(id);
Math.random = () => 0;

function game() {
    const canvas = {
        width: 800, height: 600,
        getContext: () => ({}),
        addEventListener() {},
    };
    return new ConnectFourGame(canvas, { textContent: '', style: {} });
}
function key(g, value) {
    g.input._handleDown({ key: value, preventDefault() {} });
    g.input._handleUp({ key: value });
}
function play(board, columns, c = 1, d = 1) {
    for (const b of columns) {
        const result = board.dropPiece(b, c, d);
        assert.ok(['placed', 'win', 'draw'].includes(result.result));
    }
}
function state(board) {
    return {
        grid: [...board.grid],
        history: board.moveHistory.slice(),
        redo: board.turnManager.redoStack.slice(),
        currentIndex: board.turnManager.currentIndex,
        turnCount: board.turnManager.moveCount,
        moveCount: board.moveCount,
        winner: board.winner,
        gameOver: board.gameOver,
        winLine: board.winLine.slice(),
    };
}
function preserved(board, action) {
    const before = state(board);
    const references = [board.grid, board.moveHistory, board.turnManager.redoStack, board.winLine];
    const result = action();
    assert.deepEqual(state(board), before, 'search restores every board and turn field');
    assert.equal(board.grid, references[0]);
    assert.equal(board.moveHistory, references[1]);
    assert.equal(board.turnManager.redoStack, references[2]);
    assert.equal(board.winLine, references[3]);
    return result;
}

let passed = 0, failed = 0;
function test(name, action) {
    clock = new Clock();
    try {
        action();
        passed++;
        console.log(`PASS ${name}`);
    } catch (error) {
        failed++;
        console.error(`FAIL ${name}`, error);
    }
}

try {
    test('completed AI pair undoes back to the preceding human decision', () => {
        const g = game();
        key(g, 'a');
        g._handleDrop(2, 1, 1);
        clock.advance(399);
        assert.equal(g.board.moveCount, 1);
        assert.equal(g.aiThinking, true);
        clock.advance(1);
        assert.equal(g.board.moveCount, 2);
        assert.equal(g.board.moveHistory[1].player, 2);
        assert.equal(g.board.currentPlayer, 1);
        assert.equal(g.aiThinking, false);
        assert.equal(clock.timers.size, 0);
        const before = state(g.board);
        g._handleDrop(3, 1, 1);
        clock.advance(400);
        key(g, 'u');
        assert.deepEqual([...g.board.grid], before.grid);
        assert.deepEqual(g.board.moveHistory, before.history);
        assert.equal(g.board.moveCount, 2);
        assert.equal(g.board.currentPlayer, 1);
    });

    test('human terminal undo removes only the winning human move', () => {
        const g = game();
        key(g, 'a');
        play(g.board, [2, 3, 2, 3, 2, 3]);
        const before = state(g.board);
        g._handleDrop(2, 1, 1);
        assert.equal(g.board.winner, 1);
        assert.equal(g.board.currentPlayer, 2, 'terminal moves still advance turns');
        assert.equal(clock.timers.size, 0);
        key(g, 'u');
        assert.deepEqual([...g.board.grid], before.grid);
        assert.deepEqual(g.board.moveHistory, before.history);
        assert.equal(g.board.moveCount, 6);
        assert.equal(g.board.currentPlayer, 1);
        assert.equal(g.board.gameOver, false);
        assert.equal(g.board.winner, 0);
        assert.deepEqual(g.board.winLine, []);
    });

    test('AI terminal undo removes its win and the preceding human move', () => {
        const g = game();
        play(g.board, [4, 2, 4, 2, 0, 2]);
        const before = state(g.board);
        key(g, 'a');
        g._handleDrop(0, 1, 1);
        clock.advance(400);
        assert.equal(g.board.winner, 2);
        assert.equal(g.board.currentPlayer, 1);
        key(g, 'u');
        assert.deepEqual([...g.board.grid], before.grid);
        assert.deepEqual(g.board.moveHistory, before.history);
        assert.equal(g.board.moveCount, 6);
        assert.equal(g.board.currentPlayer, 1);
        assert.equal(g.board.gameOver, false);
        assert.equal(g.board.winner, 0);
    });

    test('one pending human move can be undone without a later AI reply', () => {
        const g = game();
        key(g, 'a');
        g._handleDrop(2, 1, 1);
        key(g, 'u');
        assert.equal(g.board.moveCount, 0);
        assert.equal(g.board.currentPlayer, 1);
        assert.equal(g.board.grid.size, 0);
        assert.equal(g.board.moveHistory.length, 0);
        assert.equal(g.aiThinking, false);
        assert.equal(g._aiTimer, null);
        assert.equal(clock.timers.size, 0);
        clock.advance(800);
        assert.equal(g.board.moveCount, 0);
    });

    test('two-human mode undoes exactly one move', () => {
        const g = game();
        play(g.board, [2, 3]);
        key(g, 'u');
        assert.equal(g.board.moveCount, 1);
        assert.equal(g.board.currentPlayer, 2);
    });

    for (const resetKey of ['n', 'r']) {
        test(`${resetKey.toUpperCase()} cancels a queued AI reply and permits a fresh game`, () => {
            const g = game();
            key(g, 'a');
            g.scoring.addScore(1);
            g._handleDrop(2, 1, 1);
            key(g, resetKey);
            assert.equal(g.board.moveCount, 0);
            assert.equal(g.board.currentPlayer, 1);
            assert.equal(g.scoring.score, resetKey === 'n' ? 1 : 0);
            assert.equal(g.aiThinking, false);
            assert.equal(g._aiTimer, null);
            assert.equal(clock.timers.size, 0);
            clock.advance(800);
            assert.equal(g.board.moveCount, 0);
            g._handleDrop(3, 1, 1);
            clock.advance(400);
            assert.equal(g.board.moveCount, 2);
            assert.equal(g.board.currentPlayer, 1);
        });
    }

    for (const disable of ['toggle', 'difficulty']) {
        test(`${disable} disabling cancels the reply; reenabling owns one new timer`, () => {
            const g = game();
            key(g, 'a');
            g._handleDrop(2, 1, 1);
            const before = state(g.board);
            if (disable === 'toggle') key(g, 'a');
            else for (let i = 0; i < 3; i++) key(g, 'd');
            assert.equal(g.aiEnabled, false);
            assert.equal(g.aiThinking, false);
            assert.equal(g._aiTimer, null);
            assert.equal(clock.timers.size, 0);
            clock.advance(800);
            assert.deepEqual(state(g.board), before);
            key(g, 'a');
            assert.equal(clock.timers.size, 1);
            key(g, 'd');
            assert.equal(clock.timers.size, 1, 'difficulty changes do not duplicate the reply');
            clock.advance(400);
            assert.equal(g.board.moveCount, 2);
            assert.equal(g.board.currentPlayer, 1);
            assert.equal(clock.timers.size, 0);
        });
    }

    test('AI execution requires enabled, nonterminal P2 state', () => {
        const g = game();
        preserved(g.board, () => g._aiMove());
        key(g, 'a');
        preserved(g.board, () => g._aiMove());
        play(g.board, [2]);
        key(g, 'a');
        preserved(g.board, () => g._aiMove());
        g.board.reset();
        play(g.board, [2, 3, 2, 3, 2, 3, 2]);
        key(g, 'a');
        preserved(g.board, () => g._aiMove());
        assert.equal(clock.timers.size, 0);
    });

    test('depth-one root and medium AI maximize the actual fixed-P2 evaluator', () => {
        const g = game();
        play(g.board, [0], 0, 0);
        // Keep a genuine redo entry: search must not replace it with simulated moves.
        play(g.board, [1], 0, 0);
        g.board.undoLastMove();
        const center = { b: 2, c: 1, d: 1 };
        const corner = { b: 4, c: 2, d: 2 };
        g.board.dropPiece(center.b, center.c, center.d);
        const centerScore = g.board.evaluatePosition(2);
        g.board.undoLastMove();
        g.board.dropPiece(corner.b, corner.c, corner.d);
        const cornerScore = g.board.evaluatePosition(2);
        g.board.undoLastMove();
        assert.equal(centerScore, 8);
        assert.equal(cornerScore, 6);
        assert.equal(preserved(g.board, () => g._alphaBetaRoot([center, corner], 1)), center);
        assert.equal(preserved(g.board, () => g._bestMoveByEval([corner, center], 1)), center);
    });

    test('hard AI avoids a depth-three forced loss on an actual gravity board', () => {
        const g = game();
        g.board = new ConnectFourBoard(4, 5, 1, 1);
        g.renderer.board = g.board;
        play(g.board, [2, 3, 0, 0, 4, 3, 3, 1, 1, 4, 3, 0, 4, 4, 1], 0, 0);
        const moves = g.board.getValidMoves();
        assert.equal(g.board.currentPlayer, 2);
        assert.equal(g._findImmediateWin(moves, 1), null);
        assert.equal(g._findImmediateWin(moves, 2), null);
        const before = state(g.board);
        g.board.dropPiece(2, 0, 0);
        assert.ok(preserved(g.board, () => g._alphaBeta(2, -Infinity, Infinity, false)) < -100000);
        g.board.undoLastMove();
        assert.deepEqual([...g.board.grid], before.grid);
        const best = preserved(g.board, () => g._alphaBetaRoot(moves, 3));
        assert.equal(best.b, 1);
        g.board.dropPiece(best.b, 0, 0);
        assert.ok(preserved(g.board, () => g._alphaBeta(2, -Infinity, Infinity, false)) > -100000);
        g.board.undoLastMove();
        g.aiDifficulty = 3;
        key(g, 'a');
        clock.advance(400);
        assert.equal(g.board.moveCount, before.moveCount + 1);
        assert.equal(g.board.moveHistory.at(-1).move.quadray.b, 1);
        assert.equal(g.board.currentPlayer, 1);
    });
} finally {
    globalThis.setTimeout = originals.setTimeout;
    globalThis.clearTimeout = originals.clearTimeout;
    for (const name of ['requestAnimationFrame', 'cancelAnimationFrame']) {
        if (originals[name] === undefined) delete globalThis[name];
        else globalThis[name] = originals[name];
    }
    Math.random = originals.random;
}

console.log(`Connect Four controller: ${passed} passed, ${failed} failed`);
process.exitCode = failed ? 1 : 0;
