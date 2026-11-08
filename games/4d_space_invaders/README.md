# 4D Space Invaders — Raw formation ticks, bullets and shields

Shoot alien formations before they descend to the ship row.

## Quick Start

From the QuadCraft repository root:

```bash
python3.13 games/run_games.py --game space_invaders
```

The launcher serves the parent `games/` tree, including shared `4d_generic/` scripts. Do not serve only this game folder. [index.html](index.html) constructs `SpaceInvadersGame(canvas, hudElement)` and calls `init()`; its script order is authoritative. There is no bundling step.

## Model and timing

`SpaceInvadersBoard` stores alien, bullet and shield arrays with raw component labels. The ship moves/clamps B/C/D; bullets step along A. Formation movement is along B and descends along -A on an edge reversal, not a general four-axis navigation algorithm. Hits compare raw coordinate keys (rounding bullet A); projected aliases are not merged.

`SpaceInvadersGame.update()` polls ship movement and calls one `board.step()` per 100 ms logical tick. Formation schedules, shooting cooldown and bullets are tick-based, not dt-integrated. Shared entity-system imports do not make these arrays an `EntityManager` world.

Physical Quadrays have rank three modulo a common offset; four gameplay labels do not imply four independent physical axes. See [portfolio geometry and runtime contracts](../../docs/games.md) for shared units, gauges and timing.

## Controls

Left/Right or A/D moves B; Up/Down or W/S moves C; Q/E moves D. Space shoots; N starts another game, R resets, P pauses. Shift+drag rotates and the wheel zooms.

## Source and tests

- [JavaScript modules and projection/picking](js/README.md): model, renderer and controller ownership.
- [Maintenance guidance](AGENTS.md): game-specific invariants.
- [Test entrypoints and limits](tests/README.md): actual local suites and browser-runner differences.
- [Portfolio index](../GAMES_INDEX.md): launcher catalog.

These interfaces are source-audited development-checkout behavior, not a claim that tests or browser checks were run for this page.
