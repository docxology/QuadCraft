# 4D Asteroids — Continuous wrapped flight and swept collisions

Pilot a ship among asteroids and UFOs in a continuously wrapped raw four-label world, displayed through the shared three-dimensional Quadray embedding.

“4D” is the portfolio name. Physical Quadray projection has rank three; raw board labels may deliberately carry additional game state. See the [portfolio coordinate/time contract](../../docs/games.md).

## Quick Start

From the QuadCraft repository root, with Python 3.13 and a modern browser:

```bash
python3.13 games/run_games.py --game asteroids
```

Serve the parent `games/` tree, not this game directory alone: [index.html](index.html) loads sibling `../4d_generic/` assets. No JavaScript bundling step is needed. The static launcher is not a multiplayer backend.

## Game Mechanics

Entity positions wrap independently in `[0,size)^4`. Physical sphere collisions use the shared Cartesian metric with periodic BCC images, not componentwise raw minimum deltas. Swept free flight resolves the earliest collision; split fragments advance through the remaining time. `new AsteroidsBoard(size, {seed})` owns its simulation RNG and resets to that seed; renderer randomness is cosmetic.

### Clock and lifecycle

`GameLoop` calls `update(dt)` with fixed seconds at a 16 ms tick. The controller sums held raw-axis acceleration once (`0.3 / 0.016` coefficient-velocity units per second) and applies `acceleration * dt` before the existing raw coefficient-space speed cap. W/S and A/D cancel before clamping; simultaneous nonopposing axes combine without sequential cap bias. UFO fire, projectile expiry, shields and the 1.5-second respawn are simulation-time events. The shared loop caps catch-up at 250 ms. Pause rejects gameplay commands as well as updates.

## Key Controls

W/S thrust +C/−C; A/D thrust −A/+A; Q thrusts +B and E thrusts +D. Space fires in the current raw-velocity direction (or +A at rest), Shift invokes hyperspace, V activates a shield, P pauses and R resets. Shift+drag rotates; the wheel zooms.

## Architecture

- [Model](js/asteroids_board.js): `AsteroidsBoard` owns game state and rules.
- [Renderer](js/asteroids_renderer.js): `AsteroidsRenderer` — Fitted Quadray projection of entities, trails, cosmetic particles, hover readouts and the in-canvas HUD.
- [Controller](js/asteroids_game.js): `AsteroidsGame` wires input and lifecycle.
- [Module guide](js/README.md) describes additional helpers and load boundaries.

Raw labels are not four independent physical axes. Ship speed is capped in raw coefficient space, while collision radii are physical. Shift is both a hyperspace key and the camera-drag modifier.

## Testing

From the repository root:

```bash
python3.13 games/run_games.py --test --game asteroids
```

[Tests and limitations](tests/README.md) distinguish logic checks from actual browser interaction. No saved count or production-readiness claim replaces current results.

## Documentation

- [Maintenance instructions](AGENTS.md)
- [Shared modules](../4d_generic/README.md)
- [Game index](../GAMES_INDEX.md)
- [QuadCraft](../../README.md)
