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
- **Standalone**: Zero build step, zero server requirement — `index.html` loads its game logic plus the shared `../4d_generic/` Quadray/IVM modules directly via `<script>` tags (no bundler, no npm install).
- **Tests**: Unit tests in `tests/` ensure logic correctness.

## Key Controls

- **Click/Tap**: Select/Interact
- **Drag**: Rotate 3D View
- **Scroll**: Zoom

## Architecture

```
games/4d_minecraft/
├── index.html                # Entry point (loads ../4d_generic/ shared modules, then js/)
├── js/
│   ├── minecraft_board.js    # Game State & Logic
│   ├── minecraft_analysis.js # Synergetics Geometry Analysis & Verification
│   ├── minecraft_renderer.js # Canvas Visualization
│   └── minecraft_game.js     # Controller
└── tests/
    ├── test_minecraft.js     # Node.js Unit Tests
    └── test_analysis.js      # Node.js Unit Tests (Synergetics analysis)
```

4D Coordinate Math (`Quadray`) lives in the shared `../4d_generic/quadray.js` module,
not inside this game's `js/` directory.

---
*Part of the [QuadCraft](../../) project.*
