# 4D Backgammon - Agent Instructions

## Project Overview

4D Backgammon reimagines the classic board game on a 4D spiral track. The "board" is a linear path of 24 points coiled through 4D space. Players move checkers based on dice rolls, bearing off at the end. **Production-ready** with 8 passing tests.

## Quick Commands

```bash
# Run all tests (8 tests, 100% pass)
node tests/test_backgammon.js

# Open in browser
open games/4d_backgammon/index.html

# Start local server (Port 8106)
./games/run_backgammon.sh
```

## Key Directories

| Directory | Files | Purpose |
|-----------|-------|---------|
| `js/` | 3 modules | Core logic (Quadray, Board, Renderer, Game) |
| `tests/` | 1 file | Test suite (8 tests) |

## Shared Modules

Imported via `<script>` tags in `index.html` from `../4d_generic/`:
`quadray.js`, `camera.js`, `projection.js`, `zoom.js`, `synergetics.js`

## Module Dependency Order

Load in this order:

```
1. backgammon_board.js   # Game state, points, moves
2. backgammon_renderer.js# Canvas rendering of spiral
3. backgammon_game.js    # Controller, Dice logic
```

## File Inventory

### JavaScript Modules (`js/`)

| File | Key Exports |
|------|-------------|
| `backgammon_board.js` | `Board`, `Point` (0-23, bar, off) |
| `backgammon_renderer.js` | `Renderer` |
| `backgammon_game.js` | `Game`, `Dice` |

### Tests (`tests/`)

| File | Tests | Coverage |
|------|-------|----------|
| `test_backgammon.js` | 8 | Valid moves, hitting blots, bearing off, winning |

## Key Concepts

### The 4D Spiral

Unlike 2D Backgammon, the track isn't U-shaped. It's a spiral in XYZW space. However, topologically, it functions identically to the 1D track of standard Backgammon (Points 1-24). The 4D visualization adds spatial context but preserves the classic rules.

## Verification Checklist

- [ ] All tests pass: `node tests/test_backgammon.js`
- [ ] Browser loads without errors
- [ ] Dice roll works
- [ ] Valid moves highlighted
- [ ] Checkers move from point to point
- [ ] Bearing off logic works
