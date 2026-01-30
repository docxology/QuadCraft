# Core Engine - AI Agent Guidelines

## Overview

The core engine contains fundamental data structures that all other systems depend on. Changes here have wide-reaching effects.

## Critical Invariants

### Quadray Constraint

**Always maintain:** `a + b + c + d = constant`

When modifying `Quadray.h`:

- Call `normalized()` after arithmetic operations
- Preserve the constraint in all conversions
- Test round-trip: Quadray → Cartesian → Quadray

### Coordinate Precision

- Use `float` for performance, not `double`
- The `ROOT2` constant (√2) is critical for conversions
- Grid alignment depends on exact coordinate math

## Modification Guidelines

### Adding New Coordinate Functions

1. Add to `Quadray.h` or `Vector3.h`
2. Ensure consistency with existing operators
3. Document mathematical basis in comments

### Modifying World System

1. Consider chunk boundary effects
2. Update mesh regeneration triggers
3. Test with terrain generation

### Extending Entity System

1. Camera is the primary entity currently
2. New entities should follow similar patterns
3. Consider serialization for save/load

## Dependencies Graph

```text
Vector3 ← Quadray ← TetrahedralElement ← TetraChunk ← World
                                                    ↑
                                          TerrainGenerator
```

## Testing Checklist

- [ ] Quadray normalization works correctly
- [ ] Coordinate conversions are reversible
- [ ] Chunk boundaries handled properly
- [ ] Terrain generates without artifacts
- [ ] Camera movement is smooth
