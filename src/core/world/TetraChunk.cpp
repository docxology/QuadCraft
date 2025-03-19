#include "TetraChunk.h"
#include "World.h"
#include "TerrainGenerator.h"

namespace QuadCraft {

// Static terrain generator instance
static TerrainGenerator terrainGenerator;

void TetraChunk::generate(World& world) {
    // Use the terrain generator to fill this chunk
    terrainGenerator.generateChunk(*this, world);
    
    // Mark the chunk as generated
    isGenerated = true;
}

} // namespace QuadCraft 