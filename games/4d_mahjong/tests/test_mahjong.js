/**
 * test_mahjong.js — Comprehensive Tests for 4D Mahjong
 * Run: node tests/test_mahjong.js
 */
if (typeof Quadray === 'undefined') { const _q = require('../../4d_generic/quadray.js'); globalThis.Quadray = _q.Quadray; }
if (typeof GridUtils === 'undefined') { const _g = require('../../4d_generic/grid_utils.js'); globalThis.GridUtils = _g.GridUtils; }
if (typeof SYNERGETICS === 'undefined') { const _s = require('../../4d_generic/synergetics.js'); globalThis.SYNERGETICS = _s.SYNERGETICS; globalThis.verifyRoundTrip = _s.verifyRoundTrip; globalThis.verifyGeometricIdentities = _s.verifyGeometricIdentities; }
if (typeof BaseBoard === 'undefined') { const _bb = require('../../4d_generic/base_board.js'); globalThis.BaseBoard = _bb.BaseBoard; }
const { MahjongBoard, MahjongTile, TILE_SUITS, TILE_COLORS } = require('../js/mahjong_board.js');

let p = 0, f = 0, t = 0;
function assert(name, cond) { t++; if (cond) { p++; console.log(`  ✅ ${name}`); } else { f++; console.log(`  ❌ ${name}`); } }

console.log('=== 4D Mahjong — Comprehensive Tests ===\n');

console.log('— Construction —');
const b = new MahjongBoard();
assert('Has tiles', b.tiles.length > 0);
assert('Score starts 0', b.score === 0);
assert('Moves start 0', b.moves === 0);
assert('No selection', b.selected === null);
assert('Game not over', !b.gameOver);

console.log('\n— Tile Suits —');
assert('5 suits', TILE_SUITS.length === 5);
assert('Has bamboo', TILE_SUITS.includes('bamboo'));
assert('Has circle', TILE_SUITS.includes('circle'));
assert('Has character', TILE_SUITS.includes('character'));
assert('Has wind', TILE_SUITS.includes('wind'));
assert('Has dragon', TILE_SUITS.includes('dragon'));
assert('Tile colors defined', typeof TILE_COLORS === 'object');

console.log('\n— MahjongTile —');
const tile = new MahjongTile('bamboo', 1, 0, { a: 0, b: 0, c: 0, d: 0 });
assert('Tile has suit', tile.suit === 'bamboo');
assert('Tile has value', tile.value === 1);
assert('Tile has layer', tile.layer === 0);
assert('Tile not matched', !tile.matched);
assert('Tile has toQuadray', tile.toQuadray() instanceof Quadray);

console.log('\n— Tile Matching —');
const t1 = new MahjongTile('bamboo', 3, 0, { a: 0, b: 0, c: 0, d: 0 });
const t2 = new MahjongTile('bamboo', 3, 1, { a: 1, b: 0, c: 0, d: 0 });
const t3 = new MahjongTile('circle', 3, 0, { a: 2, b: 0, c: 0, d: 0 });
assert('Same suit+value match', t1.matches(t2));
assert('Different suit no match', !t1.matches(t3));

console.log('\n— Exposed Tiles —');
const exposed = b.getExposedTiles();
assert('Has exposed tiles', exposed.length > 0);
assert('Exposed are tiles', exposed[0] instanceof MahjongTile);

console.log('\n— Hint —');
const hint = b.getHint();
assert('Hint returns pair or null', hint === null || (Array.isArray(hint) && hint.length === 2));

console.log('\n— Remaining —');
assert('Remaining > 0', b.remainingTiles() > 0);

console.log('\n— Metadata —');
const meta = b.getMetadata();
assert('Has score', typeof meta.score === 'number');
assert('Has remainingTiles', typeof meta.remainingTiles === 'number');

console.log('\n— Reset —');
b.reset();
assert('Reset clears score', b.score === 0);
assert('Reset clears moves', b.moves === 0);
assert('Reset clears gameOver', !b.gameOver);
assert('Reset has tiles', b.tiles.length > 0);

console.log('\n— Synergetics —');
assert('TETRA_VOL = 1', SYNERGETICS.TETRA_VOL === 1);
assert('OCTA_VOL = 4', SYNERGETICS.OCTA_VOL === 4);
assert('Round-trip passes', verifyRoundTrip(new Quadray(1, 0, 0, 0)).passed);
assert('Geometric identities pass', verifyGeometricIdentities().allPassed);

console.log(`\n=== Results: ${p} passed, ${f} failed (${t} total) ===`);
process.exit(f > 0 ? 1 : 0);
