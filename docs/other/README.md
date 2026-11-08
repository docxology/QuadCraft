# Technical Papers & Analysis

Maintained technical/historical discussions, not peer-reviewed publications or a completed-engine specification. Read the [canonical coordinate contract](../quadray_coordinates.md) for current conventions before using these papers.

## Papers

| Paper | Scope |
| --- | --- |
| [Technical Framework](QuadCraft_%20Technical%20Framework%20for%20a%20Tetrahedral-B.md) | Historical design questions compared with actual chunk, terrain, and meshing source |
| [Coordinate Analysis](Quadray%20Coordinates_%20A%20Comprehensive%20Analysis%20of%20T.md) | Common-offset equivalence, historical sources, polyhedra, and interpretation |
| [Geometric Formalization](Quadray%20Coordinates_%20Technical%20and%20Geometric%20Forma.md) | Rank-three quotient, gauges, embedding, inverse, and induced metric |
| [Dimensional Conversion](Technical%20Supplement_%20Dimensional%20Conversion%20Betwe.md) | Source-specific conversions and explicit tetravolume units |

## Purpose

The common mathematical model is three-dimensional: four coefficients modulo a shared additive offset. No fixed-sum physical constraint or fourth independent spatial axis is implied. Historical design proposals and external libraries are not current QuadCraft APIs.

## Usage

1. Use the canonical contract and mathematics pages below for maintained definitions.
2. Use the formalization or conversion paper for derivations in QC's explicit scale and orientation.
3. Use the framework paper to distinguish experimental source behavior from older proposals.
4. Trace implementation claims to [native coordinates](../../src/core/coordinate/Quadray.h), [world storage](../../src/core/world/World.h), [meshing](../../src/render/mesh/ChunkMesher.cpp), and [shared game grid utilities](../../games/4d_generic/grid_utils.js). Raw board aliases need not be physical occupancy keys.

## Cross-References

- [Canonical Coordinate Contract](../quadray_coordinates.md)
- [Quadray Mathematics](../mathematics/quadray_coordinates.md)
- [Tetrahedral Geometry](../mathematics/tetrahedral_geometry.md)
- [IVM & Synergetics](../mathematics/ivm_synergetics.md)
- [Architecture](../architecture.md)
- [Manuscript Status](../manuscript/MANUSCRIPT_STATUS.md)
- [Documentation Index](../README.md)
