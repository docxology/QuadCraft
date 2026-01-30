# Coordinate Systems

This directory contains the mathematical foundation for QuadCraft's tetrahedral coordinate system.

## Files

| File | Purpose |
|------|---------|
| `Quadray.h` | Four-dimensional quadray coordinate system |
| `Vector3.h` | Standard 3D Cartesian vector and Vector4 for frustum |

## Quadray Coordinate System

Quadray coordinates use four values `(a, b, c, d)` to represent points in 3D space:

### Basis Vectors

The four basis vectors extend from the center of a regular tetrahedron to its vertices:

- **A-axis**: Direction (1, 1, 1) normalized
- **B-axis**: Direction (-1, -1, 1) normalized
- **C-axis**: Direction (-1, 1, -1) normalized
- **D-axis**: Direction (1, -1, -1) normalized

### Key Properties

1. **Constraint**: `a + b + c + d = constant` for all points in same 3D hyperplane
2. **Non-negative**: Normalized quadrays have `a, b, c, d ≥ 0`
3. **Redundancy**: 4 coordinates for 3D space allows natural tetrahedral operations

### Conversion Formulas

**Cartesian to Quadray:**

```cpp
const float scale = 1.0f / ROOT2;
float a = scale * (max(0, x) + max(0, y) + max(0, z));
float b = scale * (max(0, -x) + max(0, -y) + max(0, z));
float c = scale * (max(0, -x) + max(0, y) + max(0, -z));
float d = scale * (max(0, x) + max(0, -y) + max(0, -z));
```

**Quadray to Cartesian:**

```cpp
const float scale = 1.0f / ROOT2;
float x = scale * (a - b - c + d);
float y = scale * (a - b + c - d);
float z = scale * (a + b - c - d);
```

## Vector3

Standard 3D vector with:

- Component access (x, y, z)
- Arithmetic operators (+, -, *, /)
- Dot product, cross product
- Length, normalization

## Usage

```cpp
#include "Quadray.h"
#include "Vector3.h"

Vector3 cartesian(1.0f, 2.0f, 3.0f);
Quadray quad = Quadray::fromCartesian(cartesian);
Vector3 back = quad.toCartesian();
// back ≈ cartesian (within floating-point precision)
```
