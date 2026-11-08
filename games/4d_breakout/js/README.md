# 4D Breakout JavaScript — Logical-step ball motion and three-axis paddle control

Break raw-label bricks by steering a paddle across B, C and D while the ball travels along A.

## Modules and entrypoint

The [game page](../index.html) loads sibling [shared modules](../../4d_generic/README.md) before the local game stack. Its local order is:

```text
breakout_board.js
breakout_renderer.js
breakout_game.js
```

| File | Actual responsibility |
| --- | --- |
| [breakout_board.js](breakout_board.js) | `BreakoutBoard`: The board owns continuous raw ball labels, per-step velocity, brick hit counts, combo points, lives and level rebuilding. Brick contact checks the rounded raw ball cell; paddle contact compares raw B/C/D offsets. These are not swept physical-sphere collisions. |
| [breakout_renderer.js](breakout_renderer.js) | `BreakoutRenderer`: Projected bricks, paddle, ball/trail and the lives/score/level HUD. |
| [breakout_game.js](breakout_game.js) | `BreakoutGame`: input, lifecycle and HUD wiring |

## Data and update boundary

The controller polls held paddle keys and calls `board.step()` every 20 ms. Ball velocity and the 0.5 paddle increment are per logical step; the callback ignores dt rather than integrating physical units per second.

Do not add a second seconds multiplier to per-step motion or describe rounded raw brick contact as physical collision. Keep score/life synchronization between board and controller.

## Limitations

The collision model is rounded-cell/raw-component arcade logic, not the Asteroids swept-collision model or a general physics engine. Clearing bricks rebuilds the next level rather than ending a finite campaign.

See the [game guide](../README.md) for controls, [logic tests](../tests/README.md) for coverage boundaries and [portfolio contracts](../../../docs/games.md) for geometry/time conventions. Shared modules are capabilities, not an automatic entity/physics/save/network layer for this game.
