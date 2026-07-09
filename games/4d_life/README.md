# 4D Quadray Life

A standalone implementation of Life using **Quadray coordinates** and the **Isotropic Vector Matrix (IVM)** tetrahedral geometry.

![4D Life](https://img.shields.io/badge/4D-Life-blue?style=for-the-badge)

## Quick Start

### Option 1: Run Script (Recommended)

```bash
./run_life.sh
```
This starts a local server on port 8103 and opens the browser.

### Option 2: Manual Server

```bash
cd games/4d_life
python3 -m http.server 8103
open http://localhost:8103
```

## Game Mechanics

- **4D Geometry**: Board coordinates (a, b, c, d) map to tetrahedral space.
- **Shared library**: Uses the common `4d_generic/` module library (quadray math, camera, rendering, input, HUD). Open `index.html` to play — no build step or install required, but the `../4d_generic/*.js` scripts must stay alongside `games/4d_life/`.
- **Tests**: Unit tests in `tests/` ensure logic correctness.

## Key Controls

- **Click/Tap**: Select/Interact
- **Drag**: Rotate 3D View
- **Scroll**: Zoom

## Architecture

```
games/4d_life/
├── index.html           # Entry point (loads ../4d_generic/*.js, see below)
├── js/
│   ├── life_board.js    # Game State & Logic
│   ├── life_renderer.js # Canvas Visualization
│   └── life_game.js     # Controller
└── tests/
    └── test_life.js     # Node.js Unit Tests

../4d_generic/            # Shared library (12 modules) this game depends on:
                           # quadray.js, camera.js, projection.js, zoom.js,
                           # synergetics.js, game_loop.js, input_controller.js,
                           # grid_utils.js, base_board.js, base_renderer.js,
                           # base_game.js, hud.js, score_manager.js
```

---
*Part of the [QuadCraft](../../) project.*
