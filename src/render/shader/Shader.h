#pragma once

#include <string>
#include "../../core/coordinate/Vector3.h"

namespace QuadCraft {

class Shader {
public:
    Shader() : programId(0) {}
    ~Shader();
    
    // Load and compile shader from source code
    bool loadFromSource(const std::string& vertexSource, const std::string& fragmentSource);
    
    // Load shader from files
    bool loadFromFile(const std::string& vertexPath, const std::string& fragmentPath);
    
    // Use the shader
    void use() const;
    
    // Utility uniform functions
    void setBool(const std::string& name, bool value) const;
    void setInt(const std::string& name, int value) const;
    void setFloat(const std::string& name, float value) const;
    void setVec3(const std::string& name, const Vector3& value) const;
    void setVec3(const std::string& name, float x, float y, float z) const;
    void setMat4(const std::string& name, const float* value) const;
    
    // Check if the shader is initialized
    bool isInitialized() const { return programId != 0; }
    
private:
    // OpenGL shader program ID
    unsigned int programId;
    
    // Check for shader compilation or linking errors
    bool checkCompileErrors(unsigned int shader, const std::string& type);
};

} // namespace QuadCraft 