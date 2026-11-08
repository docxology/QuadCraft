# 4D Hex JavaScript maintenance

Use the [module map](README.md) and actual [HTML entrypoint](../index.html), not a generic game template, for dependency order and construction. Read [game-level instructions](../AGENTS.md) before editing this directory.

## Model/controller contract

Preserve canonical cells and the exact face conditions. A winning fixture must follow real bounded-neighbor edges, not assume arbitrary coefficient-axis steps are FCC contacts.

Placement and win detection are discrete actions; no continuous board simulation runs in the inherited update hook.

## Rendering and input

`HexRenderer` handles projected canonical cells colored by owner, neighbor edges and nearest-screen-cell picking.

Click a cell to place. N starts a new board; R resets and P pauses. Shift+drag rotates; the wheel zooms. The HTML buttons expose New Game/Pause/Reset.

Keep browser-only DOM/Canvas work in its actual controller/renderer boundary. The board exposes CommonJS exports for Node logic tests. Browser controllers/renderers may also require shared globals and DOM/Canvas; requiring one file does not construct a complete game.

Use [tests](../tests/README.md) to select behavior checks and the [shared library guide](../../4d_generic/README.md) for common helpers. Preserve per-game semantics rather than importing unsupported shared features.
