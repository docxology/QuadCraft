# QuadCraft Quadrays: Embedding, Units, and Occupancy Contracts

This is the canonical coordinate contract for the development checkout. Four coefficients describe a **three-dimensional Euclidean point**, not four independent physical axes. The `4D` game names also refer to four-index game rules; those rules must not be confused with the rank of the physical embedding.

- [Mathematical derivation](mathematics/quadray_coordinates.md)
- [Tetrahedral geometry and model boundaries](mathematics/tetrahedral_geometry.md)
- [IVM volume units and game conventions](mathematics/ivm_synergetics.md)
- [Gameplay implementation boundaries](game_design/gameplay_overview.md)
- [Documentation index](README.md) · [Glossary](reference/glossary.md)

## Mathematical Foundation

Let $q=(a,b,c,d)$ and $\mathbf1=(1,1,1,1)$. Physical positions are equivalence classes

$$q\sim q+t\mathbf1.$$

The embedding has rank three and kernel $\operatorname{span}(\mathbf1)$. No fixed component sum is required. `normalized()` subtracts the minimum component, yielding a nonnegative representative with at least one zero; it does **not** normalize length or impose a sum of one. Barycentric weights within a specified tetrahedron are a different construction.

## Implementation in QuadCraft

The relevant implementations are separate, not interchangeable modules:

| Implementation | Forward result | Inverse call | Important distinction |
| --- | --- | --- | --- |
| [Native `Quadray`](../src/core/coordinate/Quadray.h) | `Vector3` | `Quadray::fromCartesian(Vector3)` | Float coefficients; `normalized`, `length`, `magnitude`, `distance`, addition and scalar multiplication |
| [Shared game `Quadray`](../games/4d_generic/quadray.js) | `{x,y,z}` | `Quadray.fromCartesian(x,y,z)` | Also `toIVM`, `toKey`, normalized approximate `equals`; game storage need not use these keys |
| [Modular browser experiment](../src/js/experiments/browser/js/math/quadray.js) | `[x,y,z]` | `Quadray.fromCartesian([x,y,z])` | Browser globals, deduplication and raw-component `equals`; not the shared game module |

The monolithic [browser experiment](../src/browser/index.html) is another entrypoint. Do not assume that its controls, globals or persistence are features of every portfolio game.

## Coordinate Conversion

### Quadray to XYZ Conversion

Native and shared-game coordinates use

$$
E(q)=\frac1{\sqrt2}(a-b-c+d,\ a-b+c-d,\ a+b-c-d).
$$

The four coefficient-unit directions have Cartesian length $\sqrt{3/2}$, pairwise dot product $-1/2$, and endpoint-to-endpoint distance $2$. These are not unit-length orthogonal axes.

QuadMath and symergetics use the scale-one convention

$$(X,Y,Z)=(a-b-c+d,\ a+b-c-d,\ a-b+c-d).$$

Thus QuadCraft has $(x,y,z)=(X,Z,Y)/\sqrt2$: the axis swap reverses orientation, lengths scale by $1/\sqrt2$, squared lengths by $1/2$, and unsigned volumes by $1/(2\sqrt2)$. See the [suite unit mapping](https://github.com/docxology/symergetics/blob/main/docs/synergetics-suite.md).

### XYZ to Quadray Conversion

The source computes four sign-split sums, divides by $\sqrt2$, then subtracts their minimum. Algebraically this is equivalent to taking

$$
\nu=\frac1{2\sqrt2}(x+y+z,\ -x-y+z,\ -x+y-z,\ x-y-z),
\qquad q=\nu-\min_i\nu_i\,\mathbf1.
$$

The sign-split result differs from $\nu$ only by a common offset. In exact arithmetic $E(q)=(x,y,z)$ and inverse-after-forward returns the minimum-zero representative, **not necessarily the original tuple**. Native floats and JavaScript numbers introduce rounding. This continuous inverse is not an integer snap or a nearest-lattice search.

## Normalization

For example, `(2,1,1,1)` normalizes to `(1,0,0,0)`; both map to $(1,1,1)/\sqrt2$. `(1,1,1,1)` is the physical origin. A raw game may nevertheless store the two labels `(0,0,0,0)` and `(1,1,1,1)` separately.

The physical metric for a difference $\Delta$ is

$$d^2=\|E(\Delta)\|^2=2\sum_i\Delta_i^2-\frac12\left(\sum_i\Delta_i\right)^2.$$

Do not use the ordinary four-component norm for physical distances. Common-offset differences have zero physical length.

## Native World Occupancy

[World](../src/core/world/World.h) converts quadrays to Cartesian coordinates and floors each Cartesian coordinate divided by `TetraChunk::CHUNK_SIZE` (16) to select a **cubic Cartesian chunk**. Chunk-local coordinates subtract that chunk's Cartesian origin and pass through the continuous inverse.

[TetraChunk](../src/core/world/TetraChunk.h) stores non-air elements in a map keyed by minimum-zero floating quadrays. Its hash combines exact component hashes; its comparator uses a `1e-5` tolerance. This is not integer quantization, nor a general guarantee of reliable approximate-key lookup: nearby floats can compare equal while hashing differently. Canonicalization removes the mathematical common-offset ambiguity but does not eliminate floating-point limitations.

## Usage Across Games

The [shared game module](../games/4d_generic/quadray.js) provides physical conversion, distance, and helpers, but **board occupancy belongs to each game**. For example, [MinecraftBoard](../games/4d_minecraft/js/minecraft_board.js) uses literal comma-separated `GridUtils.key(a,b,c,d)` strings. Common-offset aliases can hold different blocks while projecting to the same physical point. Its raw slot count is not a count of distinct physical voxels.

`Quadray.toKey()` instead normalizes then rounds components. `Quadray.toIVM(q)` normalizes, uses `Math.round` componentwise (ties upward), and normalizes again. Neither performs an XYZ-nearest FCC search. [GridUtils](../games/4d_generic/grid_utils.js) also has raw four-component `manhattan`/`euclidean` functions; those describe label differences, not the physical metric above.

## Tetrahedral Elements

A coordinate is a point or anchor, not a volume cell. Native [TetrahedralElement](../src/core/world/TetrahedralElement.h) adds a fixed four-vertex shape around an anchor. Game parity labels (`tetra`/`octa`), displayed polyhedra, native tetrahedra and raw board slots are distinct concepts. See [geometry](mathematics/tetrahedral_geometry.md#implementation-in-quadcraft) before inferring face adjacency, nonoverlap, containment or a space-filling tiling.

## The S3 Constant

For the ideal regular tetrahedron formed by the four coefficient-unit endpoints, edge length is 2 and Euclidean volume is $2\sqrt2/3$. Defining that tetrahedron as one native IVM tetra-unit gives

$$V_{\mathrm{IVM}}=\frac{3}{2\sqrt2}V_{\mathrm{QC}}=S_3V_{\mathrm{QC}},\qquad S_3=\sqrt{9/8}.$$

This is a declared mensuration convention, not a fourth-dimensional volume or evidence of a mass/density engine. For scale-one suite XYZ the factor is $3/8$. Game `cellVolume() = 0.375` is a separate per-slot accounting convention, not the measured mesh volume; see [the full unit derivation](mathematics/ivm_synergetics.md#the-s3-constant).

## Advantages of Quadray Coordinates in QuadCraft

Redundant coefficients expose tetrahedral symmetry and common-offset equivalence. They do not by themselves provide exact floating-point arithmetic, collision detection, a validated honeycomb, or faster rendering. Those properties require separate implementation and evidence.
