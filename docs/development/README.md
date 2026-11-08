# Development guides by runtime and implementation boundary

[Documentation index](../README.md) · [Architecture overview](../architecture.md) · [Portfolio contracts](../games.md)

## Start and verify

- [Setup: native build or portfolio HTTP serving](setup_guide.md)
- [Tests: native, Node/Python, structure, and real Chromium](testing_guide.md)
- [Runtime ownership and data flow](architecture.md)
- [Actual C++ interfaces and JavaScript differences](api_reference.md)

These pages describe the development checkout. Commands are instructions, not saved passing results. Historical HTML/JSP experiments are separate from the thirty-game portfolio and from the C++17 executable.

## Native implementation and bounded designs

| Guide | What it documents |
|---|---|
| [Chunk storage](chunk_system.md) | Cartesian chunk keys, local quadrays, generation/dirty mesh lifecycle and numeric limits |
| [Entities](entity_system.md) | Direct native ownership, real JS helpers and conceptual entity design questions |
| [Physics](physics_system.md) | Native picking/motion limits and specialized browser-game kernels; no general native physics engine |
| [Source customization](modding_guide.md) | Real material/terrain/game edits, not a plugin SDK |
| [Visible assets](asset_creation_guide.md) | Vertex colors and source-owned browser resources; no texture/model import pipeline |

## Historical browser geometry experiments

| Guide | Concrete topic |
|---|---|
| [JavaScript runtime map](javascript_implementation.md) | Inline, old snapshot, modular experiment and portfolio boundaries |
| [CCP columns](ccp_ball_grid_system.md) | Range storage, Var-tree migration, surface extraction and cache limitations |
| [Sphere silhouettes](cone_plane_intersection_rendering.md) | Cone-plane conic output, fallback behavior and known visual limitation |
| [Brush composition](paintbrush_system.md) | Masks, offset Minkowski sums and incomplete non-ball removal |
| [Quaternion camera](quaternion_camera_system.md) | `[x,y,z,w]` arrays, free functions and movement/time ownership |
| [Gamepad polling](gamepad_integration_guide.md) | First-slot controller layout and real capability limits |
| [Live evaluation](realtime_code_evaluation.md) | Trusted direct eval, not sandboxed code execution |
| [Performance investigation](javascript_performance_optimization.md) | Source-visible costs and semantics-preserving profiling, not invented benchmark claims |
| [JSP synchronization](multiplayer_system.md) | Actual sparse Var merge and server timestamps; no production multiplayer promise |

## Shared contracts

[Portfolio documentation](../games.md) is the canonical local reference for raw labels versus physical quadrays, twelve-neighbor versus eight-neighbor graphs, fixed seconds, seeded streams and conservative transport. [Coordinate documentation](../quadray_coordinates.md) describes the embedding. Conceptual design sections identify unresolved decisions explicitly; they are not APIs to copy into a program.
