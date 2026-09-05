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

/**
 * World: chunk storage and block access.
 *
 * CANONICAL CHUNK KEY SPACE — Cartesian grid. A chunk is identified by
 * (chunkX, chunkY, chunkZ) where chunk (cx, cy, cz) covers the world-space
 * Cartesian cube [cx*CHUNK_SIZE, (cx+1)*CHUNK_SIZE) x [cy*... x [cz*...).
 * Every chunk-creation and chunk-lookup path uses this key space:
 * quadray positions entering the World API are converted with
 * Quadray::toCartesian() and floored via worldToChunkCoords() first.
 * Inside a chunk, elements are stored under chunk-LOCAL quadray coordinates
 * (see TetraChunk::worldToChunkSpace); chunk meshes are emitted in world
 * space by adding the chunk's Cartesian origin (see ChunkMesher).
 */
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
     * @param radius The radius (in chunks) around the center to generate
     */
    void generateChunksAround(const Quadray& center, int radius) {
        // Canonical key space is the Cartesian chunk grid: convert the quadray
        // center to Cartesian chunk coordinates before generating neighbors.
        Vector3 cartPos = center.toCartesian();
        auto [centerX, centerY, centerZ] = worldToChunkCoords(cartPos);

        // When the player is far from the origin, increase the chunk generation radius
        // This helps maintain a better view of the world when at higher elevations
        int adaptiveRadius = radius;
        float distFromOrigin = cartPos.length();

        // Add more chunks at higher distances from origin
        if (distFromOrigin > 100.0f) {
            adaptiveRadius += 1; // Add one extra layer
        }
        if (distFromOrigin > 200.0f) {
            adaptiveRadius += 1; // Another extra layer
        }

        // Generate chunks within an approximate sphere around the center chunk
        for (int dx = -adaptiveRadius; dx <= adaptiveRadius; dx++) {
            for (int dy = -adaptiveRadius; dy <= adaptiveRadius; dy++) {
                for (int dz = -adaptiveRadius; dz <= adaptiveRadius; dz++) {
                    // Only generate chunks within the specified radius
                    if (dx*dx + dy*dy + dz*dz <= adaptiveRadius*adaptiveRadius) {
                        getOrCreateChunk(centerX + dx, centerY + dy, centerZ + dz);
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

    // Get or create (and generate) a chunk at the specified Cartesian chunk coordinates
    std::shared_ptr<TetraChunk> getOrCreateChunk(int chunkX, int chunkY, int chunkZ) {
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
            chunk->generate();
        }
        
        return chunk;
    }
    
private:
    // Map of all loaded chunks
    std::unordered_map<std::tuple<int, int, int>, std::shared_ptr<TetraChunk>, ChunkCoordHash> chunks;
};

} // namespace QuadCraft 