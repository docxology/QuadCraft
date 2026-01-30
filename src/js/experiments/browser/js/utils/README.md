# Utility Modules

Shared constants and utilities.

## Files

| File | Purpose |
|------|---------|
| `constants.js` | Configuration and constants |

## constants.js

Central configuration and mathematical constants:

### Mathematical Constants

```javascript
ROOT2 = Math.sqrt(2)      // √2 for quadray scaling
S3 = Math.sqrt(3)         // √3 for geometry
```

### Game Configuration

```javascript
// Camera settings
CAMERA_SPEED = 0.5
CAMERA_SENSITIVITY = 0.1
ZOOM_SPEED = 0.1

// Grid settings
GRID_SIZE = 100
DOT_SIZE = 2

// Rendering
MAX_RENDER_DISTANCE = 50
```

### UI Configuration

```javascript
// Panel dimensions
CONTROL_PANEL_WIDTH = 250
ANALYSIS_PANEL_WIDTH = 300

// Time series
TIME_WINDOW_DEFAULT = 60  // seconds
UPDATE_INTERVAL_DEFAULT = 100  // ms
```

### Color Palette

```javascript
COLORS = {
  octahedron: '#4a90d9',
  tetrahedronZ: '#d94a4a',
  tetrahedronC: '#4ad94a',
  grid: '#888888',
  background: '#1a1a2e'
}
```

## Usage

```javascript
import { ROOT2, CAMERA_SPEED, COLORS } from './utils/constants.js';
```
