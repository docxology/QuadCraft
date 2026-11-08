# 4D 2048 — Raw-label directional tile slides and merges

Slide equal-valued tiles on a raw four-index board, merging them to increase score and reach a 2048 tile.

“4D” is the portfolio name. Physical Quadray projection has rank three; raw board labels may deliberately carry additional game state. See the [portfolio coordinate/time contract](../../docs/games.md).

## Quick Start

From the QuadCraft repository root, with Python 3.13 and a modern browser:

```bash
python3.13 games/run_games.py --game 2048
```

Serve the parent `games/` tree, not this game directory alone: [index.html](index.html) loads sibling `../4d_generic/` assets. No JavaScript bundling step is needed. The static launcher is not a multiplayer backend.

## Game Mechanics

The default board stores all 3^4 raw labels, including common-offset aliases. `slide(0..11)` adds the selected raw permutation of `(0,1,1,2)` directly, without neighbor normalization; these are twelve nonnegative raw directions, not bidirectional canonical FCC traversal. A destination merges at most once per slide; a successful slide spawns a random 2 or 4 tile and increments move count.

### Clock and lifecycle

Slides are discrete key actions; inherited update has no continuous simulation. Slide callbacks explicitly reject paused input. P toggles the shared loop; R resets the board/scoring.

## Key Controls

Keys 1–9 select direction indices 0–8; 0 selects index 9; Q/W select indices 10/11. These map in order to `GridUtils.DIRECTIONS`, not the arrow/WASD movement scheme of other games. New Game and Reset buttons both call reset. Shift+drag rotates; the wheel zooms.

## Architecture

- [Model](js/2048_board.js): `Twenty48Board` owns game state and rules.
- [Renderer](js/2048_renderer.js): `Twenty48Renderer` — Depth-sorted projected raw tiles, value colors/numbers and shared coordinate axes.
- [Controller](js/2048_game.js): `Twenty48Game` wires input and lifecycle.
- [Module guide](js/README.md) describes additional helpers and load boundaries.

There is no undo, solver or seeded replay. Reaching 2048 sets `won` but does not itself stop slides. The controller passes unsupported ScoreManager option `key` (not `storageKey`) and returns a string from `_getHUDState`, although BaseGame expects `{text,color}`; do not promise a persistent Best record or a working shared HUD.

## Testing

From the repository root:

```bash
python3.13 games/run_games.py --test --game 2048
```

[Tests and limitations](tests/README.md) distinguish logic checks from actual browser interaction. No saved count or production-readiness claim replaces current results.

## Documentation

- [Maintenance instructions](AGENTS.md)
- [Shared modules](../4d_generic/README.md)
- [Game index](../GAMES_INDEX.md)
- [QuadCraft](../../README.md)
