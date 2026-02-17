# 4D Quadray Checkers - Agent Instructions

## Project Overview

4D Checkers game using Quadray coordinates. Standalone browser application with 11 passing tests.

## Quick Commands

```bash
# Run all tests (11 tests, 100% pass)
node tests/test_checkers.js

# Open in browser
open index.html

# Start local server
python3 -m http.server 8080
```

## Key Directories

| Directory | Files | Purpose |
|-----------|-------|---------|
| `js/` | 3 modules | Core JavaScript (Quadray, board, renderer, game) |
| `tests/` | 2 files | Test suite (11 tests + browser runner) |

## Shared Modules

Imported via `<script>` tags in `index.html` from `../4d_generic/`:
`quadray.js`, `camera.js`, `projection.js`, `zoom.js`, `synergetics.js`

## Module Dependency Order

Load in this order to avoid reference errors:

```text
1. checkers_board.js     # Board logic (needs Quadray)
2. checkers_renderer.js  # Canvas rendering (needs Quadray, Board, Game)
3. checkers_game.js      # Controller (needs all above)
```

## File Inventory

### JavaScript Modules (`js/`)

| File | Lines | Key Exports |
|------|-------|-------------|
| `checkers_board.js` | 196 | `CheckersBoard`, `CheckersPiece`, `PlayerColor`, `PieceType` |
| `checkers_renderer.js` | 258 | `Renderer` class with grid, pieces, HUD |
| `checkers_game.js` | 148 | `CheckersGame` controller with win detection |

### Tests (`tests/`)

| File | Tests | Coverage |
|------|-------|----------|
| `test_checkers.js` | 11 | Setup, moves, capture, promotion |
| `test.html` | — | Browser test runner |

## Code Standards

- **Language**: ES6+ JavaScript (classes, const/let, arrow functions)
- **Comments**: JSDoc for public functions
- **Indentation**: 4 spaces
- **Export Pattern**: Browser + Node.js dual support

```javascript
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ClassName };
}
```

## Key Classes

| Class | Location | Purpose |
|-------|----------|---------|
| `CheckersPiece` | `checkers_board.js` | Piece with color, type, position |
| `CheckersBoard` | `checkers_board.js` | Board state, move generation, captures |
| `Renderer` | `checkers_renderer.js` | Canvas projection & drawing |
| `CheckersGame` | `checkers_game.js` | Turn management, win detection, input |

## Game Rules Summary

- Board: 4×4×4×4 Quadray grid
- Move: Diagonal (change 2 coords by ±1)
- Red advances by increasing coordinate sum
- Black advances by decreasing coordinate sum
- Capture: Jump over adjacent enemy
- Promotion: Red at Sum ≥ 8, Black at Sum ≤ 0
- Win: Opponent has no pieces or no legal moves

## Common Tasks

### Adding a Test

```javascript
// In test_checkers.js, add to runTests():
function testNewFeature() {
    const board = new CheckersBoard(4);
    // setup
    assert(condition, "Description");
}
```

### Modifying Movement Rules

Edit `getValidMoves()` and `tryAddMove()` in `checkers_board.js`. The direction vectors are defined in the `axes` array.

### Changing Promotion Rules

Edit `checkPromotion()` in `checkers_board.js`. Currently uses sum-based thresholds.

## Verification Checklist

- [ ] All 11 tests pass: `node tests/test_checkers.js`
- [ ] Browser loads: `open index.html`
- [ ] Game plays (select, move, capture)
- [ ] Shift+drag rotates view
- [ ] Reset button works
- [ ] Console shows no errors
