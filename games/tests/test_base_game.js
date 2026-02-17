/**
 * test_base_game.js — Tests for BaseGame module
 *
 * Tests: constructor setup, init, togglePause, reset, _getHUDState, _syncCamera.
 * Since BaseGame requires GameLoop and InputController, we mock them.
 * Run: node games/tests/test_base_game.js
 */
const path = require('path');

let passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) { passed++; console.log(`  ✅ ${msg}`); }
    else { failed++; console.error(`  ❌ ${msg}`); }
}

console.log('╔═══════════════════════════════════╗');
console.log('║   Test: BaseGame Module           ║');
console.log('╚═══════════════════════════════════╝\n');

// --- Provide global mocks for GameLoop, InputController, etc. ---
class MockGameLoop {
    constructor(opts) {
        this.updateFn = opts.update;
        this.renderFn = opts.render;
        this.tickRate = opts.tickRate;
        this.paused = false;
        this.running = false;
    }
    start() { this.running = true; }
    stop() { this.running = false; }
    togglePause() { this.paused = !this.paused; }
}

class MockInputController {
    constructor() { this.bindings = []; this.attached = false; this._keys = {}; }
    bind(keys, fn) { this.bindings.push({ keys, fn }); }
    attach() { this.attached = true; }
    detach() { this.attached = false; }
    isDown(k) { return !!this._keys[k]; }
}

// Inject globals
global.GameLoop = MockGameLoop;
global.InputController = MockInputController;

// Now load BaseGame
const { BaseGame } = require(path.join(__dirname, '..', '4d_generic', 'base_game.js'));

// --- Mock dependencies ---
function mockCanvas() {
    return {
        width: 400, height: 400,
        getContext: () => ({
            fillRect: () => { }, fillText: () => { },
            fillStyle: '', font: '', textAlign: '',
            beginPath: () => { }, arc: () => { }, fill: () => { },
        })
    };
}

function mockBoard() {
    return { gameOver: false, score: 0, reset: function () { this.score = 0; this.gameOver = false; } };
}

function mockRenderer() {
    return { rotX: 0, rotY: 0, render: function () { } };
}

function mockHud() {
    return { textContent: '', style: { color: '' } };
}

// 1. Constructor
console.log('▸ Constructor');
const canvas = mockCanvas();
const hud = mockHud();
const board = mockBoard();
const renderer = mockRenderer();
const game = new BaseGame(canvas, hud, board, renderer, { tickRate: 50, name: 'Test' });
assert(game.board === board, 'stores board');
assert(game.renderer === renderer, 'stores renderer');
assert(game.gameName === 'Test', 'stores name');
assert(game.loop instanceof MockGameLoop, 'creates GameLoop');
assert(game.input instanceof MockInputController, 'creates InputController');
assert(game.loop.tickRate === 50, 'passes tickRate');

// 2. init()
console.log('▸ init()');
game.init();
assert(game.input.attached, 'input attached');
assert(game.loop.running, 'loop started');

// 3. togglePause()
console.log('▸ togglePause()');
game.togglePause();
assert(game.loop.paused === true, 'paused after toggle');
game.togglePause();
assert(game.loop.paused === false, 'unpaused after second toggle');

// 4. reset()
console.log('▸ reset()');
board.score = 500;
board.gameOver = true;
game.reset();
assert(board.score === 0, 'board reset');
assert(board.gameOver === false, 'gameOver reset');
assert(game.loop.running, 'loop restarted');

// 5. _getHUDState() default
console.log('▸ _getHUDState() default');
board.gameOver = false;
board.score = 42;
const state = game._getHUDState();
assert(state.text.includes('42'), 'HUD shows score');
assert(state.color === '#94a3b8', 'playing color');

// 6. _getHUDState() game over
console.log('▸ _getHUDState() game over');
board.gameOver = true;
board.score = 99;
const goState = game._getHUDState();
assert(goState.text.includes('GAME OVER'), 'HUD shows GAME OVER');
assert(goState.color === '#f87171', 'game over red');

// 7. Base input bindings (P and R)
console.log('▸ Base input bindings');
const pBind = game.input.bindings.find(b => b.keys.includes('p'));
assert(pBind !== undefined, 'P key is bound');
const rBind = game.input.bindings.find(b => b.keys.includes('r'));
assert(rBind !== undefined, 'R key is bound');

// 8. update() is a no-op in base
console.log('▸ update() base no-op');
try { game.update(); passed++; console.log('  ✅ base update does not throw'); }
catch { failed++; console.error('  ❌ base update threw'); }

// 9. _setupGameInput() is a no-op in base
console.log('▸ _setupGameInput() base no-op');
// Already called during construction — no error
assert(game.input.bindings.length >= 2, 'base bindings exist');

// 10. Camera sync
console.log('▸ _syncCamera()');
// Without camera — should not throw
try { game._syncCamera(); passed++; console.log('  ✅ no camera → no throw'); }
catch { failed++; console.error('  ❌ no camera threw'); }

// Cleanup globals
delete global.GameLoop;
delete global.InputController;

console.log(`\n${'─'.repeat(36)}`);
console.log(`BaseGame: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
