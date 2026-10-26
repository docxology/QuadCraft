# QuadCraft Development Setup Guide

This guide will help you set up a development environment for the QuadCraft project, covering everything from prerequisites to building and running the game.

## Development Environment Overview

The QuadCraft engine is written in C++ and uses modern graphics APIs, making it compatible with multiple platforms while leveraging the computational efficiency needed for tetrahedral world representation.

```mermaid
graph TD
    subgraph "Development Stack"
        Languages["Languages"]
        BuildSystem["Build System"]
        Dependencies["Dependencies"]
        IDE["IDE/Editor Support"]
    end
    
    Languages --> CPP["C++17"]
    Languages --> GLSL["GLSL Shaders"]
    
    BuildSystem --> CMake["CMake"]
    BuildSystem --> Ninja["Ninja (Optional)"]
    
    Dependencies --> Graphics["Graphics Libraries"]
    Dependencies --> Math["Math Libraries"]
    Dependencies --> System["System Libraries"]
    
    Graphics --> OpenGL["OpenGL"]
    Graphics --> GLEW["GLEW"]
    Graphics --> GLFW["GLFW"]
    
    Math --> CustomMath["QuadCraft Math"]
    
    System --> STL["STL"]
    System --> FileSystem["Filesystem"]
    
    IDE --> VSCode["Visual Studio Code"]
    IDE --> VisualStudio["Visual Studio"]
    IDE --> CLion["CLion"]
```

## Prerequisites

### Required Software

1. **C++ Compiler**
   - Windows: Visual Studio 2019 or newer with C++ workload
   - Linux: GCC 7.3.0+ or Clang 6.0+
   - macOS: Xcode Command Line Tools (Clang)

