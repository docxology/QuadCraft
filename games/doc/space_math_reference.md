# Python quadray, projection and grid helpers

Source: [`src/space/`](../src/space/). These are floating-point helpers, not exact-rational geometry or a four-dimensional Euclidean model. The [canonical portfolio contracts](../../docs/games.md) own gauge, orientation and unit conventions; [suite interoperability](https://github.com/docxology/symergetics/blob/main/docs/synergetics-suite.md) covers exchange with the scientific packages.

## Quadray objects and metrics

```python
from games.src.space import Quadray, distance, angle_between

q = Quadray(1, 0, 0, 0)
xyz = q.to_xyz()
same_point = Quadray(2, 1, 1, 1)
physical_separation = distance(q, same_point)
```

`Quadray(a=0,b=0,c=0,d=0)` stores floats. Its `normalized()` subtracts the minimum coefficient, selecting a gauge rather than making a unit vector. `to_xyz()` and `from_xyz(x,y,z)` use the shared/native embedding; each coefficient-unit basis vector has XYZ norm `sqrt(3/2)`, not `1/sqrt(2)`. Common-offset aliases have zero physical distance.

| API | Behavior |
|---|---|
| `clone()`, `as_tuple()`, iteration/indexing | Copy or access four coefficients |
| `q1 + q2` | New normalized result |
| `q1 - q2`, `q * scalar`, `-q` | New raw result, no gauge reduction |
| `length()`, `distance_to(other)`, `distance(q1,q2)` | Embedded Cartesian Euclidean units, gauge-invariant |
| `equals(other, epsilon=1e-4)` | Compare normalized coefficients with tolerance |
| `to_key()` | Normalize then Python `round` each coefficient; not raw occupancy identity or nearest-FCC search |
| `Quadray.A/B/C/D`, `.BASIS`, `.ORIGIN` | Coefficient-unit basis and origin objects |
| `angle_between(q1,q2)` | XYZ dot-product angle in degrees; returns zero for a zero vector |
| `manhattan_4d(q1,q2)`, `euclidean_4d(q1,q2)` | Raw four-coefficient metrics, not physical distance |

Tolerance equality and rounded hashing are not a general exact-coordinate key scheme. Python half-even `round` differs from JavaScript `Math.round` at ties; do not assume cross-language snapped keys are interchangeable.

## Projection interfaces

`quadray_to_xyz(q)` and `xyz_to_quadray(x,y,z)` delegate to `Quadray`. `rotate_xyz(x,y,z,rot_x=0,rot_y=0)` applies Y then X rotation, angles in radians.

```python
from games.src.space import project_quadray, project_basis_axes

point = project_quadray(q, rot_x=0.5, rot_y=0.7, scale=35,
                       camera_dist=5, center_x=300, center_y=300)
axes = project_basis_axes(axis_len=2)
```

`project_quadray(q, *, rot_x=0, rot_y=0, scale=35, camera_dist=5, center_x=300, center_y=300)` returns `ScreenPoint(x,y,scale)`. Screen coordinates are pixels; the last field is the perspective multiplier. Camera distance is in embedded XYZ units. The Python function substitutes 1 at a zero perspective denominator and has no physical `target` option, unlike current browser projection; neither is a general clipping/occlusion engine. `project_basis_axes` takes the same keyword options plus `axis_len=2` and returns labeled/color-coded origin/tip records.

## Raw grids and canonical adjacency

`generate_grid(size)` returns all `size**4` raw `Quadray` labels in `[0,size)`; those are not all distinct physical points. `neighbors(a,b,c,d)` returns twelve normalized `Quadray` objects using permutations of `(0,1,1,2)`. `bounded_neighbors(...,size)` normalizes before checking component bounds with `in_bounds(a,b,c,d,size)`. These moves preserve component sum modulo four; the full canonical integer set contains separate residue sublattices. Do not replace a game's raw adjacency with this graph without auditing its rules.

`random_coord(size)` uses Python's global random generator for raw labels. `depth_sort(cells, project_fn=None)` returns new dictionaries with `quadray`, `px`, `py`, `pscale`, sorted ascending by `pscale`. Its callback receives four numbers and must return a dictionary (`x`, `y`, `scale`), not a `ScreenPoint` tuple. Without a callback it uses a raw coefficient-sum heuristic, not physical camera depth.

## Reference constants and bounded claims

`IVM` and `SYNERGETICS` name the same `SynergeticsConstants` instance, not a class. Constants include `TETRA_VOL=1`, `OCTA_VOL=4`, `CUBO_VOL=20`, `ICOSA_VOL≈18.512296`, `BASIS_LENGTH=sqrt(3/2)`, `D_OVER_R=2`, `PHI`, `S3=sqrt(9/8)`. `volume_xyz_to_ivm` multiplies by S3; the inverse divides. These reference volume units do not establish that arbitrary board slots tile physical space or each represent a regular tetrahedron.

`IVMGrid(frequency=1)` exposes formula-based `vertex_count`, `tetra_count`, `octa_count`, `edge_length`, `volume_tetra()` and `volume_octa()`. It does not generate or verify a mesh/tessellation. `Jitterbug.volume_at_angle(theta_deg)` is clamped piecewise-linear interpolation through its three stored reference volumes; `phases()` returns those reference records, not exact moving-polyhedron geometry.

`verify_round_trip(q,tolerance=0.01)` returns `CheckResult`. `verify_geometric_identities(tolerance=0.01)` returns `VerificationReport(checks)` with `all_passed`, `pass_count`, `summary()`. Checks cover basis norms/angles, origin, selected round trips, distance symmetry, triangle inequality, S3 and stored volume ratios. These numerical spot checks are neither formal proofs nor whole-game verification.

JavaScript uses `toCartesian`, `fromCartesian`, `subtract`, `GridUtils.neighbors`; do not copy invented `toXYZ`, `fromXYZ`, `sub`, or `getNeighbors` names into browser examples. See [actual browser APIs](shared_modules_reference.md).
