# Browser Experiments - AI Agent Guidelines

## Overview

This is the most mature JavaScript implementation with properly separated modules. See the README.md in this directory for comprehensive documentation.

## Key Principles

### Modularity

- Each module has single responsibility
- Dependencies are explicit
- Easy to test in isolation

### Code Organization

```
js/
├── core/       # Game engine
├── math/       # Coordinate math
├── analysis/   # Analysis tools
└── utils/      # Constants and utilities
```

## Development Guidelines

### Adding New Features

1. Identify appropriate module
2. Follow existing patterns
3. Export via module system
4. Update standalone if needed

### Modifying Existing Code

1. Understand module dependencies
2. Maintain API compatibility
3. Test with both modular and standalone
4. Update imports as needed

### Performance

- Profile before optimizing
- Consider rendering impact
- Cache computed values
- Use requestAnimationFrame

## Relationship to Standalone

`QuadCraft_Complete_Standalone.html` contains all modules embedded:

- Easier distribution
- No module loading required
- Must be updated when modules change

## Testing

1. Test in modular version first
2. Check console for errors
3. Verify save/load works
4. Test all UI controls
