# 4D Checkers — Canonical-position jumps and promotion

A local two-player checker variant with seven pieces per side and normalized Quadray position identity.

“4D” is the portfolio name. Physical Quadray projection has rank three; raw board labels may deliberately carry additional game state. See the [portfolio coordinate/time contract](../../docs/games.md).

## Quick Start

From the QuadCraft repository root, with Python 3.13 and a modern browser:

```bash
python3.13 games/run_games.py --game checkers
```

Serve the parent `games/` tree, not this game directory alone: [index.html](index.html) loads sibling `../4d_generic/` assets. No JavaScript bundling step is needed. The static launcher is not a multiplayer backend.

## Game Mechanics

Initial Red pieces occupy low coordinate sums and Black pieces high sums. Men add one of the six positive two-axis pairs for Red and subtract it for Black; kings can do both. Moves normalize through Quadray arithmetic, bounds use normalized components in `[0,size)`, and captures jump one enemy. Promotion uses normalized sum ≥8 for Red or ≤0 for Black.

### Clock and lifecycle

Piece moves are discrete actions; `update()` performs no simulation work. A shared render loop handles display and camera state, not automatic turns.

## Key Controls

Click an own piece, then a displayed destination; left-drag rotates the view and the wheel zooms. M chooses a random move, N starts a new game, R resets and P pauses the loop.

## Architecture

- [Model](js/checkers_board.js): `CheckersBoard` owns game state and rules.
- [Renderer](js/checkers_renderer.js): `CheckersRenderer` — Projected grid/pieces, selected destinations and move indicators, with separate piece and move-target hit tests.
- [Controller](js/checkers_game.js): `CheckersGame` wires input and lifecycle.
- [Module guide](js/README.md) describes additional helpers and load boundaries.

Canonical `position.toKey()` merges common-offset aliases; this is not 256 physically distinct slots. Generated simple moves and single jumps do not implement mandatory captures or chained multi-jumps. The initial even-sum arrangement is not a separate general parity-validation API.

## Testing

From the repository root:

```bash
python3.13 games/run_games.py --test --game checkers
```

[Tests and limitations](tests/README.md) distinguish logic checks from actual browser interaction. No saved count or production-readiness claim replaces current results.

## Documentation

- [Maintenance instructions](AGENTS.md)
- [Shared modules](../4d_generic/README.md)
- [Game index](../GAMES_INDEX.md)
- [QuadCraft](../../README.md)
