# Architecture

Code structure and module organization.

---

## Directory Structure

```
4d_chess/
├── index.html          # Main game page
├── README.md           # Project overview
├── js/
│   ├── quadray.js      # Core coordinate system
│   ├── chess_pieces.js       # Chess piece definitions
│   ├── chess_board.js        # 4D game board
│   ├── chess_renderer.js     # 3D visualization
│   ├── chess_game.js         # Game controller
│   ├── chess_storage.js      # Save/load functionality
│   └── chess_analysis.js     # Geometric analysis
├── docs/
│   ├── README.md       # Documentation index
│   ├── api-reference.md
│   ├── quadray-math.md
│   ├── game-rules.md
│   └── architecture.md # This file
└── tests/
    ├── test.html       # Browser test runner
    └── test_chess.js     # Unit tests (83 tests)
```

---

## Module Dependencies

```
┌─────────────┐
│  quadray.js │  Core math (no dependencies)
└──────┬──────┘
       │
       v
┌─────────────┐
│  chess_pieces.js  │  Uses Quadray for positions/movement
└──────┬──────┘
       │
       v
┌─────────────┐
│   chess_board.js  │  Uses Pieces, Quadray
└──────┬──────┘
       │
       v
┌─────────────┬─────────────┬─────────────┐
│ chess_renderer.js │   chess_game.js   │ chess_analysis.js │
│   (Board)   │(Board,Rend) │   (Board)   │
└─────────────┴──────┬──────┴─────────────┘
                     │
                     v
              ┌─────────────┐
              │ chess_storage.js  │  (Game serialization)
              └─────────────┘
```

---

## Module Responsibilities

### quadray.js

- **Purpose**: 4D tetrahedral coordinate system
- **Exports**: `Quadray`, `ROOT2`, `S3`
- **Key role**: Mathematical foundation
- **Methods**: clone, normalized, toCartesian, fromCartesian, add, subtract, scale, distance, distanceTo, equals, toKey

### chess_pieces.js

- **Purpose**: Chess piece definitions and movement
- **Exports**: `Piece`, `King`, `Queen`, `Rook`, `Bishop`, `Knight`, `Pawn`, `PieceType`, `PlayerColor`, `createPiece`
- **Key role**: Movement rules for each piece type
- **Piece types**: 6 (King, Queen, Rook, Bishop, Knight, Pawn)

### chess_board.js

- **Purpose**: Game board state management
- **Exports**: `Board`, `BOARD_CONFIG`
- **Key role**: Position validation, move execution, check detection
- **Constants**: `TOTAL_PIECES_PER_SIDE: 12`, `TOTAL_PIECES: 24`

### chess_renderer.js

- **Purpose**: 3D visualization on HTML5 Canvas
- **Exports**: `Renderer`
- **Key role**: Project 4D → 2D, draw pieces/grid/UI
- **Features**: Glow effects, math panel, numbered move indicators

### chess_game.js

- **Purpose**: Main game controller
- **Exports**: `Game`, `GAME_VERSION`, `DEFAULT_CONFIG`
- **Key role**: User interaction, turn management, game flow
- **Version**: 1.0.0

### chess_storage.js

- **Purpose**: Save/load game state
- **Exports**: `exportGameState`, `importGameState`, `downloadJSON`, `handleFileUpload`, `generateSaveFilename`
- **Key role**: Serialization to JSON (v1.0 format)

### chess_analysis.js

- **Purpose**: Geometric and strategic analysis
- **Exports**: `calculateCenterControl`, `calculateMobilityScore`, `calculatePieceSpread`, `calculateMaterialScore`, `getPositionMetrics`, `createMoveLog`, `logGameMetrics`, `getDistanceStats`
- **Key role**: Game metrics and logging

---

## Data Flow

### Game Loop

```
User Input → handleClick() → selectPiece()/makeMove()
                                    │
                                    v
                              Board.movePiece()
                                    │
                                    v
                           Check game state
                           (check/checkmate)
                                    │
                                    v
                              render() ────→ Canvas
```

### Rendering Pipeline

```
Board positions → project() → 2D coordinates → Canvas draw
     │
     └── Each piece → getSymbol() → Draw piece glyph
```

---

## Browser vs Node.js

All modules support both environments:

```javascript
// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ClassName };
}
```

### Browser Usage

```html
<script src="js/quadray.js"></script>
<script src="js/chess_pieces.js"></script>
<!-- ... -->
```

### Node.js Usage

```javascript
const { Quadray } = require('./js/quadray.js');
const { Board } = require('./js/chess_board.js');
```

---

## Event System

| Event | Handler | Action |
|-------|---------|--------|
| mousedown | onMouseDown | Select/move piece |
| mousemove | onMouseMove | Hover effects, drag rotate |
| mouseup | onMouseUp | End drag |
| wheel | wheel handler | Zoom |
| keydown | keydown handler | Shortcuts (R, 1-9, Space, A) |

---

## Extension Points

### Adding New Piece Types

1. Create class extending `Piece` in `chess_pieces.js`
2. Implement `getValidMoves(board)` method
3. Add to `PieceType` enum
4. Add symbol in `getSymbol()` method
5. Update `createPiece()` factory

### Adding New Analysis Metrics

1. Add function in `chess_analysis.js`
2. Export function
3. Call from `getPositionMetrics()`
4. Update UI panel if needed

### Adding New UI Features

1. Add HTML in `index.html`
2. Add CSS styles
3. Add handler method in `Game` class
4. Connect via onclick or event listener

---

## Testing Strategy

### Test Coverage Summary

| Module | Base Tests | Extended Tests | Total |
|--------|------------|----------------|-------|
| Quadray Class | 12 | 5 | 17 |
| Piece Classes | 8 | 5 | 13 |
| Board Class | 7 | 6 | 13 |
| Movement Rules | 4 | — | 4 |
| Game State | 2 | — | 2 |
| Math Accuracy | 5 | — | 5 |
| Storage Module | 3 | 3 | 6 |
| Analysis Module | 5 | 4 | 9 |
| Edge Cases | 5 | — | 5 |
| Geometric Verification | — | 9 | 9 |
| **Total** | **51** | **32** | **83** |

### Unit Tests (`test_chess.js`)

- Quadray arithmetic and conversion
- Piece creation and movement
- Board operations
- Game state validation
- Storage serialization
- Analysis metrics

### Browser Tests

- Visual rendering
- User interaction
- Move execution
- Save/load cycle

### Running Tests

```bash
# CLI
cd tests && node test_chess.js

# Browser
open tests/test.html
```

---

## Version Information

| Component | Version |
|-----------|---------|
| Game | 1.0.0 |
| Save Format | 1.0 |
| Board Config | PIECES_PER_SIDE: 12 |
