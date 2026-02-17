# Quadray Mathematics

The mathematical foundation of 4D Quadray Chess.

---

## What are Quadray Coordinates?

**Quadray coordinates** (a, b, c, d) represent positions using four basis vectors emanating from the center of a regular tetrahedron to its vertices.

```
        A (1,0,0,0)
       /|\
      / | \
     /  |  \
    /   O   \      O = Origin (0,0,0,0)
   /   /|\   \
  /   / | \   \
 B---+--+--+---D
(0,1,0,0)    (0,0,0,1)
      |
      C (0,0,1,0)
```

### Key Properties

1. **Non-negative**: After normalization, all components ≥ 0
2. **Normalized**: At least one component equals 0
3. **Symmetric**: All four directions are equivalent
4. **Tetrahedral**: 109.47° angle between any two axes

---

## Normalization

Quadray normalization ensures at least one component is zero:

```javascript
normalized() {
    const minVal = Math.min(a, b, c, d);
    return new Quadray(
        a - minVal,
        b - minVal,
        c - minVal,
        d - minVal
    );
}
```

**Example**: (2, 3, 1, 4) normalizes to (1, 2, 0, 3)

---

## Conversion to Cartesian

Transform Quadray to traditional 3D coordinates:

```
x = (a - b - c + d) / √2
y = (a - b + c - d) / √2  
z = (a + b - c - d) / √2
```

### Basis Vectors in Cartesian

| Quadray | Cartesian (x, y, z) |
|---------|---------------------|
| A (1,0,0,0) | (0.707, 0.707, 0.707) |
| B (0,1,0,0) | (-0.707, -0.707, 0.707) |
| C (0,0,1,0) | (-0.707, 0.707, -0.707) |
| D (0,0,0,1) | (0.707, -0.707, -0.707) |

---

## Distance Formula

The distance between two Quadrays:

```
D = √((Δa² + Δb² + Δc² + Δd²) / 2)
```

Where Δ represents the difference in each component.

**Example**: Distance from (0,0,0,0) to (1,0,0,0) = √(1/2) ≈ 0.707

---

## Isotropic Vector Matrix (IVM)

The **IVM** is Buckminster Fuller's space-filling arrangement of tetrahedra and octahedra. Key properties:

- All edges have equal length
- 60° and 109.47° angles (vs Cartesian 90°)
- More efficient packing than cubic grid
- Natural representation in Quadray coordinates

### Tetrahedral Angle

The angle between any two Quadray basis vectors:

```
θ = arccos(-1/3) ≈ 109.4712°
```

This is the characteristic angle of a regular tetrahedron.

---

## Arithmetic Operations

### Addition

```javascript
q1.add(q2)  // Returns normalized sum
```

Example: (1,0,0,0) + (0,1,0,0) = (1,1,0,0)

### Subtraction

```javascript
q1.subtract(q2)  // For distance calculations
```

### Scaling

```javascript
q.scale(2)  // Doubles each component
```

---

## Movement in 4D Space

### Single Step (King)

Move 1 unit in any basis direction:

- +a: (x,y,z,w) → (x+1,y,z,w)
- +b: (x,y,z,w) → (x,y+1,z,w)
- etc.

### Diagonal (Bishop)

Two axes change simultaneously:

- +a+b: (x,y,z,w) → (x+1,y+1,z,w)
- +a-b: (x,y,z,w) → (x+1,y-1,z,w)
- etc.

### L-Shape (Knight)

+2 in one axis, +1 in another:

- +2a+1b: (x,y,z,w) → (x+2,y+1,z,w)
- etc.

---

## Further Reading

- [Kirby Urner's Quadray Papers](http://www.grunch.net/synergetics/quadrays.html)
- [Synergetics by R. Buckminster Fuller](http://www.rwgrayprojects.com/synergetics/synergetics.html)
- [Wikipedia: Isotropic Vector Matrix](https://en.wikipedia.org/wiki/Isotropic_vector_matrix)
