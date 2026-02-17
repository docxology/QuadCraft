# 4D Mahjong - Agent Instructions

## Project Overview

4D Mahjong simulates the classic tile-matching game in a 4-layered 3D layout (conceptually 4D). Players match identical free tiles to clear the board. **Production-ready** with 7 passing tests.

## Quick Commands

```bash
# Run all tests (7 tests, 100% pass)
node tests/test_mahjong.js

# Open in browser
open games/4d_mahjong/index.html

# Start local server (Port 8111)
./games/run_mahjong.sh
```

## Key Directories

| Directory | Files | Purpose |
|-----------|-------|---------|
| `js/` | 3 modules | Core logic (Quadray, Board, Renderer, Game) |
| `tests/` | 1 file | Test suite (7 tests) |

## Shared Modules

Imported via `<script>` tags in `index.html` from `../4d_generic/`:
`quadray.js`, `camera.js`, `projection.js`, `zoom.js`, `synergetics.js`

## Module Dependency Order

Load in this order:

```
1. mahjong_board.js   # Tile layout & Matching logic
2. mahjong_renderer.js# Canvas rendering
3. mahjong_game.js    # Controller & Input
```

## File Inventory

### JavaScript Modules (`js/`)

| File | Key Exports | Purpose |
|------|-------------|---------|
| `mahjong_board.js` | `Board`, `Tile` | Layout generation, checking free tiles |
| `mahjong_renderer.js`| `Renderer` | Drawing tiles with face art |
| `mahjong_game.js` | `Game` | Selection & Hints |

### Tests (`tests/`)

| File | Tests | Coverage |
|------|-------|----------|
| `test_mahjong.js` | 7 | Tile freedom rules, matching pairs, win condition |

## Key Mechanics

### Freedom Rule

A tile is "free" if it has no tile on top (Layer + 1) AND has at least one side (Left or Right) open.

### 4D Layering

The "turtle" layout is built by stacking tiles in height (Z/W dimension).

## Verification Checklist

- [ ] All tests pass: `node tests/test_mahjong.js`
- [ ] Browser loads without errors
- [ ] Tiles render with correct faces
- [ ] Only free tiles can be selected
- [ ] Matches remove tiles
- [ ] Hint system finds valid pairs
