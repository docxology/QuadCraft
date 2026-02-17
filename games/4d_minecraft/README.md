# 4D Quadray Minecraft

A standalone implementation of Minecraft using **Quadray coordinates** and the **Isotropic Vector Matrix (IVM)** tetrahedral geometry.

![4D Minecraft](https://img.shields.io/badge/4D-Minecraft-blue?style=for-the-badge)

## Quick Start

### Option 1: Run Script (Recommended)

```bash
./run_minecraft.sh
```
This starts a local server on port 8107 and opens the browser.

### Option 2: Manual Server

```bash
cd games/4d_minecraft
python3 -m http.server 8107
open http://localhost:8107
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
games/4d_minecraft/
├── index.html           # Entry point
├── js/
│   ├── quadray.js       # 4D Coordinate Math
│   ├── minecraft_board.js  # Game State & Logic
│   ├── minecraft_renderer.js # Canvas Visualization
│   └── minecraft_game.js   # Controller
└── tests/
    └── test_minecraft.js   # Node.js Unit Tests
```

---
*Part of the [QuadCraft](../../) project.*
