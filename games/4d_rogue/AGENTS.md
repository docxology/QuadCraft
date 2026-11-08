# 4D Rogue — Model and runtime maintenance

Read the [game guide](README.md), [module ownership](js/README.md), [test scope](tests/README.md) and [portfolio contracts](../../docs/games.md) before changing behavior.

## Preserve the implemented boundary

Use `RogueBoard`, `RogueRenderer` and `RogueGame`, not generated U-prefixed names. Preserve canonical FOV crossings and blocker visibility. Do not claim raw Manhattan chase gates are IVM hop distance.

Movement key events call `board.move(dirIndex)`. Successful moves, attacks and door opening trigger enemy turns; the inherited frame update does not autonomously advance the dungeon. The injected seed controls board randomness, but reset continues the RNG rather than restarting a universal replay stream.

[index.html](index.html) instantiates `RogueGame` after the actual shared imports and local board/renderer/controller scripts. Inheritance or an imported helper is not evidence that this game uses every shared system. Keep rules in `RogueBoard`, projected drawing in `RogueRenderer` and browser input/lifecycle in `RogueGame`.

## Evidence and commands

Run commands from the QuadCraft repository root; launch with `python3.13 games/run_games.py --game rogue`. See [tests/README.md](tests/README.md) for the Node and harness commands. Report exercised checks, not saved counts, production-readiness or inferred canvas coverage. Review the actual controls in the game guide rather than copying another game's bindings.
