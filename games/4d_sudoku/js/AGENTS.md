# 4D Sudoku JavaScript — Change boundaries

Follow [module ownership and projection](README.md) and the real [HTML imports](../index.html). Shared code is in `../../4d_generic/`; do not introduce a second local coordinate implementation.

Preserve canonical grid membership and the same adjacency in generator, conflicts and win checks. Do not advertise classic Sudoku constraints, unique solutions or model-level numeric validation beyond the implemented checks.

Clicks/number-key events edit values. The inherited update hook is empty. R clears non-givens while preserving the puzzle; N constructs another `SudokuBoard(4)` and reconnects the renderer.

Update the [game guide](../README.md) when bindings or lifecycle change. [Local tests](../tests/README.md) describe actual evidence; importing shared geometry, routing or entity code does not establish its use by this game.
