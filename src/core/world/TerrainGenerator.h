#pragma once

#include <random>
#include <functional>
#include "TetraChunk.h"
#include "World.h"

namespace QuadCraft {

class TerrainGenerator {
public:
    TerrainGenerator(unsigned int seed = 12345)
        : seed(seed), engine(seed), distribution(-1.0f, 1.0f) {
        // Initialize noise parameters
        terrainNoiseScale = 0.05f;
        terrainNoiseAmplitude = 32.0f;
        caveNoiseScale = 0.1f;
        caveThreshold = 0.7f;
    }
    
    // Generate terrain for a given chunk
    void generateChunk(TetraChunk& chunk, World& world) {
        // For each potential position in the chunk
        const int resolution = 8; // Resolution within each chunk
        
        for (int x = 0; x < resolution; ++x) {
            for (int y = 0; y < resolution; ++y) {
                for (int z = 0; z < resolution; ++z) {
                    // Convert to local position within chunk (0.0 to 1.0)
                    float localX = static_cast<float>(x) / resolution;
                    float localY = static_cast<float>(y) / resolution;
                    float localZ = static_cast<float>(z) / resolution;
                    
                    // Convert to world position
                    float worldX = (chunk.chunkX * TetraChunk::CHUNK_SIZE) + (localX * TetraChunk::CHUNK_SIZE);
                    float worldY = (chunk.chunkY * TetraChunk::CHUNK_SIZE) + (localY * TetraChunk::CHUNK_SIZE);
                    float worldZ = (chunk.chunkZ * TetraChunk::CHUNK_SIZE) + (localZ * TetraChunk::CHUNK_SIZE);
                    
                    // For each of the four tetrahedral elements in this cube
                    generateTetraElements(chunk, Vector3(worldX, worldY, worldZ), 
                                         TetraChunk::CHUNK_SIZE / resolution);
                }
            }
        }
        
        // Mark the chunk as generated
        chunk.isGenerated = true;
    }
    
private:
    // Generate the tetrahedral elements for a cube at the given position
    void generateTetraElements(TetraChunk& chunk, const Vector3& position, float size) {
        // Create five tetrahedra that fill a cube
        // These are the five standard tetrahedra that divide a cube
        
        // Get the eight corners of the cube
        Vector3 corners[8] = {
            position + Vector3(0, 0, 0),         // 0: bottom-left-back
            position + Vector3(size, 0, 0),      // 1: bottom-right-back
            position + Vector3(0, size, 0),      // 2: top-left-back
            position + Vector3(size, size, 0),   // 3: top-right-back
            position + Vector3(0, 0, size),      // 4: bottom-left-front
            position + Vector3(size, 0, size),   // 5: bottom-right-front
            position + Vector3(0, size, size),   // 6: top-left-front
            position + Vector3(size, size, size) // 7: top-right-front
        };
        
        // Define the five tetrahedra that fill the cube
        std::array<std::array<int, 4>, 5> tetraIndices = {{
            {0, 1, 2, 5}, // Tetrahedron 0
            {2, 3, 5, 7}, // Tetrahedron 1
            {0, 2, 4, 5}, // Tetrahedron 2
            {2, 4, 5, 6}, // Tetrahedron 3
            {2, 5, 6, 7}  // Tetrahedron 4
        }};
        
        // Generate each tetrahedron
        for (const auto& indices : tetraIndices) {
            // Calculate the center of the tetrahedron
            Vector3 center(0, 0, 0);
            for (int i = 0; i < 4; ++i) {
                center = center + corners[indices[i]];
            }
            center = center / 4.0f;
            
            // Determine the block type based on noise and height
            Block::BlockID blockId = determineBlockType(center);
            
            if (blockId != Block::AIR_BLOCK) {
                // Convert to quadray coordinates
                Quadray quadPos = Quadray::fromCartesian(center);
                
                // Convert to local chunk coordinates
                Quadray localPos = chunk.worldToChunkSpace(quadPos);
                
                // Set the block
                chunk.setBlock(localPos, blockId);
            }
        }
    }
    
    // Determine the block type at a given position based on noise
    Block::BlockID determineBlockType(const Vector3& pos) {
        // Basic height map
        float baseHeight = terrainNoiseAmplitude * simplexNoise(
            pos.x * terrainNoiseScale, 
            0.0f,
            pos.z * terrainNoiseScale
        );
        
        // Cave noise
        float caveNoise = simplexNoise(
            pos.x * caveNoiseScale,
            pos.y * caveNoiseScale,
            pos.z * caveNoiseScale
        );
        
        // Determine block type based on height and noise
        if (pos.y < baseHeight) {
            // Underground
            if (caveNoise > caveThreshold) {
                // Cave
                return Block::AIR_BLOCK;
            } else if (pos.y > baseHeight - 4) {
                // Surface layer
                return Block::GRASS_BLOCK;
            } else if (pos.y > baseHeight - 8) {
                // Sub-surface layer
                return Block::DIRT_BLOCK;
            } else {
                // Deep underground
                return Block::STONE_BLOCK;
            }
        } else if (pos.y < 5) {
            // Water level
            return Block::WATER_BLOCK;
        }
        
        // Above ground
        return Block::AIR_BLOCK;
    }
    
    // Simple Perlin noise implementation
    float simplexNoise(float x, float y, float z) {
        // This is a placeholder for a proper noise function
        // In a real implementation, you would use a library like FastNoise
        float noise = std::sin(x * 0.1f) * std::cos(y * 0.1f) * std::sin(z * 0.1f);
        noise = (noise + 1.0f) * 0.5f; // Normalize to 0-1
        return noise;
    }
    
    // Noise parameters
    unsigned int seed;
    std::mt19937 engine;
    std::uniform_real_distribution<float> distribution;
    float terrainNoiseScale;
    float terrainNoiseAmplitude;
    float caveNoiseScale;
    float caveThreshold;
};

} // namespace QuadCraft 