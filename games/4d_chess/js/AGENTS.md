# 4D Quadray Chess JavaScript maintenance

Use the [module map](README.md) and actual [HTML entrypoint](../index.html), not a generic game template, for dependency order and construction. Read [game-level instructions](../AGENTS.md) before editing this directory.

## Model/controller contract

Preserve canonical keys, inclusive normalized bounds and directed piece offsets. Keep pseudo-legal move generation distinct from check detection. Audit real TurnManager records before claiming persistence/history compatibility.

Turns are discrete. A shared loop refreshes HUD/selected-piece view, while autoplay uses an independent browser interval (1000 ms by default). Loop pause does not stop that interval or globally gate click/key commands.

## Rendering and input

`Renderer` handles projected board, pieces, selected destinations, picking and math/HUD overlays; `FPVRenderer` is a separate selected-piece camera.

Click an own piece then a highlighted destination, or use 1–9 for displayed move choices. Space/M makes a random move; A toggles random autoplay; N/R reset; Escape deselects; S/L invoke legacy Save/Load. Shift+drag rotates; wheel or +/− zooms. P toggles the shared loop.

Keep browser-only DOM/Canvas work in its actual controller/renderer boundary. The board exposes CommonJS exports for Node logic tests. Browser controllers/renderers may also require shared globals and DOM/Canvas; requiring one file does not construct a complete game.

Use [tests](../tests/README.md) to select behavior checks and the [shared library guide](../../4d_generic/README.md) for common helpers. Preserve per-game semantics rather than importing unsupported shared features.
