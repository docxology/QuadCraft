# 4D Life JavaScript maintenance

Use the [module map](README.md) and actual [HTML entrypoint](../index.html), not a generic game template, for dependency order and construction. Read [game-level instructions](../AGENTS.md) before editing this directory.

## Model/controller contract

Preserve the raw Set and 80-offset toroidal update rule; do not replace it with GridUtils’s twelve-neighbor graph. Keep the wall-clock speed gate distinct from the shared loop’s fixed-second callback units.

The shared loop has a 500 ms update tick. Inside `update()`, `performance.now()` gates at most one generation by the separate `speed` millisecond threshold (initially 200). Thus the displayed speed is not a guaranteed generation interval; this is not fixed-dt continuous integration.

## Rendering and input

`LifeRenderer` handles depth-projected live cells, glow, hover geometric readouts and generation/population HUD.

Space/P toggles the loop; S advances one generation even while paused; Up/Down decrease/increase the speed threshold by 50 ms (minimum 50). R reseeds. The page buttons expose play/pause, single-step and reseed. Shift+drag rotates; the wheel zooms.

Keep browser-only DOM/Canvas work in its actual controller/renderer boundary. The board exposes CommonJS exports for Node logic tests. Browser controllers/renderers may also require shared globals and DOM/Canvas; requiring one file does not construct a complete game.

Use [tests](../tests/README.md) to select behavior checks and the [shared library guide](../../4d_generic/README.md) for common helpers. Preserve per-game semantics rather than importing unsupported shared features.
