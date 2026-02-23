# 4D Snake — Agent Instructions

## Project Overview

Classic snake game navigating through 4D Quadray space. Standalone browser application built on Quadray coordinates.

## Quick Commands

```bash
# Run tests (15 tests)
node tests/test_snake.js

# Open in browser
open index.html

# Start local server
python3 -m http.server 8113
```

## Shared Modules

Imported via `<script>` tags in `index.html` from `../4d_generic/`:
`quadray.js`, `camera.js`, `projection.js`, `zoom.js`, `synergetics.js`

## Module Dependency Order

Load in this order to avoid reference errors:

```text
1. snake_board.js     # Board/world state (needs Quadray)
2. snake_renderer.js  # Canvas rendering (needs Quadray, Board)
3. snake_game.js      # Controller (needs all above)
```

## File Inventory

### JavaScript Modules (`js/`)

| File | Key Exports | Purpose |
|------|-------------|---------|
| `snake_board.js` | `SnakeBoard` | Grid with snake segments, food placement, and collision detection |
| `snake_renderer.js` | `SnakeRenderer` | 3D projected snake body, food markers, and trail effects |
| `snake_game.js` | `SnakeGame` | Input-driven direction changes, growth mechanics, and game loop |

### Tests (`tests/`)

| File | Tests | Coverage |
|------|-------|----------|
| `test_snake.js` | 15 | Board creation, cell operations, reset |
| `test.html` | — | Browser test runner |

## Game Rules Summary

- Snake moves through IVM grid positions
- Eating food extends the snake body
- Snake dies on self-collision or boundary hit
- Movement follows Quadray adjacency (8-connected IVM)
- Speed increases with score

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

- [ ] All tests pass: `node tests/test_snake.js`
- [ ] Browser loads: `open index.html`
- [ ] Game plays (basic interaction)
- [ ] Shift+drag rotates view
- [ ] Reset button works
- [ ] Console shows no errors
