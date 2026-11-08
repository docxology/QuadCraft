# Quadray Coordinates: A Comprehensive Analysis of Tetrahedral Coordinate Systems

This technical/historical discussion explains quadrays using QuadCraft's declared scale and orientation. It is not a claim that historical authors' software is part of the game. Read the [canonical coordinate contract](../quadray_coordinates.md) and [mathematical reference](../mathematics/quadray_coordinates.md) first; return to the [papers index](README.md).

## Origins and Definition of Quadray Coordinates

Kirby Urner's [*An Introduction to Quadrays*](https://www.grunch.net/synergetics/quadintro.html), first posted in 1997 and revised in 2000, describes four rays from a regular tetrahedron's center to its vertices. This primary account supplies the geometric construction and normalization examples. It does not by itself establish priority for every historical naming or invention claim, so no such attribution is asserted here.

### Mathematical Properties

Let $\mathbf1=(1,1,1,1)$ and let $E$ be the QuadCraft embedding below. Its four columns sum to zero, its rank is 3, and its kernel is exactly $\operatorname{span}\{\mathbf1\}$. Physical vectors therefore form $\mathbb R^4/\operatorname{span}\{\mathbf1\}$, not Euclidean four-space. Addresses $q$ and $q+t\mathbf1$ denote the same point.

Subtracting $\min(q)$ gives a unique minimum-zero representative in exact arithmetic. Subtracting the mean gives a zero-sum representative. Neither is a physical fixed-sum constraint. Dividing by the sum is **not** gauge normalization: it generally moves the point. To choose the sum-one representative for the centered tetrahedron, add $(1-\sum_iq_i)\mathbf1/4$. Those affine coefficients need not all be nonnegative; they are nonnegative precisely inside the tetrahedron.

## Geometric Foundation and Tetrahedral Structure

### Tetrahedral Versus Cartesian Perspectives

The generators have pairwise angle $\arccos(-1/3)$, about $109.47^\circ$. They span the same three-dimensional Euclidean space as Cartesian coordinates. A Cartesian basis has three independent vectors, not six; counting its positive and negative rays is a different convention. Four tetrahedral rays positively span space because their sum is zero, not because they introduce an extra spatial dimension.

Tetrahedral molecular arrangements and close-packed sphere models are useful geometric analogies. They are not evidence that one coordinate frame is universally more natural, isotropic, or computationally efficient than another. Discrete tetrahedral symmetry is not invariance under every rotation.

## Converting Between XYZ and Quadray Coordinates

[Native `Quadray.h`](../../src/core/coordinate/Quadray.h) and [shared game `quadray.js`](../../games/4d_generic/quadray.js) are the primary implementation sources for the formulas here. Other historical implementations may choose different units or orientations.

### XYZ to Quadray Conversion

For Cartesian $(x,y,z)$, set

$$r=\frac{1}{2\sqrt2}(x+y+z,-x-y+z,-x+y-z,x-y-z).$$

Then return $r-\min(r)\mathbf1$. The source implements the equivalent positive-part construction followed by minimum subtraction. This is a real-valued inverse representative, not rounding to an integer lattice. The inverse is source-specific: changing the forward embedding changes this formula.

### Quadray to XYZ Conversion

$$E(a,b,c,d)=\frac{1}{\sqrt2}(a-b-c+d,\ a-b+c-d,\ a+b-c-d).$$

Coefficient-unit generators have length $\sqrt{3/2}$, generator-endpoint separation is 2, and common offsets disappear. A Cartesian axis permutation or global rescaling is a different embedding convention, even if the abstract quotient is the same.

### Volumetric Considerations

A regular tetrahedron of Cartesian edge $L$ has volume $L^3/(6\sqrt2)$. In this embedding, the tetrahedron formed by the four generator endpoints has edge 2 and Cartesian volume $2\sqrt2/3$. If that tetrahedron defines one tetravolume, then

$$V_{\rm tet}=\frac{3}{2\sqrt2}V_{\rm XYZ}=\sqrt{9/8}\,V_{\rm XYZ}.$$

This is an explicit **volume-unit choice**, not a universal coordinate Jacobian or a rule to rescale all lengths and areas. See [IVM units](../mathematics/ivm_synergetics.md).

## Quadray Coordinates and Polyhedra

### Concentric Hierarchy of Polyhedra

Under $E$, the following vertex sets describe centered regular polyhedra:

