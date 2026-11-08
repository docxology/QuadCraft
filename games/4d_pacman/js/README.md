# 4D Pac-Man JavaScript — State, projection and controller ownership

Plain scripts loaded by [the browser entrypoint](../index.html); shared dependencies come from `../../4d_generic/`, not a local Quadray copy. Preserve the entrypoint's actual load order. Board modules expose CommonJS exports for Node logic tests; this does not make the browser controller DOM-free.

| Module | Principal interface | Responsibility |
| --- | --- | --- |
| [`pacman_board.js`](pacman_board.js) | `PacManBoard` | Board state and game rules |
| [`pacman_renderer.js`](pacman_renderer.js) | `PacManRenderer` | Canvas projection and drawing |
| [`pacman_game.js`](pacman_game.js) | `PacmanGame` | Input, lifecycle and HUD |

## Game-specific interfaces

`setDirection(dir)` buffers the selected raw offset; `step()` owns movement and collisions; `getEntities()` supplies render data. The static direction name array labels only the first eight entries; names do not change the twelve numeric offsets.

## Projection and interaction

`PacManRenderer` projects and depth-sorts maze/entity sprites through `BaseRenderer`. Input is keyboard direction selection, not click-to-route picking. Rendered overlap does not merge raw collision sites.

Preserve wrapped raw keys and distinguish twelve model directions from eight bound keys. Do not document the misleading ±axis labels as actual unit-vector movement or claim BFS ghost routing.

See [model/timing and controls](../README.md), [local regression scope](../tests/README.md) and [shared portfolio contracts](../../../docs/games.md). Screen overlap is not proof that two gameplay slots are identical.
