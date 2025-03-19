#pragma once

#include <memory>
#include <unordered_map>
#include "Mesh.h"
#include "../../core/world/TetraChunk.h"
#include "../../core/world/World.h"

namespace QuadCraft {

class ChunkMesher {
public:
    ChunkMesher(const World& world) : world(world) {}
    
    // Create a mesh for a chunk
    std::shared_ptr<Mesh> createMeshForChunk(const TetraChunk& chunk);
    
    // Precomputed triangle tables and other lookup data
    void initializeLookupTables();
    
private:
    // Reference to the world
    const World& world;
    
    // Helper function to get block type at position, handling chunk boundaries
    Block::BlockID getBlockAt(const TetraChunk& chunk, const Quadray& pos);
    
    // Check if a face should be rendered
    bool shouldRenderFace(const TetraChunk& chunk, const Quadray& blockPos, const Quadray& neighborPos);
    
    // Color lookup table for each block type
    std::unordered_map<Block::BlockID, Vector3> blockColors;
};

} // namespace QuadCraft 