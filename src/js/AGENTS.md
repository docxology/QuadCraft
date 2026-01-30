# JavaScript Source - AI Agent Guidelines

## Overview

This directory contains experimental JavaScript implementations. Code maturity varies.

## Hierarchy

```text
js/
└── experiments/         # Various prototypes
    ├── *.html           # Standalone experiments
    ├── browser/         # Modular version (most mature)
    └── saves/           # Experiment save files
```

## Guidelines

### Working with Experiments

- Experiments are for exploration
- May have incomplete features
- Use as reference, not production code
- Document interesting findings

### Modular Browser Version

The `browser/` subdirectory is the most polished:

- Follow its patterns for new code
- Has comprehensive README
- Properly separated concerns

## Best Practices

### Creating New Experiments

1. Create standalone HTML file
2. Document purpose at top
3. Note dependencies
4. Mark as experimental

### Promoting to Production

1. Test thoroughly
2. Refactor for modularity
3. Update main browser app
4. Archive experiment if superseded
