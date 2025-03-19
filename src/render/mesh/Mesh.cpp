#include <GL/glew.h>
#include "Mesh.h"

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
    // Validate inputs
    if (vertices.empty() || indices.empty()) {
        return;  // Don't create empty meshes
    }
    
    // Safety check - don't create excessively large meshes
    if (vertices.size() > 100000 || indices.size() > 150000) {
        return;  // Mesh is too large, don't attempt to create
    }
    
    // Clean up any existing resources
    if (vao != 0) {
        glDeleteVertexArrays(1, &vao);
        vao = 0;
    }
    
    if (vbo != 0) {
        glDeleteBuffers(1, &vbo);
        vbo = 0;
    }
    
    if (ebo != 0) {
        glDeleteBuffers(1, &ebo);
        ebo = 0;
    }
    
    // Create new resources with error checking
    glGenVertexArrays(1, &vao);
    if (vao == 0) return;  // Failed to create VAO
    
    glGenBuffers(1, &vbo);
    if (vbo == 0) {
        // Clean up and return
        glDeleteVertexArrays(1, &vao);
        vao = 0;
        return;
    }
    
    glGenBuffers(1, &ebo);
    if (ebo == 0) {
        // Clean up and return
        glDeleteVertexArrays(1, &vao);
        glDeleteBuffers(1, &vbo);
        vao = 0;
        vbo = 0;
        return;
    }
    
    try {
        // Bind the Vertex Array Object first
        glBindVertexArray(vao);
        
        // Bind and initialize the Vertex Buffer Object (VBO)
        glBindBuffer(GL_ARRAY_BUFFER, vbo);
        glBufferData(GL_ARRAY_BUFFER, vertices.size() * sizeof(Vertex), vertices.data(), GL_STATIC_DRAW);
        
        // Bind and initialize the Element Buffer Object (EBO)
        glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, ebo);
        glBufferData(GL_ELEMENT_ARRAY_BUFFER, indices.size() * sizeof(unsigned int), indices.data(), GL_STATIC_DRAW);
        
        // Check for OpenGL errors
        GLenum err = glGetError();
        if (err != GL_NO_ERROR) {
            // An error occurred, clean up and return
            glBindVertexArray(0);
            glDeleteVertexArrays(1, &vao);
            glDeleteBuffers(1, &vbo);
            glDeleteBuffers(1, &ebo);
            vao = vbo = ebo = 0;
            return;
        }
        
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
        
        // Determine render mode based on the number of indices
        // If indices are pairs, it's likely lines; if they're triplets, it's likely triangles
        renderMode = (indexCount % 2 == 0 && indexCount % 3 != 0) ? GL_LINES : GL_TRIANGLES;
    }
    catch (...) {
        // Handle any exceptions (shouldn't happen, but just in case)
        if (vao != 0) {
            glDeleteVertexArrays(1, &vao);
            vao = 0;
        }
        if (vbo != 0) {
            glDeleteBuffers(1, &vbo);
            vbo = 0;
        }
        if (ebo != 0) {
            glDeleteBuffers(1, &ebo);
            ebo = 0;
        }
        vertexCount = indexCount = 0;
    }
}

void Mesh::render() const {
    if (vao == 0 || indexCount == 0) {
        return;  // Nothing to render
    }
    
    try {
        // Bind the Vertex Array Object
        glBindVertexArray(vao);
        
        // Draw the mesh
        glDrawElements(renderMode, indexCount, GL_UNSIGNED_INT, 0);
        
        // Unbind the VAO
        glBindVertexArray(0);
    }
    catch (...) {
        // Just in case, unbind the VAO
        glBindVertexArray(0);
    }
}

void Mesh::render(int mode) const {
    if (vao == 0 || indexCount == 0) {
        return;  // Nothing to render
    }
    
    try {
        // Bind the Vertex Array Object
        glBindVertexArray(vao);
        
        // Draw the mesh with the specified mode
        glDrawElements(mode, indexCount, GL_UNSIGNED_INT, 0);
        
        // Unbind the VAO
        glBindVertexArray(0);
    }
    catch (...) {
        // Just in case, unbind the VAO
        glBindVertexArray(0);
    }
}

} // namespace QuadCraft 