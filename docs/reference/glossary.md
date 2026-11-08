# QuadCraft Glossary

Definitions for the development checkout. Mathematical terms do not by themselves establish implemented gameplay features. The [canonical quadray contract](../quadray_coordinates.md) governs coordinate conventions; [interfaces](../ui/user_interface.md) names the actual UI surfaces.

## A

### Adjacent Tetrahedra

Geometrically, tetrahedra sharing a triangular face. A game's neighbor relation is not automatically face adjacency: specify the graph and model. The sandbox census uses eight signed coefficient steps, while `GridUtils.neighbors` uses twelve different canonical steps.

### Ambient Occlusion

A shading concept estimating obstruction of ambient light. This definition is not a claim of an implemented tetrahedral ambient-occlusion pipeline.

## B

### Block

A stored material/occupancy record. Native [`TetrahedralElement`](../../src/core/world/TetrahedralElement.h) associates a normalized position and block ID with a four-vertex display model. [`MinecraftBoard`](../../games/4d_minecraft/js/minecraft_board.js) instead stores material IDs under raw four-component string keys. Neither name alone proves a space-filling physical cell.

### Broad Phase Collision

A coarse candidate-filtering stage in collision detection. It is general terminology, not evidence of a shared QuadCraft collision subsystem.

## C

### Canonical Representative

A selected representative of a common-offset equivalence class. QuadCraft's zero-minimum gauge subtracts `min(a,b,c,d)` from every coefficient. This is not unit-length normalization, integer rounding or a fixed-sum constraint.

### Cartesian Coordinates

