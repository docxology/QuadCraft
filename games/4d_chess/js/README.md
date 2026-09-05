# JavaScript Modules

Core JavaScript modules for 4D Quadray Chess.

## Modules (Load Order)

| # | Module | Lines | Purpose |
|---|--------|-------|---------|
| 1 | quadray.js | 210 | 4D coordinate math |
| 2 | chess_pieces.js | 280 | Chess piece classes |
| 3 | chess_board.js | 272 | Game board state |
| 4 | chess_renderer.js | 422 | 3D visualization |
| 5 | chess_game.js | 556 | Main controller |
| 6 | chess_analysis.js | 370+ | Metrics & verification |
| 7 | chess_storage.js | 177 | Save/load JSON |

## Usage

### Browser

```html
<script src="js/quadray.js"></script>
<script src="js/chess_pieces.js"></script>
<!-- ... -->
```

### Node.js

```javascript
const { Quadray } = require('./js/quadray.js');
const { Board } = require('./js/chess_board.js');
```

## Key Classes

- **Quadray** - 4D tetrahedral coordinates
- **Piece** - Base class + King, Queen, Rook, Bishop, Knight, Pawn
- **Board** - 24-piece game management
- **Renderer** - Canvas 3D projection
- **Game** - User interaction & game loop
