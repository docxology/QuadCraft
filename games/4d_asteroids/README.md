# 4D Quadray Asteroids

A standalone implementation of Asteroids using **Quadray coordinates** and the **Isotropic Vector Matrix (IVM)** tetrahedral geometry.

![4D Asteroids](https://img.shields.io/badge/4D-Asteroids-blue?style=for-the-badge)

## Quick Start

### Option 1: Run Script (Recommended)

```bash
# From the repository root:
./games/run.sh asteroids
```
This starts a local server on port 8104 and opens the browser.

### Option 2: Manual Server

```bash
cd games
python3 -m http.server 8104
open http://localhost:8104/4d_asteroids/
```

## Game Mechanics

- **Geometry**: Independent continuous raw labels wrap in `[0,size)^4`; collisions
  use physical Cartesian sphere radii in the shared native embedding. Periodic
  images form a BCC lattice, so componentwise raw minimum deltas are not valid
  physical nearest images. Swept free-flight collisions resolve earliest impact,
  including seams and grazing passes; split fragments continue from the impact.
- **Clock**: `GameLoop` supplies fixed seconds (16 ms per tick here), with the
  shared 250 ms catch-up limit. Held thrust is 18.75 raw velocity units/s²,
  preserving the original 0.3 impulse per tick and raw speed cap of 2.
  UFO firing, projectile lifetime, shields and 1.5-second respawn use simulation
  time and retain elapsed remainders. Pause freezes gameplay commands and time;
  reset discards pending respawns and starts the seeded world again.
- **Reproducibility**: `new AsteroidsBoard(size, {seed})` accepts a uint32 seed.
  Omitted seeds are sampled once. All simulation draws use the board's independent
  `GridUtils.createSeededRng` stream; cosmetic renderer draws cannot change play.
  Repeating a reset with the same seed and tick inputs repeats the simulation.
- **Camera**: The full continuous hypercube's 16 corners are fitted with padding,
  keeping legal entity positions in front of the camera at every rotation.
- **Standalone**: Zero dependencies. Open `index.html` to play.
- **Regressions**: `node tests/test_asteroids.js`; `tests/test.html` additionally
  exercises the actual Canvas renderer and controller in a browser.

## Key Controls

- **W/S, A/D, Q/E**: Held thrust on the labeled axes
- **Space**: Fire; **Shift**: Hyperspace; **V**: Shield
- **P**: Pause; **R**: Reset; **Shift+drag**: Rotate; **Scroll**: Zoom

## Architecture

```
games/4d_asteroids/
├── index.html           # Entry point
├── js/
│   ├── asteroids_board.js  # Game State & Logic
│   ├── asteroids_renderer.js # Canvas Visualization
│   └── asteroids_game.js   # Controller
└── tests/
    └── test_asteroids.js   # Node.js Unit Tests
```

---
*Part of the [QuadCraft](../../) project.*
