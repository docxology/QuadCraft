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
- **Standalone**: Zero dependencies. Open `index.html` to play.
- **Tests**: Unit tests in `tests/` ensure logic correctness.

## Key Controls

- **Click/Tap**: Select/Interact
- **Drag**: Rotate 3D View
- **Scroll**: Zoom

## Architecture

```
games/4d_life/
├── index.html           # Entry point
├── js/
│   ├── quadray.js       # 4D Coordinate Math
│   ├── life_board.js  # Game State & Logic
│   ├── life_renderer.js # Canvas Visualization
│   └── life_game.js   # Controller
└── tests/
    └── test_life.js   # Node.js Unit Tests
```

---
*Part of the [QuadCraft](../../) project.*
