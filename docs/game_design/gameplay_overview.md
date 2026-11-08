# QuadCraft Gameplay: Separate Prototypes, Shared Geometry, and Design Goals

QuadCraft contains several implementations, not one engine with every feature listed in historical design notes. This page describes development-checkout behavior from source; it is not an interactive-play or performance-validation report.

[Design index](README.md) · [Coordinate contract](../quadray_coordinates.md) · [Controls](controls_and_navigation.md) · [Blocks](block_system.md) · [Generation](world_generation.md) · [UI](../ui/user_interface.md).

## Core Concept

The common theme is exploring tetrahedral geometry through four-coefficient labels. Physical quadrays are rank-three Euclidean positions modulo a common offset. Portfolio games can additionally assign rules to distinct raw four-index slots, even when two slots have the same physical projection. The `4D` names do not mean that a four-axis Euclidean world is being rendered without loss.

## Implementations and Player Experience

| Entrypoint | Implemented interaction model | Boundary |
| --- | --- | --- |
| [Native `src/game`](../../src/game/Game.cpp) | Free camera, generated Cartesian chunks, colored tetrahedral element meshes, sampled block lookup/placement | Prototype shapes and storage are not a validated regular honeycomb or complete player physics system |
| [Monolithic browser experiment](../../src/browser/index.html) | Geometry painting, tetra/octa/ball brushes, camera controls, configurable visualization and experimental state tools | Own global state and controls; not the portfolio's shared game loop |
| [Modular browser experiment](../../src/js/experiments/browser/js/core/gameController.js) | Separate browser-controller experiment | Its API and state are not the native engine or the monolithic page |
| [Portfolio games](../../games/GAMES_INDEX.md) | Individual board, arcade, building and strategy rules, with shared helpers | No universal control scheme, voxel engine, save format or physics contract across titles |

## Core Gameplay Mechanics

### Navigation

Native movement controls a Cartesian camera. The browser painter has its own movement/rotation scheme. Many portfolio games rotate a view of projected game positions instead of moving an embodied first-person player. Use the [entrypoint-specific controls guide](controls_and_navigation.md), not a combined WASD/flight/gamepad table.

### Block Interaction

[4D Minecraft](../../games/4d_minecraft/js/minecraft_game.js) is a concrete building example:

1. The renderer picks the last-painted square marker containing the pointer.
2. Plain left-click attempts placement at the hovered raw label plus `(0,0,1,0)`.
3. Alt+left-click removes that raw slot and returns its block type to inventory.
4. Successful placement consumes inventory, increments placement count and adds one score point.

This is not selected-face tetrahedral placement, a physical upward displacement along Cartesian $y$, progressive mining by hardness or an exact 3D raycast. The shared embedding maps `+C` to $(-1,1,-1)/\sqrt2$.

### Building System

[MinecraftBoard](../../games/4d_minecraft/js/minecraft_board.js) stores raw-key blocks, inventory and counters. The ordinary controls select block IDs 1–10 with keys `1`–`9` and `0`. Other prototypes use different block/brush representations. There is no common blueprint, modding, mirror-tool or structure-validation API implied by these names.

## World System

Native generation samples deterministic sine-based fractal fields in Cartesian chunks; Minecraft initializes a finite layered raw-slot map with random grass/tree placement. These implementations have different boundaries and reproducibility properties. See [generation details](world_generation.md), including why `size=8` is not an enforced immutable world boundary.

## Model Methods Versus Active Game Behavior

Minecraft's board implements:

- `stepPhysics()`: label-based sand/water falling and water spreading.
- `stepTime()`: increments a scalar day/night counter and sets `lightLevel`.
- `update()`: invokes those two methods.
- `craft('planks')` and `craft('glass')`: fixed inventory conversions.

However, [MinecraftGame.update()](../../games/4d_minecraft/js/minecraft_game.js) only refreshes analysis and assigns it to the renderer. It does **not** call the board's `update()`. The default game loop therefore must not be advertised as running falling sand, flowing water or a progressing day/night cycle. The renderer can display sky states if the board's time changes, and a direct board consumer can invoke its update methods. Crafting is integrated separately: the [Minecraft page](../../games/4d_minecraft/index.html) has Craft Planks/Glass buttons that directly call the board recipes, although the controller binds no crafting key.

## Game Modes

Creative, exploration, challenge and educational modes were historical **design categories**, not four implemented selectable modes in a common engine. Minecraft provides a click-driven sandbox with finite inventory and score tracking. Individual portfolio games have their own objectives; these do not constitute a shared survival/progression system.

## Progression System

Minecraft configures `ScoreManager` with a level threshold of 50 placed-block score points and zero lives for its sandbox. That source configuration is not evidence of geometry-mastery achievements, tutorial completion, skill tracking or unlocked building capabilities. Such systems remain design ideas unless a particular game implements them explicitly.

## Design Philosophy

The design goals are mathematical legibility, controllable views and exploration of unfamiliar spatial labels. They are hypotheses about user experience, not measured educational outcomes. An evaluation would need explicit tasks and evidence—for example, whether players distinguish common-offset aliases, understand the four projected directions and predict raw-slot versus physical displacement.

## Future Gameplay Expansions

Structural integrity, integrated ecology, weather, guided coordinate lessons, world-spanning automation and a unified multiplayer game are possible design discussions, not a release commitment or runnable feature list. Each would need a concrete state model and integration design. Browser experiment networking controls alone do not establish a reliable multiplayer contract for the portfolio.

## Related Reading

- [Geometry and actual native offsets](../mathematics/tetrahedral_geometry.md)
- [Volume accounting versus measured solids](../mathematics/ivm_synergetics.md#game-volume-accounting)
- [Advanced building exercises](advanced_building_techniques.md)
- [Games overview](../games.md) and [implementation architecture](../architecture.md)
