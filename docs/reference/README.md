# QuadCraft Reference and Terminology

Use the [canonical quadray contract](../quadray_coordinates.md) for coordinate scale, orientation, inverse and identity rules. This reference separates mathematical concepts from source-specific game conventions and design vocabulary.

## Contents

| Document | Description |
| --- | --- |
| [glossary.md](glossary.md) | Geometry, native occupancy, raw game labels, rendering/model boundaries and bounded gameplay terminology |
| [AGENTS.md](AGENTS.md) | Guidance for maintaining source-bound definitions |

## Quick Reference

### Core Terms

| Term | Definition |
| --- | --- |
| Quadray | Four coefficients representing a Euclidean 3D point modulo a common additive offset; physical rank three |
| Canonical representative | Zero-minimum coefficients, obtained by subtracting the minimum; no fixed-sum requirement |
| Native occupancy | Cartesian chunk lookup with chunk-local normalized quadray keys; floating-point storage, not integer quantization |
| Raw game label | Four-component key retained by `GridUtils.key`; common-offset aliases can remain separate game slots |
| CCP/FCC | Cubic close-packed / face-centered cubic sphere-center arrangement; not all projected integer quadrays automatically form one FCC lattice |
| Voxel boundary | Boundary of a declared volume cell, not automatically a projected point marker, graph contact or display tetrahedron |

### Shape Types

A tetrahedron has four triangular faces; an octahedron has eight. The ideal regular tetrahedral–octahedral honeycomb uses both. Native display offsets and browser Z/C shape constructions must be checked separately; shape names alone do not establish regularity, gap-free tiling or measured cell volume.

### Coordinate Systems

Native/shared-game coordinates use

`(x,y,z) = (a-b-c+d, a-b+c-d, a+b-c-d)/sqrt(2)`.

The kernel consists of common offsets `(t,t,t,t)`. This is Euclidean 3D geometry, not an independent Euclidean 4D world. Game naming and raw `size^4` label counts do not change that fact. Follow the [canonical page](../quadray_coordinates.md) for source-specific browser variants and inverse/snapping details.

## Source and Navigation

- [`Quadray.h`](../../src/core/coordinate/Quadray.h), [`World.h`](../../src/core/world/World.h), [`TetraChunk.h`](../../src/core/world/TetraChunk.h): native coordinates/storage.
- [`quadray.js`](../../games/4d_generic/quadray.js), [`grid_utils.js`](../../games/4d_generic/grid_utils.js), [`base_board.js`](../../games/4d_generic/base_board.js): shared game coordinates, canonical neighbor helpers and raw keys.
- [`minecraft_analysis.js`](../../games/4d_minecraft/js/minecraft_analysis.js): game model statistics, not a solid-boundary measurement service.
- [UI documentation](../ui/README.md) · [IVM & Synergetics](../mathematics/ivm_synergetics.md) · [Documentation index](../README.md)
