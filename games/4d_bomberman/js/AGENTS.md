# 4D Bomberman JavaScript maintenance

Use the [module map](README.md) and actual [HTML entrypoint](../index.html), not a generic game template, for dependency order and construction. Read [game-level instructions](../AGENTS.md) before editing this directory.

## Model/controller contract

Preserve raw keys and the eight signed movement/explosion directions. Keep logical bomb ticks separate from fixed-second loop callback units; examine paused event callbacks explicitly.

One `board.step()` runs per 200 ms loop tick. Bomb timers and enemy motion are logical-step quantities; they are not seconds passed to a continuous integrator.

## Rendering and input

`BombermanRenderer` handles depth-projected walls, destructible blocks, power-ups, explosions, bombs, enemies, player and board status.

W/S or Up/Down move +A/−A; D/A or Right/Left move +B/−B; E/Q move +C/−C; X/Z move +D/−D. Space places a bomb; N starts a new game, R resets and P pauses the loop. Shift+drag rotates; the wheel zooms.

Keep browser-only DOM/Canvas work in its actual controller/renderer boundary. The board exposes CommonJS exports for Node logic tests. Browser controllers/renderers may also require shared globals and DOM/Canvas; requiring one file does not construct a complete game.

Use [tests](../tests/README.md) to select behavior checks and the [shared library guide](../../4d_generic/README.md) for common helpers. Preserve per-game semantics rather than importing unsupported shared features.
