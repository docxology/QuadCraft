# Native C++17 interfaces and JavaScript API boundaries

[Development index](README.md) · [Chunk contract](chunk_system.md) · [JavaScript map](javascript_implementation.md)

## Coordinates and units

All native types below are in namespace `QuadCraft`. Include paths in snippets assume the repository's `src/` is an include root.

| Header | Existing interface |
|---|---|
| [`Quadray.h`](../../src/core/coordinate/Quadray.h) | `Quadray(float a, float b, float c, float d)`, `normalized()`, `toCartesian()`, static `fromCartesian(const Vector3&)`, `length()`, `magnitude()`, static/instance `distance()`, `operator+`, `operator*` |
| [`Vector3.h`](../../src/core/coordinate/Vector3.h) | Cartesian vector storage and arithmetic used by camera, chunks and meshes |

Normalization subtracts the minimum coefficient; it does not normalize vector length. Physical coordinates are common-offset equivalence classes. Native/shared-JS Cartesian coordinates are

```text
(x,y,z) = (a-b-c+d, a-b+c-d, a+b-c-d) / sqrt(2)
```

A coefficient-unit basis vector has length `sqrt(3/2)`. Native values are `float`, not exact integers/rationals. [Coordinate documentation](../quadray_coordinates.md) covers the embedding; do not borrow another suite member's scale/orientation unchanged.

## Blocks, world and chunks

| Header | Existing interface and behavior |
|---|---|
| [`Block.h`](../../src/core/world/Block.h) | `Block::BlockID` is `uint16_t`; built-in IDs air, stone, dirt, grass, water, sand, ore. `Block(id, transparent, solid, name)` and `BlockRegistry::registerBlock(const Block&)` are source-level customization points. Unknown registry IDs return the air definition. |
| [`World.h`](../../src/core/world/World.h) | `getBlock(const Quadray&) const`, `setBlock(const Quadray&, Block::BlockID)`, `getChunk(int,int,int)`, `hasChunk(int,int,int) const`, `getOrCreateChunk(int,int,int)`, `worldToChunkCoords(const Vector3&) const`, `generateChunksAround(const Quadray&,int)`, `updateChunks(const Quadray&)` |
| [`TetraChunk.h`](../../src/core/world/TetraChunk.h) | `TetraChunk(int,int,int)`, local `getBlock`/`setBlock`, `worldToChunkSpace`, `chunkToWorldSpace`, `generate()`, `getElements() const`, `getNeighbors()`, `updateNeighborChunks(World&)`, dirty/generated/visible flags |
| [`TerrainGenerator.h`](../../src/core/world/TerrainGenerator.h) | `generateChunk(TetraChunk&)`; parameters/noise helpers are private, with no public seed API |

`getChunk` creates empty storage. `getOrCreateChunk` generates only on its new-chunk path; it returns an already present chunk unchanged. Neither method is a promise to regenerate existing storage. Use [chunk lifecycle](chunk_system.md) rather than assuming a universal lazy-generation API.

```cpp
#include "core/world/World.h"

void placeStone(QuadCraft::World& world) {
    const auto position = QuadCraft::Quadray::fromCartesian(
        QuadCraft::Vector3(20.0f, 5.0f, 5.0f));
    world.setBlock(position, QuadCraft::Block::STONE_BLOCK);
    const auto id = world.getBlock(position);
    (void)id;
}
```

This uses actual storage methods, not terrain containment or exact face picking. It does not save changes to disk.

## Rendering, camera and input

[`ChunkMesher.cpp`](../../src/render/mesh/ChunkMesher.cpp) implements `createMeshForChunk(const TetraChunk&)` and returns `shared_ptr<Mesh>`. It needs an OpenGL context for mesh upload. [`Camera.h`](../../src/core/entity/Camera.h) uses Cartesian position and Euler-angle camera state; it is not the browser experiment's quaternion-array camera.

[`Input.h`](../../src/game/Input.h) takes a GLFW window, camera, world and `GameInputDelegate&`; `processInput(float deltaTime, Camera&, World&)` receives seconds. The delegate exposes `toggleWireframe()` and `toggleOverlay()`.

## JavaScript is not a C++ binding

[`games/4d_generic/quadray.js`](../../games/4d_generic/quadray.js) has JavaScript-specific methods, including `Quadray.fromCartesian(x,y,z)` with three numbers, not a C++ `Vector3` argument. [`GridUtils`](../../games/4d_generic/grid_utils.js) distinguishes raw labels from canonical physical cells. The historical HTML experiments define yet another local `Quadray` API. See [portfolio contracts](../games.md).

There are no installed `quadcraft/api/` headers, native `EntityManager`, physics-world API or mod registry. Those names are not usable recipes; see [source customization](modding_guide.md).
