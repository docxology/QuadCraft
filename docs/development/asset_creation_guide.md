# Asset Creation Guide

This guide explains how to create and import custom assets for QuadCraft.

## Texture Assets

QuadCraft uses standard image formats for block and item textures.

### Block Textures

- **Format**: PNG (recommended)
- **Resolution**: Powers of 2 (16x16, 32x32, 64x64)
- **Mapping**: Since blocks are tetrahedrons, textures are mapped to triangular faces. The texture is typically an equilateral triangle UV-mapped onto a square image.

#### Texture Layout

For a standard square texture:

- **Bottom-Left**: Vertex A
- **Bottom-Right**: Vertex B
- **Top-Center**: Vertex C (approximate)

### UI Textures

UI elements like icons and crosshairs should be transparent PNGs.

## Model Assets

While the world is voxel-based, entities (mobs, items) can use custom meshes.

- **Format**: OBJ or glTF
- **Scale**: 1 unit = 1 tetrahedron height
- **Orientation**: Forward is +Z, Up is +Y

## Importing Assets

Assets are typically loaded via the Modding System.

### Directory Structure

Place your assets in your mod folder:

```text
my_mod/
├── mod.json
└── assets/
    └── my_mod/
        ├── textures/
        │   ├── blocks/
        │   └── items/
        └── models/
            └── entities/
```

### Registration

Register textures in your mod's initialization code:

```cpp
registry->registerTexture("my_mod:custom_block", "assets/my_mod/textures/blocks/custom_block.png");
```

## Best Practices

1. **Consistency**: Match the pixel density of vanilla assets (default 16x16).
2. **seamlessness**: Ensure textures tile correctly on all 3 sides of the triangle.
3. **Optimization**: Keep texture sizes reasonable to save memory.