Three orthogonal coordinates `(x,y,z)` for Euclidean physical space. Native/shared-game quadrays use `(a-b-c+d, a-b+c-d, a+b-c-d)/sqrt(2)`; browser experiment variants must be checked against their own source. See [coordinate conversion](#coordinate-conversion).

### Chunk

In the native [`World`](../../src/core/world/World.h), a region indexed by three Cartesian integers. The world-space half-open cube has side `TetraChunk::CHUNK_SIZE`; elements inside it use chunk-local quadray keys. A chunk is not a four-dimensional hypercube or a proof that its display tetrahedra tile the region.

### Common-Offset Equivalence

`q` and `q+t(1,1,1,1)` have the same Cartesian image. The four basis vectors sum to zero, so the physical map has rank three. For example, `(0,0,0,0)` and `(1,1,1,1)` denote the same physical point but may be separate raw game slots.

### Coordinate Conversion

Mapping between coefficient records and Cartesian points. Native [`Quadray.h`](../../src/core/coordinate/Quadray.h) and shared-game [`quadray.js`](../../games/4d_generic/quadray.js) implement the forward map above and a sign-split, zero-minimum inverse. Inverses, scale, orientation and snapping are source-specific; do not substitute another package's conversion or assume rounding searches for the nearest physical lattice point. See the [canonical contract](../quadray_coordinates.md).

## F

### Face (Tetrahedral)

One of four triangular boundary faces of a tetrahedron. A game statistic called “exposed faces” need not count those triangles; Minecraft's analysis counts contacts in an eight-direction raw-label graph.

## G

### Global Coordinates

Positions relative to the world origin, as opposed to a chunk's local origin. The native world converts physical positions to Cartesian chunk indices, then to local quadrays for storage; it does not mix two independent physical spaces.

### Greedy Meshing

Combining compatible faces into larger primitives. Native [`ChunkMesher.cpp`](../../src/render/mesh/ChunkMesher.cpp) emits individual exposed triangular faces; do not call that a greedy meshing implementation.

## L

### Level of Detail (LOD)

Reducing representation detail with view distance or another criterion. Chunk culling and render-count limits are not automatically a geometric LOD system.

### Local Coordinates

Coordinates relative to a declared origin. Native `worldToChunkSpace` subtracts the chunk's Cartesian origin before converting back to quadrays; four coefficient-wise chunk indices are not used.

## N

### Narrow Phase Collision

Detailed intersection/contact testing after candidate selection. A projected square hit test or sampled occupancy ray is not an exact tetrahedron collision solver.

### Native Canonical Occupancy

Native world access groups physical positions by Cartesian chunk and chunk-local quadrays. [`TetraChunk.h`](../../src/core/world/TetraChunk.h) normalizes keys for hashing/equality; hashing uses exact float hashes while equality uses a small epsilon. This is not an integer-quantized key contract or a guarantee that arbitrary nearly equal floating values hash identically. It differs from the portfolio's raw-key storage.

### Non-Euclidean Geometry

Geometry with a non-Euclidean metric/structure. A non-orthogonal tetrahedral coordinate basis does **not** make QuadCraft's physical geometry non-Euclidean; its forward map and distance are Euclidean in three dimensions.

## O

### Orientation (Tetrahedral)

The arrangement of a tetrahedron's vertices relative to a reference frame. A tetrahedron has four vertices in three-dimensional space. Browser labels Z/C denote experiment-specific shape constructions, not extra physical dimensions.

## P

### Pathfinding

Route search on a declared navigation graph. A twelve-step neighbor helper, raw coefficient Manhattan distance and eight-step game census describe different graphs; do not silently equate their distances or connectivity.

### Procedural Generation

Algorithmic creation of world/board content. The native terrain experiment and game-specific generators are separate implementations, not evidence of a common biome/structure API.

## Q

### Quadray Coordinates

Four coefficients `(a,b,c,d)` along tetrahedral basis directions, representing Euclidean 3D points **modulo a common additive offset**. They are not four independent Euclidean axes, distances from four vertices or fixed-sum barycentric weights. Normalizing by the minimum chooses a representative without changing the physical point. See [canonical quadrays](../quadray_coordinates.md).

## R

### Raw Game Label

A four-component record used as a game-state identifier without gauge reduction. [`GridUtils.key`](../../games/4d_generic/grid_utils.js) preserves its four inputs; `generateGrid(size)` enumerates `size^4` labels. Common-offset aliases can therefore be distinct board slots at one projected physical location. In contrast, `Quadray.toKey()` normalizes and rounds, and `generateCanonicalGrid(size)` enumerates zero-minimum integer representatives. These APIs are not interchangeable without changing game state semantics.

### Raycasting

Querying a ray for intersections. Native [`Input.h`](../../src/game/Input.h) samples world occupancy along a camera ray. Minecraft's [`hitTest`](../../games/4d_minecraft/js/minecraft_renderer.js) instead selects a projected square face in screen space; it is not a physical triangle-ray intersection.

### Regular Tetrahedron

A tetrahedron with six equal edges. The native `TetrahedralElement.getVertices()` offsets are not a regular tetrahedron despite their source comments: with `size=0.5`, squared edges 0–1 and 2–3 are `5/9` and `2/9`. Do not transfer ideal regular-tetrahedron volumes or tiling properties to that display model.

## S

### Space-Filling Tetrahedra

A claim requiring a specified tessellation. Congruent regular tetrahedra alone do not tile Euclidean 3D space. The ideal tetrahedral–octahedral honeycomb uses both regular tetrahedra and octahedra. Quadray labels or a tetrahedral display mesh alone do not demonstrate a gap-free voxel partition.

### Spatial Partitioning

Dividing data/space into regions for lookup and rendering. Native Cartesian chunks are one concrete example; an octree is a different structure and is not implied by chunking.

## T

### Tetrahedron

A polyhedron with four triangular faces, four vertices and six edges. “Tetrahedral” describes geometry, not a fourth spatial dimension.

### Tetrahedral Grid

An ambiguous informal name. Specify whether it means an ideal tetrahedral–octahedral honeycomb, lattice sites/contact edges, native chunk occupancy, or raw game labels. These have different boundaries and adjacency.

### Tetrahedral Meshing

Creating triangle meshes for tetrahedral models. Native [`ChunkMesher`](../../src/render/mesh/ChunkMesher.cpp) emits triangles from element vertices, insets them slightly and translates them by the Cartesian chunk origin. This render pipeline does not certify a space-filling tessellation or validate its geometry.

## V

### Vertex (Tetrahedral)

One of a tetrahedron's four corners. An occupied lattice site, a block center and a model vertex need not be the same object.

### Voxel

A volume element in a specified discretization. In QuadCraft, distinguish the intended voxel world from stored occupancy records and rendered markers. Do not infer measured solid volume from record count without a declared cell shape, scale and non-overlap rule.

## W

### World Generation

Creating terrain or a game's initial board. Consult the owning implementation; generated point locations do not alone establish tessellation, collision boundaries or a shared world format.

## Technical Concepts

### Entity Component System (ECS)

An architecture organizing entity data into components and systems. This is a general definition, not a claim that every native/browser/game path uses ECS.

### Frustum Culling

Rejecting objects outside the camera view volume. Native `Game::render()` applies a chunk bounding-sphere/frustum check; it is not exact per-face visibility or a UI occlusion test.

### Marching Tetrahedra

An isosurface-extraction technique subdividing a scalar field into tetrahedra. Native element-face emission is not marching tetrahedra.

### Model and Voxel Boundaries

A render model's triangles, a stored occupancy graph and the boundary of a union of physical cells are distinct. Native elements supply a four-vertex model; Minecraft renders projected square markers and derives graph statistics from stored labels. Its “Shared Faces”/“Exposed Faces” statistics use eight signed coefficient directions, not measured triangle contacts; “Center of Mass” is the equal-weight mean of stored block positions, not an integrated uniform-solid centroid. The `size^4` fill denominator and per-record volume assignment are model conventions, not measurements of unique physical FCC cells or a rendered solid. See [`minecraft_analysis.js`](../../games/4d_minecraft/js/minecraft_analysis.js).

### Octree

A spatial tree with eight children per internal node. Native chunk maps are not octrees; the term does not imply an implemented subsystem.

### Quaternion

A four-component algebraic representation used for 3D rotations. Four quaternion components do not mean four physical spatial axes. The browser painting experiment has a quaternion-camera path independent of its quadray position representation.

### SIMD (Single Instruction, Multiple Data)

Parallel arithmetic on multiple values per instruction. This general term is not evidence of explicit SIMD physics/render kernels in QuadCraft.

## Game-Specific Terms

### Biome

A region with shared environmental characteristics. Treat specific biome generation as implementation-dependent, not a universal feature of every game.

### Crafting

Combining inventory resources according to a recipe. The Minecraft page wires two real operations: one wood to four planks and one sand to one glass, implemented by `MinecraftBoard.craft`. This is not the earlier proposed rotatable tetrahedral recipe-grid UI.

### Tetrahedral Compass

A design term for a navigation display. Native F2 draws colored basis lines; the sandbox draws projected basis arrows. Neither is the fully featured compass-ring widget previously described in these docs.

### Tetrahedral Portal

A conceptual teleportation structure, not an established shared gameplay feature or API.

### Tetraforming

Informal design vocabulary for modifying a tetrahedral-themed environment. Concrete placement/removal behavior is defined separately by each controller/model.

### Tetravolume

Volume relative to a declared reference regular tetrahedron. In the native/shared Cartesian scale, a regular tetrahedron of edge 2 has Euclidean volume `2*sqrt(2)/3` and is assigned one tetra-unit; multiply Cartesian volume by `sqrt(9/8)`. Minecraft's analysis assigns `0.375` tetra-units per raw stored block record; this does not measure the native display tetrahedron or prove non-overlapping physical occupancy. See [volume conventions](../mathematics/ivm_synergetics.md).

### Tower Defense Path

A route used by the tower-defense game model. Its graph and traversal rules must come from that game's board/controller, not from an assumption that every quadray step crosses a physical tetrahedron face. See the [portfolio](../games.md).

## Coordinate & Grid Terms

### CCP (Cubic Close-Packed) / FCC (Face-Centered Cubic)

Names for the same ideal closest-packed equal-sphere center arrangement. Each site has twelve nearest contacts. Not all integer quadrays automatically form one FCC lattice: the full projected integer set is BCC-type; the twelve `GridUtils.DIRECTIONS` preserve component sum modulo four and act within an FCC-type sublattice. See [`grid_utils.js`](../../games/4d_generic/grid_utils.js) and [canonical coordinates](../quadray_coordinates.md).

### Cell Parity

`Quadray.cellType` in the shared game module labels a record `tetra` or `octa` from the parity of the rounded coefficient sum. This is a game classification helper, not a derivation of a unique physical cell decomposition, its face adjacency or its volume.

### Concentric Hierarchy

A Synergetics family of suitably scaled ideal polyhedra with relative volumes tetrahedron 1, cube 3, octahedron 4, rhombic dodecahedron 6 and cuboctahedron 20. These ratios require the reference geometry; they are not volumes of arbitrary same-edge models or automatic occupancy counts. See [IVM & Synergetics](../mathematics/ivm_synergetics.md).

### Cuboctahedron / Vector Equilibrium (VE)

A polyhedron with eight triangular and six square faces. The twelve nearest neighbors of an ideal FCC site form a cuboctahedral shell; radial and edge lengths agree. Its Synergetics reference volume is 20 tetra-units. See [IVM & Synergetics](../mathematics/ivm_synergetics.md).

## Mathematics & Physics Terms

### Hitscan

An attack resolved by a ray query without projectile travel time. This describes a possible game mechanic, not a shared physics/rendering API; consult the relevant game implementation.

### IVM (Isotropic Vector Matrix)

The ideal closest-packed lattice/contact framework associated with the tetrahedral–octahedral honeycomb. Distinguish its twelve contacts from the eight signed basis steps and from raw board labels. `GridUtils.neighbors` canonicalizes its twelve physical step results; raw-key maps need not merge all aliases. See [canonical quadrays](../quadray_coordinates.md).

### Jitterbug Transformation

A geometric transformation relating cuboctahedral configurations to other configurations, including an octahedral endpoint. Mentioning it is conceptual background, not evidence of an implemented UI animation or game mechanic.

### Octet Truss

A framework based on tetrahedral and octahedral units. It is geometric/engineering background, not a claim that QuadCraft simulates structural loads or realizes a maximum-efficiency physical structure.

### S3 Constant

`sqrt(9/8)`, used for the declared native/shared Cartesian-to-tetra-unit volume convention. A volume multiplier depends on coordinate scale and reference tetrahedron; it cannot be transferred unchanged to another embedding. It does not add a physical dimension or convert an arbitrary block count into solid volume. See [canonical contract](../quadray_coordinates.md) and [IVM volume conventions](../mathematics/ivm_synergetics.md).

### Synergetics

Buckminster Fuller's geometric/mensuration framework, used as conceptual background and in shared game constants/helpers. A philosophical association is not proof of the geometry, physics or gameplay claims of a particular implementation.

### Volume Ratio

A quotient of volumes under stated scaling and reference units. State whether the operands are ideal polyhedra, integrated solids, model cells or assigned per-record values.

## Development Terms

### Pheromone Trail

A concentration/trace metaphor used in ant-simulation gameplay. Specific deposition and movement rules belong to the SimAnt implementation, not a common quadray geometry contract.

### Run Script

A game launcher/server convenience script. See [games overview](../games.md) for actual entry points; the existence of a launcher does not establish a deployed game server.

### Standalone Architecture

Game-specific HTML entry points and controllers/renderers with reusable code under [`games/4d_generic/`](../../games/4d_generic/). “Standalone” does not mean no shared modules, no local HTTP serving or a self-contained single HTML file.

[Reference index](README.md) · [Canonical coordinates](../quadray_coordinates.md) · [UI documentation](../ui/README.md) · [Documentation index](../README.md)
