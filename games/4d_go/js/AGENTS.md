# 4D Go JavaScript maintenance

Use the [module map](README.md) and actual [HTML entrypoint](../index.html), not a generic game template, for dependency order and construction. Read [game-level instructions](../AGENTS.md) before editing this directory.

## Model/controller contract

Keep one canonical cell per physical point. Capture/liberty traversal must use the same normalized bounded-neighbor graph; retain P as pass rather than silently restoring a base pause shortcut.

Placement/pass are discrete actions; inherited `update()` is empty. The shared loop only maintains display/HUD/camera state.

## Rendering and input

`GoRenderer` handles projected canonical cells/stones, neighbor edges and nearest-screen-cell picking.

Click a cell to place; P passes while unpaused (it replaces BaseGame’s default P-pause binding). Use the Pause button to toggle the loop. N starts a new board and R resets. Shift+drag rotates; the wheel zooms.

Keep browser-only DOM/Canvas work in its actual controller/renderer boundary. The board exposes CommonJS exports for Node logic tests. Browser controllers/renderers may also require shared globals and DOM/Canvas; requiring one file does not construct a complete game.

Use [tests](../tests/README.md) to select behavior checks and the [shared library guide](../../4d_generic/README.md) for common helpers. Preserve per-game semantics rather than importing unsupported shared features.
