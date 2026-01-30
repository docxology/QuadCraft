# QuadCraft - AI Agent Guidelines

## Project Overview

QuadCraft is a tetrahedral-based voxel game using quadray coordinates, inspired by Minecraft. The project explores an alternative to cubic voxels using tetrahedral geometry and a four-dimensional coordinate system.

## Key Technologies

| Component | Technology | Location |
|-----------|------------|----------|
| Native Engine | C++17, OpenGL, GLEW, GLFW3 | `src/core/`, `src/game/`, `src/render/` |
| Browser Game | JavaScript, HTML5 Canvas | `src/browser/`, `src/js/` |
| Server Backend | Java, JSP, Tomcat | `src/server/` |
| Build System | CMake 3.10+ | `CMakeLists.txt` |

## Core Concepts

### Quadray Coordinate System

The quadray system uses four coordinates `(a, b, c, d)` instead of three Cartesian coordinates `(x, y, z)`:

- Based on tetrahedral geometry with 4 basis vectors from tetrahedron center to vertices
- Constraint: `a + b + c + d = constant` for points in same 3D space
- Enables precise tetrahedral grid navigation without floating-point errors
- Conversion functions in `src/core/coordinate/Quadray.h` and `src/js/experiments/browser/js/math/quadray.js`

### Tetrahedral Voxels

- Blocks are tetrahedra instead of cubes
- Space filled with octahedrons and two types of tetrahedrons (Z and C)
- Allows more natural representation of slopes and curves
- Each cube conceptually divided into 5 tetrahedra

## Architecture Patterns

```text
┌─────────────────────────────────────────────────────────┐
│                    Game Layer                           │
│  (Input handling, game loop, user interface)            │
├─────────────────────────────────────────────────────────┤
│                  Rendering Layer                        │
│  (Mesh generation, shaders, depth sorting)              │
├─────────────────────────────────────────────────────────┤
│                    Core Layer                           │
│  (Coordinates, world management, chunks, blocks)        │
└─────────────────────────────────────────────────────────┘
```

## Development Guidelines

### When Modifying Coordinate Systems

- Always maintain the quadray constraint (`a + b + c + d = constant`)
- Test conversions between quadray and Cartesian in both directions
- The 12 core navigation directions must preserve grid alignment

### When Working with Rendering

- Triangle sorting is critical for proper depth ordering
- Cone-plane intersection technique used for accurate sphere rendering
- Chunk-based mesh caching for performance

### When Modifying Game State

- Central state management in `gameState.js` (browser) or `Game.cpp` (native)
- Use dirty flags to trigger mesh regeneration only when needed
- Save format is JSON with quadray coordinates

## File Naming Conventions

- C++ headers: `PascalCase.h`
- C++ source: `PascalCase.cpp`
- JavaScript modules: `camelCase.js`
- Documentation: `snake_case.md`

## Testing Approach

- Browser version can be tested directly by opening HTML files
- Native version requires CMake build (`./build.sh`)
- Save/load functionality uses localStorage (browser) or JSON files

## Documentation Structure

- `/docs/` - Comprehensive documentation
- `/docs/development/` - Technical implementation guides
- `/docs/game_design/` - Gameplay mechanics
- `/docs/mathematics/` - Mathematical foundations
- Each source directory contains its own README.md and AGENTS.md

## Common Tasks

### Adding a New Block Type

1. Define block properties in `Block.h` / block system
2. Add to block registry
3. Update mesh generation for new geometry
4. Add any special rendering effects

### Modifying Terrain Generation

1. Edit `TerrainGenerator.h` or equivalent noise functions
2. Terrain uses fractal noise adapted for tetrahedral space
3. Test with various seed values

### Adding New Controls

1. Browser: Update `gameController.js` and `Input.h`
2. Native: Modify `Input.h` and `Game.cpp`
3. Document in controls section of README

## Performance Considerations

- Chunk loading/unloading based on player distance
- Sparse storage (only non-air elements stored)
- View frustum culling for rendering
- Efficient quadray-to-Cartesian conversion cached where possible
