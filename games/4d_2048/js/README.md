# 4D 2048 JavaScript — Raw-label directional tile slides and merges

Slide equal-valued tiles on a raw four-index board, merging them to increase score and reach a 2048 tile.

## Modules and entrypoint

The [game page](../index.html) loads sibling [shared modules](../../4d_generic/README.md) before the local game stack. Its local order is:

```text
2048_board.js
2048_renderer.js
2048_game.js
```

| File | Actual responsibility |
| --- | --- |
| [2048_board.js](2048_board.js) | `Twenty48Board`: The default board stores all 3^4 raw labels, including common-offset aliases. `slide(0..11)` adds the selected raw permutation of `(0,1,1,2)` directly, without neighbor normalization; these are twelve nonnegative raw directions, not bidirectional canonical FCC traversal. A destination merges at most once per slide; a successful slide spawns a random 2 or 4 tile and increments move count. |
| [2048_renderer.js](2048_renderer.js) | `Twenty48Renderer`: Depth-sorted projected raw tiles, value colors/numbers and shared coordinate axes. |
| [2048_game.js](2048_game.js) | `Twenty48Game`: input, lifecycle and HUD wiring |

## Data and update boundary

Slides are discrete key actions; inherited update has no continuous simulation. Slide callbacks explicitly reject paused input. P toggles the shared loop; R resets the board/scoring.

Preserve raw slide bounds and the exact twelve-key/index mapping; this board does not normalize slide destinations. Keep each destination’s once-per-slide merge guard. Do not infer canonical FCC adjacency from the direction labels.

## Limitations

There is no undo, solver or seeded replay. Reaching 2048 sets `won` but does not itself stop slides. The controller passes unsupported ScoreManager option `key` (not `storageKey`) and returns a string from `_getHUDState`, although BaseGame expects `{text,color}`; do not promise a persistent Best record or a working shared HUD.

See the [game guide](../README.md) for controls, [logic tests](../tests/README.md) for coverage boundaries and [portfolio contracts](../../../docs/games.md) for geometry/time conventions. Shared modules are capabilities, not an automatic entity/physics/save/network layer for this game.
