# 4D Connect Four JavaScript — Raw-slot gravity, undo and local AI

Drop pieces into `(b,c,d)` columns of a raw four-index board; gravity fills A from its lowest empty row.

## Modules and entrypoint

The [game page](../index.html) loads sibling [shared modules](../../4d_generic/README.md) before the local game stack. Its local order is:

```text
connect_four_board.js
connect_four_renderer.js
connect_four_game.js
```

| File | Actual responsibility |
| --- | --- |
| [connect_four_board.js](connect_four_board.js) | `ConnectFourBoard`: The default board is 6×5×3×3 raw slots. Keys preserve common-offset aliases as independent game slots. Wins walk 40 undirected raw line directions, not the twelve physical FCC contacts. The board records drops and undo state; the controller offers human/human or local AI play. |
| [connect_four_renderer.js](connect_four_renderer.js) | `ConnectFourRenderer`: Projected columns/slots, hover and ghost previews, drop animations, placed pieces, win lines and column hit tests. |
| [connect_four_game.js](connect_four_game.js) | `ConnectFourGame`: input, lifecycle and HUD wiring |

## Data and update boundary

Drops and turns are discrete. AI replies are queued with one 400 ms browser timeout; new/reset/undo and AI ownership changes cancel a pending reply. This timeout is separate from the render loop.

Never normalize slot keys or use gauge-aware equality for winning lines. Undo restores the preceding human decision when AI is enabled; preserve single-timeout ownership and fixed-P2 search evaluation.

## Limitations

Easy uses random choice after immediate win/block checks; medium uses position evaluation; hard uses depth-three alpha-beta. This is not a solved or measured-strength engine. A pending AI timeout is not paused by stopping the render loop.

See the [game guide](../README.md) for controls, [logic tests](../tests/README.md) for coverage boundaries and [portfolio contracts](../../../docs/games.md) for geometry/time conventions. Shared modules are capabilities, not an automatic entity/physics/save/network layer for this game.
