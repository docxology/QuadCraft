# World System

This directory contains the world generation and management systems.

## Files

| File | Purpose |
|------|---------|
| `World.h` | Central world management |
| `TetraChunk.h` | Chunk data structure (header) |
| `TetraChunk.cpp` | Chunk implementation |
| `TerrainGenerator.h` | Procedural terrain generation |
| `Block.h` | Block type definitions |
| `TetrahedralElement.h` | Individual voxel element |

## Architecture

```text
World
├── Manages collection of TetraChunks
├── Handles chunk loading/unloading
├── Provides block access interface
└── Coordinates terrain generation

TetraChunk
├── Fixed-size spatial partition
├── Contains TetrahedralElements
├── Tracks dirty state for mesh regeneration
└── Sparse storage for memory efficiency

TerrainGenerator
├── Fractal noise functions
├── Height map generation
├── Feature placement (caves, ores, water)
└── Biome determination
```

## Key Concepts

### Chunk System

Chunks partition the world into manageable pieces:

- Fixed dimensions for predictable memory usage
- Load chunks near player, unload distant ones
- Dirty flag triggers mesh regeneration

### Tetrahedral Elements

Each element represents a single tetrahedral voxel:

- Position in quadray coordinates
- Block type reference
- Optional metadata

### Block Types

Blocks define material properties:

- Visual appearance (color, texture)
- Physical properties (solid, liquid)
- Interaction behavior

## Terrain Features

The terrain generator creates:

- **Mountains**: Higher frequency noise
- **Caves**: 3D noise for cavities
- **Ore Veins**: Clustered deposits
- **Water**: Below certain elevation
