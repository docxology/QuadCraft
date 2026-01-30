# Coordinate Systems - AI Agent Guidelines

## Critical: Mathematical Precision

This is the mathematical foundation of the entire project. Changes must preserve:

1. **Quadray constraint**: `a + b + c + d = constant`
2. **Reversible conversions**: Quadray ↔ Cartesian
3. **Grid alignment**: Navigation directions must land on grid points

## Constants

```cpp
ROOT2 = 1.41421356237...  // √2, critical for scaling
```

Never change this constant without understanding all downstream effects.

## When Modifying Quadray.h

### Adding Operators

- Follow existing patterns for consistency
- Always return normalized result
- Test with edge cases (zeros, negatives)

### Modifying Conversions

- Both directions must be updated together
- Test round-trip precision
- Verify grid navigation still works

## When Modifying Vector3.h

- Standard 3D vector operations
- Less critical than Quadray
- Ensure compatibility with OpenGL conventions

## Testing Requirements

Before committing coordinate changes:

1. Test conversion: `Cartesian → Quadray → Cartesian`
2. Test navigation: All 12 directions
3. Test normalization: Various input ranges
4. Test edge cases: Origin, axis-aligned points

## Common Pitfalls

- **Forgetting normalization**: Operations can violate constraint
- **Precision loss**: Accumulated floating-point errors
- **Sign errors**: Quadray components should be non-negative after normalization
