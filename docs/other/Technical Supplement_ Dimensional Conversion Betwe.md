# Technical Supplement: Dimensional Conversion Between XYZ and Quadray/IVM Coordinate Systems

The conversion between traditional Cartesian (XYZ) coordinates and tetrahedral-based systems like Quadray coordinates represents a fundamental shift in how we conceptualize and measure space. This supplement provides a comprehensive technical overview of the conversion processes, with particular emphasis on Kirby Urner's formulations and the critical S3 constant that bridges these coordinate systems.

## Mathematical Foundation of Quadray Coordinates

Quadray coordinates utilize four basis vectors emanating from the center of a regular tetrahedron to its vertices, creating a four-dimensional representation of three-dimensional space. The basis vectors are typically denoted as (1,0,0,0), (0,1,0,0), (0,0,1,0), and (0,0,0,1).

Unlike Cartesian coordinates, which rely on three mutually perpendicular axes, quadray coordinates distribute spatial information across four non-orthogonal directions. This creates an inherent redundancy that allows multiple valid representations of the same point in space, providing mathematical flexibility.

### Key Properties

A fundamental property of quadray coordinates is that the four normalized basis vectors sum to zero. Mathematically, this means that for any point represented as (a,b,c,d), adding multiples of (k,k,k,k) does not change the point's location:

$$
(a,b,c,d) + k(1,1,1,1)
$$

This property enables various normalization strategies, including:

1. **Zero-minimum normalization**: Ensures at least one coordinate equals zero
2. **Barycentric normalization**: Sets the sum of coordinates to equal 1
3. **Zero-sum normalization**: Ensures coordinates sum to zero

## Coordinate Conversion Formulas

### XYZ to Quadray Conversion

The conversion from Cartesian to quadray coordinates involves distributing the XYZ information across the four quadray components, accounting for the signs of the Cartesian coordinates:

```
procedure xyz2quad(x,y,z)
  q(1) = 1/root2 * (iif(x>=0,x, 0)+iif(y>=0,y, 0)+iif(z>=0,z, 0))
  q(2) = 1/root2 * (iif(x>=0,0,-x)+iif(y>=0,0,-y)+iif(z>=0,z, 0))
  q(3) = 1/root2 * (iif(x>=0,0,-x)+iif(y>=0,y, 0)+iif(z>=0,0,-z))
  q(4) = 1/root2 * (iif(x>=0,x, 0)+iif(y>=0,0,-y)+iif(z>=0,0,-z))
  simplify()
endproc
```

The simplify() procedure normalizes the result to ensure at least one coordinate equals zero:

```
procedure simplify
  local i
  minval=q(1)
  for i=1 to 4
    minval = min(minval,q(i))
  endfor
  for i=1 to 4
    q(i)=q(i)-minval
  endfor
endproc
```

This algorithm effectively maps each of the eight octants in Cartesian space to specific patterns in quadray space[^10].

### Quadray to XYZ Conversion

The inverse transformation from quadray to XYZ coordinates is more straightforward:

```
procedure quad2xyz(a,b,c,d)
  x = 1/root2 * (a - b - c + d)
  y = 1/root2 * (a - b + c - d)
  z = 1/root2 * (a + b - c - d)
endproc
```

This linear transformation reveals the core mathematical relationship between quadray and Cartesian coordinates[^10].

## The S3 Conversion Constant

The S3 constant (approximately 1.06066 or precisely √(9/8)) is central to the volumetric relationship between XYZ and IVM coordinate systems.

### Definition and Value

S3 represents the volumetric ratio between equivalent shapes measured in the two coordinate systems:

$$
S3 = \sqrt{\frac{9}{8}} \approx 1.06066
$$

This constant emerges when comparing a tetrahedron with edges twice the length of a cube's edges, resulting in a volume difference of approximately 6%[^1].

### Dimensional Conversion Formulas

The S3 constant establishes a critical relationship between measurements in the two coordinate systems:

1. **Volume conversion**: XYZ volume × S3 = IVM volume[^8]
2. **Area conversion**: XYZ area × S3^(2/3) = IVM area
3. **Length conversion**: XYZ length × S3^(1/3) = IVM length

These conversion formulas ensure consistency across different dimensional measurements when transitioning between coordinate systems.

## Metric Operations in Quadray Coordinates

### Length Calculation

For zero-sum normalized quadray coordinates (where a+b+c+d=0), the length formula derived by Tom Ace is:

$$
D = \sqrt{\frac{a^2 + b^2 + c^2 + d^2}{2}}
$$

This formula provides a measure consistent with the tetrahedral geometry of the coordinate system[^2].

### Vector Operations

Vector operations in quadray coordinates follow patterns similar to traditional vector spaces but must account for the non-orthogonal basis:

1. **Addition**: Performed component-wise, followed by normalization
2. **Scalar multiplication**: Simple component-wise multiplication
3. **Dot product**: For zero-sum normalized quadrays (QX, QY), Tom Ace derived:

$$
QX \cdot QY = \frac{4}{3} \sum_{i=1}^{4} QX_i \cdot QY_i
$$[^3]

## Python Implementation

Kirby Urner's Python implementation includes Vector and Qvector classes that handle the conversion between coordinate systems. The key methods are:

