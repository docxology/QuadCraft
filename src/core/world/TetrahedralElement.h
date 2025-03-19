#pragma once

#include "../coordinate/Quadray.h"
#include "Block.h"

namespace QuadCraft {

class TetrahedralElement {
public:
    // The position in quadray coordinates (normalized)
    Quadray position;
    
    // The block type of this element
    Block::BlockID blockId;
    
    TetrahedralElement() : blockId(Block::AIR_BLOCK) {}
    
    TetrahedralElement(const Quadray& pos, Block::BlockID id)
        : position(pos.normalized()), blockId(id) {}
    
    // Check if this element is solid
    bool isSolid(const BlockRegistry& registry) const {
        return registry.getBlock(blockId).solid;
    }
    
    // Check if this element is transparent
    bool isTransparent(const BlockRegistry& registry) const {
        return registry.getBlock(blockId).transparent;
    }
    
    // Check if this element is air
    bool isAir() const {
        return blockId == Block::AIR_BLOCK;
    }
    
    // Get the four vertices of this tetrahedron in Cartesian space
    std::array<Vector3, 4> getVertices() const {
        // Convert position to Cartesian
        Vector3 center = position.toCartesian();
        
        // Size of each tetrahedron (can be adjusted)
        const float size = 0.5f;
        
        // Calculate vertices for a regular tetrahedron
        // These constants create a perfect regular tetrahedron
        const float sqrt2 = 1.414213562f; // √2
        
        std::array<Vector3, 4> vertices;
        // Vertex at the top
        vertices[0] = center + Vector3(0, size, 0);
        // Three vertices at the base forming an equilateral triangle
        vertices[1] = center + Vector3(2.0f * size / 3.0f, -size / 3.0f, 0);
        vertices[2] = center + Vector3(-size / 3.0f, -size / 3.0f, sqrt2 * size / 3.0f);
        vertices[3] = center + Vector3(-size / 3.0f, -size / 3.0f, -sqrt2 * size / 3.0f);
        
        return vertices;
    }
    
    // Get the four faces of this tetrahedron (each face is a triangle)
    std::array<std::array<int, 3>, 4> getFaces() const {
        // Indices for the four triangular faces
        // Each face is defined by three vertex indices
        std::array<std::array<int, 3>, 4> faces = {{
            {0, 1, 2}, // Face 0
            {0, 2, 3}, // Face 1
            {0, 3, 1}, // Face 2
            {1, 3, 2}  // Face 3
        }};
        
        return faces;
    }
};

} // namespace QuadCraft 