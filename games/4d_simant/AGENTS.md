# 4D SimAnt - Agent Instructions

## Project Overview

4D SimAnt simulates an ant colony in a 4D tetrahedral grid. Ants forage for food, leaving pheromone trails that others follow. It demonstrates swarm intelligence and path emergence in IVM geometry. **Production-ready** with 9 passing tests.

## Quick Commands

```bash
# Run all tests (9 tests, 100% pass)
node tests/test_simant.js

# Open in browser
open games/4d_simant/index.html

# Start local server (Port 8105)
./games/run_simant.sh
```

## Key Directories

| Directory | Files | Purpose |
|-----------|-------|---------|
| `js/` | 7 modules | Core logic, AI, Combat, Pheromones |
| `tests/` | 1 file | Test suite (9 tests) |

## Shared Modules

Imported via `<script>` tags in `index.html` from `../4d_generic/`:
`quadray.js`, `camera.js`, `projection.js`, `zoom.js`, `synergetics.js`

## Module Dependency Order

Load in this order:

```
1. simant_board.js         # World state & Grid
2. simant_ai.js            # Ant behavior logic
3. simant_combat.js        # Combat resolution
4. simant_pheromone_viz.js # Visual effect for trails
5. simant_renderer.js      # Main renderer
6. simant_game.js          # Controller
```

## File Inventory

### JavaScript Modules (`js/`)

| File | Key Exports | Purpose |
|------|-------------|---------|
| `simant_board.js` | `Board`, `Ant`, `Food` | Game state container |
| `simant_ai.js` | `AntAI` | Decision making (Forage, Return, Attack) |
| `simant_combat.js` | `resolveCombat` | Interaction between Red/Black ants |
| `simant_pheromone_viz.js`| `PheromoneVisualizer` | Heatmap-style rendering |
| `simant_renderer.js` | `Renderer` | 3D projection of board |
| `simant_game.js` | `Game` | Main loop |

### Tests (`tests/`)

| File | Tests | Coverage |
|------|-------|----------|
| `test_simant.js` | 9 | Movement, pheromone deposit/decay, food gathering |

## Key Mechanics

### Pheromones

Ants leave 'ToFood' or 'ToHome' trails. These are stored in a sparse map in `Board`. The AI polls adjacent cells (12 IVM neighbors) and follows the gradient.

### Swarm AI

- **Wander**: Random walk if no gradient.
- **Forage**: Follow 'ToFood' or random.
- **Return**: Carry food, deposit 'ToFood', follow 'ToHome'.

## Verification Checklist

- [ ] All tests pass: `node tests/test_simant.js`
- [ ] Browser loads without errors
- [ ] Ants spawn and move
- [ ] Pheromone trails appear (visualized opacity)
- [ ] Food is collected and returned to nest
- [ ] Red vs Black combat works
