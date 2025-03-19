#pragma once

#include <vector>
#include <array>
#include <memory>
#include "../../core/coordinate/Vector3.h"

namespace QuadCraft {

struct Vertex {
    Vector3 position;
    Vector3 normal;
    Vector3 color;
    float texCoordU;
    float texCoordV;
    
    Vertex() = default;
    
    Vertex(const Vector3& pos, const Vector3& norm, const Vector3& col, float u, float v)
        : position(pos), normal(norm), color(col), texCoordU(u), texCoordV(v) {}
};

class Mesh {
public:
    Mesh() : vao(0), vbo(0), ebo(0), vertexCount(0), indexCount(0), renderMode(0) {}
    ~Mesh();
    
    // Create a mesh from vertex and index data
    void create(const std::vector<Vertex>& vertices, const std::vector<unsigned int>& indices);
    
    // Render the mesh using the automatically determined render mode
    void render() const;
    
    // Render the mesh with a specific mode (GL_TRIANGLES, GL_LINES, etc.)
    void render(int mode) const;
    
    // Check if the mesh is initialized
    bool isInitialized() const { return vao != 0; }
    
    // Get vertex and index counts
    unsigned int getVertexCount() const { return vertexCount; }
    unsigned int getIndexCount() const { return indexCount; }
    
private:
    // OpenGL handles
    unsigned int vao; // Vertex Array Object
    unsigned int vbo; // Vertex Buffer Object
    unsigned int ebo; // Element Buffer Object
    
    // Counts
    unsigned int vertexCount;
    unsigned int indexCount;
    
    // Render mode (GL_TRIANGLES, GL_LINES, etc.)
    int renderMode;
};

} // namespace QuadCraft 