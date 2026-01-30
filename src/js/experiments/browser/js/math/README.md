# Math Modules

Mathematical foundations for quadray coordinate system.

## Files

| File | Purpose |
|------|---------|
| `quadray.js` | Quadray coordinate class |
| `geometry.js` | Shape generation and directions |

## quadray.js

The `Quadray` class implements the 4D coordinate system:

### Constructor

```javascript
new Quadray(a, b, c, d)
```

### Key Methods

```javascript
// Conversion
toCartesian()      // Returns {x, y, z}
Quadray.fromCartesian(x, y, z)

// Operations
add(other)         // Add quadrays
subtract(other)    // Subtract quadrays
scale(factor)      // Scale by constant
normalize()        // Ensure constraint satisfied

// Utility
equals(other)      // Compare quadrays
toString()         // String representation
```

### Constraint

Quadrays maintain: `a + b + c + d = constant`

## geometry.js

Shape definitions and navigation:

### Shapes

```javascript
// Generate shape vertices
getOctahedronVertices(center)
getTetrahedronZVertices(center)
getTetrahedronCVertices(center)
```

### Navigation Directions

```javascript
// 12 core navigation directions
DIRECTIONS = {
  // Forward directions (ASDFGH keys)
  a: Quadray(...),
  s: Quadray(...),
  // ... etc
  
  // Backward directions (QWERTY keys)
  q: Quadray(...),
  w: Quadray(...),
  // ... etc
}
```

The 12 directions maintain perfect grid alignment.
