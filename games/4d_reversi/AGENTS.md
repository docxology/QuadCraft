# 4D Reversi — Model and runtime maintenance

Read the [game guide](README.md), [module ownership](js/README.md), [test scope](tests/README.md) and [portfolio contracts](../../docs/games.md) before changing behavior.

## Preserve the implemented boundary

Keep eighty-direction raw flanking separate from inherited physical-neighbor helpers. Preserve controller-owned pass/turn handling; do not advertise an automatic AI opponent.

`ReversiGame` owns a `TurnManager` and pass/end-of-game decisions. `update()` only synchronizes renderer state; clicks and M perform placements. The board also exposes a greedy `aiMove(color)` helper, but normal play does not automatically call it.

[index.html](index.html) instantiates `ReversiGame` after the actual shared imports and local board/renderer/controller scripts. Inheritance or an imported helper is not evidence that this game uses every shared system. Keep rules in `ReversiBoard`, projected drawing in `ReversiRenderer` and browser input/lifecycle in `ReversiGame`.

## Evidence and commands

Run commands from the QuadCraft repository root; launch with `python3.13 games/run_games.py --game reversi`. See [tests/README.md](tests/README.md) for the Node and harness commands. Report exercised checks, not saved counts, production-readiness or inferred canvas coverage. Review the actual controls in the game guide rather than copying another game's bindings.
