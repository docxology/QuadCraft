# QuadCraft Browser Implementation

A complete 3D voxel game using quadray coordinate system, built for web browsers with both modular and standalone versions.

## Quick Start

### Standalone Version (Recommended)
Open `QuadCraft_Complete_Standalone.html` directly in any modern browser - no server required.

### Modular Version (For Development)
1. Start a local HTTP server: `python3 -m http.server 8080`
2. Open `http://localhost:8080/src/browser/` and navigate to the modular files
3. Note: Modular version requires creating an HTML file that imports the JS modules

## Game Controls

### Navigation
- **QWERTY keys** (q,w,e,r,t,y): Move backward in 6 directions
- **ASDFGH keys** (a,s,d,f,g,h): Move forward in 6 directions

### Camera Controls
- **Arrow Keys**: Pan camera (Left/Right/Up/Down)
- **Mouse**: Left-drag to rotate, right-drag to pan, scroll to zoom
- **UI Sliders**: Manual camera position adjustment

### Shape Placement
- **X**: Place/remove octahedron at current position
- **Z**: Place/remove tetrahedron Z at current position
- **C**: Place/remove tetrahedron C at current position
- **Space**: Place/remove all 3 shapes at current position
- **Shift**: Toggle grid dots visibility

### Save/Load
- **QuickSave 1-5**: Save to browser localStorage (slots 1-5)
- **QuickLoad 1-5**: Load from browser localStorage (slots 1-5)
- **Save File**: Export game state to JSON file
- **Load File**: Import game state from JSON file

## Files Structure

### HTML Files
- **`QuadCraft_Complete_Standalone.html`** - Complete self-contained game (1500+ lines)
  - All functionality embedded in single file
  - Works offline, no external dependencies
  - Recommended for distribution and play

### JavaScript Modules (`js/`)

#### Core System (`js/core/`)
- **`gameState.js`** - Central game state management
  - Handles grid data, shapes, camera state
  - Methods: `addDot()`, `toggleOctahedronAt()`, etc.
  
- **`gameController.js`** - Input handling and game logic
  - Keyboard/mouse event processing
  - Movement and shape placement logic
  
- **`renderer.js`** - 3D rendering engine
  - Triangle sorting and projection
  - Canvas drawing with proper depth ordering
  
- **`camera.js`** - Camera system
  - 3D transformations and view management
  - Mouse and keyboard interaction handling
  
- **`saveLoadController.js`** - Save/load functionality
  - localStorage management (quicksaves)
  - File export/import (JSON format)
  
- **`codeExecutor.js`** - JavaScript code execution
  - Safe code evaluation in game context
  - Procedural generation functions

#### Mathematics (`js/math/`)
- **`quadray.js`** - 4D coordinate system implementation
  - Core `Quadray` class with 4D-to-3D conversion
  - Essential for the entire coordinate system
  
- **`geometry.js`** - Shape generation and geometry
  - Octahedron and tetrahedron creation
  - Direction mappings and navigation

#### Analysis Tools (`js/analysis/`)
- **`logger.js`** - Real-time coordinate logging
  - Continuous position tracking
  - Log export and statistics
  
- **`analyzer.js`** - Coordinate analysis
  - Statistical analysis of movement patterns
  - Shape distribution analysis
  
- **`visualizer.js`** - Additional visualization
  - Heatmaps and coordinate grids
  - Canvas-based analysis tools

#### Utilities (`js/utils/`)
- **`constants.js`** - Configuration and constants
  - Mathematical constants (ROOT2, S3)
  - Game configuration settings
  - Utility functions, logging config, error messages
  - Camera movement settings

### Styles (`styles/`)
- **`main.css`** - Complete styling for modular version
  - Modern UI design with panels
  - Responsive layout and controls

### Main Entry (`js/`)
- **`main.js`** - Application initialization
  - Module coordination and startup
  - Global app instance management

## Architecture

### Coordinate System
The game uses a **quadray coordinate system** - a 4D coordinate system that maps to 3D space:
- 4 coordinates (a,b,c,d) represent points in 3D
- Constraint: a+b+c+d = constant for points in same 3D space
- Enables perfect tetrahedral/octahedral grid alignment
- 12 core navigation directions maintain grid precision

