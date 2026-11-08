# 4D Hex JavaScript — Canonical FCC paths between opposing faces

Alternate red/blue placements to connect opposite coordinate faces on a bounded canonical-cell FCC graph.

## Modules and entrypoint

The [game page](../index.html) loads sibling [shared modules](../../4d_generic/README.md) before the local game stack. Its local order is:

```text
hex_board.js
hex_renderer.js
hex_game.js
```

| File | Actual responsibility |
| --- | --- |
| [hex_board.js](hex_board.js) | `HexBoard`: Cells are zero-minimum representatives, not all `size^4` raw aliases. Red connects a=0 to a=size−1; Blue connects b=0 to b=size−1. `_checkWin` traverses occupied cells using bounded normalized neighbors, up to twelve per cell. |
| [hex_renderer.js](hex_renderer.js) | `HexRenderer`: Projected canonical cells colored by owner, neighbor edges and nearest-screen-cell picking. |
| [hex_game.js](hex_game.js) | `HexGame`: input, lifecycle and HUD wiring |

## Data and update boundary

Placement and win detection are discrete actions; no continuous board simulation runs in the inherited update hook.

Preserve canonical cells and the exact face conditions. A winning fixture must follow real bounded-neighbor edges, not assume arbitrary coefficient-axis steps are FCC contacts.

## Limitations

This is a bounded three-dimensional FCC connection adaptation, not ordinary planar Hex. Planar Hex’s no-draw theorem and standard strategy do not transfer automatically. It has no AI, network opponent or general analysis engine.

See the [game guide](../README.md) for controls, [logic tests](../tests/README.md) for coverage boundaries and [portfolio contracts](../../../docs/games.md) for geometry/time conventions. Shared modules are capabilities, not an automatic entity/physics/save/network layer for this game.
