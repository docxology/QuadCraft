# QuadCraft source and documentation maintenance

## Start with the runtime boundary

Read [README.md](README.md), [architecture](docs/architecture.md) and scoped instructions before editing. QuadCraft contains a native C++17 prototype, historical browser/server geometry experiments and thirty portfolio games. They do not share one world/entity/render/save/network runtime.

| Area | Source and scope |
|---|---|
| Native | `src/core/`, `src/game/`, `src/render/`; CMake, GLFW, GLEW, OpenGL |
| Browser experiments | Exact HTML snapshot under `src/browser/` or `src/js/experiments/`; local JS helpers differ from portfolio helpers |
| Server experiment | `src/server/tomcat/webapps/QuadCraft/QuadCraftAjax.jsp`; polled Var-tree state merge, not authenticated multiplayer |
| Portfolio | `games/4d_<key>/`, shared `games/4d_generic/`, Python launcher/QA `games/src/` |

## Coordinate and storage contracts

Physical quadrays are common-offset equivalence classes of four coefficients with rank three. Native/shared JavaScript use

```text
(x,y,z) = (a-b-c+d, a-b+c-d, a+b-c-d) / sqrt(2)
```

Zero-minimum normalization is a gauge choice, not Euclidean unit normalization. Preserve each implementation's declared scale and orientation. Float native coordinates are not exact arithmetic.

Native chunk keys are Cartesian integer triples, selected by floor division including negative positions. Inside chunks, element keys are local quadrays; mesh vertices add the Cartesian chunk origin. Read [chunk lifecycle](docs/development/chunk_system.md) before changing generation or dirty invalidation.

Portfolio raw labels may intentionally preserve aliases. `GridUtils.generateGrid/key` keep raw identity; canonical generation/neighbors describe physical points. Do not normalize every board key or interchange raw four-coefficient metrics with `Quadray.distance`. [Portfolio contracts](docs/games.md) own the exact graph/time/RNG distinctions.

## Source modification rules

- Inspect declarations and real callers before changing/documenting interfaces. Native namespace is `QuadCraft`; C++ `fromCartesian` accepts `Vector3`, shared JS accepts three numbers, historical HTML has separate APIs.
- Native ownership is direct `Game`/`World`/`Camera`/`Input`/`ChunkMesher`, not a shipped ECS or physics world.
- Shader code is embedded in `Game.cpp`; current meshes use vertex colors, not an imported texture/model pipeline.
- Native block picking is sampled ray marching, not exact tetrahedron intersection. Camera movement is not collision physics.
- Older browser maps and newer Var-tree storage/save formats differ; identify the snapshot before copying code.
- Direct browser eval is trusted page-privileged code, not a sandbox or mod loader.
- A static portfolio HTTP server is not the JSP endpoint or a multiplayer backend.
- Do not claim unimplemented modding, networking, physics, assets or LOD features from conceptual documents.

## Time and random ownership

Shared portfolio `GameLoop` accumulates milliseconds and passes fixed seconds to updates; individual logical-tick/specialized controllers remain authoritative. Native and historical browser loops use clamped variable deltas. Do not add a second dt multiplication or apply new input retroactively to accumulated time.

Use existing injected random streams where consumers expose them; there is no universal seeded replay/reset API. Conservative graph transport exchanges equal/opposite edge flux and is not symmetric-normalized heat. Masks disable edges rather than deleting stored field mass.

## Build and verification routing

[Setup](docs/development/setup_guide.md) contains native dependencies/build options and HTTP launch instructions. [Testing](docs/development/testing_guide.md) separates graphics-free CTest, Node/Python logic, catalog validation and real Chromium rendering/input. Examples explicitly use Python 3.13 without changing repository pins. Report only checks actually exercised; old counts/dated receipts are not current green evidence.

## Documentation maintenance

Read [docs/AGENTS.md](docs/AGENTS.md) and [development rules](docs/development/AGENTS.md). Use source-backed signatures, informative topic titles and canonical cross-links. Remove fictional recipes rather than placing a warning before them. Retain useful design questions as explicitly conceptual material. Keep hub navigation and inbound heading links synchronized; preserve immutable release artifacts and user-generated output.
