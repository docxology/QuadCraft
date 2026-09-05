# 4D Quadray Chess - Agent Instructions

## Project Overview

4D Chess game using Quadray coordinates and the Isotropic Vector Matrix (IVM) tetrahedral geometry. **Production-ready** with 91 passing tests.

## Quick Commands

```bash
# Run all tests (91 tests, 100% pass)
cd tests && node test_chess.js

# Start local server
python3 -m http.server 8080

# Open in browser
open index.html
```

## Key Directories

| Directory | Files | Purpose |
|-----------|-------|---------|
| `js/` | 7 modules | Core JavaScript (Quadray, pieces, board, renderer, game, storage, analysis) |
| `docs/` | 10 files | Documentation (rules, theory, notation, API, architecture) |
| `tests/` | 5 files | Test suite (91 tests across 4 test files) |

## Shared Modules

Imported via `<script>` tags in `index.html` from `../4d_generic/`:
`quadray.js`, `camera.js`, `projection.js`, `zoom.js`, `synergetics.js`

## Module Dependency Order

Load in this order to avoid reference errors:

```
1. chess_pieces.js     # Chess pieces (needs Quadray)
2. chess_board.js      # Game board (needs Quadray, Piece)
3. chess_renderer.js   # 3D visualization (needs Quadray, Board)
4. chess_game.js       # Controller (needs all above)
5. chess_analysis.js   # Metrics (needs Quadray, Board)
6. chess_storage.js    # Save/load (needs all above)
```

## File Inventory

### JavaScript Modules (`js/`)

| File | Lines | Key Exports |
|------|-------|-------------|
| chess_pieces.js | 280 | `Piece`, `King`, `Queen`, `Rook`, `Bishop`, `Knight`, `Pawn`, `PieceType`, `createPiece` |
| chess_board.js | 272 | `Board` class with check detection |
| chess_renderer.js | 427 | `Renderer` class for 3D projection |
| chess_game.js | 556 | `Game` controller class |
| chess_storage.js | 177 | `exportGameState`, `importGameState`, `downloadJSON` |
| chess_analysis.js | 386 | `getPositionMetrics`, `verifyGeometricIdentities` |

### Documentation (`docs/`)

| File | Purpose |
|------|---------|
| README.md | Index |
| game-rules.md | How to play |
| piece-movement.md | Detailed piece mechanics |
| chess-theory.md | Strategy guide (openings, tactics, endgames) |
| chess-history.md | Chess evolution to 4D |
| notation.md | Game recording system |
| quadray-math.md | Mathematical foundations |
| api-reference.md | Class/method documentation |
| architecture.md | Code structure |
| AGENTS.md | Agent instructions |

### Tests (`tests/`)

| File | Tests | Coverage |
|------|-------|----------|
| test_chess.js | 91 | Complete, runnable test suite (`node test_chess.js`) |
| lib_runner.js | — | Shared TestRunner class (helper, not run directly) |
| lib_quadray.js | — | Quadray coordinate test helpers (helper, not run directly) |
| lib_geometry.js | — | IVM geometry verification helpers (helper, not run directly) |
| test.html | — | Browser runner |

## Code Standards

- **Language**: ES6+ JavaScript (classes, const/let, arrow functions)
- **Comments**: JSDoc for all public functions
- **Indentation**: 4 spaces
- **Export Pattern**: Browser + Node.js dual support

```javascript
// Dual export pattern (at end of each module)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ClassName };
}
```

## Key Classes

| Class | Location | Purpose |
|-------|----------|---------|
| `Piece` | chess_pieces.js | Base chess piece + 6 subclasses |
| `Board` | chess_board.js | 24-piece game board with Map storage |
| `Renderer` | chess_renderer.js | Canvas 3D projection |
| `Game` | chess_game.js | Main controller + UI |

## Mathematical Constants

| Constant | Value | Description |
|----------|-------|-------------|
| Tetrahedral angle | 109.47° | arccos(-1/3) |
| Basis vector length | 0.707 | 1/√2 |
| Board size | 4 | Default (0-4 range per axis) |

## Distance Formula

```
D = √((a² + b² + c² + d²) / 2)
```

## Common Tasks

### Adding a Test

```javascript
// In test_chess.js
test.describe('Your Module', () => {
    test.it('should do something', () => {
        test.assertEqual(actual, expected, 'message');
    });
});
```

### Adding a Metric

```javascript
// In chess_analysis.js
function calculateNewMetric(board, color) {
    // Implementation
    return value;
}
// Add to exports
```

### Modifying Piece Movement

```javascript
// In chess_pieces.js, in the piece's getValidMoves method
getValidMoves(board) {
    const moves = [];
    // Add move logic using Quadray basis vectors
    return moves;
}
```

## Verification Checklist

- [ ] All 91 tests pass: `cd tests && node test_chess.js`
- [ ] Browser loads: `open index.html`
- [ ] Game plays correctly (select piece, click move)
- [ ] Verify Math button works in sidebar
- [ ] Console shows no errors
