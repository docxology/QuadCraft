# 4D Asteroids - Agent Instructions

## Project Overview

4D Asteroids is an arcade-style game where the player pilots a ship through a 4D hypserspace. The game features continuous movement, inertia, and "screen wrapping" across 4 dimensions. **Production-ready** with 8 passing tests.

## Quick Commands

```bash
# Run all tests (8 tests, 100% pass)
node tests/test_asteroids.js

# Open in browser
open games/4d_asteroids/index.html

# Start local server (Port 8104)
./games/run_asteroids.sh
```

## Key Directories

| Directory | Files | Purpose |
|-----------|-------|---------|
| `js/` | 3 modules | Core logic (Quadray, Board, Renderer, Game) |
| `tests/` | 1 file | Test suite (12 tests) |

## Shared Modules

Imported via `<script>` tags in `index.html` from `../4d_generic/`:
`quadray.js`, `camera.js`, `projection.js`, `zoom.js`, `synergetics.js`

## Module Dependency Order

Load in this order:

```
1. asteroids_board.js    # Physics & Entity state (Ship, Asteroids)
2. asteroids_renderer.js # Canvas rendering
3. asteroids_game.js     # Controller loop & Input
```

## File Inventory

### JavaScript Modules (`js/`)

| File | Key Exports | Note |
|------|-------------|------|
| `asteroids_board.js` | `Board`, `Entity`, `Ship`, `Asteroid` | Handles physics updates |
| `asteroids_renderer.js` | `Renderer` class | |
| `asteroids_game.js` | `Game` controller | |

### Tests (`tests/`)

| File | Tests | Coverage |
|------|-------|----------|
| `test_asteroids.js` | 12 | Movement, wrapping, collision detection, asteroid splitting |

## Key Concepts

### 4D Wrapping

The game world is a 4-torus. When an object leaves the bound (e.g., a > 4), it wraps to the opposite side (a = -4). This is implemented in `Board.update()`.

### Inertia

The ship has a velocity vector `(dv_a, dv_b, dv_c, dv_d)`. Thrust adds to this vector; friction/drag slowly reduces it.

## Verification Checklist

- [ ] All tests pass: `node tests/test_asteroids.js`
- [ ] Browser loads without errors
- [ ] Ship moves with inertia (Arrow keys)
- [ ] Spacebar fires projectiles
- [ ] Asteroids split when hit
- [ ] Wrapping works across all boundaries
