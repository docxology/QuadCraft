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
- **Standalone**: Zero dependencies. Open `index.html` to play.
- **Tests**: Unit tests in `tests/` ensure logic correctness.

## Key Controls

- **Click/Tap**: Select/Interact
- **Drag**: Rotate 3D View
- **Scroll**: Zoom

## Architecture

```
games/4d_backgammon/
├── index.html           # Entry point
├── js/
│   ├── quadray.js       # 4D Coordinate Math
│   ├── backgammon_board.js  # Game State & Logic
│   ├── backgammon_renderer.js # Canvas Visualization
│   └── backgammon_game.js   # Controller
└── tests/
    └── test_backgammon.js   # Node.js Unit Tests
```

---
*Part of the [QuadCraft](../../) project.*
