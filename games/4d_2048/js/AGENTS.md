# 4D 2048 JavaScript maintenance

Use the [module map](README.md) and actual [HTML entrypoint](../index.html), not a generic game template, for dependency order and construction. Read [game-level instructions](../AGENTS.md) before editing this directory.

## Model/controller contract

Preserve raw slide bounds and the exact twelve-key/index mapping; this board does not normalize slide destinations. Keep each destination’s once-per-slide merge guard. Do not infer canonical FCC adjacency from the direction labels.

Slides are discrete key actions; inherited update has no continuous simulation. Slide callbacks explicitly reject paused input. P toggles the shared loop; R resets the board/scoring.

## Rendering and input

`Twenty48Renderer` handles depth-sorted projected raw tiles, value colors/numbers and shared coordinate axes.

Keys 1–9 select direction indices 0–8; 0 selects index 9; Q/W select indices 10/11. These map in order to `GridUtils.DIRECTIONS`, not the arrow/WASD movement scheme of other games. New Game and Reset buttons both call reset. Shift+drag rotates; the wheel zooms.

Keep browser-only DOM/Canvas work in its actual controller/renderer boundary. The board exposes CommonJS exports for Node logic tests. Browser controllers/renderers may also require shared globals and DOM/Canvas; requiring one file does not construct a complete game.

Use [tests](../tests/README.md) to select behavior checks and the [shared library guide](../../4d_generic/README.md) for common helpers. Preserve per-game semantics rather than importing unsupported shared features.
