# 4D Minesweeper JavaScript — Change boundaries

Follow [module ownership and projection](README.md) and the real [HTML imports](../index.html). Shared code is in `../../4d_generic/`; do not introduce a second local coordinate implementation.

Keep canonical enumeration, safe-zone placement, count caching and flood traversal on the same physical adjacency. Flags must remain hidden during safe flood expansion.

`MinesweeperGame.update()` is intentionally empty: mouse handlers perform reveal and flag operations. Zero-count flood reveal skips flagged sites; win detection counts revealed safe cells.

Update the [game guide](../README.md) when bindings or lifecycle change. [Local tests](../tests/README.md) describe actual evidence; importing shared geometry, routing or entity code does not establish its use by this game.
