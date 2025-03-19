# QuadCraft

A tetrahedral-based voxel game using quadray coordinates, inspired by Minecraft.

## Overview

QuadCraft is an experimental voxel game that uses tetrahedral elements (instead of cubes) and quadray coordinates. This unique approach allows for more natural representation of slopes, curves, and complex structures that are difficult to achieve with traditional cubic voxels.

### Key Features

- **Tetrahedral Voxels**: Blocks are tetrahedra instead of cubes, allowing for more complex and natural shapes
- **Quadray Coordinate System**: Based on tetrahedral geometry rather than cubic geometry
- **Procedural Terrain**: Generated using noise functions adapted for tetrahedral space
- **Interactive Building**: Place and remove tetrahedral blocks

## Technical Description

QuadCraft demonstrates several advanced technical concepts:

1. **Quadray Coordinates**: A four-value coordinate system based on tetrahedral geometry
2. **Tetrahedral Mesh Generation**: Using modified marching tetrahedrons algorithm
3. **Chunk Management**: Tetrahedral chunks for efficient memory utilization
4. **Ray Casting**: For block selection and placement

## Building and Running

### Prerequisites

You'll need the following libraries installed:

- OpenGL
- GLEW
- GLFW3
- CMake (3.10 or higher)
- C++17 compatible compiler

### Build Instructions

#### Linux

```bash
# Install dependencies (Ubuntu/Debian)
sudo apt-get install libglew-dev libglfw3-dev cmake g++

# Clone the repository
git clone https://github.com/yourusername/QuadCraft.git
cd QuadCraft

# Create build directory
mkdir build
cd build

# Build using CMake
cmake ..
make

# Run the game
./bin/QuadCraft
```

#### Windows (with MSVC)

```bash
# Clone the repository
git clone https://github.com/yourusername/QuadCraft.git
cd QuadCraft

# Create build directory
mkdir build
cd build

# Build using CMake
cmake ..
cmake --build . --config Release

# Run the game
.\bin\Release\QuadCraft.exe
```

## Controls

- **W, A, S, D**: Move
- **Space**: Move up
- **Left Shift**: Move down
- **Mouse**: Look around
- **Left Mouse Button**: Remove block
- **Right Mouse Button**: Place block
- **Escape**: Exit

## Architecture

The project is structured as follows:

```
QuadCraft/
├── src/
│   ├── core/                    # Core engine components
│   │   ├── coordinate/          # Coordinate systems
│   │   ├── world/               # World generation
│   │   ├── physics/             # Physics engine
│   │   └── entity/              # Entity management
│   ├── render/                  # Rendering pipeline
│   │   ├── mesh/                # Mesh generation
│   │   ├── shader/              # Shader programs
│   │   └── texture/             # Texture management
│   ├── ui/                      # User interface
│   └── game/                    # Game-specific logic
├── assets/                      # Game assets
└── docs/                        # Documentation
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Based on research from "Mutable Game Environments Built on a Tetrahedral Mesh"
- Inspired by Minecraft and other voxel-based games
- Quadray coordinate system based on work by R. Buckminster Fuller and Kirby Urner 