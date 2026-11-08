# 4D Snake — Model and runtime maintenance

Read the [game guide](README.md), [module ownership](js/README.md), [test scope](tests/README.md) and [portfolio contracts](../../docs/games.md) before changing behavior.

## Preserve the implemented boundary

Keep array/Set occupancy equal after movement, growth and departing-tail entry. Preserve raw reachable-component food placement; physical normalization would merge distinct gameplay slots.

`SnakeGame.update()` calls one logical `step()` per loop tick and synchronizes the millisecond tick interval with the board speed. Eating grows the body; filling the playable component ends the board even if other raw components are empty.

[index.html](index.html) instantiates `SnakeGame` after the actual shared imports and local board/renderer/controller scripts. Inheritance or an imported helper is not evidence that this game uses every shared system. Keep rules in `SnakeBoard`, projected drawing in `SnakeRenderer` and browser input/lifecycle in `SnakeGame`.

## Evidence and commands

Run commands from the QuadCraft repository root; launch with `python3.13 games/run_games.py --game snake`. See [tests/README.md](tests/README.md) for the Node and harness commands. Report exercised checks, not saved counts, production-readiness or inferred canvas coverage. Review the actual controls in the game guide rather than copying another game's bindings.
