# 4D Tetris JavaScript — State, projection and controller ownership

Plain scripts loaded by [the browser entrypoint](../index.html); shared dependencies come from `../../4d_generic/`, not a local Quadray copy. Preserve the entrypoint's actual load order. Board modules expose CommonJS exports for Node logic tests; this does not make the browser controller DOM-free.

| Module | Principal interface | Responsibility |
| --- | --- | --- |
| [`tetris_board.js`](tetris_board.js) | `TetrisBoard` | Board state and game rules |
| [`tetris_renderer.js`](tetris_renderer.js) | `TetrisRenderer` | Canvas projection and drawing |
| [`tetris_game.js`](tetris_game.js) | `TetrisGame` | Input, lifecycle and HUD |

## Game-specific interfaces

`movePiece(da,db,dc,dd)`, `rotatePiece()`, `gravity()`, `hardDrop()` and `spawnPiece(forceType=null)` own piece state. `getGhostCells()` is a computed preview; `_clearLines()` clears full raw A-slices.

## Projection and interaction

`TetrisRenderer` projects locked, active and ghost-piece cells and sorts by projected scale. The ghost previews drop position; it is not a collision body. No click picking controls falling pieces.

Preserve raw occupancy, rectangular bounds, B/C/D permutation and full-slice clearing. Do not replace these with inherited canonical neighbors or assume every callback consumes dt.

See [model/timing and controls](../README.md), [local regression scope](../tests/README.md) and [shared portfolio contracts](../../../docs/games.md). Screen overlap is not proof that two gameplay slots are identical.
