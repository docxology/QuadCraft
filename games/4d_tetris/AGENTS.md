# 4D Tetris — Model and runtime maintenance

Read the [game guide](README.md), [module ownership](js/README.md), [test scope](tests/README.md) and [portfolio contracts](../../docs/games.md) before changing behavior.

## Preserve the implemented boundary

Preserve raw occupancy, rectangular bounds, B/C/D permutation and full-slice clearing. Do not replace these with inherited canonical neighbors or assume every callback consumes dt.

The controller loop interval is 16 ms, but gravity is separately scheduled by `performance.now()` against the board millisecond `tickInterval`. It executes at most one gravity call per eligible update, resets the gravity clock on unpause and spawns a piece on init/reset. This is not elapsed-seconds gravity integration.

[index.html](index.html) instantiates `TetrisGame` after the actual shared imports and local board/renderer/controller scripts. Inheritance or an imported helper is not evidence that this game uses every shared system. Keep rules in `TetrisBoard`, projected drawing in `TetrisRenderer` and browser input/lifecycle in `TetrisGame`.

## Evidence and commands

Run commands from the QuadCraft repository root; launch with `python3.13 games/run_games.py --game tetris`. See [tests/README.md](tests/README.md) for the Node and harness commands. Report exercised checks, not saved counts, production-readiness or inferred canvas coverage. Review the actual controls in the game guide rather than copying another game's bindings.
