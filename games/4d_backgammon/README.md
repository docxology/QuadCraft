# 4D Backgammon — Dice-driven race on a projected 24-point track

A two-player dice race on 24 logical points arranged along four colored Quadray lanes.

“4D” is the portfolio name. Physical Quadray projection has rank three; raw board labels may deliberately carry additional game state. See the [portfolio coordinate/time contract](../../docs/games.md).

## Quick Start

From the QuadCraft repository root, with Python 3.13 and a modern browser:

```bash
python3.13 games/run_games.py --game backgammon
```

Serve the parent `games/` tree, not this game directory alone: [index.html](index.html) loads sibling `../4d_generic/` assets. No JavaScript bundling step is needed. The static launcher is not a multiplayer backend.

## Game Mechanics

`points`, `bar`, `borne` and remaining dice own the race state. The board supplies hitting, bar re-entry, bearing-off checks and a winner; `pointToQuadray(i)` supplies a distinct physical display position for each logical point. The track is not the shared 12-neighbor FCC graph.

### Clock and lifecycle

Turns change through board actions, not elapsed-time integration. The shared loop provides camera/HUD rendering; it does not roll dice or advance pieces automatically.

## Key Controls

Click once to roll when dice are absent; then click a point with a valid move. The controller takes the first valid move from that point rather than asking for a destination. N starts a new board, R resets scoring/board and P pauses the loop. Shift+drag rotates; the wheel zooms.

## Architecture

- [Model](js/backgammon_board.js): `BackgammonBoard` owns game state and rules.
- [Renderer](js/backgammon_renderer.js): `BackgammonRenderer` — Projected lane axes, track points and checker stacks, dice/status overlays and numbered-point hit testing.
- [Controller](js/backgammon_game.js): `BackgammonGame` wires input and lifecycle.
- [Module guide](js/README.md) describes additional helpers and load boundaries.

Board-level bar/bearing-off support is broader than the point-click UI: the renderer hit test selects numbered track points. Do not describe this as a complete standard Backgammon interface or an automatic opponent.

## Testing

From the repository root:

```bash
python3.13 games/run_games.py --test --game backgammon
```

[Tests and limitations](tests/README.md) distinguish logic checks from actual browser interaction. No saved count or production-readiness claim replaces current results.

## Documentation

- [Maintenance instructions](AGENTS.md)
- [Shared modules](../4d_generic/README.md)
- [Game index](../GAMES_INDEX.md)
- [QuadCraft](../../README.md)
