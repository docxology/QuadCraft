# 4D Lights Out JavaScript — Canonical-cell toggle puzzles on the FCC graph

Turn every light off by toggling a canonical physical cell together with its bounded FCC neighbors.

## Modules and entrypoint

The [game page](../index.html) loads sibling [shared modules](../../4d_generic/README.md) before the local game stack. Its local order is:

```text
lights_out_board.js
lights_out_renderer.js
lights_out_game.js
```

| File | Actual responsibility |
| --- | --- |
| [lights_out_board.js](lights_out_board.js) | `LightsOutBoard`: The board uses `generateCanonicalGrid(size)`. A toggle flips self plus up to twelve normalized bounded neighbors. Randomization starts all-off and applies legal toggles, retaining a reversible route back; move counting is reset after generation. Win detection locks further player toggles. |
| [lights_out_renderer.js](lights_out_renderer.js) | `LightsOutRenderer`: Projected lit/unlit canonical cells, neighbor edges and nearest-screen-cell hit testing. |
| [lights_out_game.js](lights_out_game.js) | `LightsOutGame`: input, lifecycle and HUD wiring |

## Data and update boundary

Toggles are discrete actions; inherited `update()` does not simulate time. The shared loop updates camera/HUD/display.

Keep canonical cells and normalized bounded-neighbor toggles aligned. Random generation must not get trapped by the player-facing won guard. Do not document unsupported ScoreManager low-score options as implemented.

## Limitations

The controller supplies `key` and `highScoreMode` options that shared ScoreManager does not implement. Do not promise persistent lowest-move records: the board’s move count is authoritative, while that advertised Best-score mode is not wired to a supported scoring API.

See the [game guide](../README.md) for controls, [logic tests](../tests/README.md) for coverage boundaries and [portfolio contracts](../../../docs/games.md) for geometry/time conventions. Shared modules are capabilities, not an automatic entity/physics/save/network layer for this game.
