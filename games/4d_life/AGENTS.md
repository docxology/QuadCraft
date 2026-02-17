# 4D Life - Agent Instructions

## Project Overview

4D Life is an implementation of Conway's Game of Life on a 4D toroidal grid (IVM lattice). Cells have up to 12 neighbors. **Production-ready** with 8 passing tests.

## Quick Commands

```bash
# Run all tests (8 tests, 100% pass)
node tests/test_life.js

# Open in browser
open games/4d_life/index.html

# Start local server (Port 8103)
./games/run_life.sh
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
1. life_board.js   # Grid state & Rules
2. life_renderer.js# Canvas rendering
3. life_game.js    # Loop & Controls
```

## File Inventory

### JavaScript Modules (`js/`)

| File                 | Key Exports     | Purpose                  |
|----------------------|-----------------|--------------------------|
| `quadray.js`         | `Quadray`       | Coordinates              |
| `life_board.js`      | `Board`, `Cell` | Sparse map of live cells |
| `life_renderer.js`   | `Renderer`      | Projection               |
| `life_game.js`       | `Game`          | Tick loop, speed control |

### Tests (`tests/`)

| File           | Tests | Coverage                                |
|----------------|-------|-----------------------------------------|
| `test_life.js` | 8     | Birth, Survival, Overcrowding, Wrapping |

## Game Rules (Conway in 4D)

- **Neighbors**: 12 (IVM coordination number)
- **Birth**: Dead cell with exactly 3 live neighbors becomes live.
- **Survival**: Live cell with 2 or 3 neighbors stays live.
- **Death**: <2 (underpopulation) or >3 (overpopulation) dies.
- **Wraparound**: Logic handles toroidal boundaries on all 4 axes.

## Verification Checklist

- [ ] All tests pass: `node tests/test_life.js`
- [ ] Browser loads without errors
- [ ] Cells toggle on click
- [ ] Simulation runs/pauses
- [ ] Patterns propagate correctly
- [ ] Clear button wipes board
