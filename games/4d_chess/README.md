# 4D Quadray Chess

A stunning 4D chess game using **Quadray coordinates** and the **Isotropic Vector Matrix (IVM)** tetrahedral geometry.

![4D Quadray Chess](https://img.shields.io/badge/4D-Quadray%20Chess-9966ff?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)

## Overview

4D Quadray Chess reimagines chess in four-dimensional tetrahedral space. Instead of the traditional 2D grid, pieces move along four basis vectors (a, b, c, d) emanating from the center of a regular tetrahedron to its vertices.

### Key Features

- **4D Quadray Coordinate System** - Positions defined by 4 non-negative coordinates
- **IVM Tetrahedral Grid** - Based on Buckminster Fuller's Isotropic Vector Matrix
- **Real-Time Math Display** - Shows Quadray coordinates, Cartesian conversion, and distance calculations
- **Random Move & Auto-Play** - Quick game exploration with 🎲 Random and ▶ Auto buttons
- **Save/Load Games** - Export/import game state as JSON files
- **Geometric Analysis** - Position metrics: material, mobility, center control, piece spread
- **Stunning Visuals** - Dark mode with glow effects and smooth animations
- **Full Chess Rules** - Check detection, turn enforcement, piece captures

## Quick Start

### Option 1: Direct Browser (Simplest)

```bash
# macOS
open 4d_chess/index.html

# Linux
xdg-open 4d_chess/index.html

# Windows
start 4d_chess/index.html
```

### Option 2: Local HTTP Server (Recommended)

```bash
# Navigate to the 4d_chess directory
cd 4d_chess

# Python 3
python3 -m http.server 8080

# Then open http://localhost:8080 in your browser
```

### Option 3: VS Code Live Server

1. Install the "Live Server" extension
2. Right-click `index.html` → "Open with Live Server"

### Run Tests

```bash
# Node.js CLI
cd 4d_chess/tests && node test_all.js

# Or open in browser
open 4d_chess/tests/test.html
```

## How to Play

1. **Click** a piece to select it (yellow ring)
2. **Click** a green circle to move to that position
3. **Drag** to rotate the 3D view
4. **Space/M** - Make a random move
5. **A** - Toggle auto-play mode
6. **S** - Save game / **L** - Load game
7. **R** - Reset the game

## Quadray Coordinates

Traditional chess uses (x, y) coordinates. 4D Quadray Chess uses (a, b, c, d) coordinates where:

- All coordinates are non-negative integers
- The four axes point to the vertices of a tetrahedron
- Movement along any axis corresponds to sliding along that tetrahedral direction

### Conversion to Cartesian

```
x = (a - b - c + d) / √2
y = (a - b + c - d) / √2
z = (a + b - c - d) / √2
```

### Distance Formula

```
D = √((a² + b² + c² + d²) / 2)
```

## Piece Movement

| Piece | Symbol | Movement in Quadray Space |
|-------|--------|---------------------------|
| King | ♔/♚ | 1 step in any basis direction (a, b, c, or d) |
| Queen | ♕/♛ | Combines Rook + Bishop movement |
| Rook | ♖/♜ | Slides along a single axis |
| Bishop | ♗/♝ | Moves diagonally (2 axes change simultaneously) |
| Knight | ♘/♞ | L-shape: +2 in one axis, +1 in another |
| Pawn | ♙/♟ | Forward along primary axis, diagonal capture |

## Project Structure

```
4d_chess/
├── index.html          # Main game page
├── README.md           # This file
├── AGENTS.md           # Agent instructions
├── CONTRIBUTING.md     # Contributor guide
├── js/
│   ├── quadray.js      # Quadray coordinate class (210 lines)
│   ├── pieces.js       # Chess piece definitions (280 lines)
│   ├── board.js        # 4D game board (272 lines)
│   ├── renderer.js     # 3D visualization (427 lines)
│   ├── game.js         # Game controller (556 lines)
│   ├── storage.js      # Save/load functionality (177 lines)
│   └── analysis.js     # Geometric analysis (386 lines)
├── docs/
│   ├── README.md       # Documentation index
│   ├── api-reference.md   # Class/method documentation
│   ├── architecture.md    # Code structure
│   ├── game-rules.md      # How to play
│   ├── piece-movement.md  # Detailed piece mechanics
│   ├── notation.md        # Game notation system
│   ├── chess-theory.md    # Strategy guide (openings, tactics, endgames)
│   ├── chess-history.md   # From ancient chess to 4D
│   └── quadray-math.md    # Mathematical foundations
└── tests/
    ├── test.html       # Visual test runner
    ├── test_all.js     # Unit test suite (91 tests) — the runnable entry point
    ├── lib_runner.js   # Shared test runner class (helper, not run directly)
    ├── lib_quadray.js  # Quadray coordinate test helpers (helper, not run directly)
    └── lib_geometry.js # IVM geometry verification helpers (helper, not run directly)
```

## Math Display Features

The game includes a comprehensive math display showing:

### Canvas Math Panel

- Color-coded Quadray coordinates (a=red, b=green, c=blue, d=yellow)
- Real-time Cartesian conversion
- Distance from origin
- Valid moves count

### Sidebar Panels

- **Move History** - Coordinate transitions with distance (Δ)
- **Math Formulas** - Quadray↔Cartesian conversion reference

### Console Logging

```
📐 QUADRAY MOVE
From: (a=2.00, b=0.00, c=1.00, d=0.00)
  To: (a=4.00, b=0.00, c=1.00, d=0.00)
Cartesian: (0.71, 2.12, 0.71) → (2.12, 2.12, 2.12)
Distance traveled: 1.414 units
```

## Testing

Run the visual test suite:

```bash
open 4d_chess/tests/test.html
```

### Test Coverage

- **Quadray Class** - Coordinates, arithmetic, conversion, distance
- **Piece Classes** - Symbols, movement vectors
- **Board Class** - Setup, positions, check detection
- **Mathematical Accuracy** - Tetrahedral angles, triangle inequality

## Mathematical Background

### Isotropic Vector Matrix (IVM)

The IVM is a space-filling arrangement of tetrahedra and octahedra discovered by Buckminster Fuller. It provides an alternative to the Cartesian coordinate system based on 60° angles rather than 90°.

### Quadray Coordinate System

Developed by Kirby Urner, Quadray coordinates use four non-negative basis vectors pointing to the vertices of a regular tetrahedron. This provides several advantages:

- All coordinates are non-negative (no negative numbers needed)
- Natural representation of tetrahedral geometry
- Direct mapping to IVM spatial structures

### Tetrahedral Angle

The angle between any two Quadray basis vectors is approximately **109.47°** (the tetrahedral angle), calculated as:

```
θ = arccos(-1/3) ≈ 109.4712°
```

## Related Projects

- **QuadCraft** - Parent project exploring Quadray applications
- [Kirby Urner's Quadray Papers](http://www.grunch.net/synergetics/quadrays.html)
- [Synergetics](http://www.rwgrayprojects.com/synergetics/synergetics.html) by R. Buckminster Fuller

## License

MIT License - See LICENSE file for details.

---

*Part of the [QuadCraft](../../) project - Exploring 4D tetrahedral geometry through interactive applications.*
