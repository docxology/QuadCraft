const assert = (c, m) => { if (!c) { console.error(`❌ FAILED: ${m}`); throw new Error(m); } console.log(`✅ PASSED: ${m}`); };
if (typeof require !== 'undefined') { const { Quadray } = require('../../4d_generic/quadray.js'); const { MinecraftBoard, BlockType } = require('../js/minecraft_board.js'); global.Quadray = Quadray; global.MinecraftBoard = MinecraftBoard; global.BlockType = BlockType; }
function runTests() {
    console.log("Running 4D Minecraft Tests...");
    const b = new MinecraftBoard(8);
    assert(b.blocks.size > 0, "Terrain generated");
    assert(b.getBlock(0, 0, 0, 0) === BlockType.STONE, "Bottom layer is stone");
    assert(b.getBlock(0, 0, 1, 0) === BlockType.DIRT, "Second layer is dirt");
    assert(b.inventory[1] === 99, "Stone inventory starts at 99");
    // Place
    b.selectedBlock = BlockType.STONE;
    const placed = b.placeBlock(0, 0, 7, 0);
    assert(placed, "Block placed successfully");
    assert(b.getBlock(0, 0, 7, 0) === BlockType.STONE, "Placed block is stone");
    assert(b.inventory[1] === 98, "Inventory decreased");
    // Remove
    const removed = b.removeBlock(0, 0, 7, 0);
    assert(removed, "Block removed successfully");
    assert(b.getBlock(0, 0, 7, 0) === BlockType.AIR, "Removed block is air");
    assert(b.inventory[1] === 99, "Inventory restored");
    // Cannot place on occupied
    assert(!b.placeBlock(0, 0, 0, 0), "Cannot place on occupied");
    console.log("All 4D Minecraft tests completed!");
}
if (typeof require !== 'undefined' && require.main === module) runTests();
