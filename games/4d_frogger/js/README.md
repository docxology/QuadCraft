# 4D Frogger JavaScript — Event-driven hops and logical-step lane hazards

Hop along A through obstacle lanes while changing wrapped B/C/D lane positions.

## Modules and entrypoint

The [game page](../index.html) loads sibling [shared modules](../../4d_generic/README.md) before the local game stack. Its local order is:

```text
frogger_board.js
frogger_renderer.js
frogger_game.js
```

| File | Actual responsibility |
| --- | --- |
| [frogger_board.js](frogger_board.js) | `FroggerBoard`: A is bounded by the lane count; B/C/D hops wrap independently. Reaching the final A row adds a goal, resets the frog/timer and advances the level. `step()` moves obstacles along B/C/D and tests raw-coordinate proximity on the same A row; there are no four home slots or rideable-platform rules. |
| [frogger_renderer.js](frogger_renderer.js) | `FroggerRenderer`: Projected lane backgrounds, depth-sorted frog/obstacle entities, a logical-timer bar and board HUD. |
| [frogger_game.js](frogger_game.js) | `FroggerGame`: input, lifecycle and HUD wiring |

## Data and update boundary

The shared loop calls one `board.step()` every 200 ms. `timeLeft` counts logical ticks, not seconds; obstacle speed is per step. Hop input is event-driven rather than a held-key continuous integrator.

Preserve raw wrapped B/C/D state and bounded A progress. Keep timer/speed units per board step, and do not invent four-goal home slots or pause-gated hop ownership.

## Limitations

Hop callbacks guard game-over but not pause, so loop pause alone does not block hops. Collision is raw-coordinate arcade logic rather than physical sphere distance. Shared geometric readouts do not change the lane topology.

See the [game guide](../README.md) for controls, [logic tests](../tests/README.md) for coverage boundaries and [portfolio contracts](../../../docs/games.md) for geometry/time conventions. Shared modules are capabilities, not an automatic entity/physics/save/network layer for this game.