### Rendering Pipeline
1. **Game State** → Quadray coordinates for all objects
2. **Coordinate Conversion** → Quadray to 3D Cartesian
3. **3D Projection** → Apply camera transformations
4. **Triangle Sorting** → Depth-based ordering for proper rendering
5. **Canvas Drawing** → Render triangles with correct visibility

### Data Flow
```
User Input → GameController → GameState → Renderer → Canvas
     ↓
Analysis Tools ← Logger ← GameState
     ↓
Visualizer → Analysis Canvas
```

## Features

### Core Gameplay
- **Infinite 3D grid navigation** using quadray coordinates
- **Perfect shape tiling** with octahedrons and tetrahedrons
- **Precise movement** along tetrahedral grid points
- **3D camera** with rotation, panning, and zoom

### Analysis & Visualization
- **Real-time coordinate logging** with export capabilities
- **Statistical analysis** of movement patterns and shape distribution
- **Trajectory plotting** and coordinate range analysis
- **Heatmap visualization** of visited areas
- **Live coordinate display** showing current position

### Code Execution
- **JavaScript evaluation** in game context
- **Procedural generation** functions for creating patterns
- **Grid manipulation** functions for bulk operations
- **Safe execution environment** with game object access

### Save System
- **5 QuickSave slots** using browser localStorage
- **File-based saves** with JSON export/import
- **Complete state preservation** including camera position
- **Cross-session persistence** for important saves

## Browser Compatibility

- **Chrome/Chromium**: Full support
- **Firefox**: Full support  
- **Safari**: Full support
- **Edge**: Full support

### Requirements
- Modern browser with Canvas 2D support
- JavaScript enabled
- For modular version: HTTP server (due to ES6 modules)

## Development

### Adding Features
1. Modify appropriate module in `js/` directory
2. Update `index.html` if new modules added
3. Test in modular version first
4. Update standalone version in `QuadCraft_Complete_Standalone.html`

### Architecture Guidelines
- **Separation of concerns**: Each module handles specific functionality
- **Central state management**: All game data in `gameState.js`
- **Event-driven updates**: Use flags like `viewChanged`, `gridChanged`
- **Consistent naming**: Follow existing patterns for methods and variables

### Module Dependencies
```
main.js
├── constants.js (utilities)
├── quadray.js (coordinate system)
├── geometry.js (depends on quadray.js)
├── gameState.js (depends on quadray.js)
├── gameController.js (depends on gameState.js)
├── renderer.js (depends on gameState.js)
├── camera.js (independent)
├── saveLoadController.js (depends on gameState.js)
├── codeExecutor.js (depends on gameState.js)
├── logger.js (depends on gameState.js)
├── analyzer.js (depends on gameState.js)
└── visualizer.js (depends on gameState.js)
```

## Mathematical Background

### Quadray Coordinates
Quadrays use 4 coordinates (a,b,c,d) to represent 3D points:
- Based on tetrahedral symmetry
- Natural for crystal lattices and space-filling polyhedra
- Enables precise navigation without floating-point errors
- Maps to Cartesian via linear transformation

### Shape Geometry
- **Octahedrons**: 8 triangular faces, fit together perfectly
- **Tetrahedrons**: 4 triangular faces, two orientations (Z and C)
- **Space filling**: Combination of all 3 shapes tiles 3D space completely
- **Grid alignment**: All shapes align perfectly with quadray grid points

## Troubleshooting

### Common Issues
1. **Blank screen**: Check browser console for errors
2. **Module not found**: Ensure HTTP server is running for modular version
3. **Controls not working**: Check that gameController initialized properly
4. **Save/load fails**: Check browser localStorage permissions

### Performance
- Optimized triangle sorting for smooth rendering
- Efficient quadray-to-cartesian conversion
- Limited logging entries to prevent memory issues
- Canvas clipping for better performance

## License

This implementation is part of the QuadCraft project exploring quadray coordinate systems and 3D voxel manipulation. 