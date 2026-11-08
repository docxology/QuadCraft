# QuadCraft: Technical Framework for a Tetrahedral-Based Minecraft Clone

This historical design discussion is maintained as a source-grounded comparison with the development checkout, not as a specification of a completed engine. The original Python sketches were proposals, not QuadCraft APIs. The sections below distinguish geometric facts, observed source behavior, and design questions without retaining those fictional interfaces.

Start with the [canonical coordinate contract](../quadray_coordinates.md), [quadray mathematics](../mathematics/quadray_coordinates.md), and [architecture overview](../architecture.md). Return to the [papers index](README.md).

## Tetrahedral Voxels vs. Cubic Voxels: Fundamental Differences

A tetrahedral mesh represents a volume with four-vertex cells and triangular faces. A cubic occupancy grid represents a different discretization. Changing coordinates alone changes neither the occupied solid nor its boundary: a quadray address does not specify a tetrahedron's vertices, orientation, size, or neighbors.

### Tetrahedral Mesh Advantages

Tetrahedral meshes can represent piecewise-planar sloped boundaries, but accuracy depends on resolution and mesh construction. Smooth surfaces still require approximation. Better collision accuracy, faster rendering, and smoother gameplay are not consequences of using four coefficients; each requires a defined algorithm and measurements. Congruent regular tetrahedra alone do not tile Euclidean space; a tetrahedral–octahedral honeycomb or a suitable nonregular tetrahedral subdivision is a separate geometric construction. See [tetrahedral geometry](../mathematics/tetrahedral_geometry.md).

## Quadray Coordinate System Implementation

Physical quadrays are the rank-three quotient

$$\mathbb R^4/\operatorname{span}\{(1,1,1,1)\}.$$

Thus $q$ and $q+t(1,1,1,1)$ denote the same three-dimensional point. The four tetrahedral generators are linearly dependent, not four independent Euclidean axes. There is no required fixed component sum. The native class and shared game class expose floating-point coefficients; this is not an exact-arithmetic guarantee.

### Coordinate System Transformations

[Native `Quadray.h`](../../src/core/coordinate/Quadray.h) and [shared `quadray.js`](../../games/4d_generic/quadray.js) use

$$E(a,b,c,d)=\frac{1}{\sqrt2}(a-b-c+d,\ a-b+c-d,\ a+b-c-d).$$

A coefficient-unit generator has Cartesian length $\sqrt{3/2}$; the four generator endpoints form a regular tetrahedron of edge 2. This geometric tetrahedron is not the native element mesh.

An inverse representative is

$$r=\frac{1}{2\sqrt2}(x+y+z,-x-y+z,-x+y-z,x-y-z),\qquad q=r-\min(r)\mathbf1.$$

The source's positive-part inverse followed by minimum subtraction yields this same canonical representative in exact arithmetic. Conversion returns real coefficients, not an integer lattice snap. These formulas depend on this orientation and scale; do not copy another quadray implementation's inverse without matching its forward map.

## Chunk Management in a Tetrahedral System

### Tetrahedral Chunk Structure

The implemented native chunks are **Cartesian cubes**, not tetrahedral chunk regions. [`World.h`](../../src/core/world/World.h) floors each Cartesian component divided by `TetraChunk::CHUNK_SIZE` (16). [`TetraChunk.h`](../../src/core/world/TetraChunk.h) converts positions to chunk-local quadrays and stores non-air elements in an unordered map. Writes mark the chunk dirty rather than immediately rebuilding a mesh.

The native hash uses exact hashes of minimum-normalized floating-point components while equality uses an epsilon. That mismatch is a numerical limitation, not integer quantization or a proven robust canonical occupancy scheme. Common-offset reduction is intended to identify the same physical address; it is not a fourth gameplay axis.

