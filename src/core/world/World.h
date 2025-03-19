#pragma once

#include <unordered_map>
#include <memory>
#include <tuple>
#include <functional>
#include "TetraChunk.h"
#include "Block.h"

namespace QuadCraft {

// Hash function for chunk coordinates
struct ChunkCoordHash {
    std::size_t operator()(const std::tuple<int, int, int>& coords) const {
        auto [x, y, z] = coords;
        std::size_t h1 = std::hash<int>{}(x);
        std::size_t h2 = std::hash<int>{}(y);
        std::size_t h3 = std::hash<int>{}(z);
        return h1 ^ (h2 << 1) ^ (h3 << 2);
    }
};

class World {
public:
    // Block registry
    BlockRegistry blockRegistry;
    
    World() = default;
    
    // Get a chunk at the specified coordinates
    std::shared_ptr<TetraChunk> getChunk(int chunkX, int chunkY, int chunkZ) {
        auto coords = std::make_tuple(chunkX, chunkY, chunkZ);
        auto it = chunks.find(coords);
        
        if (it != chunks.end()) {
            return it->second;
        }
        
        // Create a new chunk if it doesn't exist
        auto chunk = std::make_shared<TetraChunk>(chunkX, chunkY, chunkZ);
        chunks[coords] = chunk;
        
        return chunk;
    }
    
    // Get a chunk at the specified coordinates (const version)
    std::shared_ptr<TetraChunk> getChunk(int chunkX, int chunkY, int chunkZ) const {
        auto coords = std::make_tuple(chunkX, chunkY, chunkZ);
        auto it = chunks.find(coords);
        
        if (it != chunks.end()) {
            return it->second;
        }
        
        return nullptr; // Can't create a new chunk in const method
    }
    
    // Check if a chunk exists at the specified coordinates
    bool hasChunk(int chunkX, int chunkY, int chunkZ) const {
        return chunks.find(std::make_tuple(chunkX, chunkY, chunkZ)) != chunks.end();
    }
    
    // Convert world coordinates to chunk coordinates
    std::tuple<int, int, int> worldToChunkCoords(const Vector3& worldPos) const {
        int chunkX = static_cast<int>(std::floor(worldPos.x / TetraChunk::CHUNK_SIZE));
        int chunkY = static_cast<int>(std::floor(worldPos.y / TetraChunk::CHUNK_SIZE));
        int chunkZ = static_cast<int>(std::floor(worldPos.z / TetraChunk::CHUNK_SIZE));
        return std::make_tuple(chunkX, chunkY, chunkZ);
    }
    
    // Get the block at the specified world coordinates
    Block::BlockID getBlock(const Quadray& worldPos) const {
        // Convert to Cartesian for chunk lookup
        Vector3 cartesian = worldPos.toCartesian();
        auto [chunkX, chunkY, chunkZ] = worldToChunkCoords(cartesian);
        
        // Get the chunk if it exists
        auto chunk = getChunk(chunkX, chunkY, chunkZ);
        if (!chunk) {
            return Block::AIR_BLOCK; // Return air for non-existent chunks
        }
        
        // Convert world coordinates to local chunk coordinates
        Quadray localPos = chunk->worldToChunkSpace(worldPos);
        
        // Get the block from the chunk
        return chunk->getBlock(localPos);
    }
    
    // Set the block at the specified world coordinates
    void setBlock(const Quadray& worldPos, Block::BlockID blockId) {
        // Convert to Cartesian for chunk lookup
        Vector3 cartesian = worldPos.toCartesian();
        auto [chunkX, chunkY, chunkZ] = worldToChunkCoords(cartesian);
        
        // Get or create the chunk
        auto chunk = getChunk(chunkX, chunkY, chunkZ);
        
        // Convert world coordinates to local chunk coordinates
        Quadray localPos = chunk->worldToChunkSpace(worldPos);
        
        // Set the block in the chunk
        chunk->setBlock(localPos, blockId);
    }
    
    // Generate chunks around a point
    void generateChunksAround(const Vector3& centerPos, int radius) {
        auto [centerX, centerY, centerZ] = worldToChunkCoords(centerPos);
        
        for (int x = centerX - radius; x <= centerX + radius; ++x) {
            for (int y = centerY - radius; y <= centerY + radius; ++y) {
                for (int z = centerZ - radius; z <= centerZ + radius; ++z) {
                    auto chunk = getChunk(x, y, z);
                    if (!chunk->isGenerated) {
                        chunk->generate(*this);
                        chunk->isGenerated = true;
                    }
                }
            }
        }
    }
    
    // Get all generated chunks
    const std::unordered_map<std::tuple<int, int, int>, std::shared_ptr<TetraChunk>, ChunkCoordHash>& getChunks() const {
        return chunks;
    }
    
    // Get dirty chunks (those that need mesh regeneration)
    std::vector<std::shared_ptr<TetraChunk>> getDirtyChunks() {
        std::vector<std::shared_ptr<TetraChunk>> dirtyChunks;
        
        for (auto& [coords, chunk] : chunks) {
            if (chunk->isDirty) {
                dirtyChunks.push_back(chunk);
            }
        }
        
        return dirtyChunks;
    }
    
    // Mark a chunk as clean (mesh has been regenerated)
    void markChunkAsClean(const std::shared_ptr<TetraChunk>& chunk) {
        chunk->isDirty = false;
    }

private:
    // Map of all loaded chunks
    mutable std::unordered_map<std::tuple<int, int, int>, std::shared_ptr<TetraChunk>, ChunkCoordHash> chunks;
};

} // namespace QuadCraft 