# Quadray Chess architecture — browser wiring, canonical board and TurnManager state

## Module Dependencies

The live [index.html](../index.html) loads the shared classic-script helpers first, then local scripts in this order:

```text
chess_pieces.js
chess_board.js
chess_renderer.js
chess_fpv_renderer.js
chess_storage.js
chess_analysis.js
chess_game.js
```

There is no local `js/quadray.js`; the canonical class comes from [4d_generic](../../4d_generic/README.md). This browser stack is independent of the native C++ engine and historical browser/server experiments.

## Module Responsibilities

- [Pieces](../js/chess_pieces.js): enums, factory and directed pseudo-legal destinations.
- [Board](../js/chess_board.js): canonical rounded keys, prescribed setup, occupancy/captures, normalized inclusive bounds and check queries.
- [Overview renderer](../js/chess_renderer.js): projected board, pieces, move highlights, screen picking and geometric HUD.
- [FPV renderer](../js/chess_fpv_renderer.js): selected-piece view, local directions and visible pieces; no new board dimension.
- [Controller](../js/chess_game.js): BaseGame subclass, input, selection, turn/history ownership, random autoplay and end messages.
- [Storage](../js/chess_storage.js): legacy object serialization and browser file I/O; record-schema compatibility is incomplete.
- [Analysis](../js/chess_analysis.js): material, generated-move count, fixed-center heuristic, pairwise physical spread and legacy flat-history readouts.

## Data Flow

HTML constructs `new Game(canvas,hudElement)` and calls `init()`. BaseGame attaches key input and starts the shared render loop. A click is picked by the overview renderer; selection calls `piece.getValidMoves(board)`. A chosen destination calls `Game.makeMove`, which mutates the board, records/advances TurnManager, updates capture score and queries the next player’s generated moves/check flag.

The board mutator does not enforce full legality; move generation does not filter self-check. See [rules](game-rules.md) before treating a terminal message as standard chess adjudication.

## Game Loop

The loop uses fixed-second callbacks at `1000/30` milliseconds per tick. Chess does not integrate piece motion over dt: `update()` synchronizes display state and the optional FPV view. Random autoplay is a separate `setInterval` using `autoPlaySpeed` in milliseconds. Loop pause does not cancel that interval or gate every command. Reset clears autoplay and resets board/selection/turn state.

## History and storage boundary

`TurnManager.recordAndAdvance` appends wrappers containing player, `move`, turn number and timestamp. `Game.currentPlayer` and `Game.moveHistory` are getter-only views of the manager. Legacy storage/history-analysis functions expect flat `from/to/captured` records and import assigns those getter-only properties. The exposed Save/Load UI therefore must not be documented as a working controller round-trip.

## Browser vs Node.js

Piece/board/storage/analysis modules expose CommonJS exports used by the Node suite. Browser controllers/renderers also depend on shared globals and DOM/Canvas state; requiring a single controller file is not a standalone runtime recipe. [Tests](../tests/README.md) use helper game objects for storage, not the actual controller, and the historical HTML runner has stale dependencies.

[Module map](../js/README.md) · [API reference](api-reference.md) · [Contribution guide](../CONTRIBUTING.md).