Shared games have a different contract: [`GridUtils.generateGrid` and `key`](../../games/4d_generic/grid_utils.js) retain raw four-component board labels. Distinct labels can project to the same point. `generateCanonicalGrid` instead selects minimum-zero representatives. Do not silently merge raw gameplay slots when discussing physical occupancy.

## Terrain Generation Algorithms

### 3D Noise Adaptation

[`TerrainGenerator.h`](../../src/core/world/TerrainGenerator.h) samples a three-dimensional Cartesian subdivision, computes five candidate centers per sampled cube, selects block IDs by height and noise thresholds, and converts those centers to local quadrays. Its function named `simplexNoise` combines sine waves; it is not a Perlin or simplex-noise implementation. No four-dimensional density field is required by quadrays.

The generator stores centers and block IDs, not the candidate corner sets. Consequently its five-index pattern does not establish that the subsequently rendered element shapes tile those cubes.

## Rendering Pipeline for Tetrahedral Blocks

### Marching Tetrahedrons Algorithm

Marching tetrahedra extracts an isosurface by interpolating scalar samples on tetrahedral edges. The native [`ChunkMesher.cpp`](../../src/render/mesh/ChunkMesher.cpp) instead emits triangles from stored element vertices when a neighbor is air or transparent. It is exposed-face meshing, not marching tetrahedra.

[`TetrahedralElement::getVertices`](../../src/core/world/TetrahedralElement.h) uses fixed Cartesian offsets at size 0.5. Despite its comments, those offsets are not regular: squared edge lengths 0–1 and 2–3 are respectively $5/9$ and $2/9$. Neither regularity nor a gap-free tetrahedral–octahedral tessellation follows from this source. The mesher also insets faces; source presence is not a geometric validation or rendering-quality result.

### LOD Support for Tetrahedral Meshes

The old component-wise coarsening sketch was a proposal. It did not preserve a demonstrated cell complex, shared faces, or topology. The cited mesher does not establish an adaptive LOD system. A future LOD design would need explicit geometry and transition rules; no such public API is specified here.

## Physics and Collision Detection

### Tetrahedral Collision Detection

A tetrahedral collision algorithm needs actual cell vertices and a defined broad/narrow phase. A quadray center is insufficient. The former `get_tetrahedra_in_bounds`, `generate_tetrahedron_shape`, and `intersects` recipe was not a callable native API. This discussion does not establish a general tetrahedral rigid-body solver, nor does it make a blanket claim that the separate games lack model-level physics.

## Practical Implementation Considerations

### Performance Optimization

Gauge reduction, sparse storage, chunk boundaries, face visibility, and coordinate conversion are separate concerns. They can introduce costs as well as simplify addressing. No performance comparison or multithreaded meshing benchmark accompanies this document; claims of superiority over cubic voxel engines would require like-for-like evidence.

### Data Structures for Tetrahedral Elements

Use the real `World::getBlock`, `World::setBlock`, and `TetraChunk` declarations to understand native storage. Their chunk-local positions and Cartesian chunk keys are not interchangeable with raw game board keys or the discarded Python `TetrahedralWorld` proposal.

## Building Upon Prior Work: Early Tetrahedral Game Environments

Kirby Urner's [1997 quadray introduction](https://www.grunch.net/synergetics/quadintro.html) and [conversion discussion](https://www.grunch.net/synergetics/quadxyz.html) provide historical coordinate context. They are not evidence for QuadCraft terrain, collision, networking, LOD, or performance features. Independent tetrahedral-mesh projects likewise do not establish implemented features in this checkout.

## Conclusion: From Concept to Implementation

The defensible framework is a rank-three tetrahedral coordinate representation plus separately implemented experimental storage and meshing components. Mathematical equivalence, a valid space partition, engine integration, and measured gameplay behavior are different claims. For maintained definitions and units, use the [canonical coordinate contract](../quadray_coordinates.md) and [IVM discussion](../mathematics/ivm_synergetics.md); for current software scope, use the linked source and architecture pages.
