# Technical Supplement: Dimensional Conversion Between XYZ and Quadray/IVM Coordinate Systems

Here "dimensional conversion" means conversion of a redundant coordinate representation and, separately, declared measurement units. It does **not** mean projecting four independent physical dimensions into three. This supplement derives the development checkout's convention from [native `Quadray.h`](../../src/core/coordinate/Quadray.h) and [shared `quadray.js`](../../games/4d_generic/quadray.js).

For maintained definitions, use the [canonical coordinate contract](../quadray_coordinates.md), [quadray mathematics](../mathematics/quadray_coordinates.md), and [IVM units](../mathematics/ivm_synergetics.md). Return to the [papers index](README.md).

## Mathematical Foundation of Quadray Coordinates

Let $E$ have columns $(1,1,1)/\sqrt2$, $(-1,-1,1)/\sqrt2$, $(-1,1,-1)/\sqrt2$, and $(1,-1,-1)/\sqrt2$. Their sum is zero; any three are independent. The physical vector space is the rank-three quotient $\mathbb R^4/\operatorname{span}\{\mathbf1\}$, with $\mathbf1=(1,1,1,1)$.

### Key Properties

$E(q+t\mathbf1)=Eq$. Minimum-zero normalization $N(q)=q-\min(q)\mathbf1$ chooses a nonnegative representative; zero-sum normalization subtracts the mean. Neither a fixed sum nor nonnegativity is an intrinsic restriction on the physical vector. A sum-one affine representative can be obtained by **adding** $(1-\sum_iq_i)\mathbf1/4$. Dividing the tuple by its sum instead rescales the physical vector and is not an equivalent normalization.

## Coordinate Conversion Formulas

### XYZ to Quadray Conversion

A zero-sum inverse representative is

$$r=\frac1{2\sqrt2}(x+y+z,-x-y+z,-x+y-z,x-y-z).$$

For minimum-zero output, use $N(r)$. The actual native/shared implementation instead computes, with $u_+=\max(u,0)$,

$$s=\frac1{\sqrt2}\bigl(x_++y_++z_+,\ (-x)_++(-y)_++z_+,\ (-x)_++y_++(-z)_+,\ x_++(-y)_++(-z)_+\bigr),$$

then returns $N(s)$. Since

$$s=r+\frac{|x|+|y|+|z|}{2\sqrt2}\mathbf1,$$

both yield the same representative in exact arithmetic. This explains the source's positive-part inverse rather than replacing it with an incompatible scale. Neither inverse performs integer rounding or a nearest-lattice search.

### Quadray to XYZ Conversion

$$x=(a-b-c+d)/\sqrt2,\quad y=(a-b+c-d)/\sqrt2,\quad z=(a+b-c-d)/\sqrt2.$$

The matrix satisfies $EE^T=2I_3$ and $E^TE=2I_4-\mathbf1\mathbf1^T/2$. Thus $Er=(x,y,z)$ and inverse-after-forward recovers the same equivalence class, not necessarily the original raw tuple. Native float arithmetic and JavaScript numbers introduce ordinary floating-point limitations.

A coefficient-unit generator has length $\sqrt{3/2}$. The regular tetrahedron on the four generator endpoints has edge 2. These units and this axis order must accompany copied formulas; other source conventions can be perfectly valid but numerically different.

## The S3 Conversion Constant

### Definition and Value

The sources define $S3=\sqrt{9/8}=3/(2\sqrt2)\approx1.06066017$. Its interpretation requires a reference solid and length units. A regular tetrahedron of Cartesian edge $L$ has volume

$$V_{\rm XYZ}(L)=\frac{L^3}{6\sqrt2}.$$

With the edge-2 tetrahedron assigned one tetravolume, $V_{\rm XYZ}=2\sqrt2/3$ for that reference solid, so its reciprocal is $S3$.

### Dimensional Conversion Formulas

Under **that** reference convention,

$$V_{\rm tet}=S3\,V_{\rm XYZ},\qquad V_{\rm XYZ}=V_{\rm tet}/S3.$$

There is no canonical length or area conversion obtained by taking $S3^{1/3}$ or $S3^{2/3}$. A choice of volume unit need not be the cube of a chosen linear unit. Both coordinate descriptions already refer to the same physical Euclidean lengths and areas once $E$ is declared. If a different global length unit is chosen explicitly, lengths, areas, and volumes scale by its first, second, and third powers; that is a separate operation.

The redundant $3\times4$ matrix has no ordinary four-dimensional volume determinant. A change to four coefficients does not itself alter physical volume.

