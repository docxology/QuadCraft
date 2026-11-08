# 4D Quadray Chess JavaScript — Directed piece moves on a canonical Quadray board

A local chess-inspired variant on canonical Quadray positions, with projected overview and selected-piece views.

## Modules and entrypoint

The [game page](../index.html) loads sibling [shared modules](../../4d_generic/README.md) before the local game stack. Its local order is:

```text
chess_pieces.js
chess_board.js
chess_renderer.js
chess_fpv_renderer.js
chess_storage.js
chess_analysis.js
chess_game.js
```

| File | Actual responsibility |
| --- | --- |
| [chess_board.js](chess_board.js) | `Board`: The default `Board(4)` enumerates zero-minimum representatives with normalized components from 0 through 4 inclusive. Piece rules are directed: positive basis/pair slides, ordered +2/+1 knight offsets, and color-specific pawn advance. `Board.movePiece` mutates occupancy; the UI chooses generated destinations and advances `TurnManager`. |
| [chess_renderer.js](chess_renderer.js) | `Renderer`: Projected board, pieces, selected destinations, picking and math/HUD overlays; `FPVRenderer` is a separate selected-piece camera. |
| [chess_game.js](chess_game.js) | `Game`: input, lifecycle and HUD wiring |
| [chess_pieces.js](chess_pieces.js) | `Piece`, piece subclasses, enums and `createPiece(type,color,position)` |
| [chess_fpv_renderer.js](chess_fpv_renderer.js) | `FPVRenderer`: selected-piece camera and local move view |
| [chess_storage.js](chess_storage.js) | Legacy serialization/file I/O; see compatibility limitation below |
| [chess_analysis.js](chess_analysis.js) | Material/mobility/physical-spread readouts and legacy move-history tools |

## Data and update boundary

Turns are discrete. A shared loop refreshes HUD/selected-piece view, while autoplay uses an independent browser interval (1000 ms by default). Loop pause does not stop that interval or globally gate click/key commands.

Preserve canonical keys, inclusive normalized bounds and directed piece offsets. Keep pseudo-legal move generation distinct from check detection. Audit real TurnManager records before claiming persistence/history compatibility.

## Limitations

This is not full orthodox chess: generated moves are not filtered for self-check; kings can be captured; castling, en passant and pawn promotion are absent. Save/Load and move-history analysis retain legacy flat records that do not match the controller’s TurnManager-wrapped history/getter-only state; do not rely on a working round-trip.

See the [game guide](../README.md) for controls, [logic tests](../tests/README.md) for coverage boundaries and [portfolio contracts](../../../docs/games.md) for geometry/time conventions. Shared modules are capabilities, not an automatic entity/physics/save/network layer for this game.
