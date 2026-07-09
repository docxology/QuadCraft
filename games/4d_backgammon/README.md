# 4D Quadray Backgammon

A standalone implementation of Backgammon using **Quadray coordinates** and the **Isotropic Vector Matrix (IVM)** tetrahedral geometry.

![4D Backgammon](https://img.shields.io/badge/4D-Backgammon-blue?style=for-the-badge)

## Quick Start

### Option 1: Run Script (Recommended)

```bash
./run_backgammon.sh
```
This starts a local server on port 8106 and opens the browser.

### Option 2: Manual Server

```bash
cd games/4d_backgammon
python3 -m http.server 8106
open http://localhost:8106
```

## Game Mechanics

- **4D Geometry**: Board coordinates (a, b, c, d) map to tetrahedral space.
- **No install step**: No build tooling or package manager needed. Open `index.html` (via a local server) to play — it loads the shared `../4d_generic/` modules (Quadray, camera, grid utils, etc.) plus this game's own 3 scripts; see Architecture below.
- **Tests**: Unit tests in `tests/` ensure logic correctness.

## Key Controls

- **Click/Tap**: Select/Interact
- **Drag**: Rotate 3D View
- **Scroll**: Zoom

## Architecture

```
games/4d_backgammon/
├── index.html           # Entry point (loads 14 shared ../4d_generic/ scripts, then the 3 below)
├── js/
│   ├── backgammon_board.js  # Game State & Logic (uses shared Quadray/GridUtils/etc.)
│   ├── backgammon_renderer.js # Canvas Visualization
│   └── backgammon_game.js   # Controller
└── tests/
    └── test_backgammon.js   # Node.js Unit Tests

../4d_generic/            # Shared modules used by this game (and 29 others):
├── quadray.js            # 4D Coordinate Math
├── camera.js, projection.js, zoom.js, synergetics.js, game_loop.js,
│   input_controller.js, grid_utils.js, base_board.js, turn_manager.js,
│   base_renderer.js, base_game.js, hud.js, score_manager.js
```

---
*Part of the [QuadCraft](../../) project.*
