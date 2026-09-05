#pragma once

#include <unordered_map>
#include <vector>
#include <memory>
#include <array>
#include "../coordinate/Quadray.h"
#include "TetrahedralElement.h"
#include "Block.h"

namespace QuadCraft {

// Forward declaration
class World;

// Hash function for Quadray coordinates to use in unordered_map
struct QuadrayHash {
    std::size_t operator()(const Quadray& q) const {
        // Normalize to ensure consistent hashing
        Quadray normalized = q.normalized();
        
        // Combine hash of each component
        std::size_t h1 = std::hash<float>{}(normalized.a);
        std::size_t h2 = std::hash<float>{}(normalized.b);
        std::size_t h3 = std::hash<float>{}(normalized.c);
        std::size_t h4 = std::hash<float>{}(normalized.d);
        
        return h1 ^ (h2 << 1) ^ (h3 << 2) ^ (h4 << 3);
    }
};

// Equality operator for Quadray coordinates to use in unordered_map
struct QuadrayEqual {
    bool operator()(const Quadray& q1, const Quadray& q2) const {
        // Normalize both coordinates for comparison
        Quadray n1 = q1.normalized();
        Quadray n2 = q2.normalized();
        
        // Compare each component with a small epsilon for floating-point comparison
        const float epsilon = 1e-5f;
        return std::abs(n1.a - n2.a) < epsilon &&
               std::abs(n1.b - n2.b) < epsilon &&
               std::abs(n1.c - n2.c) < epsilon &&
               std::abs(n1.d - n2.d) < epsilon;
    }
};

/**
 * A chunk of tetrahedral elements.
 *
 * Chunk coordinates (chunkX, chunkY, chunkZ) are CARTESIAN grid indices:
 * the chunk covers the world-space cube [chunkX*CHUNK_SIZE, (chunkX+1)*CHUNK_SIZE)
 * on each axis (see World's canonical key-space note). Element keys inside the
 * chunk are chunk-LOCAL quadray coordinates produced by worldToChunkSpace().
 */
class TetraChunk {
public:
    // Constants for chunk properties
    static const int CHUNK_SIZE = 16;
    static const int CHUNK_GENERATION_RADIUS = 4;
    static const int CHUNK_UNLOAD_DISTANCE = 8 * CHUNK_SIZE;

    // Cartesian grid coordinates of this chunk
    int chunkX, chunkY, chunkZ;

    // Flags for chunk state
    bool isDirty;        // Whether the chunk needs mesh regeneration
    bool isGenerated;    // Whether the chunk has been generated
    bool isVisible;      // Whether the chunk is currently visible to the player

    // Constructor
    TetraChunk(int x, int y, int z) :
        chunkX(x),
        chunkY(y),
        chunkZ(z),
        isDirty(true),
        isGenerated(false),
        isVisible(false) {
    }
    
    // Get a block at specified quadray coordinates
    Block::BlockID getBlock(const Quadray& quadPos) const {
        auto it = elements.find(quadPos);
        if (it != elements.end()) {
            return it->second.blockId;
        }
        return Block::AIR_BLOCK;
    }
    
    // Set a block at specified quadray coordinates
    void setBlock(const Quadray& quadPos, Block::BlockID blockId) {
        if (blockId == Block::AIR_BLOCK) {
            // Remove the element if setting to air
            elements.erase(quadPos);
        } else {
            // Add or update the element
            elements[quadPos] = TetrahedralElement(quadPos, blockId);
        }
        
        // Mark the chunk as dirty for mesh regeneration
        isDirty = true;
    }
    
    // Convert world space coordinates to local chunk coordinates
    Quadray worldToChunkSpace(const Quadray& worldPos) const {
        // Convert to Cartesian first to simplify chunk space calculations
        Vector3 cartesian = worldPos.toCartesian();
        
        // Adjust for chunk position
        Vector3 localPos(
            cartesian.x - (chunkX * CHUNK_SIZE),
            cartesian.y - (chunkY * CHUNK_SIZE),
            cartesian.z - (chunkZ * CHUNK_SIZE)
        );
        
        // Convert back to quadray
        return Quadray::fromCartesian(localPos);
    }
    
    // Convert local chunk coordinates to world space coordinates
    Quadray chunkToWorldSpace(const Quadray& localPos) const {
        // Convert to Cartesian first to simplify world space calculations
        Vector3 cartesian = localPos.toCartesian();
        
        // Adjust for chunk position
        Vector3 worldPos(
            cartesian.x + (chunkX * CHUNK_SIZE),
            cartesian.y + (chunkY * CHUNK_SIZE),
            cartesian.z + (chunkZ * CHUNK_SIZE)
        );
        
        // Convert back to quadray
        return Quadray::fromCartesian(worldPos);
    }
    
    // Get all non-air tetrahedral elements in this chunk
    const std::unordered_map<Quadray, TetrahedralElement, QuadrayHash, QuadrayEqual>& getElements() const {
        return elements;
    }
    
    // Generate the chunk's content
    void generate();
    
    // Get neighboring tetrahedral elements for a given element
    std::array<Quadray, 4> getNeighbors(const Quadray& quadPos) const;
    
    // Update neighboring chunks when blocks near the boundary change
    void updateNeighborChunks(World& world);
    
    /**
     * Marks the chunk as dirty, requiring a mesh update
     */
    void markDirty() {
        isDirty = true;
    }

    /**
     * Gets the center position of the chunk in cartesian space
     * 
     * @return The center position of the chunk
     */
    Vector3 getCenter() const {
        // Center of the chunk's Cartesian cube (chunk keys are Cartesian grid indices)
        return Vector3(
            (chunkX + 0.5f) * CHUNK_SIZE,
            (chunkY + 0.5f) * CHUNK_SIZE,
            (chunkZ + 0.5f) * CHUNK_SIZE
        );
    }
    
private:
    // Map of all non-air elements in this chunk
    std::unordered_map<Quadray, TetrahedralElement, QuadrayHash, QuadrayEqual> elements;
};

} // namespace QuadCraft 