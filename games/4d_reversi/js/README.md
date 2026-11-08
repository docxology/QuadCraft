# 4D Reversi JavaScript — State, projection and controller ownership

Plain scripts loaded by [the browser entrypoint](../index.html); shared dependencies come from `../../4d_generic/`, not a local Quadray copy. Preserve the entrypoint's actual load order. Board modules expose CommonJS exports for Node logic tests; this does not make the browser controller DOM-free.

| Module | Principal interface | Responsibility |
| --- | --- | --- |
| [`reversi_board.js`](reversi_board.js) | `ReversiBoard` | Board state and game rules |
| [`reversi_renderer.js`](reversi_renderer.js) | `ReversiRenderer` | Canvas projection and drawing |
| [`reversi_game.js`](reversi_game.js) | `ReversiGame` | Input, lifecycle and HUD |

## Game-specific interfaces

The board exports `ReversiColor`, not `Disk`. `getValidMoves(color)` returns `{pos, flips}` entries; `place(pos,color)` mutates discs. The controller owns pass/end decisions; `aiMove(color)` is a separate greedy helper.

## Projection and interaction

`ReversiRenderer.hitTest` returns the first valid move whose projected center is within 18 pixels. This is neither nearest-center selection nor reverse paint-order disc picking; overlapping raw aliases remain distinct model labels.

Keep eighty-direction raw flanking separate from inherited physical-neighbor helpers. Preserve controller-owned pass/turn handling; do not advertise an automatic AI opponent.

See [model/timing and controls](../README.md), [local regression scope](../tests/README.md) and [shared portfolio contracts](../../../docs/games.md). Screen overlap is not proof that two gameplay slots are identical.
