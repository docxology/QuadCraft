# Core Engine

The core engine provides fundamental data structures and algorithms for the tetrahedral voxel system.

## Directory Structure

```text
core/
├── coordinate/     # Coordinate systems (Quadray, Vector3)
├── entity/         # Entity management (Camera)
└── world/          # World generation and management
```

## Components

### Coordinate System (`coordinate/`)

- **Quadray.h** - Four-dimensional coordinate system for tetrahedral space
- **Vector3.h** - Traditional 3D Cartesian vector

Key features:

- Conversion between quadray and Cartesian coordinates
- Normalization to maintain constraint `a + b + c + d = constant`
- Operator overloads for coordinate arithmetic

### Entity System (`entity/`)

- **Camera.h** - Player camera with position and orientation

Features:

- View matrix generation
- Frustum calculation for culling
- Movement and rotation controls

### World System (`world/`)

- **World.h** - Central world management
- **TetraChunk.h/.cpp** - Chunk-based storage
- **TerrainGenerator.h** - Procedural generation
- **Block.h** - Block type definitions
- **TetrahedralElement.h** - Individual voxel representation

## Architecture

```text
World
├── TetraChunk[] (spatial partitioning)
│   └── TetrahedralElement[] (voxel data)
├── TerrainGenerator (procedural content)
└── Camera (view management)
```

## Key Algorithms

### Quadray Conversion

```cpp
// Cartesian to Quadray
float a = scale * (max(0, x) + max(0, y) + max(0, z));
float b = scale * (max(0, -x) + max(0, -y) + max(0, z));
float c = scale * (max(0, -x) + max(0, y) + max(0, -z));
float d = scale * (max(0, x) + max(0, -y) + max(0, -z));
```

### Terrain Generation

- Multi-octave fractal noise
- Adapted for tetrahedral geometry
- Features: mountains, caves, ore veins, water

## Dependencies

- Standard C++ library
- Math functions (for noise generation)
- No external dependencies in core
