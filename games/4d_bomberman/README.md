# 4D Bomberman — Raw-grid bombs and logical-tick explosions

Navigate a raw four-index arena, place bombs and avoid enemies and explosions.

“4D” is the portfolio name. Physical Quadray projection has rank three; raw board labels may deliberately carry additional game state. See the [portfolio coordinate/time contract](../../docs/games.md).

## Quick Start

From the QuadCraft repository root, with Python 3.13 and a modern browser:

```bash
python3.13 games/run_games.py --game bomberman
```

Serve the parent `games/` tree, not this game directory alone: [index.html](index.html) loads sibling `../4d_generic/` assets. No JavaScript bundling step is needed. The static launcher is not a multiplayer backend.

## Game Mechanics

`grid` keeps raw keys. Movement and explosions use eight signed single-coefficient steps, not the shared twelve-neighbor FCC adjacency. `step()` owns bomb counters, explosion propagation, enemy motion, power-ups, lives and level transitions.

### Clock and lifecycle

One `board.step()` runs per 200 ms loop tick. Bomb timers and enemy motion are logical-step quantities; they are not seconds passed to a continuous integrator.

## Key Controls

W/S or Up/Down move +A/−A; D/A or Right/Left move +B/−B; E/Q move +C/−C; X/Z move +D/−D. Space places a bomb; N starts a new game, R resets and P pauses the loop. Shift+drag rotates; the wheel zooms.

## Architecture

- [Model](js/bomberman_board.js): `BombermanBoard` owns game state and rules.
- [Renderer](js/bomberman_renderer.js): `BombermanRenderer` — Depth-projected walls, destructible blocks, power-ups, explosions, bombs, enemies, player and board status.
- [Controller](js/bomberman_game.js): `BombermanGame` wires input and lifecycle.
- [Module guide](js/README.md) describes additional helpers and load boundaries.

Pause stops scheduled steps, but movement/bomb key callbacks only guard game-over state, not pause. Shared pathfinding/entity scripts being loaded does not make every board action use them. This is not a physical tetrahedral tessellation.

## Testing

From the repository root:

```bash
python3.13 games/run_games.py --test --game bomberman
```

[Tests and limitations](tests/README.md) distinguish logic checks from actual browser interaction. No saved count or production-readiness claim replaces current results.

## Documentation

- [Maintenance instructions](AGENTS.md)
- [Shared modules](../4d_generic/README.md)
- [Game index](../GAMES_INDEX.md)
- [QuadCraft](../../README.md)
