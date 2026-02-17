# 4D Quadray Asteroids

A standalone implementation of Asteroids using **Quadray coordinates** and the **Isotropic Vector Matrix (IVM)** tetrahedral geometry.

![4D Asteroids](https://img.shields.io/badge/4D-Asteroids-blue?style=for-the-badge)

## Quick Start

### Option 1: Run Script (Recommended)

```bash
./run_asteroids.sh
```
This starts a local server on port 8104 and opens the browser.

### Option 2: Manual Server

```bash
cd games/4d_asteroids
python3 -m http.server 8104
open http://localhost:8104
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
games/4d_asteroids/
├── index.html           # Entry point
├── js/
│   ├── quadray.js       # 4D Coordinate Math
│   ├── asteroids_board.js  # Game State & Logic
│   ├── asteroids_renderer.js # Canvas Visualization
│   └── asteroids_game.js   # Controller
└── tests/
    └── test_asteroids.js   # Node.js Unit Tests
```

---
*Part of the [QuadCraft](../../) project.*
