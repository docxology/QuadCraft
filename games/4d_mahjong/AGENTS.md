# 4D Mahjong — Model and runtime maintenance

Read the [game guide](README.md), [module ownership](js/README.md), [test scope](tests/README.md) and [portfolio contracts](../../docs/games.md) before changing behavior.

## Preserve the implemented boundary

Keep logical layer ordering separate from camera depth and exposure. Do not replace array tile identity with normalized occupancy keys.

Play is click-driven; the inherited `BaseGame.update` does not advance tile state. The loop services rendering/HUD, while hints expire against `performance.now()` in milliseconds.

[index.html](index.html) instantiates `MahjongGame` after the actual shared imports and local board/renderer/controller scripts. Inheritance or an imported helper is not evidence that this game uses every shared system. Keep rules in `MahjongBoard`, projected drawing in `MahjongRenderer` and browser input/lifecycle in `MahjongGame`.

## Evidence and commands

Run commands from the QuadCraft repository root; launch with `python3.13 games/run_games.py --game mahjong`. See [tests/README.md](tests/README.md) for the Node and harness commands. Report exercised checks, not saved counts, production-readiness or inferred canvas coverage. Review the actual controls in the game guide rather than copying another game's bindings.
