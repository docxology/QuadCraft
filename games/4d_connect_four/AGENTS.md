# 4D Connect Four — Agent Instructions

## Project Overview

Gravity-drop 4-in-a-row in 4D Quadray/IVM space. Standalone browser application built on tetrahedral coordinates with full Quadray method integration, AI opponent, and synergetics geometry.

## Quick Commands

```bash
# Run tests (70 tests)
node tests/test_connect_four.js

# Open in browser
open index.html

# Start local server
python3 -m http.server 8120
```

## Shared Modules

All loaded via `<script>` tags from `../4d_generic/`:

| Module | Key Exports Used |
|--------|-----------------|
| `quadray.js` | `Quadray` (clone, normalized, toCartesian, fromCartesian, length, add, subtract, scale, toIVM, cellVolume, cellType, distance, distanceTo, equals, toKey, IVM_DIRECTIONS, BASIS, ORIGIN) |
| `synergetics.js` | `SYNERGETICS`, `angleBetweenQuadrays`, `verifyRoundTrip`, `verifyGeometricIdentities` |
| `grid_utils.js` | `GridUtils` (generateGrid, key, parseKey, neighbors, boundedNeighbors, inBounds, manhattan, euclidean, depthSort, shuffle, randomCoord) |
| `projection.js` | `projectQuadray`, `drawQuadrayAxes` |
| `base_renderer.js` | `BaseRenderer` (_project,_drawAxes, _clearCanvas,_drawHUD, _drawCircle,_drawDiamond) |
| `base_game.js` | `BaseGame` (init, togglePause, reset, _syncCamera,_updateHUD) |
| `hud.js` | `HUD` (set, gameOver, paused, playing, warning) |
| `score_manager.js` | `ScoreManager` (addScore, reset, toJSON) |
| `camera.js` | `CameraController` |
| `zoom.js` | `setupZoom` |
| `game_loop.js` | `GameLoop` |
| `input_controller.js` | `InputController` |

## Module Dependency Order

```text
1. quadray.js              # Quadray class
2. camera.js               # Camera controller
3. projection.js           # Quadray-to-2D projection
4. zoom.js                 # Mouse wheel zoom
5. synergetics.js          # Constants & verification
6. game_loop.js            # Render/update loop
7. input_controller.js     # Keyboard bindings
8. grid_utils.js           # IVM grid math
9. base_renderer.js        # Shared renderer base
10. base_game.js           # Shared game controller base
11. hud.js                 # HUD display
12. score_manager.js       # Score/level tracking
13. connect_four_board.js  # Board state (extends Map)
14. connect_four_renderer.js # Renderer (extends BaseRenderer)
15. connect_four_game.js   # Controller (extends BaseGame)
```

## File Inventory

### JavaScript Modules (`js/`)

| File | Key Exports | Purpose |
|------|-------------|---------|
| `connect_four_board.js` | `ConnectFourBoard` | Quadray-native grid, gravity via IVM snapping, cellType parity, win detection with IVM_DIRECTIONS, distance metrics, AI evaluation, synergetics metadata |
| `connect_four_renderer.js` | `ConnectFourRenderer` | Extends BaseRenderer: depth-sorted rendering, tetra/octa shapes via cellType, ghost preview, win glow animation, IVM wireframe, coordinate labels |
| `connect_four_game.js` | `ConnectFourGame` | Extends BaseGame: ScoreManager, HUD, AI opponent (easy/medium/hard), geometric verification on startup, move undo for AI search |

### Tests (`tests/`)

| File | Tests | Coverage |
|------|-------|----------|
| `test_connect_four.js` | 70 | Board creation, Quadray storage, cellType, gravity, win detection, distances, neighbors, round-trip, synergetics, geometric identities, angles, metadata, AI eval, reset |
| `test.html` | — | Browser test runner (loads all 12 shared modules) |

## Game Controls

| Input | Action |
|-------|--------|
| Click | Drop piece in column |
| N | New game |
| R | Reset |
| P | Pause |
| A | Toggle AI |
| D | Cycle difficulty |
| Shift+drag | Rotate camera |
| Scroll | Zoom |

## Code Standards

- **Language**: ES6+ JavaScript (classes, const/let, arrow functions)
- **Inheritance**: Extends `BaseRenderer` and `BaseGame` from shared modules
- **Comments**: JSDoc for public functions
- **Indentation**: 4 spaces
- **Export Pattern**: Browser + Node.js dual support

```javascript
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ClassName };
}
```

## Verification Checklist

- [x] All 70 tests pass: `node tests/test_connect_four.js`
- [ ] Browser loads: `open index.html`
- [ ] Game plays (click-to-drop with gravity)
- [ ] Tetra/octa cell shapes render differently
- [ ] AI opponent plays at all difficulty levels
- [ ] Shift+drag rotates view
- [ ] Win detection highlights with glow
- [ ] Move history shows Quadray coordinates
- [ ] IVM info panel shows synergetics data
- [ ] Console shows geometric verification on startup
