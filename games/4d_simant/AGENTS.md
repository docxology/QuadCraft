# 4D SimAnt — Model and runtime maintenance

Read the [game guide](README.md), [module ownership](js/README.md), [test scope](tests/README.md) and [portfolio contracts](../../docs/games.md) before changing behavior.

## Preserve the implemented boundary

Never replace the eight-neighbor terrain graph with `GridUtils.neighbors`. Keep per-ant live-validated home routes, conservative transport, explicit decay/source accounting and cosmetic RNG separate.

One `board.update()` advances a logical tick. Controller speed intervals are 300/150/50 ms; transport occurs every ten ticks and explicit evaporation every five. Reset reconstructs the board-owned RNG from the retained seed.

[index.html](index.html) instantiates `SimAntGame` after the actual shared imports and local board/renderer/controller scripts. Inheritance or an imported helper is not evidence that this game uses every shared system. Keep rules in `SimAntBoard`, projected drawing in `SimAntRenderer` and browser input/lifecycle in `SimAntGame`.

## Evidence and commands

Run commands from the QuadCraft repository root; launch with `python3.13 games/run_games.py --game simant`. See [tests/README.md](tests/README.md) for the Node and harness commands. Report exercised checks, not saved counts, production-readiness or inferred canvas coverage. Review the actual controls in the game guide rather than copying another game's bindings.
