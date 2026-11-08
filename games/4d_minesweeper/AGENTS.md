# 4D Minesweeper — Model and runtime maintenance

Read the [game guide](README.md), [module ownership](js/README.md), [test scope](tests/README.md) and [portfolio contracts](../../docs/games.md) before changing behavior.

## Preserve the implemented boundary

Keep canonical enumeration, safe-zone placement, count caching and flood traversal on the same physical adjacency. Flags must remain hidden during safe flood expansion.

`MinesweeperGame.update()` is intentionally empty: mouse handlers perform reveal and flag operations. Zero-count flood reveal skips flagged sites; win detection counts revealed safe cells.

[index.html](index.html) instantiates `MinesweeperGame` after the actual shared imports and local board/renderer/controller scripts. Inheritance or an imported helper is not evidence that this game uses every shared system. Keep rules in `MinesweeperBoard`, projected drawing in `MinesweeperRenderer` and browser input/lifecycle in `MinesweeperGame`.

## Evidence and commands

Run commands from the QuadCraft repository root; launch with `python3.13 games/run_games.py --game minesweeper`. See [tests/README.md](tests/README.md) for the Node and harness commands. Report exercised checks, not saved counts, production-readiness or inferred canvas coverage. Review the actual controls in the game guide rather than copying another game's bindings.
