# 4D Pac-Man

## Overview

A 4D implementation of the classic arcade game. Navigate a 5x5x5x5 Integer Vector Matrix (IVM) grid, eating pellets while avoiding ghosts.

### 4D Mechanics

- **Grid**: The game world is a 4-dimensional hypergrid.
- **Movement**: You can move in 8 directions (±A, ±B, ±C, ±D).
- **Projection**: The 4D world is projected to 2D using Quadray coordinates. The size/scale of entities indicates their 4D depth relative to the camera.

## Architecture

### `js/pacman_board.js` (Model)

- Manages the game state: Walls, Pellets, Power Pellets, Pacman, Ghosts.
- **`PacManBoard` Class**:
  - `_generateMaze()`: Creates a deterministic 4D maze with walls and pellets.
  - `step()`: Handles one tick of game logic (movement, collision, scoring).
  - `getEntities()`: Returns a list of all objects for rendering.

### `js/pacman_renderer.js` (View)

- Handles Canvas 2D rendering.
- **`PacManRenderer` Class**:
  - `render()`: Clears canvas, projects 4D coordinates to screen space, and draws sprites with depth sorting.
  - Features neon glow effects, pulsing power pellets, and animated characters.

### `js/pacman_game.js` (Controller)

- Bridges input and game loop.
- **`PacManGame` Class**:
  - Uses `InputController` to map generic keys (WASD, Arrows) to 4D spatial moves.
  - Uses `GameLoop` for fixed-timestep updates (separate from framerate).

## Controls

- **Movement**:
  - **Left/Right**: ±B Axis
  - **Up/Down**: ±A Axis (Vertical)
  - **Q/E**: ±C Axis (Hyper-depth 1)
  - **Z/X**: ±D Axis (Hyper-depth 2)
- **Game**:
  - **P**: Pause
  - **R**: Reset
