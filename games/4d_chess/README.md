# 4D Quadray Chess — Directed piece moves on a canonical Quadray board

A local chess-inspired variant on canonical Quadray positions, with projected overview and selected-piece views.

“4D” is the portfolio name. Physical Quadray projection has rank three; raw board labels may deliberately carry additional game state. See the [portfolio coordinate/time contract](../../docs/games.md).

## Quick Start

From the QuadCraft repository root, with Python 3.13 and a modern browser:

```bash
python3.13 games/run_games.py --game chess
```

Serve the parent `games/` tree, not this game directory alone: [index.html](index.html) loads sibling `../4d_generic/` assets. No JavaScript bundling step is needed. The static launcher is not a multiplayer backend.

## Game Mechanics

The default `Board(4)` enumerates zero-minimum representatives with normalized components from 0 through 4 inclusive. Piece rules are directed: positive basis/pair slides, ordered +2/+1 knight offsets, and color-specific pawn advance. `Board.movePiece` mutates occupancy; the UI chooses generated destinations and advances `TurnManager`.

### Clock and lifecycle

Turns are discrete. A shared loop refreshes HUD/selected-piece view, while autoplay uses an independent browser interval (1000 ms by default). Loop pause does not stop that interval or globally gate click/key commands.

## Key Controls

Click an own piece then a highlighted destination, or use 1–9 for displayed move choices. Space/M makes a random move; A toggles random autoplay; N/R reset; Escape deselects; S/L invoke legacy Save/Load. Shift+drag rotates; wheel or +/− zooms. P toggles the shared loop.

## Architecture

- [Model](js/chess_board.js): `Board` owns game state and rules.
- [Renderer](js/chess_renderer.js): `Renderer` — Projected board, pieces, selected destinations, picking and math/HUD overlays; `FPVRenderer` is a separate selected-piece camera.
- [Controller](js/chess_game.js): `Game` wires input and lifecycle.
- [Module guide](js/README.md) describes additional helpers and load boundaries.

This is not full orthodox chess: generated moves are not filtered for self-check; kings can be captured; castling, en passant and pawn promotion are absent. Save/Load and move-history analysis retain legacy flat records that do not match the controller’s TurnManager-wrapped history/getter-only state; do not rely on a working round-trip.

## Testing

From the repository root:

```bash
python3.13 games/run_games.py --test --game chess
```

[Tests and limitations](tests/README.md) distinguish logic checks from actual browser interaction. No saved count or production-readiness claim replaces current results.

## Documentation

- [Maintenance instructions](AGENTS.md)
- [Shared modules](../4d_generic/README.md)
- [Game index](../GAMES_INDEX.md)
- [Rules and reference guides](docs/README.md)
- [Contribution guide](CONTRIBUTING.md)
- [QuadCraft](../../README.md)
