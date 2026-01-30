# Math Modules - AI Agent Guidelines

## Critical: Core Mathematics

These modules define the mathematical foundation. Changes affect everything.

## quadray.js Guidelines

### Constraint Invariant

**Always maintain:** `a + b + c + d = constant`

- Call normalize() after arithmetic
- Test round-trip conversions
- Verify with known coordinates

### Conversion Accuracy

Test patterns:

```javascript
const q = Quadray.fromCartesian(1, 2, 3);
const {x, y, z} = q.toCartesian();
// Should match original within float precision
```

### Adding Operations

- Follow existing method patterns
- Ensure normalization preserved
- Document mathematical basis

## geometry.js Guidelines

### Shape Definitions

- Vertices must be consistent with C++ version
- Winding order affects rendering
- Test visual correctness

### Navigation Directions

The 12 directions are carefully calibrated:

- Opposite pairs cancel out
- All land on grid points
- Changes break navigation

## Testing Requirements

Before committing:

1. Navigation still works
2. Shapes render correctly
3. Conversions are reversible
4. Grid alignment preserved
