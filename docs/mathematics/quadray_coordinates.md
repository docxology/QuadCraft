# Quadray Mathematics: Rank-Three Geometry and Gauge-Invariant Distance

Four quadray coefficients describe ordinary Euclidean 3D geometry. This page derives the mathematics; the [canonical implementation contract](../quadray_coordinates.md) specifies source signatures, units, rounding and occupancy. [Mathematics index](README.md) · [Geometry](tetrahedral_geometry.md) · [IVM units](ivm_synergetics.md).

## Mathematical Foundation

### Basis Vectors

QuadCraft embeds the coefficient directions as

$$
e_a=(1,1,1)/\sqrt2,\quad e_b=(-1,-1,1)/\sqrt2,\quad
 e_c=(-1,1,-1)/\sqrt2,\quad e_d=(1,-1,-1)/\sqrt2.
$$

Each has length $\sqrt{3/2}$; distinct directions have dot product $-1/2$. Their mutual angle is $\arccos(-1/3)\approx109.47^\circ$. Their sum is zero, so they are a redundant generating frame, not four linearly independent basis vectors. Replacing the denominator by $\sqrt3$ would produce a different, unit-length convention, not the native implementation.

### Properties of Quadray Coordinates

For $\mathbf1=(1,1,1,1)$, $E(q+t\mathbf1)=E(q)$. Conversely, equal Cartesian images differ by a common offset. The physical space is $\mathbb R^4/\operatorname{span}(\mathbf1)$, of rank three. No fixed component sum is imposed on arbitrary quadrays.

Two useful choices of representative are:

- **Minimum zero:** $N(q)=q-\min_iq_i\mathbf1$. Components are nonnegative and at least one is zero.
- **Sum zero:** $P(q)=q-\tfrac14(\sum_iq_i)\mathbf1$. Components may be negative.

These represent the same point. The minimum-zero sum varies with the point; it is not generally zero or one. Neither gauge is unit-vector normalization.

### Algebraic Formulation

$$
E(q)=\frac1{\sqrt2}
\begin{bmatrix}1&-1&-1&1\\1&-1&1&-1\\1&1&-1&-1\end{bmatrix}q.
$$

The matrix has kernel $\operatorname{span}(\mathbf1)$ and Gram matrix $2I-\tfrac12\mathbf1\mathbf1^T$. This explains both redundancy and the metric below.

## Conversion Between Coordinate Systems

### Cartesian to Quadray

A sum-zero inverse is

$$
q_0=\frac1{2\sqrt2}(x+y+z,-x-y+z,-x+y-z,x-y-z).
$$

The native/shared inverse returns $N(q_0)$ using equivalent sign-split expressions. This is a continuous inverse of the rank-three embedding, not an inverse into four independent coordinates. It does not round or snap to a lattice. See [actual method signatures](../quadray_coordinates.md#implementation-in-quadcraft).

### Quadray to Cartesian

$$
x=(a-b-c+d)/\sqrt2,\quad y=(a-b+c-d)/\sqrt2,\quad z=(a+b-c-d)/\sqrt2.
$$

For the suite scale-one map $(X,Y,Z)$, native $(x,y,z)=(X,Z,Y)/\sqrt2$. Preserve this orientation and scale when comparing lengths, signed determinants or volumes across projects.

## Normalization

Examples are exact mathematical statements, not runtime test receipts:

| Tuple | Minimum-zero representative | Native Cartesian image |
| --- | --- | --- |
| `(0,0,0,0)` | `(0,0,0,0)` | `(0,0,0)` |
| `(1,1,1,1)` | `(0,0,0,0)` | `(0,0,0)` |
| `(2,1,1,1)` | `(1,0,0,0)` | `(1,1,1)/sqrt(2)` |
| `(0.5,0.5,0,0)` | unchanged | `(0,0,1/sqrt(2))` |

The last row is the midpoint between coefficient endpoints $e_a$ and $e_b$. `(1,1,0,0)` is their **sum**, not their midpoint. The centroid of all four endpoints is the physical origin, represented by `(0.25,0.25,0.25,0.25)` or any common-offset tuple.

## Computational Implementation Details

### Hashing Strategy

Canonicalization and storage are separate contracts. Native [TetraChunk](../../src/core/world/TetraChunk.h) hashes minimum-zero **float** components; it does not quantize them to integers. Its epsilon comparator and exact hash can disagree for nearby values. Shared-game `Quadray.toKey()` normalizes and rounds, whereas `GridUtils.key()` stores the raw tuple. See [occupancy distinctions](../quadray_coordinates.md#native-world-occupancy); do not substitute one key policy for another without changing game semantics.

### Equality Checks

Mathematically $q\sim r$ iff $N(q)=N(r)$. Implementations differ: shared-game `equals` compares normalized components approximately, while the modular browser experiment compares raw components exactly. Numerical equality and raw game-label identity are not universal geometric predicates.

## Distance Calculation

For $\Delta=q-r$,

$$
\begin{aligned}
d^2&=\frac{(\Delta a-\Delta b-\Delta c+\Delta d)^2+(\Delta a-\Delta b+\Delta c-\Delta d)^2+(\Delta a+\Delta b-\Delta c-\Delta d)^2}{2}\\
&=2\sum_i\Delta_i^2-\tfrac12(\sum_i\Delta_i)^2
=2\|P(\Delta)\|_2^2.
\end{aligned}
$$

This is positive definite on equivalence classes, but only semidefinite on raw quadruples: any common-offset difference has zero length. A coefficient-unit direction has length $\sqrt{3/2}$ and distinct coefficient endpoints are distance $2$ apart. Raw coefficient $L^1$/$L^2$ metrics can be legitimate game-label heuristics, but are not this physical metric.

## Tetrahedral Grid System

Integer coefficients alone do not specify a tetrahedral-octahedral cell complex. Their complete physical image has $\sqrt2(x,y,z)$ integral with all three coordinates of the same parity: a BCC-type point set. A chosen FCC contact subset or honeycomb needs additional lattice/cell definitions.

The shared game's `IVM_DIRECTIONS` are eight signed single-coefficient steps. The 12-vector closest-packing contact set is different: the permutations of `(0,1,1,2)` give native vectors of the form $(0,\pm\sqrt2,\pm\sqrt2)$ and coordinate permutations, each of length 2. Neither set establishes mesh face adjacency by itself. See [IVM connection](ivm_synergetics.md#connection-to-quadcraft).

## Applications in QuadCraft

Coordinates supply anchors for native elements, Cartesian camera positions and projected game labels. Native ray interaction samples a Cartesian ray and queries stored keys; it is not an exact ray/tetrahedron intersection algorithm. In Minecraft, selection is a renderer screen hit test on raw slots. These are different consumers of the same point embedding, not a common physics engine.

## The S3 Constant

The ideal regular tetrahedron with vertices $e_a,e_b,e_c,e_d$ has edge 2, Cartesian volume $2\sqrt2/3$ and declared native IVM volume 1. Hence $S_3=3/(2\sqrt2)$. [IVM units](ivm_synergetics.md#the-s3-constant) derives this convention and separates game accounting from geometric volume.

## Advantages of Quadray Coordinates

Quadrays expose tetrahedral symmetry, convenient polyhedral labels and a simple common-offset gauge. They remain coordinates for Euclidean space; oblique axes do not create non-Euclidean curvature, a fourth physical dimension, a collision solver or automatic computational savings.
