# Quadray Coordinates: Technical and Geometric Formalisms of a Tetrahedral Coordinate System

This mathematical discussion uses the development checkout's native/shared embedding. Historical conventions are compared explicitly, not presented as implemented game APIs. See the [canonical coordinate contract](../quadray_coordinates.md), [mathematical reference](../mathematics/quadray_coordinates.md), and [papers index](README.md).

## Tetrahedral Basis and Vector Formalism

### Mathematical Foundation

The four Cartesian generator vectors are the columns of

$$E=\frac1{\sqrt2}\begin{pmatrix}1&-1&-1&1\\1&-1&1&-1\\1&1&-1&-1\end{pmatrix}.$$

They have squared length $3/2$, pairwise dot product $-1/2$, and sum zero. Thus "basis" here means a redundant generating frame: $E$ has rank 3, not 4. Physical quadrays are classes $[q]$ in $\mathbb R^4/\operatorname{span}\{\mathbf1\}$, where $\mathbf1=(1,1,1,1)$. Every common offset denotes the same point.

### Geometric Relationships with Polyhedra

The four permutations of $(1,0,0,0)$ give a regular tetrahedron of Cartesian edge 2. Their negatives have canonical coordinates given by the four permutations of $(0,1,1,1)$. The six permutations of $(1,1,0,0)$ give an octahedron of edge 2, and the twelve permutations of $(0,1,1,2)$ give a cuboctahedron of edge and vertex radius 2.

These are vertex sets, not an implemented cell decomposition. The native [`TetrahedralElement`](../../src/core/world/TetrahedralElement.h) supplies different Cartesian offsets, which are not regular despite its comments; it is not the regular generator tetrahedron.

### Comparison with Cartesian Coordinates

Cartesian and physical quadray vectors describe the same three-dimensional Euclidean vector space. Three independent Cartesian vectors form a basis; the four tetrahedral generators positively span the space but are dependent. Counting positive and negative Cartesian rays as six directions does not change the linear dimension.

## Normalization Methods and Algebraic Properties

### Normalization Techniques

The following are representative choices, not physical restrictions:

- Minimum-zero: $N(q)=q-\min(q)\mathbf1$. All components are nonnegative and at least one is zero.
- Zero-sum: $Pq=q-(\sum_iq_i)\mathbf1/4$. Here $P=I-\mathbf1\mathbf1^T/4$ projects onto the three-dimensional zero-sum subspace.
- Sum-one affine representative: $B(q)=q+(1-\sum_iq_i)\mathbf1/4$. It satisfies $EB(q)=Eq$ and gives barycentric coefficients for the centered generator tetrahedron. Nonnegative barycentric coefficients describe only points inside that tetrahedron.

Dividing $q$ by its component sum instead gives $Eq/(\sum_iq_i)$, generally a different point, and is undefined for zero sum. No fixed sum is required by quadray geometry. Minimum-zero and zero-sum are alternative gauges, not conditions to impose simultaneously.

### Vector Operations

Addition and scalar multiplication descend from component-wise operations: $[q]+[p]=[q+p]$ and $s[q]=[sq]$. Normalization can select a storage representative afterward without changing the physical result.

Negation is $[-q]$, with canonical form $\max(q)\mathbf1-q$. Reversing component order is not general negation. For instance, the negative of $(1,0,0,0)$ is canonically $(0,1,1,1)$, not $(0,0,0,1)$.

## Coordinate Transformations and Metric Properties

[Native `Quadray.h`](../../src/core/coordinate/Quadray.h) and [shared game `quadray.js`](../../games/4d_generic/quadray.js) implement the forward map, inverse representative, and physical distance used here.

### XYZ to Quadray Conversion

Since $EE^T=2I_3$, a zero-sum right inverse is $r=E^Tv/2$. Explicitly,

$$r=\frac1{2\sqrt2}(x+y+z,-x-y+z,-x+y-z,x-y-z),\qquad N(r)=r-\min(r)\mathbf1.$$

The source's positive-part inverse differs from $r$ by the common offset $(|x|+|y|+|z|)/(2\sqrt2)$ before normalization. It therefore produces the same minimum-zero result in exact arithmetic. Floating-point cancellation remains possible. This inverse does not snap to integer coordinates.

### Quadray to XYZ Conversion

$$Eq=\frac1{\sqrt2}(a-b-c+d,\ a-b+c-d,\ a+b-c-d).$$

Consequently $E(r)=v$ and $N(E^TEq/2)=N(q)$. These are identities for exact real arithmetic, not an assertion of a bitwise floating-point round trip. Different scales or axis orders need corresponding inverses.

### Distance Metric

The Gram matrix is $E^TE=2I_4-\mathbf1\mathbf1^T/2=2P$. Hence

$$\langle[q],[p]\rangle=2\sum_iq_ip_i-\tfrac12\Big(\sum_iq_i\Big)\Big(\sum_ip_i\Big),$$

$$\|[q]\|^2=2\sum_iq_i^2-\tfrac12\Big(\sum_iq_i\Big)^2=2\|Pq\|_2^2.$$

