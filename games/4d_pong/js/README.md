# 4D Pong JavaScript — State, projection and controller ownership

Plain scripts loaded by [the browser entrypoint](../index.html); shared dependencies come from `../../4d_generic/`, not a local Quadray copy. Preserve the entrypoint's actual load order. Board modules expose CommonJS exports for Node logic tests; this does not make the browser controller DOM-free.

| Module | Principal interface | Responsibility |
| --- | --- | --- |
| [`pong_board.js`](pong_board.js) | `PongBoard` | Board state and game rules |
| [`pong_renderer.js`](pong_renderer.js) | `PongRenderer` | Canvas projection and drawing |
| [`pong_game.js`](pong_game.js) | `PongGame` | Input, lifecycle and HUD |

## Game-specific interfaces

`movePaddle(player,db,dc,dd)`, `aiMove()` and `step(dt)` own gameplay. `cycleDifficulty()` and `toggle2P()` modify the board mode; `getBallQuadray()` converts only for display/metadata, not physics.

## Projection and interaction

`PongRenderer` projects court corners, ball, paddles and effects to Canvas 2D. There is no mouse picking or physical FCC collision solver.

Keep per-tick ball/paddle increments distinct from seconds-based timers. Do not identify the independent court axes with four independent physical Quadray axes.

See [model/timing and controls](../README.md), [local regression scope](../tests/README.md) and [shared portfolio contracts](../../../docs/games.md). Screen overlap is not proof that two gameplay slots are identical.
