# 4D Asteroids JavaScript maintenance

Use the [module map](README.md) and actual [HTML entrypoint](../index.html), not a generic game template, for dependency order and construction. Read [game-level instructions](../AGENTS.md) before editing this directory.

## Model/controller contract

Keep raw periodic state separate from physical nearest-image distance. Preserve the independent seeded RNG and event-time ordering, including residual fragment flight and pending respawn cancellation on reset.

`GameLoop` supplies fixed seconds at a 16 ms tick. Sum held raw-axis acceleration with opposing keys cancelling, then apply thrust once before the coefficient-space speed cap; preserve `acceleration * dt`. UFO fire, projectile expiry, shields and respawn use simulation time. Follow [the canonical game timing contract](../README.md#clock-and-lifecycle); pause rejects gameplay commands as well as updates.

## Rendering and input

`AsteroidsRenderer` handles fitted Quadray projection of entities, trails, cosmetic particles, hover readouts and the in-canvas HUD.

W/S thrust +C/−C; A/D thrust −A/+A; Q thrusts +B and E thrusts +D. Space fires in the current raw-velocity direction (or +A at rest), Shift invokes hyperspace, V activates a shield, P pauses and R resets. Shift+drag rotates; the wheel zooms.

Keep browser-only DOM/Canvas work in its actual controller/renderer boundary. The board exposes CommonJS exports for Node logic tests. Browser controllers/renderers may also require shared globals and DOM/Canvas; requiring one file does not construct a complete game.

Use [tests](../tests/README.md) to select behavior checks and the [shared library guide](../../4d_generic/README.md) for common helpers. Preserve per-game semantics rather than importing unsupported shared features.
