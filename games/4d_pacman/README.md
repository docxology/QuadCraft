# 4D Pac-Man — Wrapped raw maze movement and ghost decisions

Collect pellets and power pellets while avoiding four ghosts; clearing a maze starts the next level.

## Quick Start

From the QuadCraft repository root:

```bash
python3.13 games/run_games.py --game pacman
```

The launcher serves the parent `games/` tree, including shared `4d_generic/` scripts. Do not serve only this game folder. [index.html](index.html) constructs `PacmanGame(canvas, hudElement)` and calls `init()`; its script order is authoritative. There is no bundling step.

## Model and timing

`PacManBoard` stores walls, pellets and collisions by raw four-index keys on a wrapped size-5 board. `DIRECTIONS` contains the twelve nonnegative permutations of `(0,1,1,2)`. Movement adds these vectors and wraps each component without gauge reduction; the displayed ±axis names are not literal signed single-axis moves. Ghost decisions greedily minimize raw Manhattan distance to personality/state targets; the loaded pathfinding helper is not used for these decisions.

`PacmanGame.update()` calls one logical `board.step()` at a 150 ms loop interval. Board movement, pellet collection, ghost movement and power/fruit counters advance per step; this is not dt-scaled continuous transport.

Physical Quadrays have rank three modulo a common offset; four gameplay labels do not imply four independent physical axes. See [portfolio geometry and runtime contracts](../../docs/games.md) for shared units, gauges and timing.

## Controls

Arrow Up/Down/Right/Left select direction indices 0/1/2/3 (W/S/D/A aliases); E/Q select 4/5; X/Z select 6/7. The remaining four board directions have no keyboard binding. N starts a new game, R resets, P pauses; Shift+drag rotates and the wheel zooms.

## Source and tests

- [JavaScript modules and projection/picking](js/README.md): model, renderer and controller ownership.
- [Maintenance guidance](AGENTS.md): game-specific invariants.
- [Test entrypoints and limits](tests/README.md): actual local suites and browser-runner differences.
- [Portfolio index](../GAMES_INDEX.md): launcher catalog.

These interfaces are source-audited development-checkout behavior, not a claim that tests or browser checks were run for this page.
