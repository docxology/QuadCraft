# Shader System - AI Agent Guidelines

## Overview

Shaders define the visual appearance. Changes are immediately visible but can break rendering.

## Guidelines

### Adding New Shaders

1. Create .glsl source files
2. Load via Shader class
3. Set up required uniforms
4. Test on target OpenGL version

### Modifying Existing Shaders

1. Backup working version
2. Test incrementally
3. Check all uniforms still set
4. Verify with various inputs

### Uniform Management

Required uniforms per frame:

- `view` - View matrix
- `projection` - Projection matrix
- `model` - Model matrix (if per-object)

Always verify uniforms are set before draw.

## Common Issues

### "Uniform not found"

- Name mismatch between C++ and GLSL
- Uniform optimized out (unused in shader)

### Black screen

- Shader compilation failed
- Matrix not set correctly
- Depth test issue

### Visual artifacts

- Precision issues (use highp)
- Interpolation problems
- Winding order mismatch

## Testing

- Test in wireframe mode
- Verify lighting from multiple angles
- Check with different block types
- Profile shader performance
