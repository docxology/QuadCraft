# 4D Hex — Canonical FCC paths between opposing faces

Alternate red/blue placements to connect opposite coordinate faces on a bounded canonical-cell FCC graph.

“4D” is the portfolio name. Physical Quadray projection has rank three; raw board labels may deliberately carry additional game state. See the [portfolio coordinate/time contract](../../docs/games.md).

## Quick Start

From the QuadCraft repository root, with Python 3.13 and a modern browser:

```bash
python3.13 games/run_games.py --game hex
```

Serve the parent `games/` tree, not this game directory alone: [index.html](index.html) loads sibling `../4d_generic/` assets. No JavaScript bundling step is needed. The static launcher is not a multiplayer backend.

## Game Mechanics

Cells are zero-minimum representatives, not all `size^4` raw aliases. Red connects a=0 to a=size−1; Blue connects b=0 to b=size−1. `_checkWin` traverses occupied cells using bounded normalized neighbors, up to twelve per cell.

### Clock and lifecycle

Placement and win detection are discrete actions; no continuous board simulation runs in the inherited update hook.

## Key Controls

Click a cell to place. N starts a new board; R resets and P pauses. Shift+drag rotates; the wheel zooms. The HTML buttons expose New Game/Pause/Reset.

## Architecture

- [Model](js/hex_board.js): `HexBoard` owns game state and rules.
- [Renderer](js/hex_renderer.js): `HexRenderer` — Projected canonical cells colored by owner, neighbor edges and nearest-screen-cell picking.
- [Controller](js/hex_game.js): `HexGame` wires input and lifecycle.
- [Module guide](js/README.md) describes additional helpers and load boundaries.

This is a bounded three-dimensional FCC connection adaptation, not ordinary planar Hex. Planar Hex’s no-draw theorem and standard strategy do not transfer automatically. It has no AI, network opponent or general analysis engine.

## Testing

From the repository root:

```bash
python3.13 games/run_games.py --test --game hex
```

[Tests and limitations](tests/README.md) distinguish logic checks from actual browser interaction. No saved count or production-readiness claim replaces current results.

## Documentation

- [Maintenance instructions](AGENTS.md)
- [Shared modules](../4d_generic/README.md)
- [Game index](../GAMES_INDEX.md)
- [QuadCraft](../../README.md)
