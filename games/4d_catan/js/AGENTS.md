# 4D Catan JavaScript maintenance

Use the [module map](README.md) and actual [HTML entrypoint](../index.html), not a generic game template, for dependency order and construction. Read [game-level instructions](../AGENTS.md) before editing this directory.

## Model/controller contract

Keep board resource accounting separate from controller phases and helper effects. Preserve HTML load order: board constants precede card/trading/robber/AI helpers. Do not infer complete standard-Catan legality or pause ownership from the shared base.

This is an action-driven turn game, not continuous physics. After a human end-turn, a browser timeout schedules the AI after 500 ms; this timer is independent of the shared render-loop pause.

## Rendering and input

`CatanRenderer` handles projected resource tiles, number labels, roads, settlements/cities, highlights, hover information and tile hit tests.

Use Roll Dice, construction, development-card, bank-trade and End Turn controls. Click tiles for robber placement or structures; roads use a start tile then a destination tile. N starts a new board, R resets scoring and P toggles the loop. Shift+drag rotates; the wheel zooms.

Keep browser-only DOM/Canvas work in its actual controller/renderer boundary. The board exposes CommonJS exports for Node logic tests. Browser controllers/renderers may also require shared globals and DOM/Canvas; requiring one file does not construct a complete game.

Use [tests](../tests/README.md) to select behavior checks and the [shared library guide](../../4d_generic/README.md) for common helpers. Preserve per-game semantics rather than importing unsupported shared features.
