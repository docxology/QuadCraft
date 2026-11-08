# 4D Pong — Model and runtime maintenance

Read the [game guide](README.md), [module ownership](js/README.md), [test scope](tests/README.md) and [portfolio contracts](../../docs/games.md) before changing behavior.

## Preserve the implemented boundary

Keep per-tick ball/paddle increments distinct from seconds-based timers. Do not identify the independent court axes with four independent physical Quadray axes.

The controller runs at a 16 ms loop interval, polls paddle motion, calls AI in one-player mode and calls `board.step(dt)` with seconds. Serve/power timers and paddle-velocity estimates use dt, but ball displacement and paddle/AI movement are per-step increments, not velocity-times-dt integration.

[index.html](index.html) instantiates `PongGame` after the actual shared imports and local board/renderer/controller scripts. Inheritance or an imported helper is not evidence that this game uses every shared system. Keep rules in `PongBoard`, projected drawing in `PongRenderer` and browser input/lifecycle in `PongGame`.

## Evidence and commands

Run commands from the QuadCraft repository root; launch with `python3.13 games/run_games.py --game pong`. See [tests/README.md](tests/README.md) for the Node and harness commands. Report exercised checks, not saved counts, production-readiness or inferred canvas coverage. Review the actual controls in the game guide rather than copying another game's bindings.
