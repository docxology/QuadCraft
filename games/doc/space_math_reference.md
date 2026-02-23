# Space Math Reference — `src/space/`

> **Note on 4D Geometry & Nomenclature**: Throughout QuadCraft, whenever we refer to **"4D"**, we strictly mean **Synergetics** geometry. This entails **Quadray 4D tetrahedral coordinates** deployed on an **Isotropic Vector Matrix (IVM)** of close-packed spheres, where the Quadray coordinates of the 12 neighboring balls are strictly defined by all permutations of `(0, 1, 1, 2)`.


> Python implementation of Quadray, IVM, XYZ, and geometry math — parity with the JavaScript foundation in `4d_generic/`.

---

## Package Structure

```text
src/space/
├── __init__.py      # Re-exports all public symbols (16 total)
├── quadrays.py      # Quadray coordinate class
├── ivm.py           # IVM constants (SYNERGETICS)
├── xyz.py           # Cartesian ↔ Quadray transforms, projection, rotation
└── geometry.py      # Angles, distances, verification suite, grid generation
```

---

## `quadrays.py` — Quadray Class

4D tetrahedral coordinates `(a, b, c, d)` with four basis vectors from the centre of a regular tetrahedron.

### Class: `Quadray`

```python
from games.src.space import Quadray

q = Quadray(1, 0, 0, 0)
print(q.to_xyz())              # (0.7071, 0.7071, 0.7071)
print(Quadray.from_xyz(1, 0, 0))  # Normalized Quadray
```

| Method / Property | Returns | Description |
|-------------------|---------|-------------|
| `Quadray(a, b, c, d)` | `Quadray` | Construct from 4 floats |
| `.clone()` | `Quadray` | Independent copy |
| `.normalized()` | `Quadray` | Zero-minimum normalization (min component → 0) |
| `.to_xyz()` | `(x, y, z)` | Convert to Cartesian via tetrahedron-vertex mapping |
| `Quadray.from_xyz(x, y, z)` | `Quadray` | Classmethod: Cartesian → normalized Quadray |
| `+`, `-`, `*`, `-q` | `Quadray` | Arithmetic (addition normalizes; subtraction preserves sign) |
| `.length()` | `float` | `√((a²+b²+c²+d²)/2)` |
| `.distance_to(other)` | `float` | Euclidean distance |
| `.equals(other, ε=1e-4)` | `bool` | Tolerance-based equality after normalization |
| `.to_key()` | `str` | Integer-rounded key for hash maps |
| `.as_tuple()` | `(a,b,c,d)` | Sequence interface |
| `len(q)` → `4` | `int` | Always 4 |

### Basis Vectors

| Constant | Value | Description |
|----------|-------|-------------|
| `Quadray.A` | `(1, 0, 0, 0)` | Basis vector A |
| `Quadray.B` | `(0, 1, 0, 0)` | Basis vector B |
| `Quadray.C` | `(0, 0, 1, 0)` | Basis vector C |
| `Quadray.D` | `(0, 0, 0, 1)` | Basis vector D |
| `Quadray.ORIGIN` | `(0, 0, 0, 0)` | Origin |
| `Quadray.BASIS` | `[A, B, C, D]` | All four basis vectors |

### Key Constants

| Name | Value | Formula |
|------|-------|---------|
| `ROOT2` | `1.4142...` | `√2` |
| `S3` | `1.0607...` | `√(9/8)` |

---

## `ivm.py` — IVM Constants

Isotropic Vector Matrix constants from Buckminster Fuller's Synergetics.

### Class: `IVM`

| Constant | Value | Description |
|----------|-------|-------------|
| `IVM.TETRA_VOL` | `1.0` | Tetrahedron volume (unit) |
| `IVM.OCTA_VOL` | `4.0` | Octahedron = 4× tetrahedron |
| `IVM.ICOSA_VOL` | `≈18.51` | Icosahedron volume |
| `IVM.CUBOCTA_VOL` | `20.0` | Cuboctahedron = 20× tetrahedron |
| `IVM.PHI` | `1.6180...` | Golden ratio `(1+√5)/2` |
| `IVM.D_TO_R` | `0.9994...` | D-unit → R-unit conversion factor |

### Alias: `SYNERGETICS`

`SYNERGETICS` is an alias for `IVM` — both are exported and equivalent.

---

## `xyz.py` — Coordinate Transforms

