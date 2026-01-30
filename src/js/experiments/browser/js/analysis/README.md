# Analysis Modules

Tools for analyzing gameplay and coordinate data.

## Files

| File | Purpose |
|------|---------|
| `logger.js` | Real-time coordinate logging |
| `analyzer.js` | Statistical analysis |
| `visualizer.js` | Heatmaps and visualizations |
| `timeSeriesAnalyzer.js` | Time-based coordinate tracking |

## logger.js

Continuous position tracking:

```javascript
// Start logging
logger.startLogging()

// Stop and export
logger.stopLogging()
const data = logger.exportData()
```

Features:

- Real-time position capture
- Configurable sample rate
- Export to JSON/CSV
- Statistics summary

## analyzer.js

Statistical analysis of gameplay:

```javascript
// Analyze movement patterns
analyzer.calculateStatistics(logData)
analyzer.findHotspots()
analyzer.calculateDistribution()
```

Metrics:

- Total distance traveled
- Most visited coordinates
- Movement speed statistics
- Shape placement patterns

## visualizer.js

Visual representation of data:

```javascript
// Generate visualizations
visualizer.drawHeatmap(canvas, data)
visualizer.drawTrajectory(canvas, data)
visualizer.drawCoordinateGrid(canvas)
```

Outputs:

- Heatmaps of activity
- Trajectory plots
- Coordinate overlays

## timeSeriesAnalyzer.js

Time-based analysis with live charts:

Features:

- Real-time line charts
- Quadray coordinates (a,b,c,d) over time
- Cartesian coordinates (x,y,z) over time
- Speed and distance metrics
- Configurable time windows (10-300s)
- Data export
