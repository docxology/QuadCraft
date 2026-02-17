# 4D Quadray Tower Defense

A tower defense game set in **Quadray coordinate** space on the **Isotropic Vector Matrix (IVM)** tetrahedral lattice. Defend against waves of creeps using synergetics polyhedra towers.

![4D Tower Defense](https://img.shields.io/badge/4D-Tower%20Defense-blue?style=for-the-badge)

## Quick Start

```bash
# From games/ directory
python3 run_games.py tower_defense

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

Each tower has **3 upgrade levels** that increase damage, range, and fire rate. Towers can be **sold** for 60% of total invested gold.

### Creep Types

| Type | Speed | HP | Gold | Shape |
|------|:-----:|:--:|:----:|-------|
| Normal | 1× | 1× | 1× | ● Circle |
| Fast | 2× | 0.5× | 1.2× | ◆ Diamond |
| Armored | 0.5× | 2.5× | 1.5× | ■ Square |
| Boss | 0.3× | 6× | 5× | ★ Star (every 5th wave) |

### Controls

| Key | Action |
|-----|--------|
| Click | Place tower / Select tower |
| Right-drag / Shift-drag | Rotate 3D view |
| Scroll | Zoom in/out |
| Ctrl-drag / Middle-drag | Pan view |
| `1` / `2` / `3` | Select tower type |
| `U` | Upgrade selected tower |
| `X` | Sell selected tower |
| `Space` | Toggle speed (1×/2×/3×) |
| `N` | Send next wave early |
| `Esc` | Deselect tower |

### 4D Geometry

- All positions use Quadray coordinates **(a, b, c, d)** mapped to tetrahedral space
- Path follows IVM grid-snapped integer Quadray waypoints
- Tower ranges computed via `Quadray.distance()` in 4D space
- Tetravolumes track total tower coverage

## Architecture

```
games/4d_tower_defense/
├── index.html            # UI layout and styles
├── js/
│   ├── quadray.js        # 4D Coordinate Math (shared library)
│   ├── td_board.js       # Game state, creeps, towers, waves
│   ├── td_renderer.js    # Canvas 3D projection and effects
│   └── td_game.js        # Input handling and game loop
├── tests/
│   └── test_td.js        # Node.js unit tests (35+ assertions)
├── README.md
└── AGENTS.md
```

## Tests

```bash
node tests/test_td.js
# Expected: 35+ ✅ PASSED assertions
```

---
*Part of the [QuadCraft](../../) project.*
