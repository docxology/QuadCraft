# Mathematics Documentation

Mathematical foundations of QuadCraft's tetrahedral coordinate system.

## Contents

| Document | Description |
|----------|-------------|
| [quadray_coordinates.md](quadray_coordinates.md) | The quadray coordinate system |
| [tetrahedral_geometry.md](tetrahedral_geometry.md) | Tetrahedral geometry principles |

## Overview

QuadCraft uses a unique mathematical foundation based on tetrahedral geometry.

### Quadray Coordinates

A four-dimensional coordinate system using vectors from a tetrahedron's center to its vertices:

- Four coordinates: (a, b, c, d)
- Constraint: a + b + c + d = constant
- Natural for tetrahedral operations

### Tetrahedral Geometry

Space-filling with three shape types:

- Octahedrons (8 faces)
- Tetrahedrons Z-orientation
- Tetrahedrons C-orientation

### Key Formulas

**Quadray to Cartesian:**

```
x = (a - b - c + d) / √2
y = (a - b + c - d) / √2
z = (a + b - c - d) / √2
```

**Cartesian to Quadray:**

```
a = (max(0,x) + max(0,y) + max(0,z)) / √2
b = (max(0,-x) + max(0,-y) + max(0,z)) / √2
c = (max(0,-x) + max(0,y) + max(0,-z)) / √2
d = (max(0,x) + max(0,-y) + max(0,-z)) / √2
```

## Applications

- Precise grid navigation
- Natural tetrahedral operations
- Efficient space partitioning
