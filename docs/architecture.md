# QuadCraft architecture: three runtime families

[Documentation index](README.md) · [Implementation detail](development/architecture.md) · [Games portfolio](games.md)

## Native tetrahedral prototype

The C++17 executable starts at [`src/main.cpp`](../src/main.cpp). [`Game`](../src/game/Game.cpp) owns a GLFW/OpenGL window, `World`, `Camera`, `Input` and `ChunkMesher`. This is a small synchronous prototype, not a general component-based engine.

```text
GLFW input → Input / Camera → World / TetraChunk
                                  ↓
                         TerrainGenerator
                                  ↓
                            ChunkMesher → Mesh / Shader → OpenGL
```

`World` keys chunks by Cartesian integer triples. Blocks within each chunk use local quadrays. Mesh vertices are offset into world Cartesian space. [Chunk storage](development/chunk_system.md) and the [actual C++ interfaces](development/api_reference.md) explain the distinction.

The renderer emits tetrahedral faces with vertex colors, not marching-tetrahedra isosurfaces or imported texture/model assets. Camera motion is drone-like; native rigid-body collision and gravity are not implemented. Input block picking is sampled ray marching against stored keys, not exact tetrahedron intersection.

## Historical browser geometry experiments

[`src/browser/index.html`](../src/browser/index.html) and [`src/js/experiments/`](../src/js/experiments/) contain Canvas-based geometry experiments. Brushes, compressed CCP ball columns, quaternion arrays and cone-plane ellipse rendering belong to particular HTML snapshots, not a cross-runtime SDK. The newer browser page uses a `V`/`Var` tree and polls a JSP endpoint for experimental state merging.

Read [JavaScript runtime map](development/javascript_implementation.md) before reusing a snippet, and [networking limits](development/multiplayer_system.md) before interpreting synchronization as multiplayer support.

## Thirty browser games

The [`games/src/core/registry.py`](../games/src/core/registry.py) catalog names the portfolio. Each game has its own board/controller/Canvas renderer and imports helpers from `games/4d_generic/`; Doom uses ES modules. Shared files must remain beside game directories when serving or copying them.

The Python launcher is a static HTTP server launcher, not a gameplay backend. Portfolio rules may retain independent raw four-index slots even when quadray projection maps two slots to the same physical point. Physical quadrays themselves describe three dimensions modulo a common offset, not four independent Euclidean axes.

See [games and simulation contracts](games.md) for fixed time, RNG and graph semantics; [setup](development/setup_guide.md) and [verification commands](development/testing_guide.md) for the independent native, Node/Python and real-Chromium checks.
