# 4D Space Invaders — Agent Instructions

## Project Overview

Wave-based shooting with formation movement in 4D. Standalone browser application built on Quadray coordinates.

## Quick Commands

```bash
# Run tests (8 tests)
node tests/test_space_invaders.js

# Open in browser
open index.html

# Start local server
python3 -m http.server 8117
```

## Shared Modules

Imported via `<script>` tags in `index.html` from `../4d_generic/`:
`quadray.js`, `camera.js`, `projection.js`, `zoom.js`, `synergetics.js`

## Module Dependency Order

Load in this order to avoid reference errors:

```text
1. space_invaders_board.js     # Board/world state (needs Quadray)
2. space_invaders_renderer.js  # Canvas rendering (needs Quadray, Board)
3. space_invaders_game.js      # Controller (needs all above)
```

## File Inventory

### JavaScript Modules (`js/`)

| File | Key Exports | Purpose |
|------|-------------|---------|
| `space_invaders_board.js` | `InvadersBoard` | Alien formation grid, projectile tracking, shield state |
| `space_invaders_renderer.js` | `InvadersRenderer` | Formation rendering with depth, projectile trails, shield damage |
| `space_invaders_game.js` | `InvadersGame` | Wave spawning, collision detection, scoring, and difficulty scaling |

### Tests (`tests/`)

| File | Tests | Coverage |
|------|-------|----------|
| `test_space_invaders.js` | 8 | Board creation, cell operations, reset |
| `test.html` | — | Browser test runner |

## Game Rules Summary

- Alien formations advance in 4D Quadray patterns
- Player fires projectiles along IVM axes
- Aliens speed up as fewer remain
- Shields provide destructible cover
- UFO bonus targets appear periodically

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

- [ ] All tests pass: `node tests/test_space_invaders.js`
- [ ] Browser loads: `open index.html`
- [ ] Game plays (basic interaction)
- [ ] Shift+drag rotates view
- [ ] Reset button works
- [ ] Console shows no errors
