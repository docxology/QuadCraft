# 4D Connect Four — Raw-slot gravity, undo and local AI

Drop pieces into `(b,c,d)` columns of a raw four-index board; gravity fills A from its lowest empty row.

“4D” is the portfolio name. Physical Quadray projection has rank three; raw board labels may deliberately carry additional game state. See the [portfolio coordinate/time contract](../../docs/games.md).

## Quick Start

From the QuadCraft repository root, with Python 3.13 and a modern browser:

```bash
python3.13 games/run_games.py --game connect_four
```

Serve the parent `games/` tree, not this game directory alone: [index.html](index.html) loads sibling `../4d_generic/` assets. No JavaScript bundling step is needed. The static launcher is not a multiplayer backend.

## Game Mechanics

The default board is 6×5×3×3 raw slots. Keys preserve common-offset aliases as independent game slots. Wins walk 40 undirected raw line directions, not the twelve physical FCC contacts. The board records drops and undo state; the controller offers human/human or local AI play.

### Clock and lifecycle

Drops and turns are discrete. AI replies are queued with one 400 ms browser timeout; new/reset/undo and AI ownership changes cancel a pending reply. This timeout is separate from the render loop.

## Key Controls

Click a projected column to drop; hover previews it. N starts a new board, R resets, P pauses the loop, A toggles AI, D cycles difficulty and U undoes. Buttons expose the same AI/difficulty/undo actions. Shift+drag rotates; the wheel zooms.

## Architecture

- [Model](js/connect_four_board.js): `ConnectFourBoard` owns game state and rules.
- [Renderer](js/connect_four_renderer.js): `ConnectFourRenderer` — Projected columns/slots, hover and ghost previews, drop animations, placed pieces, win lines and column hit tests.
- [Controller](js/connect_four_game.js): `ConnectFourGame` wires input and lifecycle.
- [Module guide](js/README.md) describes additional helpers and load boundaries.

Easy uses random choice after immediate win/block checks; medium uses position evaluation; hard uses depth-three alpha-beta. This is not a solved or measured-strength engine. A pending AI timeout is not paused by stopping the render loop.

## Testing

From the repository root:

```bash
python3.13 games/run_games.py --test --game connect_four
```

[Tests and limitations](tests/README.md) distinguish logic checks from actual browser interaction. No saved count or production-readiness claim replaces current results.

## Documentation

- [Maintenance instructions](AGENTS.md)
- [Shared modules](../4d_generic/README.md)
- [Game index](../GAMES_INDEX.md)
- [QuadCraft](../../README.md)
