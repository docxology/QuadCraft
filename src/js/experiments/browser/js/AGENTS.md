# JavaScript Modules - AI Agent Guidelines

## Overview

ES6 module-based architecture with clear separation of concerns.

## Module Guidelines

### Creating New Modules

1. Place in appropriate subdirectory
2. Use ES6 export syntax
3. Document public API
4. Add to dependency graph docs

### Modifying Modules

1. Maintain export compatibility
2. Consider downstream dependencies
3. Update imports if renaming

## Import Patterns

```javascript
// Named exports
export function myFunction() { }
export class MyClass { }

// Default export (rare)
export default class GameState { }

// Imports
import { function1, Class1 } from './module.js';
```

## Testing

- Modules can be tested in isolation
- Mock dependencies as needed
- Test in browser with DevTools

## Performance

- Lazy load heavy modules if possible
- Avoid circular dependencies
- Profile module loading time

## Documentation

Each module should have:

- Header comment with purpose
- JSDoc for public functions
- Usage examples if complex
