# Mesh Generation - AI Agent Guidelines

## Critical Concepts

### Face Culling

Only generate faces between solid and non-solid elements:

- Internal faces waste GPU time
- Chunk boundaries require neighbor data

### Vertex Winding

Consistent winding order (CCW) for proper:

- Backface culling
- Normal calculation
- Lighting

## Modification Guidelines

### Mesh.h/cpp

Vertex format changes:

1. Update Vertex struct
2. Modify VAO attribute setup
3. Update shaders to match
4. Test with existing meshes

### ChunkMesher

Mesh generation changes:

1. Profile generation time
2. Test all block types
3. Verify chunk boundaries
4. Check memory usage growth

## Common Patterns

### Adding Vertex Attributes

```cpp
// 1. Add to Vertex struct
struct Vertex {
    // ... existing
    float newAttribute;
};

// 2. Update VAO setup
glVertexAttribPointer(...);
glEnableVertexAttribArray(...);

// 3. Update shader input
layout(location = N) in float newAttribute;
```

### Optimizing Face Generation

- Use lookup tables for neighbor offsets
- Early-out for fully surrounded elements
- Consider octree for large empty regions

## Performance Metrics

Target: Chunk mesh generation < 10ms
Monitor: Vertex count per chunk
Alert: Memory growth over time
