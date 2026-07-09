# Quadray Coordinates Implementation in QuadCraft

## Introduction

This document describes the implementation of the quadray coordinate system in QuadCraft. Quadray coordinates are a tetrahedral-based coordinate system that provide an alternative to traditional Cartesian coordinates for representing positions in 3D space.

> [!NOTE]
> For the **detailed mathematical treatment** with basis vector derivations, hashing strategy, and worked examples, see [mathematics/quadray_coordinates.md](mathematics/quadray_coordinates.md). For IVM volume ratios and Synergetics concepts, see [mathematics/ivm_synergetics.md](mathematics/ivm_synergetics.md).

## Mathematical Foundation

Quadray coordinates utilize four basis vectors emanating from the center of a regular tetrahedron to its vertices. These vectors are typically denoted as (1,0,0,0), (0,1,0,0), (0,0,1,0), and (0,0,0,1).

Unlike Cartesian coordinates, which use three mutually perpendicular axes, quadray coordinates distribute spatial information across four non-orthogonal directions, creating an inherent redundancy that allows multiple valid representations of the same point in space.

## Implementation in QuadCraft

In QuadCraft, the `Quadray` class (defined in `src/core/coordinate/Quadray.h`) implements this coordinate system:

```cpp
class Quadray {
public:
    // Four components of quadray coordinates
    float a, b, c, d;
    
    static constexpr float ROOT2 = 1.4142135623730951f;
    
    Quadray() : a(0.0f), b(0.0f), c(0.0f), d(0.0f) {}
    Quadray(float a, float b, float c, float d) : a(a), b(b), c(c), d(d) {}
    
    // Normalize to ensure at least one coordinate is zero (zero-minimum normalization)
    Quadray normalized() const {
        float minVal = std::min({a, b, c, d});
        return Quadray(a - minVal, b - minVal, c - minVal, d - minVal);
    }
    
    // Convert from quadray to Cartesian coordinates
    Vector3 toCartesian() const {
        const float scale = 1.0f / ROOT2;
        float x = scale * (a - b - c + d);
        float y = scale * (a - b + c - d);
        float z = scale * (a + b - c - d);
        return Vector3(x, y, z);
    }
    
    // Convert from Cartesian to quadray coordinates
    static Quadray fromCartesian(const Vector3& v) {
        const float scale = 1.0f / ROOT2;
        
        float a = scale * (std::max(0.0f, v.x) + std::max(0.0f, v.y) + std::max(0.0f, v.z));
        float b = scale * (std::max(0.0f, -v.x) + std::max(0.0f, -v.y) + std::max(0.0f, v.z));
        float c = scale * (std::max(0.0f, -v.x) + std::max(0.0f, v.y) + std::max(0.0f, -v.z));
        float d = scale * (std::max(0.0f, v.x) + std::max(0.0f, -v.y) + std::max(0.0f, -v.z));
        
        Quadray result(a, b, c, d);
        return result.normalized();
    }
    
    // Calculate the length of a quadray vector
    float length() const {
        // Using the formula: D = sqrt((a² + b² + c² + d²) / 2)
        return std::sqrt((a*a + b*b + c*c + d*d) / 2.0f);
    }
    
    // Basic operations
    Quadray operator+(const Quadray& other) const {
        return Quadray(a + other.a, b + other.b, c + other.c, d + other.d).normalized();
    }
    
    Quadray operator*(float scalar) const {
        return Quadray(a * scalar, b * scalar, c * scalar, d * scalar);
    }
    
    // Calculate the distance between two points in quadray space
    static float distance(const Quadray& q1, const Quadray& q2) {
        // Subtract and find the length
        Quadray diff(q1.a - q2.a, q1.b - q2.b, q1.c - q2.c, q1.d - q2.d);
        return diff.length();
    }
};
```

## Coordinate Conversion

### XYZ to Quadray Conversion

