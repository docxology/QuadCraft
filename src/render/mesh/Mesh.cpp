#include "Mesh.h"
#include <GL/glew.h>

namespace QuadCraft {

Mesh::~Mesh() {
    // Clean up OpenGL resources
    if (vao != 0) {
        glDeleteVertexArrays(1, &vao);
    }
    
    if (vbo != 0) {
        glDeleteBuffers(1, &vbo);
    }
    
    if (ebo != 0) {
        glDeleteBuffers(1, &ebo);
    }
}

void Mesh::create(const std::vector<Vertex>& vertices, const std::vector<unsigned int>& indices) {
    // Clean up any existing resources
    if (vao != 0) {
        glDeleteVertexArrays(1, &vao);
    }
    
    if (vbo != 0) {
        glDeleteBuffers(1, &vbo);
    }
    
    if (ebo != 0) {
        glDeleteBuffers(1, &ebo);
    }
    
    // Create new OpenGL resources
    glGenVertexArrays(1, &vao);
    glGenBuffers(1, &vbo);
    glGenBuffers(1, &ebo);
    
    // Bind the Vertex Array Object first
    glBindVertexArray(vao);
    
    // Bind and initialize the Vertex Buffer Object (VBO)
    glBindBuffer(GL_ARRAY_BUFFER, vbo);
    glBufferData(GL_ARRAY_BUFFER, vertices.size() * sizeof(Vertex), vertices.data(), GL_STATIC_DRAW);
    
    // Bind and initialize the Element Buffer Object (EBO)
    glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, ebo);
    glBufferData(GL_ELEMENT_ARRAY_BUFFER, indices.size() * sizeof(unsigned int), indices.data(), GL_STATIC_DRAW);
    
    // Set the vertex attribute pointers
    
    // Position attribute
    glEnableVertexAttribArray(0);
    glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, sizeof(Vertex), (void*)offsetof(Vertex, position));
    
    // Normal attribute
    glEnableVertexAttribArray(1);
    glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, sizeof(Vertex), (void*)offsetof(Vertex, normal));
    
    // Color attribute
    glEnableVertexAttribArray(2);
    glVertexAttribPointer(2, 3, GL_FLOAT, GL_FALSE, sizeof(Vertex), (void*)offsetof(Vertex, color));
    
    // Texture coordinate attributes
    glEnableVertexAttribArray(3);
    glVertexAttribPointer(3, 2, GL_FLOAT, GL_FALSE, sizeof(Vertex), (void*)offsetof(Vertex, texCoordU));
    
    // Unbind the VAO
    glBindVertexArray(0);
    
    // Store counts
    vertexCount = static_cast<unsigned int>(vertices.size());
    indexCount = static_cast<unsigned int>(indices.size());
}

void Mesh::render() const {
    if (vao != 0 && indexCount > 0) {
        // Bind the Vertex Array Object
        glBindVertexArray(vao);
        
        // Draw the mesh
        glDrawElements(GL_TRIANGLES, indexCount, GL_UNSIGNED_INT, 0);
        
        // Unbind the VAO
        glBindVertexArray(0);
    }
}

} // namespace QuadCraft 