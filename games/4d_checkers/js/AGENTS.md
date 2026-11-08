# 4D Checkers JavaScript maintenance

Use the [module map](README.md) and actual [HTML entrypoint](../index.html), not a generic game template, for dependency order and construction. Read [game-level instructions](../AGENTS.md) before editing this directory.

## Model/controller contract

Use canonical piece keys consistently; bounds and promotion operate on normalized positions. Do not silently import mandatory-capture/multi-jump rules from standard checkers.

Piece moves are discrete actions; `update()` performs no simulation work. A shared render loop handles display and camera state, not automatic turns.

## Rendering and input

`CheckersRenderer` handles projected grid/pieces, selected destinations and move indicators, with separate piece and move-target hit tests.

Click an own piece, then a displayed destination; left-drag rotates the view and the wheel zooms. M chooses a random move, N starts a new game, R resets and P pauses the loop.

Keep browser-only DOM/Canvas work in its actual controller/renderer boundary. The board exposes CommonJS exports for Node logic tests. Browser controllers/renderers may also require shared globals and DOM/Canvas; requiring one file does not construct a complete game.

Use [tests](../tests/README.md) to select behavior checks and the [shared library guide](../../4d_generic/README.md) for common helpers. Preserve per-game semantics rather than importing unsupported shared features.
