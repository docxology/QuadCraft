# 4D Life JavaScript — Raw four-label toroidal cellular automaton

A cellular automaton on a raw four-index torus, projected with Quadray geometry for visualization.

## Modules and entrypoint

The [game page](../index.html) loads sibling [shared modules](../../4d_generic/README.md) before the local game stack. Its local order is:

```text
life_board.js
life_renderer.js
life_game.js
```

| File | Actual responsibility |
| --- | --- |
| [life_board.js](life_board.js) | `LifeBoard`: Live cells are raw-key strings in a Set. `countNeighbors` enumerates all 80 nonzero offsets in `{−1,0,1}^4`, wrapping each coefficient. A live cell survives with 4–8 neighbors; an empty cell is born with exactly 5. The shared twelve-neighbor helper is available for readouts but is not the automaton’s update neighborhood. |
| [life_renderer.js](life_renderer.js) | `LifeRenderer`: Depth-projected live cells, glow, hover geometric readouts and generation/population HUD. |
| [life_game.js](life_game.js) | `LifeGame`: input, lifecycle and HUD wiring |

## Data and update boundary

The shared loop has a 500 ms update tick. Inside `update()`, `performance.now()` gates at most one generation by the separate `speed` millisecond threshold (initially 200). Thus the displayed speed is not a guaranteed generation interval; this is not fixed-dt continuous integration.

Preserve the raw Set and 80-offset toroidal update rule; do not replace it with GridUtils’s twelve-neighbor graph. Keep the wall-clock speed gate distinct from the shared loop’s fixed-second callback units.

## Limitations

Raw common-offset aliases remain distinct automaton cells even when they project to the same physical point. Named patterns are seed shapes, not verified oscillators/gliders under these nonstandard B5/S4–8 rules. This is not ordinary Conway B3/S23 or a twelve-neighbor FCC automaton.

See the [game guide](../README.md) for controls, [logic tests](../tests/README.md) for coverage boundaries and [portfolio contracts](../../../docs/games.md) for geometry/time conventions. Shared modules are capabilities, not an automatic entity/physics/save/network layer for this game.
