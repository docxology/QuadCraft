# 4D Quadray Mahjong

A standalone implementation of Mahjong using **Quadray coordinates** and the **Isotropic Vector Matrix (IVM)** tetrahedral geometry.

![4D Mahjong](https://img.shields.io/badge/4D-Mahjong-blue?style=for-the-badge)

## Quick Start

### Option 1: Run Script (Recommended)

```bash
./run_mahjong.sh
```
This starts a local server on port 8111 and opens the browser.

### Option 2: Manual Server

```bash
cd games/4d_mahjong
python3 -m http.server 8111
open http://localhost:8111
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
games/4d_mahjong/
├── index.html           # Entry point
├── js/
│   ├── quadray.js       # 4D Coordinate Math
│   ├── mahjong_board.js  # Game State & Logic
│   ├── mahjong_renderer.js # Canvas Visualization
│   └── mahjong_game.js   # Controller
└── tests/
    └── test_mahjong.js   # Node.js Unit Tests
```

---
*Part of the [QuadCraft](../../) project.*
