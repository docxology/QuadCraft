#pragma once

#include <random>
#include <functional>
#include <cmath>
#include "TetraChunk.h"
#include "World.h"

namespace QuadCraft {

class TerrainGenerator {
public:
    TerrainGenerator(unsigned int seed = 12345)
        : seed(seed), engine(seed), distribution(-1.0f, 1.0f) {
        // Initialize noise parameters
        terrainNoiseScale = 0.02f;
        terrainNoiseAmplitude = 32.0f;
        caveNoiseScale = 0.1f;
        caveThreshold = 0.7f;
        
        // Initialize octave parameters
        octaves = 4;
        persistence = 0.5f;
        lacunarity = 2.0f;
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
                    
                    // For each of the tetrahedral elements in this cube
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
        // Basic height map with multiple octaves for more natural terrain
        float baseHeight = terrainNoiseAmplitude * fractalNoise(
            pos.x * terrainNoiseScale, 
            0.0f,
            pos.z * terrainNoiseScale,
            octaves, persistence, lacunarity
        );
        
        // Add some mountains
        float mountainNoise = fractalNoise(
            pos.x * terrainNoiseScale * 0.5f,
            0.0f,
            pos.z * terrainNoiseScale * 0.5f,
            octaves, persistence, lacunarity
        );
        
        // Boost mountain height exponentially
        float mountainFactor = std::max(0.0f, mountainNoise - 0.3f) * 2.0f;
        float mountainHeight = 20.0f * mountainFactor * mountainFactor;
        
        // Combine base terrain with mountains
        float finalHeight = baseHeight + mountainHeight;
        
        // Cave noise (3D)
        float caveNoise = fractalNoise(
            pos.x * caveNoiseScale,
            pos.y * caveNoiseScale,
            pos.z * caveNoiseScale,
            3, 0.5f, 2.0f
        );
        
        // Ore veins noise
        float oreNoise = fractalNoise(
            pos.x * 0.2f,
            pos.y * 0.2f,
            pos.z * 0.2f,
            2, 0.5f, 2.0f
        );
        
        // Determine block type based on height and noise
        if (pos.y < finalHeight) {
            // Underground
            if (caveNoise > caveThreshold) {
                // Cave
                return Block::AIR_BLOCK;
            } else if (pos.y > finalHeight - 1) {
                // Surface layer
                if (finalHeight < 5) {
                    // Sand at water level
                    return Block::SAND_BLOCK;
                } else {
                    // Grass elsewhere
                    return Block::GRASS_BLOCK;
                }
            } else if (pos.y > finalHeight - 4) {
                // Sub-surface layer
                return Block::DIRT_BLOCK;
            } else {
                // Deep underground
                // Check for ores
                if (oreNoise > 0.8f && pos.y < 20) {
                    return Block::ORE_BLOCK;
                } else {
                    return Block::STONE_BLOCK;
                }
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
        // This is a simplified noise function
        // In a real implementation, you would use a library like FastNoise
        
        // Combine multiple sine waves at different frequencies
        float noise = 0.0f;
        noise += std::sin(x * 1.0f + y * 0.5f) * 0.5f;
        noise += std::sin(y * 0.75f + z * 0.25f) * 0.25f;
        noise += std::sin(z * 0.8f + x * 0.3f) * 0.125f;
        noise += std::sin((x + y + z) * 0.5f) * 0.125f;
        
        // Normalize to range -1 to 1
        noise = noise / (0.5f + 0.25f + 0.125f + 0.125f);
        
        return noise;
    }
    
    // Fractal noise (multiple octaves)
    float fractalNoise(float x, float y, float z, int octaves, float persistence, float lacunarity) {
        float total = 0.0f;
        float frequency = 1.0f;
        float amplitude = 1.0f;
        float maxValue = 0.0f;  // Used for normalizing result to 0.0 - 1.0
        
        for (int i = 0; i < octaves; i++) {
            total += simplexNoise(x * frequency, y * frequency, z * frequency) * amplitude;
            
            maxValue += amplitude;
            
            amplitude *= persistence;
            frequency *= lacunarity;
        }
        
        // Normalize to 0.0 - 1.0
        total = total / maxValue;
        
        // Convert to range 0.0 - 1.0
        return (total + 1.0f) * 0.5f;
    }
    
    // Noise parameters
    unsigned int seed;
    std::mt19937 engine;
    std::uniform_real_distribution<float> distribution;
    float terrainNoiseScale;
    float terrainNoiseAmplitude;
    float caveNoiseScale;
    float caveThreshold;
    
    // Fractal noise parameters
    int octaves;
    float persistence;
    float lacunarity;
};

} // namespace QuadCraft 