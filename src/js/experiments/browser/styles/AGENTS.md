# Styles - AI Agent Guidelines

## Overview

CSS styling for the modular browser version.

## Guidelines

### Adding Styles

- Use CSS variables for colors
- Follow existing naming conventions
- Ensure dark mode compatibility
- Test responsiveness

### Modifying Styles

- Check impact on all panels
- Verify readability
- Test in multiple browsers
- Consider accessibility

## Best Practices

```css
/* Use CSS variables */
color: var(--text-primary);

/* Use semantic class names */
.game-controls-panel { }

/* Group related styles */
/* -- Buttons -- */
.btn { }
.btn-primary { }
```

## Testing

- Check all three panels
- Verify in different viewport sizes
- Test color contrast
- Verify hover/active states
