# Quadray Chess API reference — current signatures and ownership

This is a selected interface map for the development checkout, not a second source implementation. [Architecture](architecture.md) defines browser load order; [module sources](../js/README.md) remain authoritative.

## Quadray Class

Source: [shared quadray.js](../../4d_generic/quadray.js).

- `new Quadray(a=0,b=0,c=0,d=0)` stores coefficients without constructor normalization.
- `normalized()`, `clone()`, `add(other)`, `subtract(other)`, `scale(scalar)` return Quadrays; add/subtract normalize, scale does not.
- `toCartesian()` returns `{x,y,z}`; `Quadray.fromCartesian(x,y,z)` takes three numbers.
- `length()`, `distanceTo(other)` and `Quadray.distance(q1,q2)` use the physical rank-three metric.
- `equals(other,epsilon=0.0001)` compares normalized coefficients; `toKey()` normalizes and integer-rounds components.
- `Quadray.A/B/C/D`, `BASIS`, `ORIGIN` are class properties, not separately exported `BASIS`/`distance` functions.

[Mathematics and units](quadray-math.md) distinguish these methods from raw grid keys and graph adjacency.

## Piece Classes

Source: [chess_pieces.js](../js/chess_pieces.js).

`Piece(type,color,position)` carries `type`, `color`, `position` and `hasMoved`. Subclasses `King`, `Queen`, `Rook`, `Bishop`, `Knight`, `Pawn` take `(color,position)` and implement `getValidMoves(board)`. `getSymbol()` returns the display glyph. `createPiece(type,color,position)` selects a subclass and throws for an unknown type. `PieceType` and `PlayerColor` supply string enums.

Generated moves are pseudo-legal, not self-check-filtered. See [movement](piece-movement.md).

## Board Class

Source: [chess_board.js](../js/chess_board.js).

`new Board(size=4)` extends shared BaseBoard. `pieces` aliases its Map; `maxDistance=size*2`; `capturedPieces` groups captures by capturing color. `BOARD_CONFIG` declares twelve pieces per side/twenty-four total for the prescribed setup, not a test count.

| Interface | Behavior |
| --- | --- |
| `setupInitialPosition()`, `reset()` | Prescribed setup and state reset |
| `placePiece(piece)`, `getPieceAt(position)` | Canonical/rounded `position.toKey()` occupancy |
| `isValidPosition(position)` | Normalized components between 0 and `size`, inclusive |
| `validateBoard()` | Returns `{valid,errors}` for its implemented consistency checks, not a full rules proof |
| `hasOwnPiece(position,color)`, `hasEnemyPiece(position,color)` | Occupancy/color queries |
| `movePiece(from,to)` | Mutates occupancy, marks moved and returns captured piece or null; not a legality/turn validator |
| `getPiecesByColor(color)`, `getKing(color)` | Piece selection |
| `isInCheck(color)` | Opposing generated-move reachability of the king |
| `getAllPositions()`, `getMetadata()` | Canonical display positions and state/readouts |

## Game Class

Source: [chess_game.js](../js/chess_game.js).

`new Game(canvas,hudElement)` extends BaseGame and owns `board`, `renderer`, `turnManager`, selection, score state, optional `fpvRenderer` and an autoplay interval. `currentPlayer`/`moveHistory` are getter-only manager views.

- `init()` attaches input, starts the loop and initializes the optional page FPV canvas.
- `selectPiece(piece)`, `deselectPiece()`, `handleClick(position)`, `selectMoveByNumber(num)` manage generated move choices.
- `makeMove(from,to)` applies the board mutation, records/advances the turn and checks terminal conditions; callers must supply an appropriate move.
- `hasLegalMoves(color)` counts generated destinations despite its name; it does not filter self-check.
- `randomMove()` returns whether it made a move. `toggleAutoPlay()` owns a browser interval, not a search AI.
- `reset()`/`resetGame()` clear autoplay and reset board/turn/selection. Shared `togglePause()` does not globally freeze command handlers/autoplay.
- `toJSON()`, `fromJSON(data)`, `exportGame()`, `importGame()` expose legacy storage paths with the mismatch below; their presence is not a working save-restore guarantee.

## Renderer Class

[Renderer(canvas,board)](../js/chess_renderer.js) extends BaseRenderer and provides `render()` and `getPositionAtScreen(screenX,screenY)` plus chess-specific grid/piece/move/math drawing. [FPVRenderer(canvas,board)](../js/chess_fpv_renderer.js) is separate; `setPiece(piece)`, `setValidMoves(moves)` and `render()` control its selected-piece view.

## Analysis Module

[chess_analysis.js](../js/chess_analysis.js) exports `calculateCenterControl(board,color)`, `calculateMobilityScore(board,color)`, `calculatePieceSpread(board,color)`, `calculateMaterialScore(board,color)`, `getPositionMetrics(game)`, `createMoveLog(game)`, `logGameMetrics(game)` and `getDistanceStats(game)`, along with local geometry-check helpers. [Metric definitions](chess-theory.md) explain their limited meaning. Move-log/distance-history functions expect flat records and are not adapted to the controller’s wrapped history.

## Storage Module

[chess_storage.js](../js/chess_storage.js) exports `exportGameState(game)`, `importGameState(data,game)`, `downloadJSON(data,filename)`, `handleFileUpload(file,callback)` and `generateSaveFilename()`. Browser file I/O needs Blob/URL/FileReader/DOM APIs.

Export maps flat `move.from/to/captured`; real TurnManager history instead wraps the move under `entry.move`. Import assigns `game.currentPlayer` and `game.moveHistory`, but the real controller exposes getter-only properties. It also does not rebuild all serialized fields. Helper-object tests do not establish a live-controller round-trip. See [record compatibility](notation.md) before using these interfaces for persistence.
