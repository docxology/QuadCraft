# 4D Frogger — Event-driven hops and logical-step lane hazards

Hop along A through obstacle lanes while changing wrapped B/C/D lane positions.

“4D” is the portfolio name. Physical Quadray projection has rank three; raw board labels may deliberately carry additional game state. See the [portfolio coordinate/time contract](../../docs/games.md).

## Quick Start

From the QuadCraft repository root, with Python 3.13 and a modern browser:

```bash
python3.13 games/run_games.py --game frogger
```

Serve the parent `games/` tree, not this game directory alone: [index.html](index.html) loads sibling `../4d_generic/` assets. No JavaScript bundling step is needed. The static launcher is not a multiplayer backend.

## Game Mechanics

A is bounded by the lane count; B/C/D hops wrap independently. Reaching the final A row adds a goal, resets the frog/timer and advances the level. `step()` moves obstacles along B/C/D and tests raw-coordinate proximity on the same A row; there are no four home slots or rideable-platform rules.

### Clock and lifecycle

The shared loop calls one `board.step()` every 200 ms. `timeLeft` counts logical ticks, not seconds; obstacle speed is per step. Hop input is event-driven rather than a held-key continuous integrator.

## Key Controls

W/S or Up/Down hop +A/−A; D/A or Right/Left hop +B/−B; E/Q hop +C/−C; X/Z hop +D/−D. N starts a new game, R resets and P pauses scheduled stepping. Shift+drag rotates; the wheel zooms.

## Architecture

- [Model](js/frogger_board.js): `FroggerBoard` owns game state and rules.
- [Renderer](js/frogger_renderer.js): `FroggerRenderer` — Projected lane backgrounds, depth-sorted frog/obstacle entities, a logical-timer bar and board HUD.
- [Controller](js/frogger_game.js): `FroggerGame` wires input and lifecycle.
- [Module guide](js/README.md) describes additional helpers and load boundaries.

Hop callbacks guard game-over but not pause, so loop pause alone does not block hops. Collision is raw-coordinate arcade logic rather than physical sphere distance. Shared geometric readouts do not change the lane topology.

## Testing

From the repository root:

```bash
python3.13 games/run_games.py --test --game frogger
```

[Tests and limitations](tests/README.md) distinguish logic checks from actual browser interaction. No saved count or production-readiness claim replaces current results.

## Documentation

- [Maintenance instructions](AGENTS.md)
- [Shared modules](../4d_generic/README.md)
- [Game index](../GAMES_INDEX.md)
- [QuadCraft](../../README.md)
