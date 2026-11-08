# 4D Minesweeper JavaScript — State, projection and controller ownership

Plain scripts loaded by [the browser entrypoint](../index.html); shared dependencies come from `../../4d_generic/`, not a local Quadray copy. Preserve the entrypoint's actual load order. Board modules expose CommonJS exports for Node logic tests; this does not make the browser controller DOM-free.

| Module | Principal interface | Responsibility |
| --- | --- | --- |
| [`minesweeper_board.js`](minesweeper_board.js) | `MinesweeperBoard` | Board state and game rules |
| [`minesweeper_renderer.js`](minesweeper_renderer.js) | `MinesweeperRenderer` | Canvas projection and drawing |
| [`minesweeper_game.js`](minesweeper_game.js) | `MinesweeperGame` | Input, lifecycle and HUD |

## Game-specific interfaces

`reveal(a,b,c,d)` and `toggleFlag(a,b,c,d)` are mutation entrypoints; `getNeighborKeys` and `getCells` supply count/render data. `setCell` is an auxiliary-data compatibility method, not mine placement.

## Projection and interaction

`MinesweeperRenderer` caches projected cells during rendering. `hitTest` chooses the nearest center within 1.5 times its scaled cell radius, not a reverse paint-order face test.

Keep canonical enumeration, safe-zone placement, count caching and flood traversal on the same physical adjacency. Flags must remain hidden during safe flood expansion.

See [model/timing and controls](../README.md), [local regression scope](../tests/README.md) and [shared portfolio contracts](../../../docs/games.md). Screen overlap is not proof that two gameplay slots are identical.
