# JavaScript Modules

This directory contains the modular JavaScript implementation of QuadCraft.

## Directory Structure

```
js/
├── main.js           # Application entry point
├── core/             # Game engine modules
├── math/             # Mathematical utilities
├── analysis/         # Analysis and visualization
└── utils/            # Constants and utilities
```

## Module Dependency Graph

```
main.js
├── utils/constants.js
├── math/quadray.js
├── math/geometry.js
├── core/gameState.js
├── core/gameController.js
├── core/renderer.js
├── core/camera.js
├── core/saveLoadController.js
├── core/codeExecutor.js
├── analysis/logger.js
├── analysis/analyzer.js
├── analysis/visualizer.js
└── analysis/timeSeriesAnalyzer.js
```

## Module Categories

### Core (`core/`)

Game engine functionality:

- `gameState.js` - Central state management
- `gameController.js` - Input handling
- `renderer.js` - 3D rendering
- `camera.js` - View control
- `saveLoadController.js` - Persistence
- `codeExecutor.js` - Dynamic code execution

### Math (`math/`)

Mathematical foundations:

- `quadray.js` - Quadray coordinate class
- `geometry.js` - Shape generation

### Analysis (`analysis/`)

Tools for analyzing gameplay:

- `logger.js` - Coordinate logging
- `analyzer.js` - Statistical analysis
- `visualizer.js` - Heatmaps and grids
- `timeSeriesAnalyzer.js` - Time-based tracking

### Utils (`utils/`)

Shared utilities:

- `constants.js` - Configuration and constants

## Usage

```javascript
import { Quadray } from './math/quadray.js';
import { GameState } from './core/gameState.js';
```
