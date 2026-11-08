# 4D Connect Four JavaScript maintenance

Use the [module map](README.md) and actual [HTML entrypoint](../index.html), not a generic game template, for dependency order and construction. Read [game-level instructions](../AGENTS.md) before editing this directory.

## Model/controller contract

Never normalize slot keys or use gauge-aware equality for winning lines. Undo restores the preceding human decision when AI is enabled; preserve single-timeout ownership and fixed-P2 search evaluation.

Drops and turns are discrete. AI replies are queued with one 400 ms browser timeout; new/reset/undo and AI ownership changes cancel a pending reply. This timeout is separate from the render loop.

## Rendering and input

`ConnectFourRenderer` handles projected columns/slots, hover and ghost previews, drop animations, placed pieces, win lines and column hit tests.

Click a projected column to drop; hover previews it. N starts a new board, R resets, P pauses the loop, A toggles AI, D cycles difficulty and U undoes. Buttons expose the same AI/difficulty/undo actions. Shift+drag rotates; the wheel zooms.

Keep browser-only DOM/Canvas work in its actual controller/renderer boundary. The board exposes CommonJS exports for Node logic tests. Browser controllers/renderers may also require shared globals and DOM/Canvas; requiring one file does not construct a complete game.

Use [tests](../tests/README.md) to select behavior checks and the [shared library guide](../../4d_generic/README.md) for common helpers. Preserve per-game semantics rather than importing unsupported shared features.
