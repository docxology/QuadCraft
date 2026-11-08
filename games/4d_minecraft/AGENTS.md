# 4D Minecraft — Model and runtime maintenance

Read the [game guide](README.md), [module ownership](js/README.md), [test scope](tests/README.md) and [portfolio contracts](../../docs/games.md) before changing behavior.

## Preserve the implemented boundary

Do not silently wire board physics into the analysis-only controller. Preserve raw block occupancy and face-based picking. External world edits must invalidate analysis with `markAnalysisDirty()`.

The board exposes `stepPhysics()`, `stepTime()`, `update()` (both steps), and `craft(recipeType)`. However, the default `MinecraftGame.update()` only refreshes cached analysis; it does not call `board.update()`, so sand/water and day/night do not advance automatically. Board physics drops sand/water along -C and uses bounded canonical neighbors for water spreading.

[index.html](index.html) instantiates `MinecraftGame` after the actual shared imports and local board/renderer/controller scripts. Inheritance or an imported helper is not evidence that this game uses every shared system. Keep rules in `MinecraftBoard`, projected drawing in `MinecraftRenderer` and browser input/lifecycle in `MinecraftGame`.

## Evidence and commands

Run commands from the QuadCraft repository root; launch with `python3.13 games/run_games.py --game minecraft`. See [tests/README.md](tests/README.md) for the Node and harness commands. Report exercised checks, not saved counts, production-readiness or inferred canvas coverage. Review the actual controls in the game guide rather than copying another game's bindings.
