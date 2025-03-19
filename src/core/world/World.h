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
        
        // Get the chunk (can't create if it doesn't exist in const method)
        auto it = chunks.find(std::make_tuple(chunkX, chunkY, chunkZ));
        if (it == chunks.end()) {
            return Block::AIR_BLOCK; // Return air if chunk doesn't exist
        }
        
        auto chunk = it->second;
        
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
    
    /**
     * Generates chunks in a radius around the specified coordinates.
     * This ensures that the world is properly populated around the player.
     * 
     * @param center The center coordinates in quadray space
     * @param radius The radius around the center to generate chunks
     */
    void generateChunksAround(const Quadray& center, int radius) {
        // Calculate the chunk coordinates from the quadray position
        Quadray chunkCoords = Quadray(
            (int)std::floor(center.a / TetraChunk::CHUNK_SIZE) * TetraChunk::CHUNK_SIZE,
            (int)std::floor(center.b / TetraChunk::CHUNK_SIZE) * TetraChunk::CHUNK_SIZE,
            (int)std::floor(center.c / TetraChunk::CHUNK_SIZE) * TetraChunk::CHUNK_SIZE,
            (int)std::floor(center.d / TetraChunk::CHUNK_SIZE) * TetraChunk::CHUNK_SIZE
        );
        
        // When the player is far from the origin, increase the chunk generation radius
        // This helps maintain a better view of the world when at higher elevations
        int adaptiveRadius = radius;
        // Convert quadray to cartesian to check distance from origin
        Vector3 cartPos = center.toCartesian();
        float distFromOrigin = cartPos.length();
        
        // Add more chunks at higher distances from origin
        if (distFromOrigin > 100.0f) {
            adaptiveRadius += 1; // Add one extra layer
        }
        if (distFromOrigin > 200.0f) {
            adaptiveRadius += 1; // Another extra layer
        }
        
        // Generate chunks within an approximate sphere around the specified coordinates
        for (int a = -adaptiveRadius; a <= adaptiveRadius; a++) {
            for (int b = -adaptiveRadius; b <= adaptiveRadius; b++) {
                for (int c = -adaptiveRadius; c <= adaptiveRadius; c++) {
                    for (int d = -adaptiveRadius; d <= adaptiveRadius; d++) {
                        // Calculate the distance in quadray space (approximate sphere)
                        float distance = std::sqrt(float(a*a + b*b + c*c + d*d));
                        
                        // Only generate chunks within the specified radius
                        if (distance <= adaptiveRadius) {
                            Quadray offset = Quadray(
                                a * TetraChunk::CHUNK_SIZE,
                                b * TetraChunk::CHUNK_SIZE,
                                c * TetraChunk::CHUNK_SIZE,
                                d * TetraChunk::CHUNK_SIZE
                            );
                            
                            Quadray pos = chunkCoords + offset;
                            
                            // Create the chunk if it doesn't exist
                            getOrCreateChunk(pos);
                        }
                    }
                }
            }
        }
    }
    
    /**
     * Updates chunks based on the player's position.
     * Loads new chunks and unloads distant chunks.
     * 
     * @param playerPos The player's position in quadray space
     */
    void updateChunks(const Quadray& playerPos) {
        // First, generate chunks around the player
        generateChunksAround(playerPos, TetraChunk::CHUNK_GENERATION_RADIUS);
        
        // Calculate cartesian position for distance checks
        Vector3 playerCartPos = playerPos.toCartesian();
        
        // Adaptive maximum distance - keep more chunks loaded when the player is high up
        // This provides better panoramic views and reduces pop-in when player is elevated
        float maxDistanceSq = TetraChunk::CHUNK_UNLOAD_DISTANCE * TetraChunk::CHUNK_UNLOAD_DISTANCE;
        float playerHeight = playerCartPos.y;
        
        // If player is above certain height, keep more chunks loaded for better views
        if (playerHeight > 50.0f) {
            float heightFactor = 1.0f + (playerHeight - 50.0f) / 50.0f;
            heightFactor = std::min(heightFactor, 2.0f); // Cap at 2x normal distance
            maxDistanceSq *= heightFactor;
        }
        
        // Collect chunks to unload
        std::vector<std::tuple<int, int, int>> chunksToUnload;
        
        for (const auto& [coords, chunk] : chunks) {
            // Calculate the chunk position in cartesian space
            Vector3 chunkCenter = chunk->getCenter();
            
            // Calculate squared distance between player and chunk
            float distanceSq = (chunkCenter - playerCartPos).lengthSquared();
            
            // If the chunk is too far away, mark it for unloading
            // But keep visible chunks loaded even if they're slightly beyond the unload distance
            if (distanceSq > maxDistanceSq && !chunk->isVisible) {
                chunksToUnload.push_back(coords);
            }
        }
        
        // Unload distant chunks - but limit the number of chunks unloaded per update
        // to avoid stuttering when many chunks need unloading at once
        int maxChunksToUnload = 5;
        int unloadedCount = 0;
        
        for (const auto& coords : chunksToUnload) {
            if (unloadedCount >= maxChunksToUnload) {
                break;
            }
            
            chunks.erase(coords);
            unloadedCount++;
        }
    }
    
    /**
     * Marks all chunks as dirty to force a mesh update.
     * Useful when global changes are made that affect all chunks.
     */
    void markAllChunksDirty() {
        for (auto& [pos, chunk] : chunks) {
            chunk->markDirty();
        }
    }
    
    // Get all generated chunks
    const std::unordered_map<std::tuple<int, int, int>, std::shared_ptr<TetraChunk>, ChunkCoordHash>& getChunks() const {
        return chunks;
    }
    
    // Get a vector of chunks that need mesh updates
    std::vector<TetraChunk*> getDirtyChunks() {
        std::vector<TetraChunk*> dirtyChunks;
        
        for (auto& [coords, chunk] : chunks) {
            if (chunk->isGenerated && chunk->isDirty) {
                dirtyChunks.push_back(chunk.get());
            }
        }
        
        return dirtyChunks;
    }
    
    // Mark a chunk as clean (mesh has been regenerated)
    void markChunkAsClean(const std::shared_ptr<TetraChunk>& chunk) {
        chunk->isDirty = false;
    }

    // Get or create a chunk at the specified quadray coordinates
    std::shared_ptr<TetraChunk> getOrCreateChunk(const Quadray& quadPos) {
        // Calculate chunk coordinates from quadray position
        int chunkX = static_cast<int>(std::floor(quadPos.a / TetraChunk::CHUNK_SIZE));
        int chunkY = static_cast<int>(std::floor(quadPos.b / TetraChunk::CHUNK_SIZE));
        int chunkZ = static_cast<int>(std::floor(quadPos.c / TetraChunk::CHUNK_SIZE));
        
        // Get or create the chunk
        auto coords = std::make_tuple(chunkX, chunkY, chunkZ);
        auto it = chunks.find(coords);
        
        if (it != chunks.end()) {
            return it->second;
        }
        
        // Create a new chunk
        auto chunk = std::make_shared<TetraChunk>(chunkX, chunkY, chunkZ);
        chunks[coords] = chunk;
        
        // Generate the chunk
        if (!chunk->isGenerated) {
            chunk->generate(*this);
        }
        
        return chunk;
    }
    
    // Unload a chunk
    void unloadChunk(const Quadray& quadPos) {
        // Calculate chunk coordinates from quadray position
        int chunkX = static_cast<int>(std::floor(quadPos.a / TetraChunk::CHUNK_SIZE));
        int chunkY = static_cast<int>(std::floor(quadPos.b / TetraChunk::CHUNK_SIZE));
        int chunkZ = static_cast<int>(std::floor(quadPos.c / TetraChunk::CHUNK_SIZE));
        
        // Remove the chunk from the map
        chunks.erase(std::make_tuple(chunkX, chunkY, chunkZ));
    }
    
    // Get a chunk by quadray position
    std::shared_ptr<TetraChunk> getChunk(const Quadray& quadPos) const {
        // Calculate chunk coordinates from quadray position
        int chunkX = static_cast<int>(std::floor(quadPos.a / TetraChunk::CHUNK_SIZE));
        int chunkY = static_cast<int>(std::floor(quadPos.b / TetraChunk::CHUNK_SIZE));
        int chunkZ = static_cast<int>(std::floor(quadPos.c / TetraChunk::CHUNK_SIZE));
        
        // Find the chunk
        auto coords = std::make_tuple(chunkX, chunkY, chunkZ);
        auto it = chunks.find(coords);
        
        if (it != chunks.end()) {
            return it->second;
        }
        
        return nullptr;
    }

private:
    // Map of all loaded chunks
    std::unordered_map<std::tuple<int, int, int>, std::shared_ptr<TetraChunk>, ChunkCoordHash> chunks;
};

} // namespace QuadCraft 