# 4D Catan — Turn phases, resource tiles and a local heuristic opponent

A local two-player resource/building adaptation: human Red versus heuristic Blue AI on a prescribed 19-tile Quadray layout.

“4D” is the portfolio name. Physical Quadray projection has rank three; raw board labels may deliberately carry additional game state. See the [portfolio coordinate/time contract](../../docs/games.md).

## Quick Start

From the QuadCraft repository root, with Python 3.13 and a modern browser:

```bash
python3.13 games/run_games.py --game catan
```

Serve the parent `games/` tree, not this game directory alone: [index.html](index.html) loads sibling `../4d_generic/` assets. No JavaScript bundling step is needed. The static launcher is not a multiplayer backend.

## Game Mechanics

The board stores tile records and player resources, settlements, cities, roads and points. The controller owns roll/robber/trade/build phases, a development-card deck and click-build modes. Bank/port trading helpers, robber actions and card effects are separate modules; this is not a complete implementation of standard Catan topology or player-to-player trading.

### Clock and lifecycle

This is an action-driven turn game, not continuous physics. After a human end-turn, a browser timeout schedules the AI after 500 ms; this timer is independent of the shared render-loop pause.

## Key Controls

Use Roll Dice, construction, development-card, bank-trade and End Turn controls. Click tiles for robber placement or structures; roads use a start tile then a destination tile. N starts a new board, R resets scoring and P toggles the loop. Shift+drag rotates; the wheel zooms.

## Architecture

- [Model](js/catan_board.js): `CatanBoard` owns game state and rules.
- [Renderer](js/catan_renderer.js): `CatanRenderer` — Projected resource tiles, number labels, roads, settlements/cities, highlights, hover information and tile hit tests.
- [Controller](js/catan_game.js): `CatanGame` wires input and lifecycle.
- [Module guide](js/README.md) describes additional helpers and load boundaries.

Building/neighbor rules are this adaptation’s implementation, not standard Catan guarantees: neighbor tiles use a physical-distance threshold and road creation is not a full standard-road legality validator. Action handlers and pending AI timeouts are not globally frozen by loop pause.

## Testing

From the repository root:

```bash
python3.13 games/run_games.py --test --game catan
```

[Tests and limitations](tests/README.md) distinguish logic checks from actual browser interaction. No saved count or production-readiness claim replaces current results.

## Documentation

- [Maintenance instructions](AGENTS.md)
- [Shared modules](../4d_generic/README.md)
- [Game index](../GAMES_INDEX.md)
- [QuadCraft](../../README.md)
