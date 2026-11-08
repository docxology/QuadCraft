# Native runtime, browser experiments, and portfolio boundaries

[Development index](README.md) · [Architecture overview](../architecture.md) · [API reference](api_reference.md)

## Three implementations, not one engine

| Runtime | Entry / implementation | Responsibilities |
|---|---|---|
| Native C++17 | [`src/main.cpp`](../../src/main.cpp), [`Game.cpp`](../../src/game/Game.cpp) | GLFW window, OpenGL 3.3 core rendering, camera/input, chunk generation and block edits |
| Historical browser experiments | [`src/browser/index.html`](../../src/browser/index.html), [`src/js/experiments/`](../../src/js/experiments/) | Canvas geometry, ball grids, brushes, camera experiments; the newer page also experiments with Var-tree synchronization |
| Browser-game portfolio | [`games/`](../../games/), [`registry.py`](../../games/src/core/registry.py) | Thirty separate game controllers, boards and renderers sharing JavaScript helpers |

The JavaScript portfolio does not call the native engine or use its `World` object. The Tomcat endpoint is not the portfolio's launcher server. The launcher serves static files; it does not adjudicate gameplay.

## Native initialization and frame ownership

`Game::initialize()` creates the window/context, initializes GLEW and GL state, then owns `World`, `Camera`, `ChunkMesher` and `Input` through `unique_ptr`. Shader source is embedded in `Game.cpp`. `initializeWorld()` requests nearby chunks and builds meshes.

`Game::run()` measures GLFW elapsed time in **seconds**, clamps each update to 0.05 seconds, calls `update()` and `render()`, then swaps/polls. Its frame limiter uses a busy wait, not a fixed-step simulation. A long stall therefore loses simulation time; this is not deterministic replay.

`update()` processes input, marks chunks dirty after camera movement, requests generation and rebuilds a bounded number of meshes. Despite a source comment about distance priority, `updateChunkMeshes()` iterates the dirty-chunk collection without sorting it. Generation and meshing run synchronously; there is no worker pool or job system.

## World-to-render data flow

1. `World` converts physical quadrays to Cartesian positions and floors them into three-dimensional chunk keys.
2. `TetraChunk` stores non-air elements under chunk-local quadray keys.
3. `TerrainGenerator` samples deterministic sums of sine waves at multiple octaves. It has no public seed parameter and is not a Perlin/simplex library despite its helper's name.
4. `ChunkMesher::createMeshForChunk()` emits individual triangular tetrahedron faces, checking neighbor blocks for air/transparency and adding the Cartesian chunk origin.
5. `Game` stores meshes by chunk key and renders with view/projection matrices and an identity model transform.

This is not marching tetrahedra over a scalar isosurface. UV fields exist but generated texture coordinates are zero and the fragment shader uses vertex colors. Distance/frustum decisions and draw budgets are present; a multi-resolution terrain LOD mesh pipeline is not.

See [chunk behavior and limits](chunk_system.md) for creation-versus-generation and floating-key caveats.

## Browser timing and state are separate contracts

The newer `src/browser/index.html` uses `setTimeout` scheduling, a clamped variable elapsed-seconds delta, global scene state and a `V`/`Var` tree. Older `QuadrayGrid*.html` snapshots and the modular experiment under `src/js/experiments/browser/` have different layouts and save formats. Do not mix snippets between them.

The portfolio's shared `GameLoop` instead accumulates **milliseconds** and calls `update(tickRate / 1000)` in fixed **seconds**. Doom has its own 60 Hz accumulator and input-time settlement. [Portfolio contracts](../games.md) describe raw board labels, physical points and random streams.

## Extension boundaries

There is no native ECS, rigid-body solver, plugin SDK, asset importer, packet protocol, matchmaking service or authoritative game server. [Entities](entity_system.md), [physics](physics_system.md), [source customization](modding_guide.md) and [network experiments](multiplayer_system.md) identify existing code and retain bounded design considerations without pretending those systems exist.
