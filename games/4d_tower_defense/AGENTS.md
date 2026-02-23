# 4D Tower Defense - Agent Instructions

## Project Overview

4D Tower Defense challenges players to defend a base from waves of 4D geometric enemies using various tower types. Enemies follow a procedurally generated path through the IVM grid. **Production-ready** with comprehensive passing tests.

## Quick Commands

```bash
# Run all tests (100% pass)
node tests/test_td.js

# Run tests then launch
python3 ../../run_games.py --test --game tower_defense

# Launch (auto-kills stale port processes)
python3 ../../run_games.py --game tower_defense
```

## Key Directories

| Directory | Files | Purpose |
|-----------|-------|---------|
| `js/` | 3 modules | Core logic (Board, Renderer, Game) |
| `tests/` | 1 file | Test suite (core + extended, ~150 assertions) |

## Shared Modules

Imported via `<script>` tags in `index.html` from `../4d_generic/`:
`quadray.js`, `camera.js`, `projection.js`, `zoom.js`, `synergetics.js`, `game_loop.js`, `input_controller.js`, `grid_utils.js`, `base_board.js`, `pathfinding.js`, `base_renderer.js`, `base_game.js`, `hud.js`, `score_manager.js`

## Module Dependency Order

```
1. td_board.js     # Creeps, Towers, Pathing, Wave logic, Procedural IVM paths
2. td_renderer.js  # 3D Rendering & Visual Effects
3. td_game.js      # Controller, Input, Auto-Wave
```

## File Inventory

### JavaScript Modules (`js/`)

| File | Key Exports | Purpose |
|------|-------------|---------|
| `td_board.js` | `TowerDefenseBoard`, `TDTower`, `TDCreep`, `TOWER_TYPES`, `CREEP_TYPES` | Game state, physics, procedural paths |
| `td_renderer.js` | `TDRenderer` | Drawing towers, creeps, particles, projectile trails |
| `td_game.js` | `TDGame` | User interaction, game loop, auto-wave |

### Tests (`tests/`)

| File | Coverage |
|------|----------|
| `test_td.js` | `runTests()` — Path, placement, upgrades, sells, all 7 creep types, swarm splitting, regen healing, rhombic stats, gold math, metadata |
| | `runExtendedTests()` — Reset, sniper targeting priority, trail tracking, game-over trigger, wave countdown, speed consistency, volume ratios, log management |

## Key Mechanics

### Towers (Synergetics Polyhedra)

| Tower | TV | Cost | Ability | Key |
|-------|:--:|:----:|---------|:---:|
| ▲ Tetra | 1 | 15g | Rapid fire | 1 |
| ◆ Octa | 4 | 40g | Splash (AoE) | 2 |
| ⬡ Cubo | 20 | 100g | Slow aura | 3 |
| ✦ Rhombic | 6 | 250g | Sniper (highest-HP) | 4 |

### Creeps

| Type | Speed | HP | Gold | Shape |
|------|:-----:|:--:|:----:|-------|
| Normal | 1× | 1× | 1× | ● Circle |
| Fast | 2× | 0.5× | 1.2× | ◆ Diamond |
| Armored | 0.5× | 2.5× | 1.5× | ■ Square |
| Regen | 0.6× | 3× | 2× | ✚ Plus |
| Swarm | 1.5× | 0.8× | 1.5× | ✿ Star-7 |
| Swarmlet | 2× | 0.2× | 0.3× | • Dot |
| Boss | 0.3× | 6× | 5× | ★ Star (every 5th wave) |

### Controls

| Key | Action |
|-----|--------|
| `1`-`4` | Select tower type |
| `U` | Upgrade selected tower |
| `X` | Sell selected tower |
| `Space` | Toggle speed (1×/2×/3×) |
| `N` | Send next wave early |
| `A` | Toggle auto-wave |
| `Esc` | Deselect tower |
| `P` | Pause |
| `R` | Reset |

### Procedural Paths

Each game generates a unique IVM-snapped path using `Quadray.BASIS` neighbor steps, ensuring connected waypoints through tetrahedral space.

### Launcher Flags

| Flag | Effect |
|------|--------|
| `--test` | Run `node tests/test_td.js` before launching |
| `[port]` | Custom port (default: 8109) |
| *(auto)* | Kills stale processes on port before binding |

## Verification Checklist

- [ ] All tests pass: `node tests/test_td.js`
- [ ] Browser loads without errors
- [ ] Creep legend panel shows all 7 types
- [ ] Auto-wave button toggles correctly
- [ ] Sniper tower snipes highest-HP creep
- [ ] Swarm spawns 2 Swarmlets on death
- [ ] Regen creeps heal over time