## Metric Operations in Quadray Coordinates

### Length Calculation

For arbitrary $q$, the squared physical length is

$$\|Eq\|^2=2\sum_iq_i^2-\frac12\Bigl(\sum_iq_i\Bigr)^2.$$

For a zero-sum representative this becomes $2\sum_iq_i^2$. Consequently the length is $\sqrt{2\sum_iq_i^2}$, not $\sqrt{\sum_iq_i^2/2}$. The formula is gauge-invariant and gives zero for every common-offset tuple.

### Vector Operations

Addition, subtraction, and scaling are component-wise on quotient classes. Minimum-zero normalization may be applied afterward. Negation is $[-q]$, canonically $\max(q)\mathbf1-q$.

The QC dot product is

$$\langle Eq,Ep\rangle=2\sum_iq_ip_i-\frac12\Bigl(\sum_iq_i\Bigr)\Bigl(\sum_ip_i\Bigr).$$

For zero-sum representatives it is $2\sum_iq_ip_i$. Tom Ace's [primary C++ account](https://www.minortriad.com/quadray.html) declares **unit-length** generators, yielding factor $4/3$ instead. That is a different unit choice, not a second QC metric.

## Python Implementation

This supplement defines mathematics, not an installed QuadCraft Python `Vector`/`Qvector` API. Historical Python examples use their own embeddings, constructor conventions, and numeric types. Match the forward map and units before adapting any such implementation. The actual native and shared game classes linked above are separate implementations.

[`GridUtils`](../../games/4d_generic/grid_utils.js) also provides raw four-component Manhattan and Euclidean distances. Those are label-space quantities, not physical distance under $E$. Its `generateGrid` and `key` retain raw aliases; `generateCanonicalGrid` and canonical neighbors operate on gauge-reduced points. Native [`World`](../../src/core/world/World.h) instead uses Cartesian chunk keys and chunk-local quadrays; [`TetraChunk`](../../src/core/world/TetraChunk.h) uses normalized float hashes with epsilon equality, not integer quantization.

## Volumetric Calculations and S3

For actual tetrahedron vertices $v_0,\ldots,v_3$, first calculate

$$V_{\rm XYZ}=\frac{|\det(v_1-v_0,v_2-v_0,v_3-v_0)|}{6}.$$

Only then apply a declared volume-unit conversion. The shared `Quadray.cellVolume()` returns the gameplay constant 0.375. Although $(1/\sqrt2)^3S3=3/8$ arithmetically, that constant is not a geometric proof of the volume of every element, board slot, or rendered tetrahedron. In particular, [`TetrahedralElement::getVertices`](../../src/core/world/TetrahedralElement.h) uses its own nonregular offsets; it is not the edge-2 reference tetrahedron.

### September 2024 Developments

The linear-combination interpretation is already explicit in Urner's [1997 *Quadrays and XYZ*](https://www.grunch.net/synergetics/quadxyz.html): choose scale and orientation, then sum each generator's Cartesian contribution. It is not necessary to attribute this linearity to a new September 2024 algorithm. The historical source's procedural forward and positive-part inverse formulas agree with the convention derived above. Later implementations still need their own scale checked.

## Geometric Interpretations

The four permutations of $(1,0,0,0)$ give the edge-2 generator tetrahedron; the four permutations of $(0,1,1,1)$ give its inverse. The six permutations of $(1,1,0,0)$ give an octahedron of edge 2. The twelve permutations of $(0,1,1,2)$ give a cuboctahedron with edge and vertex radius 2.

### Relationship to IVM

The latter twelve vectors describe FCC sphere-contact directions for unit-radius spheres. They are not the nearest neighbors of the full integer quadray quotient, whose embedding is a BCC-type set. Restricting component sum modulo 4 selects one of four FCC cosets; the twelve canonical edge-difference steps preserve that residue. Selecting a lattice, choosing a graph, and constructing solid cells are distinct operations. See [IVM and Synergetics](../mathematics/ivm_synergetics.md) and Urner's [introduction](https://www.grunch.net/synergetics/quadintro.html).

## Conclusion: Practical Applications

Conversion is a rank-three linear map on equivalence classes plus an optional representative choice. Metric factors follow from its Gram matrix; tetravolume factors follow from the declared reference tetrahedron. Keeping those operations separate prevents false fourth-dimension, fixed-sum, universal-S3, and invented-API claims. The [canonical coordinate contract](../quadray_coordinates.md) is the maintained entry point for current behavior.
