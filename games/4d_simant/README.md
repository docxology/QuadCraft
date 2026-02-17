# 4D Quadray SimAnt

A standalone implementation of SimAnt using **Quadray coordinates** and the **Isotropic Vector Matrix (IVM)** tetrahedral geometry.

![4D SimAnt](https://img.shields.io/badge/4D-SimAnt-blue?style=for-the-badge)

## Quick Start

### Option 1: Run Script (Recommended)

```bash
./run_simant.sh
```
This starts a local server on port 8105 and opens the browser.

### Option 2: Manual Server

```bash
cd games/4d_simant
python3 -m http.server 8105
open http://localhost:8105
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
games/4d_simant/
├── index.html           # Entry point
├── js/
│   ├── quadray.js       # 4D Coordinate Math
│   ├── simant_board.js  # Game State & Logic
│   ├── simant_renderer.js # Canvas Visualization
│   └── simant_game.js   # Controller
└── tests/
    └── test_simant.js   # Node.js Unit Tests
```

---
*Part of the [QuadCraft](../../) project.*
