# 4D Quadray Tower Defense

A tower defense game set in **Quadray coordinate** space on the **Isotropic Vector Matrix (IVM)** tetrahedral lattice. Defend against waves of creeps using synergetics polyhedra towers.

![4D Tower Defense](https://img.shields.io/badge/4D-Tower%20Defense-blue?style=for-the-badge)

## Quick Start

```bash
# Run tests + launch
./run.sh --test

# Or manually
cd games/4d_tower_defense
python3 -m http.server 8111
open http://localhost:8111
```

## Game Mechanics

### Towers (Synergetics Polyhedra)

| Tower | TV | Cost | Ability | Description |
|-------|:--:|:----:|---------|-------------|
| ▲ Tetra | 1 | 15g | Rapid | Fast single-target fire |
| ◆ Octa | 4 | 40g | Splash | Hits all creeps in range |
| ⬡ Cubo | 20 | 100g | Slow | Slows creeps in range by 50% |
| ✦ Rhombic | 6 | 250g | Sniper | Extreme damage, targets highest-HP creep |

Each tower has **3 upgrade levels** that increase damage, range, and fire rate. Towers can be **sold** for 60% of total invested gold.

### Creep Types

| Type | Speed | HP | Gold | Shape | Special |
|------|:-----:|:--:|:----:|-------|---------|
| Normal | 1× | 1× | 1× | ● Circle | — |
| Fast | 2× | 0.5× | 1.2× | ◆ Diamond | — |
| Armored | 0.5× | 2.5× | 1.5× | ■ Square | — |
| Regen | 0.6× | 3× | 2× | ✚ Plus | Heals 5% max HP/sec |
| Swarm | 1.5× | 0.8× | 1.5× | ✿ Star-7 | Splits into 2 Swarmlets on death |
| Swarmlet | 2× | 0.2× | 0.3× | • Dot | Spawned by Swarm |
| Boss | 0.3× | 6× | 5× | ★ Star | Every 5th wave |

### Controls

| Key | Action |
|-----|--------|
| Click | Place tower / Select tower |
| Right-drag / Shift-drag | Rotate 3D view |
| Scroll | Zoom in/out |
| Ctrl-drag / Middle-drag | Pan view |
| `1` / `2` / `3` / `4` | Select tower type |
| `U` | Upgrade selected tower |
| `X` | Sell selected tower |
| `Space` | Toggle speed (1×/2×/3×) |
| `N` | Send next wave early |
| `A` | Toggle auto-wave |
| `Esc` | Deselect tower |

### 4D Geometry

- All positions use Quadray coordinates **(a, b, c, d)** mapped to tetrahedral space
- **Procedurally generated** path follows IVM grid-snapped integer Quadray waypoints
- Tower ranges computed via `Quadray.distance()` in 4D space
- Tetravolumes track total tower coverage
- Volume ratios: T:O:C:R = 1:4:20:6

### Procedural Map Generation

Each game generates a unique path using `Quadray.BASIS` neighbors to create a winding, connected route through the IVM grid. The algorithm biases toward directions that increase the total coordinate sum (moving away from origin), with 30% randomness for variety.

## Architecture

```
games/4d_tower_defense/
├── index.html            # UI layout, styles, creep legend
├── js/
│   ├── td_board.js       # Game state, creeps, towers, waves, procedural paths
│   ├── td_renderer.js    # Canvas 3D projection and effects
│   └── td_game.js        # Input handling, game loop, auto-wave
├── tests/
│   └── test_td.js        # Node.js unit tests (core + extended)
├── run.sh                # Launch script with --test flag
├── README.md
└── AGENTS.md
```

## Tests

```bash
# Run all tests
node tests/test_td.js

# Or via run.sh
./run.sh --test
```

Test suite covers: path connectivity, tower placement/upgrade/sell, all 7 creep types, swarm splitting, regen healing, sniper targeting priority, board reset, creep trail tracking, game-over trigger, wave countdown, speed consistency, volume ratios, and log management.

---
*Part of the [QuadCraft](../../) project.*
