# 4D Space Invaders — Model and runtime maintenance

Read the [game guide](README.md), [module ownership](js/README.md), [test scope](tests/README.md) and [portfolio contracts](../../docs/games.md) before changing behavior.

## Preserve the implemented boundary

Document `SpaceInvadersBoard`, `SpaceInvadersRenderer` and `SpaceInvadersGame` rather than invented Invaders aliases. Keep raw hit keys and logical counters distinct from physical projection.

`SpaceInvadersGame.update()` polls ship movement and calls one `board.step()` per 100 ms logical tick. Formation schedules, shooting cooldown and bullets are tick-based, not dt-integrated. Shared entity-system imports do not make these arrays an `EntityManager` world.

[index.html](index.html) instantiates `SpaceInvadersGame` after the actual shared imports and local board/renderer/controller scripts. Inheritance or an imported helper is not evidence that this game uses every shared system. Keep rules in `SpaceInvadersBoard`, projected drawing in `SpaceInvadersRenderer` and browser input/lifecycle in `SpaceInvadersGame`.

## Evidence and commands

Run commands from the QuadCraft repository root; launch with `python3.13 games/run_games.py --game space_invaders`. See [tests/README.md](tests/README.md) for the Node and harness commands. Report exercised checks, not saved counts, production-readiness or inferred canvas coverage. Review the actual controls in the game guide rather than copying another game's bindings.
