# Browser Application - AI Agent Guidelines

## Overview

This is the most actively developed QuadCraft implementation. Changes here are tested immediately by opening the HTML file.

## Development Workflow

1. Edit HTML/CSS/JavaScript in `index.html`
2. Refresh browser to test
3. Use browser DevTools for debugging
4. Check console for errors

## Key Code Sections

The main `index.html` contains:

- HTML structure for UI panels
- CSS styling
- JavaScript game engine (embedded)

### Game State

Central state object containing:

- Grid data (dots, shapes)
- Camera position and orientation
- UI state

### Rendering

Canvas-based 3D rendering:

- Triangle sorting for depth
- Cone-plane intersection for spheres
- Real-time updates

### Controls

Event listeners for:

- Keyboard navigation
- Mouse interaction
- Touch support (partial)

## Modification Guidelines

### Adding UI Elements

1. Add HTML in appropriate panel
2. Add CSS styles
3. Wire up JavaScript handlers
4. Test responsiveness

### Modifying Game Logic

1. Locate relevant section in script
2. Preserve state consistency
3. Update save/load if state changes
4. Test with existing saves

### Performance Concerns

- Minimize DOM operations during gameplay
- Use requestAnimationFrame for rendering
- Profile with browser DevTools

## Save Format

JSON structure:

```json
{
  "dots": [...],
  "shapes": [...],
  "camera": {...},
  "version": "..."
}
```

Maintain backward compatibility when changing.

## Testing Checklist

- [ ] All controls work
- [ ] Shapes render correctly
- [ ] Save/load functions
- [ ] No console errors
- [ ] Reasonable frame rate
