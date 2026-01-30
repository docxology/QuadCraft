# Core Modules

Game engine core functionality.

## Files

| File | Purpose |
|------|---------|
| `gameState.js` | Central state management |
| `gameController.js` | Input handling and game logic |
| `renderer.js` | 3D rendering engine |
| `camera.js` | Camera system |
| `saveLoadController.js` | Save/load functionality |
| `codeExecutor.js` | JavaScript code execution |

## gameState.js

Central game state singleton:

```javascript
// Grid data
addDot(position)
toggleOctahedronAt(position)
toggleTetrahedronZAt(position)
toggleTetrahedronCAt(position)

// State flags
viewChanged  // Camera moved
gridChanged  // Grid data modified
```

## gameController.js

Input event processing:

- Keyboard navigation (QWERTY/ASDFGH)
- Mouse interaction (rotate, pan, zoom)
- Shape placement hotkeys

## renderer.js

Canvas 2D rendering:

- Triangle depth sorting
- Quadray to screen projection
- Shape drawing with proper occlusion

## camera.js

3D camera control:

- Position in Cartesian space
- Rotation via angles or quaternions
- Mouse drag and arrow key control

## saveLoadController.js

Persistence layer:

- localStorage quicksaves
- JSON file export/import
- State serialization

## codeExecutor.js

Dynamic code evaluation:

- Safe execution environment
- Access to game objects
- Procedural generation functions
