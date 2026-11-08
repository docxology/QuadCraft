# IVM Geometry: Contact Topology, Tetra-Units, and Game Accounting

The Isotropic Vector Matrix (IVM) motivates tetrahedral-octahedral geometry and close-packing terminology. It does not establish that every QuadCraft storage record is a nonoverlapping physical cell. Start with the [coordinate contract](../quadray_coordinates.md), then distinguish the [native mesh](tetrahedral_geometry.md#implementation-in-quadcraft) from [game models](../game_design/block_system.md).

[Mathematics index](README.md) · [Quadray derivation](quadray_coordinates.md) · [Glossary](../reference/glossary.md).

## Isotropic Vector Matrix (IVM)

In the FCC (cubic close-packed) sphere arrangement, each sphere touches 12 equal neighbors. Neighbor centers form a cuboctahedron. Connecting appropriate centers produces the tetrahedral-octahedral honeycomb; regular tetrahedra alone do not tile Euclidean 3D space. Twelve nearest contacts at a node are not twelve faces of a tetrahedron: point coordination and cell face adjacency are different graphs.

### Connection to QuadCraft

[GridUtils.DIRECTIONS](../../games/4d_generic/grid_utils.js) contains the 12 permutations of `(0,1,1,2)`. Under the native embedding these are coordinate permutations of $(0,\pm\sqrt2,\pm\sqrt2)$, of length 2. `neighbors()` adds each direction and minimum-normalizes; `boundedNeighbors()` then filters component bounds. These steps preserve component-sum modulo four on integer equivalence classes. That residue is a lattice classification, not a constraint that the full sum remain constant.

By contrast, [Quadray.IVM_DIRECTIONS](../../games/4d_generic/quadray.js) consists of eight signed single-coefficient steps of length $\sqrt{3/2}$. The complete integer quadray quotient is BCC-type, with four FCC sublattices selected by component-sum modulo four. A four-coefficient frame is not itself the 12-contact neighbor set.

Native [TetraChunk](../../src/core/world/TetraChunk.cpp) computes four candidate neighbors from element-face centers. It does not use the shared game's contact graph. Do not infer equality of these topologies from the common IVM name.

## Synergetics Volume Ratios

### Concentric Hierarchy

A consistent hierarchy chooses a regular tetrahedron of **native edge length 2** as volume 1. The following ratios require compatible relative scales, not a claim that every shape has edge length 1:

| Shape and native scale | Euclidean volume | Native IVM tetra-units |
| --- | --- | --- |
| Regular tetrahedron, edge 2 | $2\sqrt2/3$ | 1 |
| Cube with vertices $(\pm1,\pm1,\pm1)/\sqrt2$, edge $\sqrt2$ | $2\sqrt2$ | 3 |
| Regular octahedron, edge 2 | $8\sqrt2/3$ | 4 |
| Rhombic dodecahedron with cube vertices above and axial vertices $\pm\sqrt2$ | $4\sqrt2$ | 6 |
| Cuboctahedron, edge 2 | $40\sqrt2/3$ | 20 |

For example, the edge-2 cube would instead have volume $8$ and IVM volume $6\sqrt2$; applying the hierarchy's `cube = 3` to it would silently change scale. Shape names without dimensions are insufficient for mensuration.

### The S3 Constant

For the declared edge-2 tetrahedron,

$$
V_{\mathrm{tetra,QC}}=\frac{2^3}{6\sqrt2}=\frac{2\sqrt2}{3},\qquad
S_3=\frac1{V_{\mathrm{tetra,QC}}}=\frac3{2\sqrt2}=\sqrt{9/8}.
$$

Thus $V_{\mathrm{IVM}}=S_3V_{\mathrm{QC}}$. This factor depends on the embedding and unit tetrahedron. For a tetrahedron with **edge 1**, the factor would be $6\sqrt2$, not $S_3$.

QuadMath/symergetics scale-one XYZ has edge $2\sqrt2$ for the coefficient-endpoint tetrahedron and Euclidean volume $8/3$. There $V_{\mathrm{IVM}}=(3/8)V_{\mathrm{XYZ}}$. QuadCraft's axis swap reverses signed orientation, while its length scaling reduces unsigned volume by $1/(2\sqrt2)$; both conventions give IVM volume 1 for the same coefficient endpoints. An arbitrary integer-coordinate tetrahedron need not have an integer number of native tetra-units.

The constant is declared in [native Quadray.h](../../src/core/coordinate/Quadray.h) and the [shared game module](../../games/4d_generic/quadray.js). Its presence does not imply a mass, density or structural-mechanics solver.

## Cell Parity

`Quadray.cellType(a,b,c,d)` rounds each component separately, sums the results, and returns `tetra` for even sums and `octa` for odd sums. It is a **game classification rule**, not a derivation of actual cell vertices, volume, orientation or face incidence. For integer inputs, an integer common offset changes the sum by a multiple of four and preserves parity. Rounding arbitrary real representatives is not a gauge-invariant geometric cell classifier.

Minecraft attaches this label to render records and metadata. Native `TetrahedralElement` has no corresponding parity-selected octahedral mesh. The monolithic browser experiment has its own named tetra/octa brush shapes; do not merge those conventions.

## Game Volume Accounting

The shared `Quadray.cellVolume()` returns `0.375`. [Minecraft analysis](../../games/4d_minecraft/js/minecraft_analysis.js) uses the same value via

$$\left(\frac1{\sqrt2}\right)^3S_3=\frac38.$$

This is a **per-record accounting convention**, equivalent to converting a hypothetical Cartesian cube of side $1/\sqrt2$ with $S_3$. It is not the ideal unit tetrahedron's volume (1), not the octahedron's volume (4), and not an integration over the renderer's square markers or native tetrahedral vertices. Multiplying raw occupied-slot count by $3/8$ does not deduplicate common-offset aliases or measure the union of physical solids. HUD fill/density/coordination analyses depend on their declared label and neighbor conventions; they are not experimental measurements of continuum matter.

## Jitterbug Transformation

The cuboctahedron-to-octahedron jitterbug is a geometric transformation discussed in Synergetics. Numerical intermediate volumes depend on the chosen linkage and scale. QuadCraft's constants and volume ratios are not an implementation of that continuous mechanism; this page supplies no gameplay command for it.

## Octet Truss

The octet-truss connection is a useful structural analogy: a tetrahedral-octahedral bar framework can have 12 equal struts at an interior FCC node. Strength, stability and efficiency depend on materials, joints and loads. No universal strength-to-weight optimum or in-game structural integrity is established by the coordinate system.

## References

- R. Buckminster Fuller, *Synergetics: Explorations in the Geometry of Thinking* (1975; *Synergetics 2*, 1979): historical mensuration context, not a QuadCraft API specification.
- [Shared source constants and geometric helpers](../../games/4d_generic/synergetics.js): implementation evidence, not independent experimental validation.
- [Tetrahedral formulas and barycentric coordinates](tetrahedral_geometry.md): volume and containment mathematics.
- [World generation implementations](../game_design/world_generation.md): actual native and game-model boundaries.
