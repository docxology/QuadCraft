# Tetrahedral Geometry: Ideal Solids, Native Meshes, and Game Markers

This page separates geometric facts from QuadCraft's actual element representation. The [coordinate contract](../quadray_coordinates.md) fixes the rank-three embedding and units. [Mathematics index](README.md) · [IVM topology and volumes](ivm_synergetics.md) · [Block models](../game_design/block_system.md).

## Basic Properties of a Tetrahedron

A nondegenerate tetrahedron has four vertices, six edges and four triangular faces. For vertices $v_0,v_1,v_2,v_3$ in Cartesian coordinates,

$$V=\frac{|\det(v_1-v_0,v_2-v_0,v_3-v_0)|}{6}.$$

The uniform solid tetrahedron's mass centroid equals its vertex mean. That equality does not extend to an arbitrary multi-cell object or polyhedron: averaging mesh vertices is generally not a volume-weighted mass centroid.

### Regular Tetrahedron

A regular tetrahedron has six equal edges. With edge $\ell$:

- Volume $V=\ell^3/(6\sqrt2)$.
- Surface area $A=\sqrt3\ell^2$.
- Interior dihedral angle $\arccos(1/3)\approx70.53^\circ$.
- Angle between center-to-vertex rays $\arccos(-1/3)\approx109.47^\circ$.

These angles refer to different objects. A triangle's internal $60^\circ$ angle is not a universal tetrahedral face slope relative to the game's vertical axis.

## Tetrahedral Grid System

### Space-Filling Properties

Regular tetrahedra alone do not tile Euclidean 3D space. Regular tetrahedra together with octahedra form the tetrahedral-octahedral honeycomb. A cube can also be subdivided into tetrahedra, but those tetrahedra are not all congruent regular tetrahedra. Either construction needs explicit vertices, cells and shared faces; four-component point labels alone provide none of those incidences.

The [IVM contact graph](ivm_synergetics.md#connection-to-quadcraft), native element-neighbor heuristic and game raw-slot grid are not interchangeable honeycomb definitions.

## Implementation in QuadCraft

### Tetrahedral Element Class

Native [TetrahedralElement](../../src/core/world/TetrahedralElement.h) contains a normalized `Quadray position` and `Block::BlockID blockId`. It exposes solidity/transparency queries and vertex/face arrays. It does **not** contain the orientation field or `containsPoint` method shown in earlier versions of this document.

For anchor $c=E(\text{position})$ and hardcoded size $s=0.5$, `getVertices()` returns $c$ plus

$$
(0,s,0),\quad (2s/3,-s/3,0),\quad
(-s/3,-s/3,\sqrt2s/3),\quad(-s/3,-s/3,-\sqrt2s/3).
$$

These offsets have mean zero, but **are not regular**, despite the source comment: at $s=0.5$, squared edge lengths $|v_0-v_1|^2=5/9$ and $|v_2-v_3|^2=2/9$ differ. Ideal regular-tetrahedron edge/area formulas therefore must not be presented as measurements of this native mesh. The fixed shape is also not a retained copy of the five corner-index tetrahedra sampled by [TerrainGenerator](../../src/core/world/TerrainGenerator.h), which stores only their anchors and block IDs. This representation does not establish a gap-free, nonoverlapping cube subdivision or regular honeycomb.

### Tetrahedral Mesh Generation

[ChunkMesher](../../src/render/mesh/ChunkMesher.cpp) obtains the four native vertices, insets them slightly toward their vertex mean and adds the Cartesian chunk origin. For each candidate exposed face it emits a triangle, calculates an outward normal and applies block/face colors. Current texture coordinates are unused zeros. Its neighbor query renders a face when the candidate neighbor is air or transparent; that lookup is not proof of exact face-sharing topology.

### Vertex Positions

For comparison, the **ideal** coefficient-endpoint tetrahedron uses

$$(1,1,1)/\sqrt2,\ (-1,-1,1)/\sqrt2,\ (-1,1,-1)/\sqrt2,\ (1,-1,-1)/\sqrt2.$$

It has edge 2 and Euclidean volume $2\sqrt2/3$. Omitting $1/\sqrt2$ produces edge $2\sqrt2$ and volume $8/3$, the suite scale-one convention. Neither vertex list is the fixed-offset native element above.

## Navigation in Tetrahedral Space

### Adjacency and Connectivity

A tetrahedron has four faces, but this does not prove that any four stored neighbors tile around it. Native [TetraChunk.getNeighbors](../../src/core/world/TetraChunk.cpp) computes candidate centers as $2f-c$ for face centroid $f$ and anchor $c$. This is a central reflection through the face centroid, not generally reflection through the face plane. It is used as a storage/visibility heuristic, not a validated volumetric adjacency structure.

### Raycasting

Native [Input.castRayFromCamera](../../src/game/Input.h) marches samples along a Cartesian camera ray and queries `World.getBlock` with continuously converted quadrays. It does not intersect each tetrahedral face or compute barycentric containment. Sampling exact-ish float keys also must not be described as a complete solid collision detector.

In [MinecraftRenderer](../../games/4d_minecraft/js/minecraft_renderer.js), blocks are screen-aligned filled squares centered at projected anchors. Picking checks these square bounds in reverse paint order. It is neither a native tetrahedral mesh nor a ray-triangle intersection.

## Collision Detection

### Barycentric Coordinates

The following is mathematics available for a future solid-containment implementation, **not a currently exposed native method**. For an affinely independent tetrahedron, solve

$$
p=v_0+u(v_1-v_0)+v(v_2-v_0)+w(v_3-v_0).
$$

Its barycentric weights are $(1-u-v-w,u,v,w)$, whose sum is one. The point lies in the closed tetrahedron iff all weights are nonnegative. Degenerate tetrahedra require separate handling; floating-point predicates require a declared tolerance.

#### Point Containment

The sum-one constraint belongs to barycentric weights relative to these four **vertices**. It is not a constant-sum constraint on free quadray coordinates relative to tetrahedral **directions**. Confusing these makes translated or gauge-shifted physical points appear invalid.

#### Calculation via Volume Ratios

Each barycentric weight is a signed determinant ratio formed by replacing that vertex with $p$, preserving vertex order. Taking absolute volumes before solving loses the outside-point sign information. This method requires nonzero denominator volume.

## Tetrahedral Coordinates vs. Cubic Voxels

Triangular faces may offer useful oblique surfaces, but efficiency, walkability, rendering cost and approximation quality depend on the actual tiling, sampling, mesh and task. They are not guaranteed advantages of quadray coefficients. Likewise, square screen markers do not establish cubic solid occupancy, and cell parity labels do not establish tetrahedral/octahedral boundaries.

## Special Geometric Structures

The tetrahedral-octahedral honeycomb and octet truss are geometric references. Geodesic domes, arches and structural stability need explicit construction/material assumptions; see [bounded building exercises](../game_design/advanced_building_techniques.md). QuadCraft does not derive a structural solver or non-Euclidean geometry merely by using oblique coordinates.
