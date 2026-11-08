# 4D Life — Raw four-label toroidal cellular automaton

A cellular automaton on a raw four-index torus, projected with Quadray geometry for visualization.

“4D” is the portfolio name. Physical Quadray projection has rank three; raw board labels may deliberately carry additional game state. See the [portfolio coordinate/time contract](../../docs/games.md).

## Quick Start

From the QuadCraft repository root, with Python 3.13 and a modern browser:

```bash
python3.13 games/run_games.py --game life
```

Serve the parent `games/` tree, not this game directory alone: [index.html](index.html) loads sibling `../4d_generic/` assets. No JavaScript bundling step is needed. The static launcher is not a multiplayer backend.

## Game Mechanics

Live cells are raw-key strings in a Set. `countNeighbors` enumerates all 80 nonzero offsets in `{−1,0,1}^4`, wrapping each coefficient. A live cell survives with 4–8 neighbors; an empty cell is born with exactly 5. The shared twelve-neighbor helper is available for readouts but is not the automaton’s update neighborhood.

### Clock and lifecycle

The shared loop has a 500 ms update tick. Inside `update()`, `performance.now()` gates at most one generation by the separate `speed` millisecond threshold (initially 200). Thus the displayed speed is not a guaranteed generation interval; this is not fixed-dt continuous integration.

## Key Controls

Space/P toggles the loop; S advances one generation even while paused; Up/Down decrease/increase the speed threshold by 50 ms (minimum 50). R reseeds. The page buttons expose play/pause, single-step and reseed. Shift+drag rotates; the wheel zooms.

## Architecture

- [Model](js/life_board.js): `LifeBoard` owns game state and rules.
- [Renderer](js/life_renderer.js): `LifeRenderer` — Depth-projected live cells, glow, hover geometric readouts and generation/population HUD.
- [Controller](js/life_game.js): `LifeGame` wires input and lifecycle.
- [Module guide](js/README.md) describes additional helpers and load boundaries.

Raw common-offset aliases remain distinct automaton cells even when they project to the same physical point. Named patterns are seed shapes, not verified oscillators/gliders under these nonstandard B5/S4–8 rules. This is not ordinary Conway B3/S23 or a twelve-neighbor FCC automaton.

## Testing

From the repository root:

```bash
python3.13 games/run_games.py --test --game life
```

[Tests and limitations](tests/README.md) distinguish logic checks from actual browser interaction. No saved count or production-readiness claim replaces current results.

## Documentation

- [Maintenance instructions](AGENTS.md)
- [Shared modules](../4d_generic/README.md)
- [Game index](../GAMES_INDEX.md)
- [QuadCraft](../../README.md)
