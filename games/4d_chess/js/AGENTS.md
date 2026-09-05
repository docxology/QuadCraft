# JavaScript Modules - Agent Instructions

## Module Overview

Core JavaScript modules for 4D Quadray Chess (7 files, ~2500 lines).

## Dependency Order (load order matters)

1. `quadray.js` - Core coordinate math (no deps)
2. `chess_pieces.js` - Chess pieces (depends on Quadray)
3. `chess_board.js` - Game board (depends on Pieces)
4. `chess_renderer.js` - 3D visualization (depends on Board)
5. `chess_game.js` - Main controller (depends on Board, Renderer)
6. `chess_analysis.js` - Metrics (depends on Board, Quadray)
7. `chess_storage.js` - Save/load (depends on Game)

## Module Responsibilities

| Module | Exports | Purpose |
|--------|---------|---------|
| quadray.js | `Quadray`, `ROOT2`, `S3` | 4D coordinates |
| chess_pieces.js | `Piece`, `King`, `Queen`, etc. | Chess pieces |
| chess_board.js | `Board`, `BOARD_CONFIG` | Game state |
| chess_renderer.js | `Renderer` | Canvas visualization |
| chess_game.js | `Game`, `GAME_VERSION` | Controller |
| chess_analysis.js | Various functions | Metrics + verification |
| chess_storage.js | Save/load functions | Persistence |

## Export Pattern

All modules use dual-environment export:

```javascript
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ClassName };
}
```

## Code Conventions

- JSDoc for all public methods
- Quadray coordinates: (a, b, c, d) non-negative
- Distance calculations use Quadray.distance()
- Position keys use Quadray.toKey()
