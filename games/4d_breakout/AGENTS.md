# 4D Breakout — Agent Instructions

## Project Overview

Brick-breaking with Quadray ball physics in 4D. Standalone browser application built on Quadray coordinates.

## Quick Commands

```bash
# Run tests (20 tests)
node tests/test_breakout.js

# Open in browser
open index.html

# Start local server
python3 -m http.server 8115
```

## Shared Modules

Imported via `<script>` tags in `index.html` from `../4d_generic/`:
`quadray.js`, `camera.js`, `projection.js`, `zoom.js`, `synergetics.js`

## Module Dependency Order

Load in this order to avoid reference errors:

```text
1. breakout_board.js     # Board/world state (needs Quadray)
2. breakout_renderer.js  # Canvas rendering (needs Quadray, Board)
3. breakout_game.js      # Controller (needs all above)
```

## File Inventory

### JavaScript Modules (`js/`)

| File | Key Exports | Purpose |
|------|-------------|---------|
| `breakout_board.js` | `BreakoutBoard` | Brick grid, ball physics, paddle state, and power-up tracking |
| `breakout_renderer.js` | `BreakoutRenderer` | Projected bricks with depth coloring, ball trail, and paddle |
| `breakout_game.js` | `BreakoutGame` | Level progression, power-up effects, lives, and game loop |

### Tests (`tests/`)

| File | Tests | Coverage |
|------|-------|----------|
| `test_breakout.js` | 20 | Board creation, cell operations, reset |
| `test.html` | — | Browser test runner |

## Game Rules Summary

- Ball bounces off paddle and destroys bricks
- Bricks arranged in 4D tetrahedral layers
- Different brick types require multiple hits
- Power-ups drop from destroyed bricks
- Clear all bricks to advance to next level

## Code Standards

- **Language**: ES6+ JavaScript (classes, const/let, arrow functions)
- **Comments**: JSDoc for public functions
- **Indentation**: 4 spaces
- **Export Pattern**: Browser + Node.js dual support

```javascript
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ClassName };
}
```

## Verification Checklist

- [ ] All tests pass: `node tests/test_breakout.js`
- [ ] Browser loads: `open index.html`
- [ ] Game plays (basic interaction)
- [ ] Shift+drag rotates view
- [ ] Reset button works
- [ ] Console shows no errors