| Function | Signature | Description |
|----------|-----------|-------------|
| `quadray_to_xyz` | `(q: Quadray) → (x,y,z)` | Quadray → Cartesian |
| `xyz_to_quadray` | `(x,y,z) → Quadray` | Cartesian → normalized Quadray |
| `project_quadray` | `(a,b,c,d, rot_x, rot_y, zoom) → (px, py, scale)` | 4D → 2D screen coords with rotation + perspective |
| `rotate_xyz` | `(x,y,z, rot_x, rot_y) → (x',y',z')` | Apply 3D rotation matrix |

---

## `geometry.py` — Geometry Functions

### Distance & Angle

| Function | Signature | Description |
|----------|-----------|-------------|
| `angle_between` | `(q1, q2) → float` | Angle in degrees between two Quadrays (via Law of Cosines) |
| `distance` | `(q1, q2) → float` | Native Quadray Euclidean distance (IVM length) |
| `manhattan_4d` | `(q1, q2) → float` | Manhattan distance over 4 components |
| `euclidean_4d` | `(q1, q2) → float` | Raw 4-component Cartesian-equivalent Euclidean |

### Grid Operations

| Function | Signature | Description |
|----------|-----------|-------------|
| `generate_grid` | `(size: int) → list[Quadray]` | All cells in `size⁴` integer grid |
| `in_bounds` | `(a,b,c,d, size) → bool` | Bounds check `[0, size)` |
| `neighbors` | `(a,b,c,d) → list[tuple]` | 12 kissing neighbours (unbounded) |
| `bounded_neighbors` | `(a,b,c,d, size) → list[tuple]` | In-bounds neighbours only |
| `depth_sort` | `(cells, project_fn?) → list[dict]` | Painter's algorithm sort |
| `random_coord` | `(size) → Quadray` | Random integer Quadray in `[0, size)` |

### Directions

```python
DIRECTIONS = [
    (1,0,0,0), (-1,0,0,0),
    (0,1,0,0), (0,-1,0,0),
    (0,0,1,0), (0,0,-1,0),
    (0,0,0,1), (0,0,0,-1),
]
```

### Verification Suite

```python
from games.src.space.geometry import verify_geometric_identities

report = verify_geometric_identities(tolerance=0.01)
print(report.summary())
assert report.all_passed
```

**8-Check Suite:**

| # | Check | Expected |
|---|-------|----------|
| 1 | Basis vector lengths | ≈ `0.7071` |
| 2 | Tetrahedral angles | ≈ `109.47°` |
| 3 | Octahedral complement | ≈ `90°` |
| 4 | Opposite pair distance | ≈ `1.4142` |
| 5 | Round-trip fidelity | `Quadray → XYZ → Quadray` identity |
| 6 | Triangle inequality | `d(A,B) + d(B,C) ≥ d(A,C)` |
| 7 | S3 constant validation | `√(9/8) ≈ 1.0607` |
| 8 | Volume ratios | `1 : 4 : 20` (Tetra : Octa : Cubocta) |

### Data Classes

| Class | Purpose |
|-------|---------|
| `CheckResult` | Single check: `name`, `description`, `expected`, `actual`, `passed` |
| `VerificationReport` | Collection of CheckResults: `all_passed`, `pass_count`, `summary()` |

---

## JS ↔ Python Parity Matrix

| Capability | JavaScript (`4d_generic/`) | Python (`src/space/`) |
|-----------|---------------------------|----------------------|
| Quadray class | `quadray.js` → `Quadray` | `quadrays.py` → `Quadray` |
| Normalization | `.normalized()` | `.normalized()` |
| XYZ conversion | `.toXYZ()` / `Quadray.fromXYZ()` | `.to_xyz()` / `Quadray.from_xyz()` |
| Arithmetic | `.add()` / `.sub()` / `.scale()` | `+` / `-` / `*` operators |
| Distance | `.distanceTo()` | `.distance_to()` |
| Key generation | `.toKey()` | `.to_key()` |
| IVM constants | `SYNERGETICS.*` | `IVM.*` / `SYNERGETICS.*` |
| Verification | `verifyGeometricIdentities()` | `verify_geometric_identities()` |
| Grid generation | `GridUtils.generateGrid()` | `generate_grid()` |
| Neighbours | `GridUtils.getNeighbors()` | `neighbors()` |
| Depth sort | `GridUtils.depthSort()` | `depth_sort()` |
| Projection | `projectQuadray()` | `project_quadray()` |

---

*See also: [shared_modules_reference.md](shared_modules_reference.md) · [architecture.md](architecture.md) · [testing_guide.md](testing_guide.md)*
