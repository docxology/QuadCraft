# 4D Breakout — Logical-step ball motion and three-axis paddle control

Break raw-label bricks by steering a paddle across B, C and D while the ball travels along A.

“4D” is the portfolio name. Physical Quadray projection has rank three; raw board labels may deliberately carry additional game state. See the [portfolio coordinate/time contract](../../docs/games.md).

## Quick Start

From the QuadCraft repository root, with Python 3.13 and a modern browser:

```bash
python3.13 games/run_games.py --game breakout
```

Serve the parent `games/` tree, not this game directory alone: [index.html](index.html) loads sibling `../4d_generic/` assets. No JavaScript bundling step is needed. The static launcher is not a multiplayer backend.

## Game Mechanics

The board owns continuous raw ball labels, per-step velocity, brick hit counts, combo points, lives and level rebuilding. Brick contact checks the rounded raw ball cell; paddle contact compares raw B/C/D offsets. These are not swept physical-sphere collisions.

### Clock and lifecycle

The controller polls held paddle keys and calls `board.step()` every 20 ms. Ball velocity and the 0.5 paddle increment are per logical step; the callback ignores dt rather than integrating physical units per second.

## Key Controls

A/D or Left/Right move the paddle −B/+B; W/S or Up/Down move +C/−C; Q/E move −D/+D. N starts a new game, R resets and P pauses. Shift+drag rotates; the wheel zooms.

## Architecture

- [Model](js/breakout_board.js): `BreakoutBoard` owns game state and rules.
- [Renderer](js/breakout_renderer.js): `BreakoutRenderer` — Projected bricks, paddle, ball/trail and the lives/score/level HUD.
- [Controller](js/breakout_game.js): `BreakoutGame` wires input and lifecycle.
- [Module guide](js/README.md) describes additional helpers and load boundaries.

The collision model is rounded-cell/raw-component arcade logic, not the Asteroids swept-collision model or a general physics engine. Clearing bricks rebuilds the next level rather than ending a finite campaign.

## Testing

From the repository root:

```bash
python3.13 games/run_games.py --test --game breakout
```

[Tests and limitations](tests/README.md) distinguish logic checks from actual browser interaction. No saved count or production-readiness claim replaces current results.

## Documentation

- [Maintenance instructions](AGENTS.md)
- [Shared modules](../4d_generic/README.md)
- [Game index](../GAMES_INDEX.md)
- [QuadCraft](../../README.md)
