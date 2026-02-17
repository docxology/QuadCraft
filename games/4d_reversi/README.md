# 4D Quadray Reversi

A standalone implementation of Reversi using **Quadray coordinates** and the **Isotropic Vector Matrix (IVM)** tetrahedral geometry.

![4D Reversi](https://img.shields.io/badge/4D-Reversi-blue?style=for-the-badge)

## Quick Start

### Option 1: Run Script (Recommended)

```bash
./run_reversi.sh
```
This starts a local server on port 8102 and opens the browser.

### Option 2: Manual Server

```bash
cd games/4d_reversi
python3 -m http.server 8102
open http://localhost:8102
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
games/4d_reversi/
├── index.html           # Entry point
├── js/
│   ├── quadray.js       # 4D Coordinate Math
│   ├── reversi_board.js  # Game State & Logic
│   ├── reversi_renderer.js # Canvas Visualization
│   └── reversi_game.js   # Controller
└── tests/
    └── test_reversi.js   # Node.js Unit Tests
```

---
*Part of the [QuadCraft](../../) project.*
