# 4D Pac-Man — Model and runtime maintenance

Read the [game guide](README.md), [module ownership](js/README.md), [test scope](tests/README.md) and [portfolio contracts](../../docs/games.md) before changing behavior.

## Preserve the implemented boundary

Preserve wrapped raw keys and distinguish twelve model directions from eight bound keys. Do not document the misleading ±axis labels as actual unit-vector movement or claim BFS ghost routing.

`PacmanGame.update()` calls one logical `board.step()` at a 150 ms loop interval. Board movement, pellet collection, ghost movement and power/fruit counters advance per step; this is not dt-scaled continuous transport.

[index.html](index.html) instantiates `PacmanGame` after the actual shared imports and local board/renderer/controller scripts. Inheritance or an imported helper is not evidence that this game uses every shared system. Keep rules in `PacManBoard`, projected drawing in `PacManRenderer` and browser input/lifecycle in `PacmanGame`.

## Evidence and commands

Run commands from the QuadCraft repository root; launch with `python3.13 games/run_games.py --game pacman`. See [tests/README.md](tests/README.md) for the Node and harness commands. Report exercised checks, not saved counts, production-readiness or inferred canvas coverage. Review the actual controls in the game guide rather than copying another game's bindings.
