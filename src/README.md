# QuadCraft Source Code

This directory contains all source code for QuadCraft, organized into three main implementation approaches.

## Directory Structure

```text
src/
├── core/           # C++ core engine (coordinates, world, entities)
├── game/           # C++ game logic (input, game loop)
├── render/         # C++ rendering system (mesh, shaders)
├── browser/        # Browser-based game application (standalone HTML)
├── js/             # JavaScript experiments and prototypes
├── server/         # Server backend (Tomcat/Java)
└── main.cpp        # Native application entry point
```

## Implementation Approaches

### 1. Native C++ Engine (`core/`, `game/`, `render/`)

The original implementation using OpenGL for rendering:

- **core/**: Coordinate systems (Quadray, Vector3), world management, chunk system
- **game/**: Game loop, input handling, camera controls
- **render/**: Mesh generation, shader programs

**Build Requirements:**

- CMake 3.10+
- C++17 compiler
- OpenGL, GLEW, GLFW3

```bash
./build.sh
```

### 2. Browser-Based Game (`browser/`)

Standalone HTML/JavaScript implementation:

- `index.html` - Main game application (QuadrayGrid4/5)
- `lib/` - JavaScript utilities (Var.js)
- `saves/` - JSON save files for game states
- `pic/` - Development screenshots

**To Run:** Open `index.html` directly in a modern browser.

### 3. JavaScript Experiments (`js/`)

Modular JavaScript prototypes and experiments:

- `experiments/` - Various HTML/JS experiments
- `experiments/browser/` - Complete modular browser version with separated concerns

**Features:**

- ES6 modules
- Time series analysis
- Code execution environment

### 4. Server Backend (`server/`)

Tomcat-based server for multiplayer synchronization:

- `tomcat/webapps/QuadCraft/` - JSP and Java backend
- Enables save/load synchronization between browser instances

## Key Files

| File | Purpose |
|------|---------|
| `main.cpp` | Native C++ application entry point |
| `browser/index.html` | Standalone browser game |
| `js/experiments/browser/QuadCraft_Complete_Standalone.html` | Self-contained browser version |

## Cross-Implementation Concepts

All implementations share:

1. **Quadray Coordinate System** - 4D coordinates for tetrahedral space
2. **Tetrahedral Voxels** - Octahedrons + 2 tetrahedron types
3. **12 Navigation Directions** - Precise grid movement
4. **JSON Save Format** - Interoperable game state storage

## Development Notes

- Browser versions are most actively developed
- Native C++ engine provides foundation but browser has more features
- Server enables experimental multiplayer through shared saves
