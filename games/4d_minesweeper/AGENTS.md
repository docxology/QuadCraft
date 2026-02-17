# 4D Minesweeper — Agent Instructions

## Project Overview

Mine-counting puzzle with IVM adjacency in 4D. Standalone browser application built on Quadray coordinates.

## Quick Commands

```bash
# Run tests (8 tests)
node tests/test_minesweeper.js

# Open in browser
open index.html

# Start local server
python3 -m http.server 8121
```

## Shared Modules

Imported via `<script>` tags in `index.html` from `../4d_generic/`:
`quadray.js`, `camera.js`, `projection.js`, `zoom.js`, `synergetics.js`

## Module Dependency Order

Load in this order to avoid reference errors:

```text
1. minesweeper_board.js     # Board/world state (needs Quadray)
2. minesweeper_renderer.js  # Canvas rendering (needs Quadray, Board)
3. minesweeper_game.js      # Controller (needs all above)
```

## File Inventory

### JavaScript Modules (`js/`)

| File | Key Exports | Purpose |
|------|-------------|---------|
| `minesweeper_board.js` | `MinesweeperBoard` | Mine placement, adjacency counting, reveal/flag state |
| `minesweeper_renderer.js` | `MinesweeperRenderer` | Grid rendering with number colors, flag markers, mine reveal animation |
| `minesweeper_game.js` | `MinesweeperGame` | Click handling, flood-fill reveal, win/lose detection, timer |

### Tests (`tests/`)

| File | Tests | Coverage |
|------|-------|----------|
| `test_minesweeper.js` | 8 | Board creation, cell operations, reset |
| `test.html` | — | Browser test runner |

## Game Rules Summary

- IVM grid contains hidden mines at Quadray positions
- Reveal a cell to see count of adjacent mines (IVM neighbors)
- 4D adjacency means up to 8 neighbors per cell (Quadray octant)
- Flag suspected mines, reveal all safe cells to win
- Hit a mine = game over

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

- [ ] All tests pass: `node tests/test_minesweeper.js`
- [ ] Browser loads: `open index.html`
- [ ] Game plays (basic interaction)
- [ ] Shift+drag rotates view
- [ ] Reset button works
- [ ] Console shows no errors
