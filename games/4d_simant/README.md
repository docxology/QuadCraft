# 4D SimAnt — Professional Edition

Ant colony simulation on a **Quadray Isotropic Vector Matrix (IVM)** grid.

## Quick Start

```bash
python3 games/run_games.py --game simant
```

## Game Mechanics

### Colony Management

- **Workers** (W, 10 food) — Forage for food, dig tunnels through dirt
- **Soldiers** (S, 50 food) — Attack enemy ants, defend territory
- **Scouts** (E, 15 food) — Explore new areas via IVM-spiral patterns
- **Queen** — Auto-spawns workers when food > 15. If she dies, you lose

### Pheromone System (6 channels)

| Channel | Purpose |
|---------|---------|
| Yellow Food | Trail to food sources |
| Yellow Home | Trail back to nest |
| Red Food / Home | Enemy equivalents |
| Yellow Danger | Combat warning (workers avoid) |
| Red Danger | Enemy combat signals |

Real IVM-neighbor diffusion spreads pheromones through the 12-around-one topology.

### Combat

- **Morale**: +3 damage when 3+ allies nearby
- **Terrain**: +5 bonus defending in own tunnel network
- **Danger pheromone** emitted at combat locations
- Queens deal 50 damage to nearby hostiles

### AI (Red Colony)

Four-phase strategy: Early (workers) → Growth (scouts) → Mid (worker+soldier mix) → Late (aggression)

### Win Condition

Defeat the Red Queen → Victory. If your Queen dies → Game Over.

## Controls

| Key | Action |
|-----|--------|
| W / S / E | Hatch Worker / Soldier / Scout |
| 1 / 2 / 3 | Speed: Slow / Normal / Fast |
| T | Toggle pheromone trail visualization |
| A | Toggle Yellow auto-assist AI |
| M | Toggle minimap |
| L | Toggle coordinate labels |
| G | Toggle IVM grid + tunnel network |
| P | Pause |
| R | Reset |
| Shift+drag | Rotate camera |

## Quadray Geometry

All positions use **(a, b, c, d)** Quadray coordinates on 12⁴ = 20,736 IVM cells.

- **Basis vectors**: color-coded **a** (orange), **b** (blue), **c** (green), **d** (pink)
- **S₃ factor**: 1.0607 (Synergetics volume conversion)
- **Volume ratios**: Tetrahedron:Octahedron:Cuboctahedron = 1:4:20
- **Verify Math** button runs 8 geometric identity checks

## Architecture

```
index.html              ← UI + premium dashboard
js/simant_board.js      ← 4D grid, pheromones, ants, simulation
js/simant_ai.js         ← Red Colony AI + Yellow Assist AI
js/simant_combat.js     ← Combat with morale + terrain
js/simant_pheromone_viz.js ← Gradient trail visualization
js/simant_renderer.js   ← IVM grid, minimap, particles, sprites
js/simant_game.js       ← Game controller, speed, win conditions
../4d_generic/*.js      ← Shared Quadray/IVM modules
tests/                  ← 148 tests (138 comprehensive + 10 basic)
```

## Tests

```bash
node tests/test_comprehensive.js  # 138 tests — all pass
node tests/test_simant.js         # 10 tests — all pass
```
