#include "ChunkMesher.h"

namespace QuadCraft {

void ChunkMesher::initializeLookupTables() {
    // Unique colors for each block type
    // Using a broader range of colors for better visual distinction
    blockColors[Block::STONE_BLOCK] = Vector3(0.6f, 0.6f, 0.6f);     // Stone - gray
    blockColors[Block::DIRT_BLOCK] = Vector3(0.55f, 0.3f, 0.13f);    // Dirt - brown
    blockColors[Block::GRASS_BLOCK] = Vector3(0.3f, 0.7f, 0.15f);    // Grass - green
    blockColors[Block::SAND_BLOCK] = Vector3(0.9f, 0.9f, 0.5f);      // Sand - light yellow
    blockColors[Block::WATER_BLOCK] = Vector3(0.0f, 0.4f, 0.9f);     // Water - blue
    blockColors[Block::ORE_BLOCK] = Vector3(0.3f, 0.3f, 0.7f);       // Ore - blue-gray
    
    // Generate unique colors for any block type without a specific color
    for (int i = 1; i < 256; i++) {
        if (blockColors.find(i) == blockColors.end()) {
            // Generate a pseudorandom but deterministic color based on the block ID
            float r = (float)(i % 7) / 7.0f;
            float g = (float)((i * 13) % 11) / 11.0f;
            float b = (float)((i * 23) % 17) / 17.0f;
            blockColors[i] = Vector3(r * 0.6f + 0.3f, g * 0.6f + 0.3f, b * 0.6f + 0.3f);
        }
    }
}

std::shared_ptr<Mesh> ChunkMesher::createMeshForChunk(const TetraChunk& chunk) {
    // Initialize lookup tables if needed
    if (blockColors.empty()) {
        initializeLookupTables();
    }
    
    // Create new mesh
    std::shared_ptr<Mesh> mesh = std::make_shared<Mesh>();
    
    // Get all non-air elements in the chunk
    const auto& elements = chunk.getElements();
    
    // Create vertices and indices for the mesh
    std::vector<Vertex> vertices;
    std::vector<unsigned int> indices;
    
    // Reserve space to avoid frequent reallocations
    vertices.reserve(elements.size() * 12);  // Estimate: 3 vertices per face, 4 faces per tetrahedron
    indices.reserve(elements.size() * 12);   // Estimate: 3 indices per face, 4 faces per tetrahedron
    
    // Safety limit for very large chunks to prevent slowdowns
    const int MAX_ELEMENTS = 10000;
    int processedElements = 0;
    
    // Process each non-air element in the chunk
    for (const auto& [pos, element] : elements) {
        // Safety check to prevent processing too many elements
        if (processedElements++ > MAX_ELEMENTS) {
            break;
        }
        
        if (element.blockId == Block::AIR_BLOCK) {
            continue;
        }
        
        // Get block color from lookup table
        Vector3 baseColor = blockColors[element.blockId];
        
        // Add some variation based on position for visual diversity
        // Create a deterministic hash from the position for consistent colors
        float posHash = pos.a * 0.13f + pos.b * 0.27f + pos.c * 0.41f + pos.d * 0.53f;
        float variation = (std::fmod(std::abs(posHash), 1.0f) * 0.2f) - 0.1f;  // -0.1 to +0.1 variation
        
        // Modify variation based on tetrahedral position - different faces get slightly different shades
        // This enhances the perception of the tetrahedral shape
        float aInfluence = std::fmod(pos.a * 3.7f, 1.0f) * 0.05f;
        float bInfluence = std::fmod(pos.b * 5.3f, 1.0f) * 0.05f;
        float cInfluence = std::fmod(pos.c * 7.1f, 1.0f) * 0.05f;
        
        Vector3 color = Vector3(
            clamp(baseColor.x + variation + aInfluence, 0.0f, 1.0f),
            clamp(baseColor.y + variation + bInfluence, 0.0f, 1.0f),
            clamp(baseColor.z + variation + cInfluence, 0.0f, 1.0f)
        );
        
        // Get the vertices of the tetrahedron
        std::array<Vector3, 4> tetraVerts = element.getVertices();
        
        // Small inset factor to avoid z-fighting when rendering faces
        // Use a smaller inset for better continuity between adjacent tetrahedra
        const float insetFactor = 0.005f;  // Reduced from 0.01f for better seams
        
        // Inset vertices slightly
        Vector3 center = (tetraVerts[0] + tetraVerts[1] + tetraVerts[2] + tetraVerts[3]) / 4.0f;
        for (int i = 0; i < 4; i++) {
            tetraVerts[i] = tetraVerts[i] + (center - tetraVerts[i]) * insetFactor;
        }
        
        // Get the neighbors of this element
        std::array<Quadray, 4> neighbors = chunk.getNeighbors(pos);
        
        // For each face of the tetrahedron
        for (int i = 0; i < 4; i++) {
            // Check if this face should be rendered (if it's exposed to air or a transparent block)
            if (shouldRenderFace(chunk, pos, neighbors[i])) {
                // Face vertices (all tetrahedron faces are triangles)
                // The face opposite to vertex i is made up of the other three vertices
                std::array<int, 3> faceIndices;
                int idx = 0;
                for (int j = 0; j < 4; j++) {
                    if (j != i) {
                        faceIndices[idx++] = j;
                    }
                }
                
                // Calculate face normal (pointing outward)
                Vector3 edge1 = tetraVerts[faceIndices[1]] - tetraVerts[faceIndices[0]];
                Vector3 edge2 = tetraVerts[faceIndices[2]] - tetraVerts[faceIndices[0]];
                Vector3 normal = edge1.cross(edge2).normalized();
                
                // If normal points toward the opposite vertex, flip it
                Vector3 toOpposite = tetraVerts[i] - tetraVerts[faceIndices[0]];
                if (normal.dot(toOpposite) > 0) {
                    normal = normal * -1.0f;
                }
                
                // Add slight color variation for each face to enhance tetrahedral perception
                Vector3 faceColor = color;
                faceColor.x = clamp(faceColor.x + 0.05f * i, 0.0f, 1.0f);
                faceColor.y = clamp(faceColor.y - 0.03f * i, 0.0f, 1.0f);
                faceColor.z = clamp(faceColor.z + 0.04f * (i % 2), 0.0f, 1.0f);
                
                // Add vertices and indices for this face
                unsigned int baseIndex = static_cast<unsigned int>(vertices.size());
                
                // Add the three vertices of this face
                for (int j = 0; j < 3; j++) {
                    vertices.push_back(Vertex(
                        tetraVerts[faceIndices[j]],  // Position
                        normal,                      // Normal
                        faceColor,                   // Color with face variation
                        0.0f, 0.0f                   // Texture coordinates (unused for now)
                    ));
                }
                
                // Add indices for the face triangle
                indices.push_back(baseIndex);
                indices.push_back(baseIndex + 1);
                indices.push_back(baseIndex + 2);
            }
        }
    }
    
    // If no vertices were created, just return an empty mesh
    if (vertices.empty()) {
        mesh->create({}, {});
        return mesh;
    }
    
    // Create the mesh from the generated vertices and indices
    mesh->create(vertices, indices);
    return mesh;
}

void ChunkMesher::createSimplifiedMesh(std::shared_ptr<Mesh>& mesh) {
    // Create a simple cube as a fallback when mesh generation failed
    std::vector<Vertex> vertices;
    std::vector<unsigned int> indices;
    
    // Use a bright color to make it obvious
    Vector3 errorColor(1.0f, 0.0f, 1.0f);  // Magenta
    
    // Simple cube vertices
    vertices.push_back(Vertex(Vector3(0.0f, 0.0f, 0.0f), Vector3(0.0f, 0.0f, -1.0f), errorColor, 0.0f, 0.0f));
    vertices.push_back(Vertex(Vector3(1.0f, 0.0f, 0.0f), Vector3(0.0f, 0.0f, -1.0f), errorColor, 1.0f, 0.0f));
    vertices.push_back(Vertex(Vector3(1.0f, 1.0f, 0.0f), Vector3(0.0f, 0.0f, -1.0f), errorColor, 1.0f, 1.0f));
    vertices.push_back(Vertex(Vector3(0.0f, 1.0f, 0.0f), Vector3(0.0f, 0.0f, -1.0f), errorColor, 0.0f, 1.0f));
    
    // A few triangles to make a visible shape
    indices.push_back(0);
    indices.push_back(1);
    indices.push_back(2);
    
    indices.push_back(0);
    indices.push_back(2);
    indices.push_back(3);
    
    mesh->create(vertices, indices);
}

Block::BlockID ChunkMesher::getBlockAt(const TetraChunk& chunk, const Quadray& pos) {
    // Convert to world position
    Quadray worldPos = chunk.chunkToWorldSpace(pos);
    
    // Get the block from the world
    return world.getBlock(worldPos);
}

bool ChunkMesher::shouldRenderFace(const TetraChunk& chunk, const Quadray& /* blockPos */, const Quadray& neighborPos) {
    // Get the neighbor block type
    Block::BlockID neighborType = getBlockAt(chunk, neighborPos);
    
    // If the neighbor is air or transparent, render the face
    return neighborType == Block::AIR_BLOCK || 
           world.blockRegistry.getBlock(neighborType).transparent;
}

} // namespace QuadCraft 