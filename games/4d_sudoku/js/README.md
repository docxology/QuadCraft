# 4D Sudoku JavaScript — State, projection and controller ownership

Plain scripts loaded by [the browser entrypoint](../index.html); shared dependencies come from `../../4d_generic/`, not a local Quadray copy. Preserve the entrypoint's actual load order. Board modules expose CommonJS exports for Node logic tests; this does not make the browser controller DOM-free.

| Module | Principal interface | Responsibility |
| --- | --- | --- |
| [`sudoku_board.js`](sudoku_board.js) | `SudokuBoard` | Board state and game rules |
| [`sudoku_renderer.js`](sudoku_renderer.js) | `SudokuRenderer` | Canvas projection and drawing |
| [`sudoku_game.js`](sudoku_game.js) | `SudokuGame` | Input, lifecycle and HUD |

## Game-specific interfaces

`place(pos,value)` mutates editable cells; `isGiven(pos)` protects clues. `_colorSolution(maxVal)` backtracks over the same bounded-neighbor graph as runtime checks. UI numeric selection is narrower than the unvalidated board value argument.

## Projection and interaction

`SudokuRenderer._proj` supplies the same camera/zoom projection to drawing and `hitTest`, which chooses the nearest cell center within 20 pixels. Selection is not reverse paint-order face containment.

Preserve canonical grid membership and the same adjacency in generator, conflicts and win checks. Do not advertise classic Sudoku constraints, unique solutions or model-level numeric validation beyond the implemented checks.

See [model/timing and controls](../README.md), [local regression scope](../tests/README.md) and [shared portfolio contracts](../../../docs/games.md). Screen overlap is not proof that two gameplay slots are identical.
