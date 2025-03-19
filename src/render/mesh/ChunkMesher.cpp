#include "ChunkMesher.h"

namespace QuadCraft {

void ChunkMesher::initializeLookupTables() {
    // Initialize block colors
    blockColors[Block::AIR_BLOCK] = Vector3(0.0f, 0.0f, 0.0f);
    blockColors[Block::STONE_BLOCK] = Vector3(0.5f, 0.5f, 0.5f);
    blockColors[Block::DIRT_BLOCK] = Vector3(0.6f, 0.3f, 0.1f);
    blockColors[Block::GRASS_BLOCK] = Vector3(0.3f, 0.7f, 0.2f);
    blockColors[Block::WATER_BLOCK] = Vector3(0.0f, 0.3f, 0.8f);
    blockColors[Block::SAND_BLOCK] = Vector3(0.9f, 0.8f, 0.6f);
}

std::shared_ptr<Mesh> ChunkMesher::createMeshForChunk(const TetraChunk& chunk) {
    // Make sure lookup tables are initialized
    if (blockColors.empty()) {
        initializeLookupTables();
    }
    
    // Prepare vertices and indices
    std::vector<Vertex> vertices;
    std::vector<unsigned int> indices;
    
    // Get all non-air elements in the chunk
    const auto& elements = chunk.getElements();
    
    // For each tetrahedral element in the chunk
    for (const auto& [quadPos, element] : elements) {
        // Skip air blocks
        if (element.isAir()) {
            continue;
        }
        
        // Get block color
        Vector3 color = blockColors[element.blockId];
        
        // Get the vertices of this tetrahedron
        auto tetraVertices = element.getVertices();
        
        // Get the faces of this tetrahedron
        auto tetraFaces = element.getFaces();
        
        // Check each face to see if it should be rendered
        for (int faceIndex = 0; faceIndex < 4; ++faceIndex) {
            // Calculate neighbor position by reflecting across this face
            Vector3 center = element.position.toCartesian();
            Vector3 faceCenter = (tetraVertices[tetraFaces[faceIndex][0]] + 
                                 tetraVertices[tetraFaces[faceIndex][1]] + 
                                 tetraVertices[tetraFaces[faceIndex][2]]) / 3.0f;
            
            Vector3 dirToFace = (faceCenter - center).normalized();
            Vector3 neighborCenter = center + dirToFace * 1.0f; // Move a bit past the face
            
            Quadray neighborPos = Quadray::fromCartesian(neighborCenter);
            
            // If the face should be rendered
            if (shouldRenderFace(chunk, element.position, neighborPos)) {
                // Calculate face normal (pointing outward)
                Vector3 v0 = tetraVertices[tetraFaces[faceIndex][0]];
                Vector3 v1 = tetraVertices[tetraFaces[faceIndex][1]];
                Vector3 v2 = tetraVertices[tetraFaces[faceIndex][2]];
                
                Vector3 edge1 = v1 - v0;
                Vector3 edge2 = v2 - v0;
                Vector3 normal = edge1.cross(edge2).normalized();
                
                // Add vertices for this face
                unsigned int baseIndex = static_cast<unsigned int>(vertices.size());
                
                // Add the three vertices of this triangular face
                vertices.push_back(Vertex(v0, normal, color, 0.0f, 0.0f));
                vertices.push_back(Vertex(v1, normal, color, 1.0f, 0.0f));
                vertices.push_back(Vertex(v2, normal, color, 0.5f, 1.0f));
                
                // Add indices for this face (simple triangle)
                indices.push_back(baseIndex);
                indices.push_back(baseIndex + 1);
                indices.push_back(baseIndex + 2);
            }
        }
    }
    
    // Create the mesh
    auto mesh = std::make_shared<Mesh>();
    if (!vertices.empty() && !indices.empty()) {
        mesh->create(vertices, indices);
    }
    
    return mesh;
}

Block::BlockID ChunkMesher::getBlockAt(const TetraChunk& chunk, const Quadray& pos) {
    // Convert to world position
    Quadray worldPos = chunk.chunkToWorldSpace(pos);
    
    // Get the block from the world
    return world.getBlock(worldPos);
}

bool ChunkMesher::shouldRenderFace(const TetraChunk& chunk, const Quadray& blockPos, const Quadray& neighborPos) {
    // Get the block types
    Block::BlockID blockType = getBlockAt(chunk, blockPos);
    Block::BlockID neighborType = getBlockAt(chunk, neighborPos);
    
    // If the neighbor is air or transparent, render the face
    return neighborType == Block::AIR_BLOCK || 
           world.blockRegistry.getBlock(neighborType).transparent;
}

} // namespace QuadCraft 