This form is positive semidefinite on raw four-tuples and positive definite on the physical quotient. Distance is $\|E(q-p)\|_2$, invariant under independent common-offset changes to either point. Raw four-dimensional Euclidean distance is not this metric.

For zero-sum representatives, the QC length is $\sqrt{2\sum_iq_i^2}$, not $\sqrt{\sum_iq_i^2/2}$. Tom Ace's [primary formulas](https://www.minortriad.com/quadray.html) explicitly choose unit-length generators and use factor $4/3$ in the zero-sum squared norm/dot product. Multiplying that metric by $3/2$ gives QC's factor 2. Mixing these conventions is the source of incompatible formulas.

## Computational Implementations and Algorithmic Considerations

### Python Implementation

This paper does not define a Python `Qvector` API for QuadCraft. External implementations have their own constructors, exact-number behavior, units, and embeddings. The native C++ and shared JavaScript source links above are authoritative for the described engine/game classes.

### Computational Efficiency

Four-component normalization and coordinate conversion use a fixed number of arithmetic operations. That observation is not evidence of a speedup over Cartesian operations, nor of exact arithmetic: native coefficients are floats and JavaScript coefficients are numbers.

[`World`](../../src/core/world/World.h) partitions Cartesian space into cubic chunks; [`TetraChunk`](../../src/core/world/TetraChunk.h) stores chunk-local quadrays. Its exact normalized-float hash and epsilon equality are not an integer quantization strategy and do not establish a robust approximate-key equivalence relation. [`GridUtils`](../../games/4d_generic/grid_utils.js) separately offers raw labels/keys and canonical grid enumeration. Raw gameplay aliases may intentionally remain distinct even when their XYZ positions coincide.

## Topological Connections and Higher-Dimensional Analogs

### Simplicial Coordinates

An analogous construction in $n$ dimensions uses $n+1$ centered regular-simplex generators with one common-offset redundancy. The resulting physical space has rank $n$, not $n+1$. Quadrays are the $n=3$ case.

### Relationship to Computational Topology

A coordinate list alone is not a simplicial complex. One must also specify vertices, edges, faces, cells, and incidence relations satisfying the required conditions. No persistent-homology or topological-data-analysis feature follows from QuadCraft using quadray addresses.

The full integer quadray quotient embeds as a BCC-type point set. The twelve canonical permutations of $(0,1,1,2)$ are edge-difference steps within an FCC coset selected by component sum modulo 4; they do not connect all integer classes. Graph adjacency, geometric nearest neighbors, and tetrahedron face neighbors are different structures.

## Philosophical and Conceptual Implications

### Challenging Cartesian Paradigms

A tetrahedral frame can make tetrahedral symmetry easier to express. This is a representational choice, not a proof that Cartesian geometry is physically incorrect or that arbitrary rotations preserve an integer quadray grid.

### Scalar Multiplication and Negation

Positive scaling preserves a nonzero vector's direction; negative scaling reverses it. The quotient uses ordinary real vector-space operations. Inversion of all three-dimensional vectors is not one proper rotation, and a permutation of four coefficients generally acts as a tetrahedral symmetry rather than inversion.

## Applications in Geometry and Computing

### Computational Geometry

For actual Cartesian tetrahedron vertices $v_0,\ldots,v_3$, use $V=|\det(v_1-v_0,v_2-v_0,v_3-v_0)|/6$. Geometry needs actual vertices and faces, not just a cell-center address.

### Volumetric Calculations

The edge-2 regular generator tetrahedron has Cartesian volume $2\sqrt2/3$. Declaring it one tetravolume gives $V_{\rm tet}=3V_{\rm XYZ}/(2\sqrt2)=\sqrt{9/8}V_{\rm XYZ}$. This is a volume-unit convention, not a universal four-to-three-dimensional determinant. Taking its cube root does not automatically define length units; see [IVM and volume units](../mathematics/ivm_synergetics.md).

### Educational Applications

The kernel, projection $P$, and Gram matrix give concrete exercises in redundant coordinates, affine versus vector normalization, and quotient metrics. They require no fourth physical spatial dimension.

## Connection to Fuller's Synergetics and 4D Geometry

### The "4D" Interpretation

Urner's [historical introduction](https://www.grunch.net/synergetics/quadintro.html) and [conversion account](https://www.grunch.net/synergetics/quadxyz.html) explain tetrahedral generators, common offsets, and unit choices. Historical "4D" terminology is not a claim of four independent Euclidean axes in this rank-three model. Separate raw four-index game states are software labels with a non-injective projection, not an exception to that rank calculation.

## Conclusion

The coherent formalism is a common-offset quotient equipped with the metric induced by a declared embedding. Gauge choices preserve points; rescaling generally does not. Historical formulas remain useful only with their own units and orientations attached. Use the [canonical contract](../quadray_coordinates.md) for maintained implementation semantics and [tetrahedral geometry](../mathematics/tetrahedral_geometry.md) for geometric distinctions.
