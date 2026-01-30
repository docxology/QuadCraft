# Rendering System - AI Agent Guidelines

## Overview

The rendering system is performance-critical. Changes must maintain visual quality and frame rate.

## Key Concerns

### Performance

- Minimize draw calls (batch by material)
- Use dirty flags to avoid regeneration
- Frustum culling before rendering

### Visual Quality

- Proper depth sorting for transparency
- Consistent lighting calculations
- Clean wireframe for debugging

## Modification Guidelines

### Adding Visual Effects

1. Consider performance impact
2. Use shader-based effects when possible
3. Test on various hardware
4. Add toggle for debugging

### Modifying Mesh Generation

1. Profile before and after
2. Verify all tetrahedron faces correct
3. Test chunk boundary transitions
4. Check memory usage

### Shader Changes

1. Validate shader compilation
2. Test uniform bindings
3. Document uniform requirements
4. Consider fallback shaders

## OpenGL Best Practices

- Minimize state changes
- Use VAOs for vertex specification
- Prefer uniform buffers for shared data
- Check for OpenGL errors in debug builds

## Testing

- Visual inspection required
- Test wireframe mode
- Verify quadray overlay
- Check various view angles
- Profile frame times
