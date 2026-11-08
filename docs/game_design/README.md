# Game Design Guide: Implemented Prototypes and Bounded Design Ideas

QuadCraft's native engine experiment, browser painter and standalone portfolio games have different state, rendering and controls. These pages describe source-defined behavior and mark conceptual discussions locally, rather than presenting a combined feature list.

## Contents

| Document | Purpose |
| --- | --- |
| [Gameplay overview](gameplay_overview.md) | Entrypoints, implemented interaction loops and limits of mode/progression claims |
| [World generation](world_generation.md) | Native sine-field Cartesian sampling versus Minecraft's raw-slot initial terrain |
| [Block system](block_system.md) | Real registries, keys, meshes, inventory and callable model operations |
| [Controls and navigation](controls_and_navigation.md) | Source-specific native, painter and portfolio keyboard/mouse behavior |
| [Building exercises](advanced_building_techniques.md) | Mathematical paths/symmetry and explicitly bounded construction ideas, not implemented generators or structural physics |

## Geometry Before Gameplay Claims

The [canonical coordinate contract](../quadray_coordinates.md) is the prerequisite: physical quadrays are rank-three common-offset equivalence classes. Games may retain independent raw four-index labels that project to the same physical location. The word `4D`, a tetra/octa parity label or a volume counter does not establish a four-dimensional physical world or validated nonoverlapping solid cells.

For ideal formulas versus actual native shapes and game markers, see [tetrahedral geometry](../mathematics/tetrahedral_geometry.md). For contact graphs and counting conventions, see [IVM units](../mathematics/ivm_synergetics.md).

## Design in Practice: Portfolio Games

The [portfolio index](../../games/GAMES_INDEX.md) lists individual board, strategy, building and arcade entrypoints. They share selected helpers, not a universal movement, modding, physics or save-game engine. A feature in one title is not inherited by every title.

For a concrete building example, Minecraft uses click placement at `+C`, Alt+click removal, raw-key occupancy and finite inventory. It paints square markers and provides Craft Planks/Glass buttons. Its board has physics/time methods, but the ordinary controller update only refreshes analysis. These distinctions are part of the current design, not evidence of a common survival simulation.

## Quick Reference

| Topic | Canonical local page |
| --- | --- |
| Actual ten-type Minecraft selection and camera gestures | [Controls](controls_and_navigation.md#portfolio-4d-minecraft) |
| Native free-camera movement and shortcut caveats | [Native controls](controls_and_navigation.md#native-prototype-controls) |
| Raw labels versus physical point identity | [Coordinate contract](../quadray_coordinates.md#usage-across-games) |
| Cell parity versus real mesh shape | [Block models](block_system.md#block-orientation--game-parity-labels) |
| Board-callable updates versus active game loop | [Gameplay boundaries](gameplay_overview.md#model-methods-versus-active-game-behavior) |

## Cross-References

- [Interface overview](../ui/user_interface.md)
- [Architecture](../architecture.md)
- [Games overview](../games.md)
- [Mathematics guide](../mathematics/README.md)
- [Glossary](../reference/glossary.md)
- [Documentation index](../README.md)