The conversion from Cartesian to quadray coordinates is implemented in the `fromCartesian` method:

```cpp
static Quadray fromCartesian(const Vector3& v) {
    const float scale = 1.0f / ROOT2;
    
    float a = scale * (std::max(0.0f, v.x) + std::max(0.0f, v.y) + std::max(0.0f, v.z));
    float b = scale * (std::max(0.0f, -v.x) + std::max(0.0f, -v.y) + std::max(0.0f, v.z));
    float c = scale * (std::max(0.0f, -v.x) + std::max(0.0f, v.y) + std::max(0.0f, -v.z));
    float d = scale * (std::max(0.0f, v.x) + std::max(0.0f, -v.y) + std::max(0.0f, -v.z));
    
    Quadray result(a, b, c, d);
    return result.normalized();
}
```

This algorithm accounts for the signs of the XYZ coordinates and distributes them appropriately across the four quadray coordinates.

### Quadray to XYZ Conversion

The conversion from quadray back to XYZ coordinates is implemented in the `toCartesian` method:

```cpp
Vector3 toCartesian() const {
    const float scale = 1.0f / ROOT2;
    float x = scale * (a - b - c + d);
    float y = scale * (a - b + c - d);
    float z = scale * (a + b - c - d);
    return Vector3(x, y, z);
}
```

This conversion directly maps the four quadray values to three Cartesian coordinates through a linear transformation.

## Normalization

Quadray coordinates have an inherent redundancy where any point in space can be represented by different equivalent coordinate quadruples. In QuadCraft, we use zero-minimum normalization, which ensures that at least one coordinate is zero:

```cpp
Quadray normalized() const {
    float minVal = std::min({a, b, c, d});
    return Quadray(a - minVal, b - minVal, c - minVal, d - minVal);
}
```

## Tetrahedral Elements

Tetrahedral elements in QuadCraft use quadray coordinates for their positions. Each tetrahedral element is defined by its position in quadray space and a block type:

```cpp
class TetrahedralElement {
public:
    // The position in quadray coordinates (normalized)
    Quadray position;
    
    // The block type of this element
    Block::BlockID blockId;
    
    // ... other methods
};
```

## Advantages of Quadray Coordinates in QuadCraft

Quadray coordinates give QuadCraft a natural fit to its tetrahedral grid —
direct mapping to tetrahedral vertices, a simple distance formula for
zero-sum normalized coordinates, and elegant integer coordinates for many
polyhedra. See [Quadray Coordinates (Mathematics)](mathematics/quadray_coordinates.md#advantages-of-quadray-coordinates)
for the full list with derivations.

## The S3 Constant

The S3 constant (√(9/8) ≈ 1.06066) converts between XYZ (cubic) and
Synergetics/IVM (tetrahedral) volume units:

```cpp
constexpr float S3 = 1.0606601717798212f; // sqrt(9/8)
```

See [IVM & Synergetics](mathematics/ivm_synergetics.md#the-s3-constant) for
the full derivation and the concentric hierarchy of volumes (tetrahedron =
1, cube = 3, octahedron = 4, rhombic dodecahedron = 6, cuboctahedron = 20
tetravolumes), and [Quadray Coordinates (Mathematics)](mathematics/quadray_coordinates.md)
for how these connect to the Quadray basis vectors.

## Usage Across Games

All 30 standalone games in `games/` import the single shared `games/4d_generic/quadray.js` module, which implements the coordinate conversions described above — there are no per-game copies to keep in sync. Games like **4D Doom** and **4D Tower Defense** additionally use IVM cell parity (tetra vs. octa) for gameplay mechanics.

## Conclusion

The implementation of quadray coordinates in QuadCraft provides a solid foundation for the tetrahedral-based voxel system. The coordinate conversion methods, normalization techniques, and distance calculations enable efficient operations in tetrahedral space, supporting the unique geometric features of the game and all 30 browser games built on this foundation.
