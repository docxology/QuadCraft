/**
 * test_minecraft.js — Comprehensive Tests for 4D Minecraft
 *
 * Groups: construction, terrain, block types, placement, removal,
 * inventory, visible blocks, neighbors, metadata, reset, synergetics.
 *
 * Run: node tests/test_minecraft.js
 */
const { Quadray } = require('../../4d_generic/quadray.js');
const { GridUtils } = require('../../4d_generic/grid_utils.js');
const { SYNERGETICS, verifyRoundTrip, verifyGeometricIdentities } = require('../../4d_generic/synergetics.js');
const { MinecraftBoard, BlockType, BLOCK_COLORS, BLOCK_NAMES } = require('../js/minecraft_board.js');

let passed = 0, failed = 0, total = 0;
function assert(name, condition) {
    total++;
    if (condition) { passed++; console.log(`  ✅ ${name}`); }
    else { failed++; console.log(`  ❌ ${name}`); }
}

console.log('=== 4D Minecraft — Comprehensive Tests ===\n');

// ─── 1. Board Construction ───────────────────────────────────────────
console.log('— Board Construction —');
const b = new MinecraftBoard(8);
assert('Size = 8', b.size === 8);
assert('Blocks generated', b.blocks.size > 0);
assert('Has inventory', typeof b.inventory === 'object');
assert('Has selectedBlock', typeof b.selectedBlock === 'number');

// ─── 2. Block Types ──────────────────────────────────────────────────
console.log('\n— Block Types —');
assert('AIR = 0', BlockType.AIR === 0);
assert('STONE = 1', BlockType.STONE === 1);
assert('DIRT = 2', BlockType.DIRT === 2);
assert('GRASS = 3', BlockType.GRASS === 3);
assert('WOOD = 4', BlockType.WOOD === 4);
assert('LEAVES = 5', BlockType.LEAVES === 5);
assert('WATER = 6', BlockType.WATER === 6);
assert('SAND = 7', BlockType.SAND === 7);
assert('DIAMOND = 8', BlockType.DIAMOND === 8);
assert('Block colors defined', typeof BLOCK_COLORS === 'object');
assert('Block names defined', typeof BLOCK_NAMES === 'object');
assert('Air name', BLOCK_NAMES[0] === 'Air');

// ─── 3. Terrain Generation ──────────────────────────────────────────
console.log('\n— Terrain Generation —');
assert('Bottom layer stone', b.getBlock(0, 0, 0, 0) === BlockType.STONE);
assert('Second layer dirt', b.getBlock(0, 0, 1, 0) === BlockType.DIRT);
// Air above terrain
assert('Top is air', b.getBlock(0, 0, 7, 0) === BlockType.AIR);

// ─── 4. Block Placement ─────────────────────────────────────────────
console.log('\n— Block Placement —');
b.selectedBlock = BlockType.STONE;
const placed = b.placeBlock(0, 0, 7, 0);
assert('Block placed', placed);
assert('Block is stone', b.getBlock(0, 0, 7, 0) === BlockType.STONE);
const invAfterPlace = b.inventory[BlockType.STONE];
assert('Inventory decreased', invAfterPlace < 99);

// Cannot place on occupied
assert('Cannot place on occupied', !b.placeBlock(0, 0, 7, 0));

// ─── 5. Block Removal ───────────────────────────────────────────────
console.log('\n— Block Removal —');
const removed = b.removeBlock(0, 0, 7, 0);
assert('Block removed', removed);
assert('Block is air', b.getBlock(0, 0, 7, 0) === BlockType.AIR);
assert('Inventory restored', b.inventory[BlockType.STONE] === invAfterPlace + 1);

// Cannot remove air
assert('Cannot remove air', !b.removeBlock(0, 0, 7, 0));

// ─── 6. Inventory ───────────────────────────────────────────────────
console.log('\n— Inventory —');
const b2 = new MinecraftBoard(8);
assert('Stone starts at 99', b2.inventory[BlockType.STONE] === 99);
assert('Dirt starts at 99', b2.inventory[BlockType.DIRT] === 99);
assert('Grass starts at 64', b2.inventory[BlockType.GRASS] === 64);
assert('Wood starts at 64', b2.inventory[BlockType.WOOD] === 64);

// ─── 7. Visible Blocks ──────────────────────────────────────────────
console.log('\n— Visible Blocks —');
const visible = b.getVisibleBlocks();
assert('Returns array', Array.isArray(visible));
assert('Has blocks', visible.length > 0);
assert('Block has position', typeof visible[0].a === 'number');
assert('Block has type', typeof visible[0].type === 'number');
assert('Block has cellType', typeof visible[0].cellType === 'string');

// ─── 8. Neighbors ────────────────────────────────────────────────────
console.log('\n— Neighbors —');
const neighbors = b.getNeighbors(3, 3, 3, 3);
assert('Neighbors returned', Array.isArray(neighbors));
assert('Has neighbors', neighbors.length > 0);
assert('Neighbors bounded', neighbors.every(n =>
    n.a >= 0 && n.a < 8 && n.b >= 0 && n.b < 8));

// ─── 9. Cell/SetCell via Quadray ─────────────────────────────────────
console.log('\n— Cell via Quadray —');
const q = new Quadray(0, 0, 0, 0);
const cellVal = b.getCell(q);
assert('getCell returns value', typeof cellVal === 'number');
b.setCell(new Quadray(0, 0, 7, 0), BlockType.SAND);
assert('setCell works', b.getBlock(0, 0, 7, 0) === BlockType.SAND);
b.removeBlock(0, 0, 7, 0); // cleanup

// ─── 10. Metadata ────────────────────────────────────────────────────
console.log('\n— Metadata —');
const meta = b.getMetadata();
assert('Has blockCount', typeof meta.blockCount === 'number');
assert('Has blockCount', typeof meta.blockCount === 'number');

// ─── 11. Reset ───────────────────────────────────────────────────────
console.log('\n— Reset —');
const b3 = new MinecraftBoard(8);
b3.placeBlock(0, 0, 7, 0);
b3.reset();
assert('Reset generates terrain', b3.blocks.size > 0);
assert('Reset clears placed blocks', b3.getBlock(0, 0, 7, 0) === BlockType.AIR);

// ─── 12. Synergetics ─────────────────────────────────────────────────
console.log('\n— Synergetics —');
assert('TETRA_VOL = 1', SYNERGETICS.TETRA_VOL === 1);
assert('OCTA_VOL = 4', SYNERGETICS.OCTA_VOL === 4);
const rt = verifyRoundTrip(new Quadray(1, 0, 0, 0));
assert('Round-trip passes', rt.passed);
const geo = verifyGeometricIdentities();
assert('Geometric identities pass', geo.allPassed);

// ─── Summary ─────────────────────────────────────────────────────────
console.log(`\n=== Results: ${passed} passed, ${failed} failed (${total} total) ===`);
process.exit(failed > 0 ? 1 : 0);
