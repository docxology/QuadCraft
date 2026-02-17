# 4D Reversi - Agent Instructions

## Project Overview

4D Reversi (Othello) is a strategy game played on a 4x4x4x4 grid. Players place discs which flip opponent discs in **80 possible directions** (all IVM neighbors). **Production-ready** with 11 passing tests.

## Quick Commands

```bash
# Run all tests (11 tests, 100% pass)
node tests/test_reversi.js

# Open in browser
open games/4d_reversi/index.html

# Start local server (Port 8102)
./games/run_reversi.sh
```

## Key Directories

| Directory | Files | Purpose |
|-----------|-------|---------|
| `js/` | 3 modules | Core logic (Quadray, ReversiBoard, Renderer, Game) |
| `tests/` | 1 file | Test suite (11 tests) |

## Shared Modules

Imported via `<script>` tags in `index.html` from `../4d_generic/`:
`quadray.js`, `camera.js`, `projection.js`, `zoom.js`, `synergetics.js`

## Module Dependency Order

Load in this order to avoid reference errors:

```
1. reversi_board.js    # Game logic, move validation, disc flipping
2. reversi_renderer.js # Canvas 3D rendering
3. reversi_game.js     # Controller, UI
```

## File Inventory

### JavaScript Modules (`js/`)

| File | Key Exports |
|------|-------------|
| `reversi_board.js` | `ReversiBoard`, `Disk` (Black/White), `getValidMoves` |
| `reversi_renderer.js` | `Renderer` class, 3D grid projection |
| `reversi_game.js` | `ReversiGame` class, turn management |

### Tests (`tests/`)

| File | Tests | Coverage |
|------|-------|----------|
| `test_reversi.js` | 11 | Setup, valid moves, capturing (flipping), game end |

## Code Standards

- **Language**: ES6+ JavaScript
- **Coordinates**: Uses `Quadray` for all positions.
- **Rendering**: Canvas API (no WebGL), custom projection.

## Key Classes

| Class | Source | Purpose |
|-------|--------|---------|
| `ReversiBoard` | reversi_board.js | Manages 4x4x4x4 grid state, flipping logic |
| `Renderer` | reversi_renderer.js | Visualization of discs and valid moves |
| `ReversiGame` | reversi_game.js | Handles turns, score, and UI interactions |

## Game Rules Summary

- **Grid**: 4x4x4x4 (256 cells)
- **Mechanic**: Place disc to flank opponent discs in any of 80 IVM directions.
- **Capture**: Flanked discs flip to your color.
- **Win**: Most discs when board full or no moves possible.

## Verification Checklist

- [ ] All tests pass: `node tests/test_reversi.js`
- [ ] Browser loads without errors
- [ ] Valid moves are highlighted
- [ ] Placing a disc flips opponent's discs correctly
- [ ] Score updates correctly