| Shape | Coefficients | Cartesian dimensions |
| --- | --- | --- |
| Tetrahedron | Four permutations of $(1,0,0,0)$ | Edge 2; circumradius $\sqrt{3/2}$ |
| Inverse tetrahedron | Four permutations of $(0,1,1,1)$ | Negatives of the tetrahedron vertices |
| Octahedron | Six permutations of $(1,1,0,0)$ | Vertices on Cartesian axes at radius $\sqrt2$; edge 2 |
| Cuboctahedron | Twelve permutations of $(0,1,1,2)$ | Vertex radius and edge length 2 |

The cuboctahedral vectors are the 12 contact directions of an FCC sphere-center lattice with unit-radius spheres. They are not the nearest-neighbor set of **all** integer quadray classes. The full integer quotient projects to a BCC-type set; restricting component sum modulo 4 selects one of four FCC cosets. The twelve edge-difference steps preserve that residue. A physical lattice and a chosen graph on it must be specified separately.

## Kirby Urner's Contributions and Implementation

Urner's [*Quadrays and XYZ*](https://www.grunch.net/synergetics/quadxyz.html), first posted October 16, 1997, explicitly discusses relative scale and orientation before giving conversions. Its procedural formulas agree with the convention used above. His introduction also explains zero-minimum and zero-sum gauges and warns that distance constants depend on the selected units.

### Programming Implementations

Tom Ace's [*Quadray formulas*](https://www.minortriad.com/quadray.html) provides C++ normalization, metric, cross-product, and rotation examples. Its declared generator length is 1, unlike QuadCraft's $\sqrt{3/2}$. Its zero-sum dot-product factor $4/3$ therefore cannot be copied as QuadCraft's metric factor. These are external mathematical implementations, not exported QuadCraft APIs.

The current native and shared game classes implement their own operations. [`GridUtils`](../../games/4d_generic/grid_utils.js) also has raw coefficient-space distances; those are not the embedded physical distance supplied by `Quadray.distance`.

## Connection to Fuller's Synergetics and 4D Geometry

### The "4D" Interpretation

Historical Synergetics vocabulary and repository `4d_*` names do not change the rank of $E$. Physical quadrays describe three-dimensional points with four redundant coefficients. A raw four-index game state can keep extra label distinctions, but its non-injective XYZ projection does not make those labels four independent physical spatial directions.

## Philosophical Implications of Quadray Coordinates

### Challenging Cartesian Paradigms

Alternative coordinates can expose useful symmetries and support educational comparisons. They do not invalidate Cartesian geometry or prove superior cognition, realism, or performance. Such claims need evidence beyond a change of notation.

### Scalar Multiplication and Negation

Scalar multiplication is component-wise on equivalence classes. The negative of $q$ is represented by $-q$; its minimum-zero form is $\max(q)\mathbf1-q$. For example, $-(1,0,0,0)$ is equivalent to $(0,1,1,1)$. Reversing the tuple order is not general negation. In three dimensions, inversion $v\mapsto-v$ is not one fixed proper rotation acting on all vectors.

## Applications in Modern Mathematics and Computing

### Computational Geometry

Integer labels make the polyhedral vertex sets above compact. They do not by themselves define faces, cell volumes, a valid tessellation, collision shapes, or a speedup. Native [`TetrahedralElement`](../../src/core/world/TetrahedralElement.h) has a separately defined mesh; its offsets must not be identified with the regular generator tetrahedron.

### Volumetric Calculations

Use actual embedded vertices and $|\det(v_1-v_0,v_2-v_0,v_3-v_0)|/6$ for Cartesian tetrahedral volume. Convert to tetravolumes only after declaring the reference tetrahedron. A gameplay `cellVolume()` constant does not establish the volume of every rendered or stored cell.

### Educational Tools

Common-offset examples, the rank-three matrix, and comparisons between gauge choices make useful exercises. Distinguish affine barycentric coordinates, physical quadray vectors, and raw game board slots instead of conflating them as a single "4D" construction.

## Conclusion

Quadrays provide a redundant tetrahedral representation of Euclidean three-space. Their mathematical value is compatible with conventional linear algebra, explicit units, and careful source-specific conversions. For maintained usage, consult the [canonical coordinate contract](../quadray_coordinates.md), [tetrahedral geometry](../mathematics/tetrahedral_geometry.md), and linked source rather than treating this historical discussion as an engine feature inventory.
