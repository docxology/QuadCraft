# 4D Sokoban — Model and runtime maintenance

Read the [game guide](README.md), [module ownership](js/README.md), [test scope](tests/README.md) and [portfolio contracts](../../docs/games.md) before changing behavior.

## Preserve the implemented boundary

Do not infer canonical adjacency from `BaseBoard` inheritance or shared direction names. Preserve the actual direct-offset rule and explicitly distinguish random generation from a solvability guarantee.

Keyboard events perform complete moves/pushes and win checks. The inherited `BaseGame.update` is empty; no autonomous physics advances boxes.

[index.html](index.html) instantiates `SokobanGame` after the actual shared imports and local board/renderer/controller scripts. Inheritance or an imported helper is not evidence that this game uses every shared system. Keep rules in `SokobanBoard`, projected drawing in `SokobanRenderer` and browser input/lifecycle in `SokobanGame`.

## Evidence and commands

Run commands from the QuadCraft repository root; launch with `python3.13 games/run_games.py --game sokoban`. See [tests/README.md](tests/README.md) for the Node and harness commands. Report exercised checks, not saved counts, production-readiness or inferred canvas coverage. Review the actual controls in the game guide rather than copying another game's bindings.
