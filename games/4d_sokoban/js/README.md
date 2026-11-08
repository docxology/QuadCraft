# 4D Sokoban JavaScript — State, projection and controller ownership

Plain scripts loaded by [the browser entrypoint](../index.html); shared dependencies come from `../../4d_generic/`, not a local Quadray copy. Preserve the entrypoint's actual load order. Board modules expose CommonJS exports for Node logic tests; this does not make the browser controller DOM-free.

| Module | Principal interface | Responsibility |
| --- | --- | --- |
| [`sokoban_board.js`](sokoban_board.js) | `SokobanBoard` | Board state and game rules |
| [`sokoban_renderer.js`](sokoban_renderer.js) | `SokobanRenderer` | Canvas projection and drawing |
| [`sokoban_game.js`](sokoban_game.js) | `SokobanGame` | Input, lifecycle and HUD |

## Game-specific interfaces

The board exports `CELL` and `SokobanBoard`. `move(dirIndex)` adds the direction vector directly, including a second same-direction offset to push a box; it does not canonicalize either destination.

## Projection and interaction

`SokobanRenderer` projects the raw grid with depth sorting. Its `hitTest` helper exists, but `SokobanGame` binds only keyboard movement and does not use screen clicks to move boxes.

Do not infer canonical adjacency from `BaseBoard` inheritance or shared direction names. Preserve the actual direct-offset rule and explicitly distinguish random generation from a solvability guarantee.

See [model/timing and controls](../README.md), [local regression scope](../tests/README.md) and [shared portfolio contracts](../../../docs/games.md). Screen overlap is not proof that two gameplay slots are identical.
