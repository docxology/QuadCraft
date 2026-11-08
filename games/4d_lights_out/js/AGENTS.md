# 4D Lights Out JavaScript maintenance

Use the [module map](README.md) and actual [HTML entrypoint](../index.html), not a generic game template, for dependency order and construction. Read [game-level instructions](../AGENTS.md) before editing this directory.

## Model/controller contract

Keep canonical cells and normalized bounded-neighbor toggles aligned. Random generation must not get trapped by the player-facing won guard. Do not document unsupported ScoreManager low-score options as implemented.

Toggles are discrete actions; inherited `update()` does not simulate time. The shared loop updates camera/HUD/display.

## Rendering and input

`LightsOutRenderer` handles projected lit/unlit canonical cells, neighbor edges and nearest-screen-cell hit testing.

Click a cell to toggle; N or New Puzzle generates another puzzle. R/Reset also randomizes rather than restoring the same starting pattern. P/Pause toggles the loop. Shift+drag rotates; the wheel zooms.

Keep browser-only DOM/Canvas work in its actual controller/renderer boundary. The board exposes CommonJS exports for Node logic tests. Browser controllers/renderers may also require shared globals and DOM/Canvas; requiring one file does not construct a complete game.

Use [tests](../tests/README.md) to select behavior checks and the [shared library guide](../../4d_generic/README.md) for common helpers. Preserve per-game semantics rather than importing unsupported shared features.
