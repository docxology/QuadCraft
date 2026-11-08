# 4D Tower Defense — Model and runtime maintenance

Read the [game guide](README.md), [module ownership](js/README.md), [test scope](tests/README.md) and [portfolio contracts](../../docs/games.md) before changing behavior.

## Preserve the implemented boundary

Keep route generation, physical placement rings and tower-distance exclusion distinct. The four polyhedron TV values are game metadata, not a measured union of tower coverage. Do not claim the launcher kills stale port owners.

`TDGame.update()` calls `board.update()` at a 16 ms loop interval. Board speed 1/2/3 performs that many `_step()` calls; simulated cooldown time is `tick * 16` ms. Regen restores 5% maximum HP every 30 logical steps, not every real second. The optional seed drives board path generation; reset generates another path without rewinding a universal replay stream.

[index.html](index.html) instantiates `TDGame` after the actual shared imports and local board/renderer/controller scripts. Inheritance or an imported helper is not evidence that this game uses every shared system. Keep rules in `TowerDefenseBoard`, projected drawing in `TDRenderer` and browser input/lifecycle in `TDGame`.

## Evidence and commands

Run commands from the QuadCraft repository root; launch with `python3.13 games/run_games.py --game tower_defense`. See [tests/README.md](tests/README.md) for the Node and harness commands. Report exercised checks, not saved counts, production-readiness or inferred canvas coverage. Review the actual controls in the game guide rather than copying another game's bindings.
