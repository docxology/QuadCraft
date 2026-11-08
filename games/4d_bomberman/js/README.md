# 4D Bomberman JavaScript — Raw-grid bombs and logical-tick explosions

Navigate a raw four-index arena, place bombs and avoid enemies and explosions.

## Modules and entrypoint

The [game page](../index.html) loads sibling [shared modules](../../4d_generic/README.md) before the local game stack. Its local order is:

```text
bomberman_board.js
bomberman_renderer.js
bomberman_game.js
```

| File | Actual responsibility |
| --- | --- |
| [bomberman_board.js](bomberman_board.js) | `BombermanBoard`: `grid` keeps raw keys. Movement and explosions use eight signed single-coefficient steps, not the shared twelve-neighbor FCC adjacency. `step()` owns bomb counters, explosion propagation, enemy motion, power-ups, lives and level transitions. |
| [bomberman_renderer.js](bomberman_renderer.js) | `BombermanRenderer`: Depth-projected walls, destructible blocks, power-ups, explosions, bombs, enemies, player and board status. |
| [bomberman_game.js](bomberman_game.js) | `BombermanGame`: input, lifecycle and HUD wiring |

## Data and update boundary

One `board.step()` runs per 200 ms loop tick. Bomb timers and enemy motion are logical-step quantities; they are not seconds passed to a continuous integrator.

Preserve raw keys and the eight signed movement/explosion directions. Keep logical bomb ticks separate from fixed-second loop callback units; examine paused event callbacks explicitly.

## Limitations

Pause stops scheduled steps, but movement/bomb key callbacks only guard game-over state, not pause. Shared pathfinding/entity scripts being loaded does not make every board action use them. This is not a physical tetrahedral tessellation.

See the [game guide](../README.md) for controls, [logic tests](../tests/README.md) for coverage boundaries and [portfolio contracts](../../../docs/games.md) for geometry/time conventions. Shared modules are capabilities, not an automatic entity/physics/save/network layer for this game.
