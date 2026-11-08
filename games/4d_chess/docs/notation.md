# Quadray Chess notation — human annotations versus runtime records

## Quadray Algebraic Notation (QAN)

For human discussion, write a canonical position as `(a,b,c,d)` and a move as `Piece(from) → (to)`. K/Q/R/B/N/P are familiar piece abbreviations; × can mark a capture. These are documentation conventions, not an implemented notation parser, PGN importer or URL-sharing protocol.

For example, `N(0,0,0,0) → (2,1,0,0)` describes one allowed knight offset on an otherwise suitable board. It is an isolated rule illustration, not a recorded move from the default setup or evidence of a full playable line. Bounds, occupancy and [actual move generators](piece-movement.md) determine availability.

## Distance Notation

If annotating distance, use `Quadray.distance(from,to)` in the [shared embedding’s units](quadray-math.md). The physical metric is common-offset invariant; the raw four-coefficient norm is not. A normalized key can represent the same physical point as several unnormalized tuples, so do not use concatenated digits as a general serialization format.

## Runtime move records

The controller calls `turnManager.recordAndAdvance({from,to,captured})`. Shared TurnManager stores an entry with:

```text
player
move: {from, to, captured}
turnNumber
timestamp
```

`from`/`to` are Quadrays in live state and `captured` is a piece or null. `Game.moveHistory` exposes this wrapped history, not a flat array of moves. It is a getter, as is `Game.currentPlayer`.

## Import/Export Formats

The legacy [storage module](../js/chess_storage.js) emits an object with version/timestamp, current player/game-over flag, board size, normalized piece records, flat move-history records and captured-piece summaries. Its file helpers download JSON or read an uploaded file; they do not implement text notation, URL state or online synchronization.

The real controller has moved to wrapped TurnManager records, while export still reads `move.from/to` directly. Import still assigns getter-only `currentPlayer` and `moveHistory` and does not restore all serialized state. Thus Save/Load buttons and S/L shortcuts exist, but a successful live-game round-trip is **not a supported guarantee**. Do not use this legacy format as a reliable archival/replay contract without repairing and testing that integration.

## Analysis Tools

Material, generated mobility, fixed-center proximity and pairwise physical spread can describe a position. History-log/distance functions also assume flat moves and share the compatibility limitation above. Check/checkmate annotations should not imply orthodox legality: move generation does not exclude self-check.

For reproducible discussion, record the checkout revision, normalized piece arrangement, side to move and exact generated move under examination. Text comments are useful without claiming a machine-readable feature that does not exist.

[Game rules](game-rules.md) · [Strategy/readouts](chess-theory.md) · [API reference](api-reference.md).
