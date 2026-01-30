# Shader System

This directory contains OpenGL shader management.

## Files

| File | Purpose |
|------|---------|
| `Shader.h` | Shader class definition |
| `Shader.cpp` | Shader implementation |

## Shader Class

Manages OpenGL shader programs:

### Creation

```cpp
Shader shader("vertex.glsl", "fragment.glsl");
// Compiles, links, validates
```

### Usage

```cpp
shader.use();
shader.setMat4("view", viewMatrix);
shader.setMat4("projection", projMatrix);
shader.setVec3("lightPos", lightPosition);
// Draw calls...
```

### Uniform Types

```cpp
void setBool(const std::string& name, bool value);
void setInt(const std::string& name, int value);
void setFloat(const std::string& name, float value);
void setVec3(const std::string& name, const Vector3& value);
void setMat4(const std::string& name, const Matrix4& value);
```

## Shader Programs

### Main Shader

- Vertex: Transform positions, pass attributes
- Fragment: Lighting, color output

### Wireframe Shader

- Simplified for debug visualization
- Single color output

### Overlay Shader

- For UI elements and quadray visualization
- Screen-space coordinates

## GLSL Version

OpenGL 3.3 shaders:

```glsl
#version 330 core
```

## Error Handling

Compilation and linking errors are:

- Logged to console
- Include shader source line numbers
- Fatal in debug, fallback in release
