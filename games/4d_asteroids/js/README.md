# 4D Asteroids JavaScript — Continuous wrapped flight and swept collisions

Pilot a ship among asteroids and UFOs in a continuously wrapped raw four-label world, displayed through the shared three-dimensional Quadray embedding.

## Modules and entrypoint

The [game page](../index.html) loads sibling [shared modules](../../4d_generic/README.md) before the local game stack. Its local order is:

```text
asteroids_board.js
asteroids_renderer.js
asteroids_game.js
```

| File | Actual responsibility |
| --- | --- |
| [asteroids_board.js](asteroids_board.js) | `AsteroidsBoard`: Entity positions wrap independently in `[0,size)^4`. Physical sphere collisions use the shared Cartesian metric with periodic BCC images, not componentwise raw minimum deltas. Swept free flight resolves the earliest collision; split fragments advance through the remaining time. `new AsteroidsBoard(size, {seed})` owns its simulation RNG and resets to that seed; renderer randomness is cosmetic. |
| [asteroids_renderer.js](asteroids_renderer.js) | `AsteroidsRenderer`: Fitted Quadray projection of entities, trails, cosmetic particles, hover readouts and the in-canvas HUD. |
| [asteroids_game.js](asteroids_game.js) | `AsteroidsGame`: input, lifecycle and HUD wiring |

## Data and update boundary

`GameLoop` calls `update(dt)` with fixed seconds at a 16 ms tick. The controller sums held raw-axis acceleration, cancelling opposing keys, then calls thrust once with `acceleration * dt` before the existing coefficient-space speed cap. See [the game timing contract](../README.md#clock-and-lifecycle) for units. UFO fire, projectile expiry, shields and the 1.5-second respawn are simulation-time events. The shared loop caps catch-up at 250 ms. Pause rejects gameplay commands as well as updates.

Keep raw periodic state separate from physical nearest-image distance. Preserve the independent seeded RNG and event-time ordering, including residual fragment flight and pending respawn cancellation on reset.

## Limitations

Raw labels are not four independent physical axes. Ship speed is capped in raw coefficient space, while collision radii are physical. Shift is both a hyperspace key and the camera-drag modifier.

See the [game guide](../README.md) for controls, [logic tests](../tests/README.md) for coverage boundaries and [portfolio contracts](../../../docs/games.md) for geometry/time conventions. Shared modules are capabilities, not an automatic entity/physics/save/network layer for this game.