```python
def quadray(self):
    """Return self as a quadray Vector (Vector -> Qvector)"""
    x, y, z = self.xyz
    k = 2/root2
    a = k * (int(bool(x >= 0)) * (x) + int(bool(y >= 0)) * (y) + int(bool(z >= 0)) * (z))
    b = k * (int(bool(x < 0)) * (-x) + int(bool(y < 0)) * (-y) + int(bool(z >= 0)) * (z))
    c = k * (int(bool(x < 0)) * (-x) + int(bool(y >= 0)) * (y) + int(bool(z < 0)) * (-z))
    d = k * (int(bool(x >= 0)) * (x) + int(bool(y < 0)) * (-y) + int(bool(z < 0)) * (-z))
    return Qvector((a, b, c, d))

@property
def xyz(self):
    """Return xyz Vector from Qvector"""
    a, b, c, d = self.coords
    k = 1/(2 * root2)
    xyz = (k * (a - b - c + d),
           k * (a - b + c - d),
           k * (a + b - c - d))
    return Vector(xyz)
```

These methods demonstrate how the conversion can be implemented in practice, accommodating various numerical types and normalization strategies[^4].

## Volumetric Calculations and S3

The volumetric relationship established by S3 is fundamental to understanding the difference between tetrahedral and cubic space partitioning:

1. If a shape has volume V in XYZ coordinates, its volume in IVM coordinates is V × S3
2. Conversely, if a shape has volume V in IVM coordinates, its volume in XYZ coordinates is V ÷ S3

This relationship explains why volumes calculated in the two systems differ by approximately 6%[^1][^8].

### September 2024 Developments

In September 2024, Kirby Urner simplified the conversion algorithms between XYZ and quadray coordinates. His approach demonstrates that these conversions are fundamentally vector operations:

1. **VECTOR → QVECTOR**: If XYZ basis vectors i, j, k are expressed as quadrays Q1, Q2, Q3, then (x,y,z) maps to (x·Q1 + y·Q2 + z·Q3)
2. **QVECTOR → VECTOR**: If the four basis Qvectors are expressed in XYZ as V1-V4, then (a,b,c,d) maps to (a·V1 + b·V2 + c·V3 + d·V4)[^4]

This formulation clarifies that the conversion is a linear transformation between different basis representations of the same vector space.

## Geometric Interpretations

The quadray system elegantly represents various polyhedra through simple integer coordinates:

1. Regular tetrahedron: The four basis vectors themselves
2. Inverse tetrahedron: (0,1,1,1), (1,0,1,1), (1,1,0,1), (1,1,1,0)
3. Octahedron: All permutations of (1,1,0,0) - six vertices in total[^2]
4. Cuboctahedron: All permutations of (2,1,1,0) - twelve vertices[^4]

These representations reveal fundamental geometric relationships that might be obscured in traditional Cartesian coordinates.

### Relationship to IVM

The Isotropic Vector Matrix (IVM) describes the vectors connecting centers in a closest-packed spheres arrangement. The twelve vectors pointing to the vertices of a cuboctahedron correspond to the directions to neighboring spheres in this packing arrangement, creating a natural connection to quadray coordinates[^7].

## Conclusion: Practical Applications

The conversion between XYZ and Quadray/IVM coordinates has significant applications in:

1. **Computational geometry**: Simplifying representations of certain polyhedra
2. **Crystallography**: Describing close-packed structures naturally
3. **Volume calculations**: Providing alternative perspectives on spatial measurement
4. **Educational tools**: Offering alternative geometric insights

The S3 constant serves as the critical bridge between these coordinate systems, enabling coherent transformations across dimensional measures. By understanding and implementing these conversion techniques, developers and mathematicians gain access to a powerful alternative framework for spatial geometry that complements traditional Cartesian approaches.

As noted by Urner in his recent developments, the fundamental nature of these conversions is that of vector transformations between different basis systems of the same underlying space[^4], providing a concise and elegant framework for navigating between these complementary geometric perspectives.

<div style="text-align: center">⁂</div>

[^1]: https://mybizmo.blogspot.com/2025/01/surely-youre-joking-mr-fuller.html

[^2]: https://www.grunch.net/synergetics/quadintro.html

[^3]: https://www.minortriad.com/quadray.html

[^4]: https://coda.io/@daniel-ari-friedman/math4wisdom/ivm-xyz-40

[^5]: https://www.grunch.net/synergetics/

[^6]: https://vixra.org/pdf/1209.0109v3.pdf

[^7]: https://en.wikipedia.org/wiki/Synergetics_(Fuller)

[^8]: https://groups.io/g/synergeo/topic/nature_is_not_using_pi/93636796

[^9]: https://arxiv.org/pdf/0710.1242.pdf

[^10]: https://www.grunch.net/synergetics/quadxyz.html

[^11]: https://groups.google.com/g/mathfuture/c/l_zqM-8xWW4/m/2DcpbHoaAgAJ

[^12]: https://www.cjfearnley.com/fuller-faq.13.sgml

[^13]: https://www.youtube.com/watch?v=g14mu4uWD4E

[^14]: https://math.stackexchange.com/questions/1474133/cut-up-a-cube-into-pieces-that-form-3-regular-tetrahedra

[^15]: https://ia902907.us.archive.org/26/items/in.ernet.dli.2015.134431/2015.134431.A-Second-Course-In-Calculus_text.pdf

[^16]: https://www.cjfearnley.com/fuller-faq.sgml

