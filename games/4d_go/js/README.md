# 4D Go JavaScript — Canonical-cell groups, liberties and captures

Place alternating black/white stones on distinct canonical physical cells joined by the shared FCC neighbor graph.

## Modules and entrypoint

The [game page](../index.html) loads sibling [shared modules](../../4d_generic/README.md) before the local game stack. Its local order is:

```text
go_board.js
go_renderer.js
go_game.js
```

| File | Actual responsibility |
| --- | --- |
| [go_board.js](go_board.js) | `GoBoard`: `generateCanonicalGrid(size)` selects zero-minimum labels. Group traversal and liberties follow bounded canonical neighbors (up to twelve). Placement captures adjacent enemy groups with no liberties and rejects suicide. Passing advances the player and move count. |
| [go_renderer.js](go_renderer.js) | `GoRenderer`: Projected canonical cells/stones, neighbor edges and nearest-screen-cell picking. |
| [go_game.js](go_game.js) | `GoGame`: input, lifecycle and HUD wiring |

## Data and update boundary

Placement/pass are discrete actions; inherited `update()` is empty. The shared loop only maintains display/HUD/camera state.

Keep one canonical cell per physical point. Capture/liberty traversal must use the same normalized bounded-neighbor graph; retain P as pass rather than silently restoring a base pause shortcut.

## Limitations

Ko/superko, territory scoring, komi and a two-pass end condition are not implemented. Capture counts are not a complete standard-Go score or winner. Noncanonical shifted labels are not extra playable cells.

See the [game guide](../README.md) for controls, [logic tests](../tests/README.md) for coverage boundaries and [portfolio contracts](../../../docs/games.md) for geometry/time conventions. Shared modules are capabilities, not an automatic entity/physics/save/network layer for this game.
