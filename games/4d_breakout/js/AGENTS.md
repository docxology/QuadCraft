# 4D Breakout JavaScript maintenance

Use the [module map](README.md) and actual [HTML entrypoint](../index.html), not a generic game template, for dependency order and construction. Read [game-level instructions](../AGENTS.md) before editing this directory.

## Model/controller contract

Do not add a second seconds multiplier to per-step motion or describe rounded raw brick contact as physical collision. Keep score/life synchronization between board and controller.

The controller polls held paddle keys and calls `board.step()` every 20 ms. Ball velocity and the 0.5 paddle increment are per logical step; the callback ignores dt rather than integrating physical units per second.

## Rendering and input

`BreakoutRenderer` handles projected bricks, paddle, ball/trail and the lives/score/level HUD.

A/D or Left/Right move the paddle −B/+B; W/S or Up/Down move +C/−C; Q/E move −D/+D. N starts a new game, R resets and P pauses. Shift+drag rotates; the wheel zooms.

Keep browser-only DOM/Canvas work in its actual controller/renderer boundary. The board exposes CommonJS exports for Node logic tests. Browser controllers/renderers may also require shared globals and DOM/Canvas; requiring one file does not construct a complete game.

Use [tests](../tests/README.md) to select behavior checks and the [shared library guide](../../4d_generic/README.md) for common helpers. Preserve per-game semantics rather than importing unsupported shared features.
