# 4D Bomberman — Agent Instructions

## Project Overview

Grid-based bombing with destructible walls in 4D IVM space. Standalone browser application built on Quadray coordinates.

## Quick Commands

```bash
# Run tests (8 tests)
node tests/test_bomberman.js

# Open in browser
open index.html

# Start local server
python3 -m http.server 8119
```

## Shared Modules

Imported via `<script>` tags in `index.html` from `../4d_generic/`:
`quadray.js`, `camera.js`, `projection.js`, `zoom.js`, `synergetics.js`

## Module Dependency Order

Load in this order to avoid reference errors:

```text
1. bomberman_board.js     # Board/world state (needs Quadray)
2. bomberman_renderer.js  # Canvas rendering (needs Quadray, Board)
3. bomberman_game.js      # Controller (needs all above)
```

## File Inventory

### JavaScript Modules (`js/`)

| File | Key Exports | Purpose |
|------|-------------|---------|
| `bomberman_board.js` | `BombermanBoard` | IVM grid, block types, bomb timers, explosion propagation |
| `bomberman_renderer.js` | `BombermanRenderer` | Top-down IVM grid with bomb animations and explosion effects |
| `bomberman_game.js` | `BombermanGame` | Bomb placement, explosion chain logic, enemy AI, and power-ups |

### Tests (`tests/`)

| File | Tests | Coverage |
|------|-------|----------|
| `test_bomberman.js` | 8 | Board creation, cell operations, reset |
| `test.html` | — | Browser test runner |

## Game Rules Summary

- Place bombs that explode along IVM axes
- Explosions destroy soft blocks and enemies
- Power-ups increase blast range and bomb count
- Navigate 4D grid to trap and eliminate enemies
- Win by being last player standing

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

- [ ] All tests pass: `node tests/test_bomberman.js`
- [ ] Browser loads: `open index.html`
- [ ] Game plays (basic interaction)
- [ ] Shift+drag rotates view
- [ ] Reset button works
- [ ] Console shows no errors
