/**
 * test_hud.js — Tests for HUD module
 *
 * Tests: HUD state management, color-coded display, livesString utility.
 * Run: node games/tests/test_hud.js
 */
const path = require('path');
const { HUD } = require(path.join(__dirname, '..', '4d_generic', 'hud.js'));

let passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) { passed++; console.log(`  ✅ ${msg}`); }
    else { failed++; console.error(`  ❌ ${msg}`); }
}

console.log('╔═══════════════════════════════════╗');
console.log('║   Test: HUD Module                ║');
console.log('╚═══════════════════════════════════╝\n');

// --- Mock element ---
function mockElement() {
    return { textContent: '', style: { color: '' } };
}

// 1. Constructor
console.log('▸ Constructor');
const el = mockElement();
const hud = new HUD(el);
assert(hud.element === el, 'stores element reference');

// 2. set()
console.log('▸ set()');
hud.set('Hello', '#ff0000');
assert(el.textContent === 'Hello', 'sets text content');
assert(el.style.color === '#ff0000', 'sets color');

hud.set('Default');
assert(el.style.color === HUD.COLORS.playing, 'defaults to playing color');

// 3. gameOver()
console.log('▸ gameOver()');
hud.gameOver('Score: 100');
assert(el.style.color === HUD.COLORS.gameOver, 'loss → red color');

hud.gameOver('You Win!', true);
assert(el.style.color === HUD.COLORS.won, 'win → green color');

// 4. paused()
console.log('▸ paused()');
hud.paused();
assert(el.textContent.includes('PAUSED'), 'default pause message');
assert(el.style.color === HUD.COLORS.paused, 'paused → yellow color');

hud.paused('Custom pause');
assert(el.textContent === 'Custom pause', 'custom pause text');

// 5. playing()
console.log('▸ playing()');
hud.playing('Score: 50');
assert(el.textContent === 'Score: 50', 'playing text');
assert(el.style.color === HUD.COLORS.playing, 'playing → slate color');

// 6. warning()
console.log('▸ warning()');
hud.warning('Low time!');
assert(el.style.color === HUD.COLORS.warning, 'warning → orange color');

// 7. livesString()
console.log('▸ livesString()');
assert(HUD.livesString(3) === '❤️❤️❤️', 'default hearts');
assert(HUD.livesString(0) === '', 'zero lives → empty');
assert(HUD.livesString(2, '🚀') === '🚀🚀', 'custom emoji');

// 8. null element safety
console.log('▸ null element safety');
const nullHud = new HUD(null);
try { nullHud.set('test'); passed++; console.log('  ✅ null element does not throw'); }
catch { failed++; console.error('  ❌ null element threw'); }

// 9. Static colors
console.log('▸ Static COLORS');
assert(typeof HUD.COLORS.gameOver === 'string', 'COLORS.gameOver exists');
assert(typeof HUD.COLORS.won === 'string', 'COLORS.won exists');
assert(typeof HUD.COLORS.paused === 'string', 'COLORS.paused exists');
assert(typeof HUD.COLORS.playing === 'string', 'COLORS.playing exists');
assert(typeof HUD.COLORS.warning === 'string', 'COLORS.warning exists');

console.log(`\n${'─'.repeat(36)}`);
console.log(`HUD: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
