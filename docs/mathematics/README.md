# Mathematics Documentation

Mathematical foundations of QuadCraft's tetrahedral coordinate system.

## Contents

| Document | Description |
| --- | --- |
| [quadray_coordinates.md](quadray_coordinates.md) | Quadray coordinate system — basis vectors, conversion formulas, hashing, distance |
| [tetrahedral_geometry.md](tetrahedral_geometry.md) | Tetrahedral geometry — properties, mesh generation, barycentrics |
| [ivm_synergetics.md](ivm_synergetics.md) | IVM & Synergetics — volume ratios, concentric hierarchy, S3 constant |

## Key Concepts

### Quadray Coordinates

Four-component coordinate system `(a, b, c, d)` where vectors point from the center of a regular tetrahedron to its vertices. All coordinates are non-negative after normalization.

### IVM (Isotropic Vector Matrix)

The space-filling grid of alternating tetrahedra and octahedra that underlies QuadCraft's world. In Synergetics, the tetrahedron is the unit of volume:

| Shape | Tetravolumes |
| ----- | ------------ |
| Tetrahedron | 1 |
| Cube | 3 |
| Octahedron | 4 |
| Rhombic Dodecahedron | 6 |
| Cuboctahedron (VE) | 20 |

### Key Formulas

**Quadray → Cartesian** (scale = 1/√2):

- x = scale × (a − b − c + d)
- y = scale × (a − b + c − d)
- z = scale × (a + b − c − d)

**S3 Constant**: √(9/8) ≈ 1.06066 — converts between XYZ and Synergetics volumes.

## Cross-References

- [Quadray implementation in QuadCraft](../quadray_coordinates.md) — engine-level overview
- [Games Portfolio](../games.md) — all 12 games use quadray coordinates
- [Glossary](../reference/glossary.md) — definitions for IVM, Synergetics, S3, etc.
