# Core Modules - AI Agent Guidelines

## Central State (gameState.js)

The single source of truth for game data.

### Guidelines

- All state changes go through gameState
- Set appropriate flags when changing state
- Avoid direct grid manipulation elsewhere

### Common Patterns

```javascript
gameState.addDot(position);
gameState.gridChanged = true;
```

## Input (gameController.js)

Event-driven input handling.

### Guidelines

- Add new controls here
- Keep handlers lightweight
- Delegate to gameState for changes

## Rendering (renderer.js)

Canvas-based 3D rendering.

### Guidelines

- Optimize drawing path
- Respect depth ordering
- Handle visibility correctly

### Performance

- Minimize per-frame allocations
- Cache computed projections
- Use dirty flags to skip redundant work

## Camera (camera.js)

View transformation management.

### Guidelines

- Maintain smooth movement
- Handle mouse capture state
- Update view matrix efficiently

## Save/Load (saveLoadController.js)

Persistence operations.

### Guidelines

- Maintain format compatibility
- Handle errors gracefully
- Test with corrupted saves

## Code Execution (codeExecutor.js)

Dynamic JavaScript evaluation.

### Security Notes

- Runs in browser context
- User code can access game objects
- Consider sandboxing for untrusted input
