# 4D Backgammon JavaScript maintenance

Use the [module map](README.md) and actual [HTML entrypoint](../index.html), not a generic game template, for dependency order and construction. Read [game-level instructions](../AGENTS.md) before editing this directory.

## Model/controller contract

Keep point indices, bar/off sentinels and dice consumption distinct from projected coordinates. Audit the first-valid-move click policy separately from board move generation.

Turns change through board actions, not elapsed-time integration. The shared loop provides camera/HUD rendering; it does not roll dice or advance pieces automatically.

## Rendering and input

`BackgammonRenderer` handles projected lane axes, track points and checker stacks, dice/status overlays and numbered-point hit testing.

Click once to roll when dice are absent; then click a point with a valid move. The controller takes the first valid move from that point rather than asking for a destination. N starts a new board, R resets scoring/board and P pauses the loop. Shift+drag rotates; the wheel zooms.

Keep browser-only DOM/Canvas work in its actual controller/renderer boundary. The board exposes CommonJS exports for Node logic tests. Browser controllers/renderers may also require shared globals and DOM/Canvas; requiring one file does not construct a complete game.

Use [tests](../tests/README.md) to select behavior checks and the [shared library guide](../../4d_generic/README.md) for common helpers. Preserve per-game semantics rather than importing unsupported shared features.
