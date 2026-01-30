# Utility Modules - AI Agent Guidelines

## constants.js

Central location for all configuration values.

### Guidelines

#### Adding Constants

- Use UPPER_SNAKE_CASE for constants
- Group related constants together
- Document units and ranges
- Consider making configurable via UI

#### Modifying Constants

- Test impact on gameplay
- Check all usages
- Consider backward compatibility for saves

### Categories

**Mathematical** - Do not change without understanding all uses

- ROOT2, S3 are fundamental

**Game Config** - Tunable for gameplay feel

- Speeds, sizes, distances

**UI Config** - Safe to adjust for layout

- Panel dimensions, colors

**Colors** - Visual preferences

- Ensure contrast and accessibility

## Best Practices

```javascript
// Good: Named exports with documentation
export const CAMERA_SPEED = 0.5;  // units per second

// Avoid: Magic numbers in code
// Use constants instead
```
