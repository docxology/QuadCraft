# 4D Quadray Chess - Agent Instructions

## Project Overview

4D Chess game using Quadray coordinates and the Isotropic Vector Matrix (IVM) tetrahedral geometry. **Production-ready** with 83 passing tests.

## Quick Commands

```bash
# Run all tests (83 tests, 100% pass)
cd tests && node test_all.js

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
| `tests/` | 5 files | Test suite (83 tests across 4 test files) |

## Module Dependency Order

Load in this order to avoid reference errors:

```
1. quadray.js    # Core coordinate math (no deps)
2. pieces.js     # Chess pieces (needs Quadray)
3. board.js      # Game board (needs Quadray, Piece)
4. renderer.js   # 3D visualization (needs Quadray, Board)
5. game.js       # Controller (needs all above)
6. analysis.js   # Metrics (needs Quadray, Board)
7. storage.js    # Save/load (needs all above)
```

## File Inventory

### JavaScript Modules (`js/`)

| File | Lines | Key Exports |
|------|-------|-------------|
| quadray.js | 210 | `Quadray` class, basis vectors, distance |
| pieces.js | 280 | `Piece`, `King`, `Queen`, `Rook`, `Bishop`, `Knight`, `Pawn`, `PieceType`, `createPiece` |
| board.js | 272 | `Board` class with check detection |
| renderer.js | 427 | `Renderer` class for 3D projection |
| game.js | 556 | `Game` controller class |
| storage.js | 177 | `exportGameState`, `importGameState`, `downloadJSON` |
| analysis.js | 386 | `getPositionMetrics`, `verifyGeometricIdentities` |

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
| test_all.js | 83 | Complete test suite |
| test_runner.js | — | Shared TestRunner class |
| test_quadray.js | 17 | Quadray coordinates |
| test_geometry.js | 9 | IVM geometry verification |
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
| `Quadray` | quadray.js | 4D tetrahedral coordinates |
| `Piece` | pieces.js | Base chess piece + 6 subclasses |
| `Board` | board.js | 24-piece game board with Map storage |
| `Renderer` | renderer.js | Canvas 3D projection |
| `Game` | game.js | Main controller + UI |

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
// In test_all.js
test.describe('Your Module', () => {
    test.it('should do something', () => {
        test.assertEqual(actual, expected, 'message');
    });
});
```

### Adding a Metric

```javascript
// In analysis.js
function calculateNewMetric(board, color) {
    // Implementation
    return value;
}
// Add to exports
```

### Modifying Piece Movement

```javascript
// In pieces.js, in the piece's getValidMoves method
getValidMoves(board) {
    const moves = [];
    // Add move logic using Quadray basis vectors
    return moves;
}
```

## Verification Checklist

- [ ] All 83 tests pass: `cd tests && node test_all.js`
- [ ] Browser loads: `open index.html`
- [ ] Game plays correctly (select piece, click move)
- [ ] Verify Math button works in sidebar
- [ ] Console shows no errors
