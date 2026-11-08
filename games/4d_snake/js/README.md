# 4D Snake JavaScript — State, projection and controller ownership

Plain scripts loaded by [the browser entrypoint](../index.html); shared dependencies come from `../../4d_generic/`, not a local Quadray copy. Preserve the entrypoint's actual load order. Board modules expose CommonJS exports for Node logic tests; this does not make the browser controller DOM-free.

| Module | Principal interface | Responsibility |
| --- | --- | --- |
| [`snake_board.js`](snake_board.js) | `SnakeBoard` | Board state and game rules |
| [`snake_renderer.js`](snake_renderer.js) | `SnakeRenderer` | Canvas projection and drawing |
| [`snake_game.js`](snake_game.js) | `SnakeGame` | Input, lifecycle and HUD |

## Game-specific interfaces

`step()`, `setDirection(dir)` and `setDirectionIndex(idx)` own movement; `getSnakeCells()` supplies render records. `_spawnFood()` respects the wrapped component. Direction-reversal rejection compares the complement `(2-da,2-db,2-dc,2-dd)`, not negated raw offsets.

## Projection and interaction

`SnakeRenderer` projects body segments and food with depth ordering and display effects. There is no click picking or movement on a canonical physical FCC board.

Keep array/Set occupancy equal after movement, growth and departing-tail entry. Preserve raw reachable-component food placement; physical normalization would merge distinct gameplay slots.

See [model/timing and controls](../README.md), [local regression scope](../tests/README.md) and [shared portfolio contracts](../../../docs/games.md). Screen overlap is not proof that two gameplay slots are identical.
