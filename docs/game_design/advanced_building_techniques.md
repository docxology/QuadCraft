# Building Exercises: Quadray Symmetry, Paths, and Explicit Limits

These are geometric exercises and design ideas, not instructions for implemented rotation tools, geodesic generators or structural simulation. For actions available in a running entrypoint, use [controls](controls_and_navigation.md) and [block models](block_system.md). The [coordinate contract](../quadray_coordinates.md) defines physical points and raw game slots.

[Design index](README.md) · [Geometry](../mathematics/tetrahedral_geometry.md) · [UI](../ui/user_interface.md).

## Tetrahedral Geometry Principles

### Slopes and Angles

An ideal regular tetrahedron has equilateral triangle faces, a $70.53^\circ$ interior dihedral angle and $109.47^\circ$ between center-to-vertex directions. None of these makes every visible slope $60^\circ$: slope depends on orientation and the chosen vertical axis. The current native element's fixed offsets are not regular; portfolio Minecraft displays projected square markers, not a face-matched tetrahedral mesh.

Regular tetrahedra alone do not tile Euclidean space. A tetrahedral-octahedral honeycomb needs an explicit cell complex, and a parity label cannot establish its face connections. Oblique coordinates are not non-Euclidean geometry.

### Structural Integrity

Triangulated frameworks can be mechanically useful, but stability depends on joints, dimensions, material behavior, loads and support conditions. QuadCraft's geometry does not implement a structural-integrity solver. Unsupported placements are not a strength experiment, and visual interlocking is not proof of load-bearing contact.

## Building Patterns

### The Helix

A mathematical helix can be sampled as

$$p(t)=(R\cos t,\ ht,\ R\sin t).$$

Choosing radius $R$, pitch parameter $h$ and a sample interval gives a point path in Cartesian space. The continuous inverse converts each point to quadrays; any later grid snapping changes the path and may duplicate points. This is a construction description, not an existing helix tool or a claim that repeating $60^\circ$ block rotations produces a walkable stair.

Portfolio Minecraft's plain-click action only adds `+C` above a selected label. It does not directly accept arbitrary sampled Cartesian positions or perform face rotations. Creating this pattern there would require model-level changes or a separately designed editor, not an undocumented shortcut.

### The Geodesic Dome

Extending from the origin along four coefficient directions and connecting the tips constructs a tetrahedral frame, not a geodesic sphere. A dome approximation requires a spherical sampling/subdivision scheme, explicit triangles and a boundary cut; a four-point construction cannot supply it.

A useful geometry exercise is instead to compare the four ideal coefficient endpoints, each at radius $\sqrt{3/2}$, with the 12 contact directions of [GridUtils](../../games/4d_generic/grid_utils.js), each at radius 2. They are different point sets and do not define the same spherical shell.

### Smooth Tunnels

Following a single coefficient direction makes a straight physical line. Alternating directions makes a piecewise-linear path; it does not guarantee smooth walls, traversable clearance or uniform width. For example, `+A,+B` has combined physical displacement `(0,0,sqrt(2))`, while `+A,+B,+C,+D` returns to the same physical point.

A raw-label game may still regard the latter endpoint as another slot. Before evaluating a tunnel or loop, choose whether it is a path through physical canonical points or through raw game labels. A coordinate path alone is not a carved solid or collision-tested passage.

## Material Usage

Native registry flags and portfolio block names differ. Minecraft supplies stone, dirt, grass, wood, leaves, water, sand, diamond, planks and glass; keys `1`–`9` and `0` select these ten IDs. Glass has a translucent display color. No durability, wood strength, optical transmission or physical void-filling performance should be inferred from these names.

The [Minecraft page](../../games/4d_minecraft/index.html) includes real Craft Planks/Glass buttons for fixed inventory recipes. Board-callable sand/water updates exist, but the default controller does not automatically advance them. This is not a general construction-material simulator.

## Tips for Exploring Geometry

1. Rotate the view to distinguish projection overlap from spatial proximity; physically coincident common-offset aliases will remain coincident.
2. Compare raw tuples with their minimum-zero representatives before counting distinct positions.
3. Use `Quadray.distance` for native Cartesian distance, not the raw four-component norm or game-label Manhattan distance.
4. Label any volume calculation with its reference edge, embedding and whether it counts records or integrates an actual solid.
5. Treat visual symmetry separately from construction availability. The regular tetrahedron has 12 proper rotational symmetries and 24 symmetries including reflections—not a universal “four-fold rotation” about every axis.

These exercises can support an educational design discussion. They do not constitute measured learning outcomes, a tutorial-progression system or guaranteed easier building than cubic voxels.
