#include "TetraChunk.h"
#include "World.h"
#include "TerrainGenerator.h"

namespace QuadCraft {

// Static terrain generator instance with a random seed
static TerrainGenerator terrainGenerator(static_cast<unsigned int>(time(nullptr)));

void TetraChunk::generate(World& world) {
    // Clear any existing elements
    elements.clear();
    
    // Use the terrain generator to fill this chunk
    terrainGenerator.generateChunk(*this, world);
    
    // Mark the chunk as generated and dirty (needs mesh update)
    isGenerated = true;
    isDirty = true;
}

// Helper method to get neighbors of an element
std::array<Quadray, 4> TetraChunk::getNeighbors(const Quadray& quadPos) const {
    // Get the vertices of this tetrahedron
    TetrahedralElement element(quadPos, Block::AIR_BLOCK); // Temporary element for calculations
    auto tetraVertices = element.getVertices();
    auto tetraFaces = element.getFaces();
    
    std::array<Quadray, 4> neighbors;
    
    // Calculate the position of each neighbor by reflecting across each face
    Vector3 center = quadPos.toCartesian();
    
    for (int faceIndex = 0; faceIndex < 4; ++faceIndex) {
        // Calculate the center of this face
        Vector3 faceCenter = (tetraVertices[tetraFaces[faceIndex][0]] + 
                             tetraVertices[tetraFaces[faceIndex][1]] + 
                             tetraVertices[tetraFaces[faceIndex][2]]) / 3.0f;
        
        // Calculate direction from center to face
        Vector3 dirToFace = (faceCenter - center).normalized();
        
        // Calculate neighbor position by reflecting across the face
        Vector3 neighborPos = center + dirToFace * 2.0f * ((faceCenter - center).length());
        
        // Convert to quadray coordinates
        neighbors[faceIndex] = Quadray::fromCartesian(neighborPos);
    }
    
    return neighbors;
}

// Helper method to update neighbors when a block changes
void TetraChunk::updateNeighborChunks(World& world) {
    // Get neighboring chunks and mark them as dirty
    std::array<std::tuple<int, int, int>, 6> neighborOffsets = {{
        {1, 0, 0}, {-1, 0, 0},
        {0, 1, 0}, {0, -1, 0},
        {0, 0, 1}, {0, 0, -1}
    }};
    
    for (const auto& offset : neighborOffsets) {
        auto [offsetX, offsetY, offsetZ] = offset;
        int neighborX = chunkX + offsetX;
        int neighborY = chunkY + offsetY;
        int neighborZ = chunkZ + offsetZ;
        
        // If the neighbor chunk exists, mark it as dirty
        if (world.hasChunk(neighborX, neighborY, neighborZ)) {
            auto neighborChunk = world.getChunk(neighborX, neighborY, neighborZ);
            neighborChunk->isDirty = true;
        }
    }
}

} // namespace QuadCraft 