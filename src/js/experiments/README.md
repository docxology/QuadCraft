# JavaScript Experiments

This directory contains HTML/JavaScript experimental prototypes for QuadCraft development.

## Directory Structure

```
experiments/
├── browser/                    # Complete modular browser version
├── saves/                      # Save files from experiments
├── QuadrayGrid.html            # Original prototype
├── QuadrayGrid2.html           # Version 2
├── QuadrayGrid3.html           # Version 3 (12-direction fixes)
├── QuadrayGrid4.html           # Current main version
├── MergedTwoGrids.html         # Grid merging demo
├── MergingTwoGrids.html        # Grid merge experiment
├── CrystalDefectCCPBalls.html  # Crystal defect simulation
├── octahedronAutomata.html     # Octahedron cellular automata
└── simpleGrid.html             # Basic grid demonstration
```

## Experiment Descriptions

### QuadrayGrid Series

Evolution of the main quadray visualization:

1. **QuadrayGrid.html** - Original basic implementation
2. **QuadrayGrid2.html** - Added more features
3. **QuadrayGrid3.html** - Fixed 12-direction navigation (was duplicates)
4. **QuadrayGrid4.html** - Current production version with full features

### Specialized Experiments

| Experiment | Purpose |
|------------|---------|
| `MergedTwoGrids.html` | Visualizing combined grid structures |
| `CrystalDefectCCPBalls.html` | Crystal lattice defect simulation |
| `octahedronAutomata.html` | Cellular automata on octahedral grid |
| `simpleGrid.html` | Basic grid for testing |

## Screenshots

Many experiments have associated screenshots (`.png`, `.jpg` files) documenting their visual output at various stages.

## Running Experiments

Most experiments can be opened directly in a browser. Some may require:

- Local HTTP server (for module imports)
- Specific save files to load
