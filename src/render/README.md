# Rendering System

This directory contains the OpenGL rendering pipeline for the native C++ implementation.

## Directory Structure

```text
render/
├── mesh/       # Mesh generation and data structures
└── shader/     # Shader programs and compilation
```

## Overview

The rendering system transforms tetrahedral voxel data into visual output:

```text
World Data → Mesh Generation → Shader Processing → Screen
```

## Components

### Mesh System (`mesh/`)

Converts tetrahedral elements to renderable geometry:

- **Mesh.h/cpp**: Vertex/index buffer management
- **ChunkMesher.h/cpp**: Chunk-to-mesh conversion

### Shader System (`shader/`)

OpenGL shader program management:

- **Shader.h/cpp**: Compilation, linking, uniforms

## Rendering Pipeline

1. **Culling**: Frustum and occlusion testing
2. **Mesh Selection**: Visible chunks identified
3. **Shader Binding**: Appropriate program activated
4. **Uniform Setup**: View/projection matrices
5. **Draw Calls**: Render each chunk mesh
6. **Post-processing**: Any screen-space effects

## Key Features

- **Chunk-based Rendering**: Only visible chunks drawn
- **Dirty System**: Meshes regenerated only when changed
- **Depth Sorting**: Proper tetrahedral face ordering
- **Wireframe Mode**: Toggle for debugging (F1)
- **Quadray Overlay**: Coordinate visualization (F2)

## OpenGL Requirements

- OpenGL 3.3+ Core Profile
- GLEW for extension loading
- GLFW for window/context management
