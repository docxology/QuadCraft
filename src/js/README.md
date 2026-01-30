# JavaScript Source

This directory contains JavaScript experiments and prototypes for QuadCraft.

## Directory Structure

```text
js/
└── experiments/     # HTML/JS experimental prototypes
    └── browser/     # Complete modular browser version
```

## Overview

The JavaScript implementations explore various approaches to the quadray coordinate system and tetrahedral voxel rendering in the browser.

## Experiments

The `experiments/` directory contains:

- Multiple QuadrayGrid versions (1-4)
- Crystal defect simulations
- Grid merging experiments
- Octahedron automata

### Key Experiments

| File | Description |
|------|-------------|
| `QuadrayGrid.html` | Original prototype |
| `QuadrayGrid2.html` | Enhanced version |
| `QuadrayGrid3.html` | 12-direction fixes |
| `QuadrayGrid4.html` | Current main version |
| `MergedTwoGrids.html` | Grid merging visualization |

### Modular Browser Version

`experiments/browser/` contains a complete, modular implementation:

- Separated concerns (core, math, analysis)
- ES6 modules
- Comprehensive documentation
- See its README.md for details

## Development Notes

- Experiments serve as prototypes
- Successful experiments get integrated into main browser app
- Some experiments are exploratory and may not be complete
