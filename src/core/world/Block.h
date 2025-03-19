#pragma once

#include <cstdint>
#include <string>
#include <unordered_map>

namespace QuadCraft {

class Block {
public:
    // Block type ID
    using BlockID = uint16_t;
    
    // Special block IDs
    static constexpr BlockID AIR_BLOCK = 0;
    static constexpr BlockID STONE_BLOCK = 1;
    static constexpr BlockID DIRT_BLOCK = 2;
    static constexpr BlockID GRASS_BLOCK = 3;
    static constexpr BlockID WATER_BLOCK = 4;
    static constexpr BlockID SAND_BLOCK = 5;
    
    // Block properties
    BlockID id;
    bool transparent;
    bool solid;
    std::string name;
    
    Block() : id(AIR_BLOCK), transparent(true), solid(false), name("air") {}
    
    Block(BlockID id, bool transparent, bool solid, const std::string& name)
        : id(id), transparent(transparent), solid(solid), name(name) {}
        
    bool isAir() const { return id == AIR_BLOCK; }
};

// Block registry to store and access block types
class BlockRegistry {
private:
    std::unordered_map<Block::BlockID, Block> blocks;
    
public:
    BlockRegistry() {
        // Register default blocks
        registerBlock(Block(Block::AIR_BLOCK, true, false, "air"));
        registerBlock(Block(Block::STONE_BLOCK, false, true, "stone"));
        registerBlock(Block(Block::DIRT_BLOCK, false, true, "dirt"));
        registerBlock(Block(Block::GRASS_BLOCK, false, true, "grass"));
        registerBlock(Block(Block::WATER_BLOCK, true, false, "water"));
        registerBlock(Block(Block::SAND_BLOCK, false, true, "sand"));
    }
    
    void registerBlock(const Block& block) {
        blocks[block.id] = block;
    }
    
    const Block& getBlock(Block::BlockID id) const {
        auto it = blocks.find(id);
        if (it != blocks.end()) {
            return it->second;
        }
        return blocks.at(Block::AIR_BLOCK); // Return air block as fallback
    }
};

} // namespace QuadCraft 