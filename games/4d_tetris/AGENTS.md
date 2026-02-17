# 4D Tetris — Agent Instructions

## Project Overview

Falling tetrominoes on a 4D IVM grid with Quadray rotations. Standalone browser application built on Quadray coordinates.

## Quick Commands

```bash
# Run tests (8 tests)
node tests/test_tetris.js

# Open in browser
open index.html

# Start local server
python3 -m http.server 8112
```

## Shared Modules

Imported via `<script>` tags in `index.html` from `../4d_generic/`:
`quadray.js`, `camera.js`, `projection.js`, `zoom.js`, `synergetics.js`

## Module Dependency Order

Load in this order to avoid reference errors:

```text
1. tetris_board.js     # Board/world state (needs Quadray)
2. tetris_renderer.js  # Canvas rendering (needs Quadray, Board)
3. tetris_game.js      # Controller (needs all above)
```

## File Inventory

### JavaScript Modules (`js/`)

| File | Key Exports | Purpose |
|------|-------------|---------|
| `tetris_board.js` | `TetrisBoard` | 4D grid state with falling piece tracking and layer detection |
| `tetris_renderer.js` | `TetrisRenderer` | IVM grid projection with falling piece preview and ghost piece |
| `tetris_game.js` | `TetrisGame` | Game loop, input handling, piece spawning, and scoring |

### Tests (`tests/`)

| File | Tests | Coverage |
|------|-------|----------|
| `test_tetris.js` | 8 | Board creation, cell operations, reset |
| `test.html` | — | Browser test runner |

## Game Rules Summary

- Tetrominoes fall on a 4D Quadray grid
- Rotate pieces using tetrahedral symmetry operations
- Complete a full layer to clear it
- Game over when pieces stack to the top
- Score increases with multi-layer clears

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

## Verification Checklist

- [ ] All tests pass: `node tests/test_tetris.js`
- [ ] Browser loads: `open index.html`
- [ ] Game plays (basic interaction)
- [ ] Shift+drag rotates view
- [ ] Reset button works
- [ ] Console shows no errors
