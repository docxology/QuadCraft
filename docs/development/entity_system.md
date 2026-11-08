# Existing game objects and a bounded native entity proposal

[Development index](README.md) · [Native API](api_reference.md) · [Physics boundaries](physics_system.md)

## What the native runtime actually owns

[`src/core/entity/`](../../src/core/entity/) contains [`Camera.h`](../../src/core/entity/Camera.h), which defines `Camera`, `Frustum` and movement directions. [`Game.cpp`](../../src/game/Game.cpp) owns camera/world/input/mesher instances directly. Blocks are `TetrahedralElement` values inside chunks, not registered entities with components.

There is no native `Entity`, `EntityManager`, `Component`, prefab registry, health/AI/inventory component, scripting facade or entity serialization layer. Earlier class diagrams were a proposed architecture, not headers to include. The repository does not establish that such a native subsystem is in active implementation.

## Real JavaScript entity helpers

[`games/4d_generic/entity_system.js`](../../games/4d_generic/entity_system.js) exports `QuadrayEntity` and `EntityManager`. They are lightweight JavaScript helpers, not the native ECS proposal.

| Interface | Actual meaning |
|---|---|
| `new QuadrayEntity(pos, vel, opts)` | Four-number position/velocity arrays become raw coefficient records; options include radius/type/color/data |
| `update(dt, size)` | Adds velocity times the supplied multiplier; optionally wraps each raw component into `[0,size)` |
| `distTo(other)` | Embedded physical `Quadray.distance` |
| `euclideanDistTo(other)` | Raw four-coefficient Euclidean distance |
| `collidesWith(other)` | Strict raw-distance radius overlap, not the physical metric |
| `destroy()` | Sets `active = false`; manager removal is separate |
| `EntityManager.add(entity)` / `removeInactive()` | Collection insertion / removal of inactive entries |

The supplied `dt` multiplier is interpreted by the caller. Do not assume this helper migrates every game's historical per-step velocity units to seconds automatically. Asteroids uses its own specialized entity/collision implementation; individual controllers remain authoritative.

## Game-specific state is often simpler

[`SimAntBoard`](../../games/4d_simant/js/simant_board.js) owns an ant array and typed-array raw-cell fields. [`DoomGame`](../../games/4d_doom/js/doom_game.js) owns player/enemy/projectile/pickup collections from its own modules. Turn-based boards keep piece and turn state in their own board classes. No single ECS unifies these objects or guarantees shared lifecycle/save/network behavior.

## Conceptual native design considerations

A future entity abstraction could separate stable identity, transform, behavior and rendering, but the smallest game-specific representation should remain the baseline. Any design would need to decide:

- Whether position is a raw game index or a physical quadray equivalence class.
- Which update owns elapsed time, creation/deletion and deterministic random state.
- Whether camera, blocks and transient effects belong to the same ownership model at all.
- Which state must survive save/load or cross a network trust boundary.

These are design questions, not working APIs or a commitment to an ECS. A component diagram cannot substitute for concrete ownership and transition tests. Start from the actual consumer and [portfolio contracts](../games.md), not fictional native component headers.
