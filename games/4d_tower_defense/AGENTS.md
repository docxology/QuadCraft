# 4D Tower Defense - Agent Instructions

## Project Overview

4D Tower Defense challenges players to defend a base from waves of 4D geometric enemies using various tower types. Enemies follow a path through the IVM grid. **Production-ready** with 9 passing tests.

## Quick Commands

```bash
# Run all tests (9 tests, 100% pass)
node tests/test_td.js

# Open in browser
open games/4d_tower_defense/index.html

# Start local server (Port 8109)
./games/run_tower_defense.sh
```

## Key Directories

| Directory | Files | Purpose |
|-----------|-------|---------|
| `js/` | 3 modules | Core logic (Quadray, Board, Renderer, Game) |
| `tests/` | 1 file | Test suite (9 tests) |

## Shared Modules

Imported via `<script>` tags in `index.html` from `../4d_generic/`:
`quadray.js`, `camera.js`, `projection.js`, `zoom.js`, `synergetics.js`

## Module Dependency Order

Load in this order:

```
1. td_board.js     # Creeps, Towers, Pathing, Wave logic
2. td_renderer.js  # 3D Rendering & Visual Effects
3. td_game.js      # Controller & Input
```

## File Inventory

### JavaScript Modules (`js/`)

| File | Key Exports | Purpose |
|------|-------------|---------|
| `td_board.js` | `Board`, `Tower`, `Creep` | Game state & Physics |
| `td_renderer.js` | `Renderer` | Drawing towers, creeps, particles |
| `td_game.js` | `Game` | User interaction, game loop |

### Tests (`tests/`)

| File | Tests | Coverage |
|------|-------|----------|
| `test_td.js` | 9 | Path verification, firing logic, money/damage calculations |

## Key Mechanics

### Towers

- **Tetra**: Rapid fire, low damage.
- **Octa**: Area of effect (Splash).
- **Cubo**: High damage, slow fire.

### Creeps

- **Normal**: Average speed/health.
- **Fast**: High speed, low health.
- **Armored**: High health, slow.
- **Boss**: Very high health.

## Verification Checklist

- [ ] All tests pass: `node tests/test_td.js`
- [ ] Browser loads without errors
- [ ] Creeps spawn and follow path
- [ ] Towers track and fire at enemies
- [ ] Money deducts when building/upgrading
- [ ] Game Over triggers when base health 0
