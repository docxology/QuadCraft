# QuadCraft API Reference

This document provides a reference for the core C++ API of QuadCraft.

## Core API

### World Management

| Class | Header | Description |
| --- | --- | --- |
| `World` | [src/core/world/World.h](../../src/core/world/World.h) | Main world management class |
| `TetraChunk` | [src/core/world/TetraChunk.h](../../src/core/world/TetraChunk.h) | Tetrahedral chunk data structure |
| `Block` | [src/core/world/Block.h](../../src/core/world/Block.h) | Block definitions and types |
| `TerrainGenerator` | [src/core/world/TerrainGenerator.h](../../src/core/world/TerrainGenerator.h) | Procedural world generation |

### Entity System

| Class | Header | Description |
| --- | --- | --- |
| `Entity` | [src/core/entity/Entity.h](../../src/core/entity/Entity.h) | Base entity class |
| `Camera` | [src/core/entity/Camera.h](../../src/core/entity/Camera.h) | Camera and view management |
| `EntityManager` | [src/core/entity/EntityManager.h](../../src/core/entity/EntityManager.h) | Entity lifecycle management |

### Coordinate System

| Class | Header | Description |
| --- | --- | --- |
| `Quadray` | [src/core/coordinate/Quadray.h](../../src/core/coordinate/Quadray.h) | Quadray coordinate implementation |
| `Vector3` | [src/core/coordinate/Vector3.h](../../src/core/coordinate/Vector3.h) | Cartesian vector math |

## Usage Examples

### Accessing the World

```cpp
#include "core/world/World.h"

// Get the block at a specific coordinate
Block GetBlockAt(World* world, int x, int y, int z) {
    return world->getBlock(x, y, z);
}
```

### Implementing Custom Blocks

See the [Modding Guide](modding_guide.md) for details on creating custom blocks and extending the API.
