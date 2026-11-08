# 4D Go — Canonical-cell groups, liberties and captures

Place alternating black/white stones on distinct canonical physical cells joined by the shared FCC neighbor graph.

“4D” is the portfolio name. Physical Quadray projection has rank three; raw board labels may deliberately carry additional game state. See the [portfolio coordinate/time contract](../../docs/games.md).

## Quick Start

From the QuadCraft repository root, with Python 3.13 and a modern browser:

```bash
python3.13 games/run_games.py --game go
```

Serve the parent `games/` tree, not this game directory alone: [index.html](index.html) loads sibling `../4d_generic/` assets. No JavaScript bundling step is needed. The static launcher is not a multiplayer backend.

## Game Mechanics

`generateCanonicalGrid(size)` selects zero-minimum labels. Group traversal and liberties follow bounded canonical neighbors (up to twelve). Placement captures adjacent enemy groups with no liberties and rejects suicide. Passing advances the player and move count.

### Clock and lifecycle

Placement/pass are discrete actions; inherited `update()` is empty. The shared loop only maintains display/HUD/camera state.

## Key Controls

Click a cell to place; P passes while unpaused (it replaces BaseGame’s default P-pause binding). Use the Pause button to toggle the loop. N starts a new board and R resets. Shift+drag rotates; the wheel zooms.

## Architecture

- [Model](js/go_board.js): `GoBoard` owns game state and rules.
- [Renderer](js/go_renderer.js): `GoRenderer` — Projected canonical cells/stones, neighbor edges and nearest-screen-cell picking.
- [Controller](js/go_game.js): `GoGame` wires input and lifecycle.
- [Module guide](js/README.md) describes additional helpers and load boundaries.

Ko/superko, territory scoring, komi and a two-pass end condition are not implemented. Capture counts are not a complete standard-Go score or winner. Noncanonical shifted labels are not extra playable cells.

## Testing

From the repository root:

```bash
python3.13 games/run_games.py --test --game go
```

[Tests and limitations](tests/README.md) distinguish logic checks from actual browser interaction. No saved count or production-readiness claim replaces current results.

## Documentation

- [Maintenance instructions](AGENTS.md)
- [Shared modules](../4d_generic/README.md)
- [Game index](../GAMES_INDEX.md)
- [QuadCraft](../../README.md)
