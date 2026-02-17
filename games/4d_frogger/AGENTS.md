# 4D Frogger — Agent Instructions

## Project Overview

Lane-crossing obstacle avoidance in 4D Quadray space. Standalone browser application built on Quadray coordinates.

## Quick Commands

```bash
# Run tests (8 tests)
node tests/test_frogger.js

# Open in browser
open index.html

# Start local server
python3 -m http.server 8118
```

## Shared Modules

Imported via `<script>` tags in `index.html` from `../4d_generic/`:
`quadray.js`, `camera.js`, `projection.js`, `zoom.js`, `synergetics.js`

## Module Dependency Order

Load in this order to avoid reference errors:

```text
1. frogger_board.js     # Board/world state (needs Quadray)
2. frogger_renderer.js  # Canvas rendering (needs Quadray, Board)
3. frogger_game.js      # Controller (needs all above)
```

## File Inventory

### JavaScript Modules (`js/`)

| File | Key Exports | Purpose |
|------|-------------|---------|
| `frogger_board.js` | `FroggerBoard` | Lane obstacle positions, frog state, home position tracking |
| `frogger_renderer.js` | `FroggerRenderer` | Scrolling lanes with depth projection, frog and obstacle sprites |
| `frogger_game.js` | `FroggerGame` | Hop-based movement, collision detection, timer, and scoring |

### Tests (`tests/`)

| File | Tests | Coverage |
|------|-------|----------|
| `test_frogger.js` | 8 | Board creation, cell operations, reset |
| `test.html` | — | Browser test runner |

## Game Rules Summary

- Navigate frog across lanes of moving obstacles
- Obstacles move along IVM axis paths at varying speeds
- Land on safe platforms (tetrahedral vertices)
- Fill all 4 home positions to clear a level
- Timer adds urgency to each crossing attempt

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

- [ ] All tests pass: `node tests/test_frogger.js`
- [ ] Browser loads: `open index.html`
- [ ] Game plays (basic interaction)
- [ ] Shift+drag rotates view
- [ ] Reset button works
- [ ] Console shows no errors
