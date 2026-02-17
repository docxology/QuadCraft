# 4D Quadray Catan

A standalone implementation of Catan using **Quadray coordinates** and the **Isotropic Vector Matrix (IVM)** tetrahedral geometry.

![4D Catan](https://img.shields.io/badge/4D-Catan-blue?style=for-the-badge)

## Quick Start

### Option 1: Run Script (Recommended)

```bash
./run_catan.sh
```
This starts a local server on port 8108 and opens the browser.

### Option 2: Manual Server

```bash
cd games/4d_catan
python3 -m http.server 8108
open http://localhost:8108
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
games/4d_catan/
├── index.html           # Entry point
├── js/
│   ├── quadray.js       # 4D Coordinate Math
│   ├── catan_board.js  # Game State & Logic
│   ├── catan_renderer.js # Canvas Visualization
│   └── catan_game.js   # Controller
└── tests/
    └── test_catan.js   # Node.js Unit Tests
```

---
*Part of the [QuadCraft](../../) project.*
