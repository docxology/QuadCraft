# 4D Lights Out — Canonical-cell toggle puzzles on the FCC graph

Turn every light off by toggling a canonical physical cell together with its bounded FCC neighbors.

“4D” is the portfolio name. Physical Quadray projection has rank three; raw board labels may deliberately carry additional game state. See the [portfolio coordinate/time contract](../../docs/games.md).

## Quick Start

From the QuadCraft repository root, with Python 3.13 and a modern browser:

```bash
python3.13 games/run_games.py --game lights_out
```

Serve the parent `games/` tree, not this game directory alone: [index.html](index.html) loads sibling `../4d_generic/` assets. No JavaScript bundling step is needed. The static launcher is not a multiplayer backend.

## Game Mechanics

The board uses `generateCanonicalGrid(size)`. A toggle flips self plus up to twelve normalized bounded neighbors. Randomization starts all-off and applies legal toggles, retaining a reversible route back; move counting is reset after generation. Win detection locks further player toggles.

### Clock and lifecycle

Toggles are discrete actions; inherited `update()` does not simulate time. The shared loop updates camera/HUD/display.

## Key Controls

Click a cell to toggle; N or New Puzzle generates another puzzle. R/Reset also randomizes rather than restoring the same starting pattern. P/Pause toggles the loop. Shift+drag rotates; the wheel zooms.

## Architecture

- [Model](js/lights_out_board.js): `LightsOutBoard` owns game state and rules.
- [Renderer](js/lights_out_renderer.js): `LightsOutRenderer` — Projected lit/unlit canonical cells, neighbor edges and nearest-screen-cell hit testing.
- [Controller](js/lights_out_game.js): `LightsOutGame` wires input and lifecycle.
- [Module guide](js/README.md) describes additional helpers and load boundaries.

The controller supplies `key` and `highScoreMode` options that shared ScoreManager does not implement. Do not promise persistent lowest-move records: the board’s move count is authoritative, while that advertised Best-score mode is not wired to a supported scoring API.

## Testing

From the repository root:

```bash
python3.13 games/run_games.py --test --game lights_out
```

[Tests and limitations](tests/README.md) distinguish logic checks from actual browser interaction. No saved count or production-readiness claim replaces current results.

## Documentation

- [Maintenance instructions](AGENTS.md)
- [Shared modules](../4d_generic/README.md)
- [Game index](../GAMES_INDEX.md)
- [QuadCraft](../../README.md)
