# CCP ball columns: range storage and surface enumeration

[Development index](README.md) · [JavaScript map](javascript_implementation.md) · [Sphere rendering](cone_plane_intersection_rendering.md)

## Scope and terminology

CCP means **cubic close packing**, the FCC arrangement with twelve touching neighbors per interior sphere. This page describes the geometry experiment in [`src/browser/index.html`](../../src/browser/index.html), not native chunk storage or all portfolio boards. [`QuadrayGrid4.html`](../../src/js/experiments/QuadrayGrid4.html) and [`indexOld_quadraygrid4.html`](../../src/browser/indexOld_quadraygrid4.html) preserve older variants.

In this experiment, `CCPBallGrid` represents occupied sphere centers using integer coordinates along three selected quadray directions: `QA = Directions.a`, `QS = Directions.s`, `QD = Directions.d`. Those local direction conventions must not be substituted for the portfolio's normalized `GridUtils.DIRECTIONS` without a coordinate conversion.

## Actual structures and interfaces

`CCPBallRange(i,j,k0,k1)` represents an immutable occupied run along D with **exclusive** endpoint `k1`. `CCPBallGrid` exposes `toASD(q)`, `fromASD(i,j,k)`, `addQuadray(q)`, `removeQuadray(q)`, `isSolid(i,j,k)`, `isSolidQ(q)` and `surfaceQuadrays(useSurfaceCacheInRanges=false)`.

`toASD` computes coordinates from quadray differences; `fromASD` combines the three basis directions and normalizes. Occupancy edits operate on the selected CCP lattice. They are not arbitrary real-valued volume membership tests. The source's `_key` and `isSolidQ` paths round their column/site coordinates; callers must use the experiment's own grid snapping.

## Storage changed between snapshots

Older snapshots store columns as `Map` entries keyed by `"i,j"`, with arrays of ranges. In the newer page, the `cols` field is commented out: `_get`/`_set` read and write column data under `NS.CCP.pu` in the Var tree using encoded `Lit$...` names. `_get` decodes cached range objects from the newest Var value when needed. The map-based recipes are therefore not the active storage interface for this newer page.

Adding/removing a ball changes the runs for its column; removal can split a run. A run encodes occupied interior points as well as its endpoints. It is not a triangle mesh and does not eliminate all interior computation.

## What “surface” currently costs

`NBR` contains twelve ASD neighbor offsets. A site is a surface site when fewer than twelve neighbors are occupied. `surfaceQuadrays()` returns quadrays for those sites.

The newer implementation explicitly disables its surface-cache branch with `false && useSurfaceCacheInRanges`; the active branch walks each occupied `k` in each stored run and tests neighbors. Thus storage may compress long runs, but current surface extraction can still cost the occupied volume. The UI checkbox is not proof that the faster cache branch is active. There is no measured constant-time lookup or universal surface-area complexity guarantee, and no benchmark numbers are asserted here.

## Rendering and collision consumers

The page collects the surface quadrays as Canvas drawables and sorts them with other geometry. [Sphere silhouette rendering](cone_plane_intersection_rendering.md) controls their screen shape. `CCPBallGrid::potenOfRollball` separately samples nearby ranges for exploratory ball repulsion; its source limits the neighborhood assumption to rolling balls no larger than CCP balls. Storage compression does not prove general collision correctness.

## Design considerations retained

Column runs are effective for coherent solids aligned with the chosen axes; scattered sites can require many short runs. A reliable surface cache would need correct invalidation in adjacent columns and after load/network replacement, plus equivalence checks against brute-force extraction. LOD, octrees, SIMD acceleration and arbitrary-region compression remain possible designs, not implemented layers of this API.

For native world partitioning use [Cartesian chunks](chunk_system.md). For raw-versus-canonical portfolio cells use [portfolio graph contracts](../games.md), not this experiment's internal ASD storage.
