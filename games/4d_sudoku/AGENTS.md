# 4D Sudoku — Model and runtime maintenance

Read the [game guide](README.md), [module ownership](js/README.md), [test scope](tests/README.md) and [portfolio contracts](../../docs/games.md) before changing behavior.

## Preserve the implemented boundary

Preserve canonical grid membership and the same adjacency in generator, conflicts and win checks. Do not advertise classic Sudoku constraints, unique solutions or model-level numeric validation beyond the implemented checks.

Clicks/number-key events edit values. The inherited update hook is empty. R clears non-givens while preserving the puzzle; N constructs another `SudokuBoard(4)` and reconnects the renderer.

[index.html](index.html) instantiates `SudokuGame` after the actual shared imports and local board/renderer/controller scripts. Inheritance or an imported helper is not evidence that this game uses every shared system. Keep rules in `SudokuBoard`, projected drawing in `SudokuRenderer` and browser input/lifecycle in `SudokuGame`.

## Evidence and commands

Run commands from the QuadCraft repository root; launch with `python3.13 games/run_games.py --game sudoku`. See [tests/README.md](tests/README.md) for the Node and harness commands. Report exercised checks, not saved counts, production-readiness or inferred canvas coverage. Review the actual controls in the game guide rather than copying another game's bindings.