2. **CMake (3.16+)**
   - [Download from cmake.org](https://cmake.org/download/)
   - Or install via package manager:
     - Windows: `winget install Kitware.CMake`
     - Linux: `sudo apt install cmake` (Ubuntu/Debian)
     - macOS: `brew install cmake`

3. **Git**
   - [Download from git-scm.com](https://git-scm.com/downloads)
   - Or install via package manager

### Optional Software

1. **Ninja Build System** (faster builds)
   - Windows: Install through Visual Studio Installer
   - Linux: `sudo apt install ninja-build`
   - macOS: `brew install ninja`

2. **IDE/Editor**
   - Visual Studio Code with C++ extension
   - Visual Studio 2019/2022
   - CLion
   - Any editor with C++ support

## Getting the Source Code

Clone the QuadCraft repository:

```bash
git clone https://github.com/docxology/QuadCraft.git
cd QuadCraft
```

QuadCraft has no git submodules and vendors no libraries: the native engine links system
OpenGL, GLEW and GLFW3 (see [Prerequisites](#prerequisites)).

## Project Structure

The repository is organized into the following main directories:

```mermaid
graph TD
    Root["Root (/)"] --> Src["src/"]
    Root --> Games["games/"]
    Root --> Docs["docs/"]
    Root --> Tests["tests/"]
    Root --> Build["build/"]

    Src --> Core["core/"]
    Src --> Game["game/"]
    Src --> Render["render/"]
    Src --> Browser["browser/ + js/ (experiments)"]
    Src --> Server["server/ (Tomcat/JSP)"]

    Games --> GameDirs["4d_<game>/ (30 standalone browser games)"]
    Games --> Launcher["run_games.py + src/ (Python launcher)"]
```

- **src/**: Native engine source (`core/`, `game/`, `render/`), browser experiments and the JSP server components
- **games/**: 30 standalone browser games plus the Python launcher (`run_games.py`, `src/`)
- **docs/**: Documentation
- **tests/**: CTest suites for the native engine (`quadray_test.cpp`, `world_chunk_test.cpp`)
- **build/**: CMake build tree, created by `./build.sh` (not tracked; see `.gitignore`)

## Building QuadCraft

### Configuring with CMake

Create a build directory and configure the project:

```bash
# From the root of the repository
mkdir -p build
cd build

# For a basic Debug build
cmake ..

# For Release build
cmake .. -DCMAKE_BUILD_TYPE=Release

# For build with specific compiler (example with Clang)
cmake .. -DCMAKE_CXX_COMPILER=clang++

# Using Ninja (faster builds)
cmake .. -G Ninja
```

### Building the Project

Once configured, build the project:

```bash
# From the build directory
cmake --build . --config Debug  # or Release
```

Alternatively, if you configured with Ninja:

```bash
ninja
```

### Platform-Specific Instructions

#### Windows

For Windows, you can use Visual Studio's CMake integration:

1. Open the QuadCraft folder in Visual Studio
2. Select the CMakeLists.txt file
3. Visual Studio will automatically configure the project
4. Select your preferred configuration (Debug/Release)
5. Build with F7 or the Build menu

#### Linux

Make sure you have the required development packages:

```bash
# Ubuntu/Debian
sudo apt install build-essential libgl1-mesa-dev libx11-dev libxrandr-dev libxinerama-dev libxcursor-dev libxi-dev

# Fedora
sudo dnf install make gcc-c++ mesa-libGL-devel libX11-devel libXrandr-devel libXinerama-devel libXcursor-devel libXi-devel
```

#### macOS

Make sure you have Xcode Command Line Tools installed:

```bash
xcode-select --install
```

### Handling Dependencies

Dependencies are resolved from the system by CMake (`find_package(OpenGL)`, `find_package(GLEW)`, `find_package(glfw3)`) — nothing is vendored or downloaded at configure time. Install the development packages:

```bash
# Ubuntu/Debian example
sudo apt install libglfw3-dev libglm-dev
```

## Running QuadCraft

After building, the executable is written to `build/bin/QuadCraft` (the CMake target sets
`RUNTIME_OUTPUT_DIRECTORY`).

```bash
# From the repository root
./build/bin/QuadCraft
```

For Windows with Visual Studio, you can run directly from the IDE with F5 or the Debug menu.

### Running Browser Games

The 30 standalone browser games require no build step:

```bash
# Open any game directly
open games/4d_chess/index.html

# Or use the shell wrapper (same thing, resolves a Python 3.10+ interpreter)
./games/run.sh chess        # Opens on port 8100

# Or use the Python launcher
python3 games/run_games.py --game chess    # Single game
python3 games/run_games.py --all           # All 30 games
python3 games/run_games.py --test          # Run all unit tests
```

See [games/README.md](../../games/README.md) for full launch options and port assignments.

## Development Workflow

### Code Style

QuadCraft follows a consistent code style:

- Use 4 spaces for indentation (no tabs)
- Class names use PascalCase
- Methods and functions use camelCase
- Variables use camelCase
- Constants and macros use UPPER_SNAKE_CASE
- Braces on new lines

Example:

```cpp
class TetrahedralBlock
{
public:
    TetrahedralBlock(const Quadray& position);
    void updateState(float deltaTime);
    
private:
    Quadray position;
    static const int MAX_VERTICES = 4;
};
```

### Making Changes

1. Create a feature branch for your changes:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes

3. Run tests to ensure everything works:

   ```bash
   cd build
   ctest
   ```

4. Commit your changes with descriptive messages:

   ```bash
   git commit -m "Add feature: description of your changes"
   ```

5. Push your branch and create a pull request

### Debug Tools

QuadCraft's runtime toggles are defined in `src/game/Input.h`:

1. **Wireframe Mode** - Press F1 to toggle
2. **Quadray Coordinate Overlay** - Press F2 to toggle
3. **Tetrahedral Distance Reporting** - Press F4 to toggle (logged to the console)

## Building Documentation

The documentation uses Markdown files with Mermaid diagrams. To view the documentation with proper rendering:

1. **Using VS Code**: Install the "Markdown Preview Enhanced" extension
2. **Using a browser**: Use a Markdown viewer that supports Mermaid, or convert to HTML:

   ```bash
   # Install a Markdown to HTML converter
   npm install -g marked
   
   # Convert a file
   marked -i docs/README.md -o docs/readme.html
   ```

## Troubleshooting

### Common Build Issues

1. **CMake can't find dependencies**
   - Install the development packages for OpenGL, GLEW and GLFW3 (Ubuntu/Debian: `sudo apt install libglew-dev libglfw3-dev`)
   - Check that `find_package(GLEW)` and `find_package(glfw3)` succeed in the CMake output

2. **Compilation errors**
   - Ensure you have a compatible C++ compiler
   - Check that you're using the right build configuration

3. **Linker errors**
   - Verify that all dependencies are properly installed
   - Make sure you're using the correct CMake configuration

### Getting Help

If you encounter issues not covered here:

1. Check the issues on the GitHub repository
2. Join the Discord server for real-time help
3. Post a question in the discussions section of the repository

## Advanced Configuration

### Build Options

QuadCraft's CMake configuration defines no custom options; the standard CMake selectors apply
and the CTest suites are always built.

```bash
# Release build
cmake -S . -B build -DCMAKE_BUILD_TYPE=Release

# Debug build
cmake -S . -B build -DCMAKE_BUILD_TYPE=Debug

# Configure with a non-default compiler
cmake -S . -B build -DCMAKE_CXX_COMPILER=clang++
```

### IDE-Specific Setup

#### Visual Studio Code

Recommended extensions:

- C/C++ (ms-vscode.cpptools)
- CMake Tools (ms-vscode.cmake-tools)
- CMake (twxs.cmake)
- Markdown Preview Enhanced

Settings (`.vscode/settings.json`):

```json
{
    "C_Cpp.default.configurationProvider": "ms-vscode.cmake-tools",
    "editor.formatOnSave": true,
    "editor.rulers": [120],
    "files.associations": {
        "*.h": "cpp"
    }
}
```

#### CLion

CLion has built-in support for CMake projects. Simply open the repository folder and CLion will detect the CMake configuration automatically.

## Performance Optimization

When developing for QuadCraft, keep these performance considerations in mind:

1. **Tetrahedral Math Operations**: Use the provided QuadCraft math libraries for tetrahedral operations, as they're optimized for performance.

2. **Chunk Management**: Carefully manage chunk loading and unloading to prevent memory issues.

3. **Rendering Optimization**: Use frustum culling and level of detail techniques for rendering large tetrahedral worlds.

4. **Profiling**: Use a platform profiler (Xcode Instruments, `perf`, `valgrind --tool=callgrind`) or a `-DCMAKE_BUILD_TYPE=RelWithDebInfo` build to identify bottlenecks.

## Next Steps

Now that your development environment is set up, here are some suggestions for getting started:

1. Explore the [Technical Architecture](architecture.md) to understand the system design
2. Learn about the [Quadray Coordinate System](../mathematics/quadray_coordinates.md)
3. Launch the browser portfolio (`python3 games/run_games.py --list`) or build and run the native engine (`./build.sh`)
4. Check the issue tracker for beginner-friendly issues to work on

## Contributing

We welcome contributions to QuadCraft! Please see the [Contributing Guide](../../games/doc/contributing.md) for guidelines on how to contribute.

## License

QuadCraft is licensed under the Apache 2.0 License. See the [LICENSE](../../LICENSE) file for details.
