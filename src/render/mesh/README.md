# Mesh Generation

This directory contains mesh data structures and chunk-to-mesh conversion.

## Files

| File | Purpose |
|------|---------|
| `Mesh.h` | Mesh class definition |
| `Mesh.cpp` | Mesh implementation |
| `ChunkMesher.h` | Chunk meshing interface |
| `ChunkMesher.cpp` | Chunk meshing implementation |

## Mesh Class

Represents renderable geometry:

### Data

```cpp
struct Vertex {
    Vector3 position;
    Vector3 normal;
    Vector2 texcoord;
    Color color;
};

std::vector<Vertex> vertices;
std::vector<uint32_t> indices;
```

### OpenGL Resources

- Vertex Array Object (VAO)
- Vertex Buffer Object (VBO)
- Element Buffer Object (EBO)

### Methods

```cpp
void upload();      // Send to GPU
void bind();        // Bind for rendering
void draw();        // Issue draw call
void clear();       // Free GPU resources
```

## ChunkMesher

Converts TetraChunk data to renderable Mesh:

### Process

1. Iterate tetrahedral elements
2. Generate faces for visible surfaces
3. Apply face culling (skip internal faces)
4. Calculate normals
5. Assign colors/texcoords
6. Build vertex/index arrays

### Optimizations

- Only mesh visible faces
- Share vertices where possible
- Batch by block type
- Cache meshes until chunk dirty

## Tetrahedral Face Generation

Each tetrahedron has 4 triangular faces:

- Visibility determined by neighbor occupancy
- Normal points outward
- Winding order for correct culling
