# Mathematics Guide: Quadray Geometry, Mesh Boundaries, and IVM Units

Begin with the [canonical coordinate contract](../quadray_coordinates.md), which fixes the development checkout's embedding, inverse signatures, units, floating-point limits and native/game occupancy distinctions.

## Contents

| Document | Purpose |
| --- | --- |
| [Quadray coordinate mathematics](quadray_coordinates.md) | Rank-three common-offset quotient, gauges, inverse, physical metric and lattice distinctions |
| [Tetrahedral geometry](tetrahedral_geometry.md) | Ideal solid formulas, actual native nonregular offsets, barycentric containment mathematics and screen-marker boundaries |
| [IVM and Synergetics](ivm_synergetics.md) | Twelve-contact topology, explicitly scaled volume hierarchy, S3 conversion and per-record game accounting |

## Key Concepts

- **Physical quadrays:** four coefficients modulo a common additive offset, not four independent spatial axes or mandatory constant-sum coordinates.
- **Minimum-zero gauge:** subtract the smallest component. This selects a nonnegative representative; it does not set vector length or component sum.
- **Native/shared embedding:** $(x,y,z)=(a-b-c+d,a-b+c-d,a+b-c-d)/\sqrt2$. Coefficient-unit directions have length $\sqrt{3/2}$.
- **Inverse:** continuous and gauge-selecting; integer snapping and nearest-lattice selection are separate operations.
- **Occupancy:** native chunks use normalized floating quadrays, while games such as Minecraft can retain physically coincident raw-label aliases.
- **Geometry:** a point anchor, a cell type label, a rendered marker and a validated solid boundary are not the same object.
- **IVM volume units:** with the ideal edge-2 regular tetrahedron defined as volume 1, $V_{\mathrm{IVM}}=\sqrt{9/8}\,V_{\mathrm{QC}}$. This does not make the actual native prototype mesh regular or the game's `0.375` per-record counter a measured union volume.

## Cross-References

- [Gameplay implementation boundaries](../game_design/gameplay_overview.md)
- [Block representations](../game_design/block_system.md)
- [Source-specific controls](../game_design/controls_and_navigation.md)
- [Glossary](../reference/glossary.md)
- [Maintained historical discussions](../other/README.md)
- [Documentation index](../README.md)
