# 4D Memory — Model and runtime maintenance

Read the [game guide](README.md), [module ownership](js/README.md), [test scope](tests/README.md) and [portfolio contracts](../../docs/games.md) before changing behavior.

## Preserve the implemented boundary

Preserve raw card keys and the third-flip hide behavior. Do not describe matching as FCC adjacency or claim that visible overlap gives a unique card.

Only click handlers mutate card state; the inherited update hook is empty. No movement or twelve-neighbor rule is used by matching.

[index.html](index.html) instantiates `MemoryGame` after the actual shared imports and local board/renderer/controller scripts. Inheritance or an imported helper is not evidence that this game uses every shared system. Keep rules in `MemoryBoard`, projected drawing in `MemoryRenderer` and browser input/lifecycle in `MemoryGame`.

## Evidence and commands

Run commands from the QuadCraft repository root; launch with `python3.13 games/run_games.py --game memory`. See [tests/README.md](tests/README.md) for the Node and harness commands. Report exercised checks, not saved counts, production-readiness or inferred canvas coverage. Review the actual controls in the game guide rather than copying another game's bindings.
