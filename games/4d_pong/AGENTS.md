# 4D Pong — Agent Instructions

## Project Overview

Paddle-ball game in tetrahedral 4D space. Standalone browser application built on Quadray coordinates.

## Quick Commands

```bash
# Run tests (8 tests)
node tests/test_pong.js

# Open in browser
open index.html

# Start local server
python3 -m http.server 8114
```

## Shared Modules

Imported via `<script>` tags in `index.html` from `../4d_generic/`:
`quadray.js`, `camera.js`, `projection.js`, `zoom.js`, `synergetics.js`

## Module Dependency Order

Load in this order to avoid reference errors:

```text
1. pong_board.js     # Board/world state (needs Quadray)
2. pong_renderer.js  # Canvas rendering (needs Quadray, Board)
3. pong_game.js      # Controller (needs all above)
```

## File Inventory

### JavaScript Modules (`js/`)

| File | Key Exports | Purpose |
|------|-------------|---------|
| `pong_board.js` | `PongBoard` | Ball position/velocity and paddle states in Quadray coordinates |
| `pong_renderer.js` | `PongRenderer` | Projected ball, paddles, score display, and boundary walls |
| `pong_game.js` | `PongGame` | Physics update loop, AI opponent, input handling, and scoring |

### Tests (`tests/`)

| File | Tests | Coverage |
|------|-------|----------|
| `test_pong.js` | 8 | Board creation, cell operations, reset |
| `test.html` | — | Browser test runner |

## Game Rules Summary

- Ball bounces in 4D Quadray space
- Two paddles positioned at opposing tetrahedral faces
- Ball reflects off paddles and boundaries
- Score when opponent misses the ball
- First to 11 points wins

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

- [ ] All tests pass: `node tests/test_pong.js`
- [ ] Browser loads: `open index.html`
- [ ] Game plays (basic interaction)
- [ ] Shift+drag rotates view
- [ ] Reset button works
- [ ] Console shows no errors
