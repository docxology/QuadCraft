# 4D Frogger JavaScript maintenance

Use the [module map](README.md) and actual [HTML entrypoint](../index.html), not a generic game template, for dependency order and construction. Read [game-level instructions](../AGENTS.md) before editing this directory.

## Model/controller contract

Preserve raw wrapped B/C/D state and bounded A progress. Keep timer/speed units per board step, and do not invent four-goal home slots or pause-gated hop ownership.

The shared loop calls one `board.step()` every 200 ms. `timeLeft` counts logical ticks, not seconds; obstacle speed is per step. Hop input is event-driven rather than a held-key continuous integrator.

## Rendering and input

`FroggerRenderer` handles projected lane backgrounds, depth-sorted frog/obstacle entities, a logical-timer bar and board HUD.

W/S or Up/Down hop +A/−A; D/A or Right/Left hop +B/−B; E/Q hop +C/−C; X/Z hop +D/−D. N starts a new game, R resets and P pauses scheduled stepping. Shift+drag rotates; the wheel zooms.

Keep browser-only DOM/Canvas work in its actual controller/renderer boundary. The board exposes CommonJS exports for Node logic tests. Browser controllers/renderers may also require shared globals and DOM/Canvas; requiring one file does not construct a complete game.

Use [tests](../tests/README.md) to select behavior checks and the [shared library guide](../../4d_generic/README.md) for common helpers. Preserve per-game semantics rather than importing unsupported shared features.
