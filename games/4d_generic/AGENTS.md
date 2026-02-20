# 4D Generic — Shared Module Library

## Project Overview

`4d_generic/` is the **shared foundation** for all QuadCraft games. It contains the canonical copies of `quadray.js`, `camera.js`, `projection.js`, `zoom.js`, and `synergetics.js`. All 4D games import these via `<script src="../4d_generic/...">` tags — no game has its own copy.

> **Not a playable game** — this is a library and reference implementation.

## Quick Commands

```bash
# Run shared module tests
node games/4d_generic/tests/test_quadray.js
node games/4d_generic/tests/test_synergetics.js

# Run all shared tests (from games/)
node tests/test_all_shared.js
```

## Shared Modules

| Module | Key Exports | Purpose |
|--------|-------------|--------|
| `quadray.js` | `Quadray` class, `BASIS`, `distance`, `fromCartesian` | 4D tetrahedral coordinate math |
| `camera.js` | `CameraController` class | Drag-to-rotate camera (shift-drag or left-drag modes) |
| `projection.js` | `projectQuadray()`, `drawQuadrayAxes()` | 3D→2D perspective projection |
| `zoom.js` | `setupZoom()` | Mouse-wheel zoom with min/max clamping |
| `synergetics.js` | `SYNERGETICS`, `angleBetweenQuadrays`, `verifyGeometricIdentities` | Fuller's volume ratios and IVM geometry |
| `base_game.js` | `BaseGame` class | Common game lifecycle (init, start, pause, reset) |
| `base_renderer.js` | `BaseRenderer` class | Common rendering (canvas setup, projection, axes drawing) |
| `game_loop.js` | `GameLoop` class | RequestAnimationFrame loop with delta tracking |
| `grid_utils.js` | `GridUtils` | IVM neighbor lookup, distance calc, depth sorting |
| `hud.js` | `HUD` class | On-canvas HUD rendering (status, controls, geometry) |
| `input_controller.js` | `InputController` class | Keyboard/mouse event multiplexer |
| `score_manager.js` | `ScoreManager` class | Win/loss/score tracking with persistence |
| `base_board.js` | `BaseBoard` class | Common board logic (grid, distances, integrity, metadata) |
| `entity_system.js` | `QuadrayEntity`, `EntityManager` | Entity position/velocity, collision, batch updates |
| `turn_manager.js` | `TurnManager` class | Player rotation, move history, undo/redo |
| `pathfinding.js` | `QuadrayPathfinder` | BFS, A*, flood fill, line-of-sight on IVM grids |
| `hud-style.css` | — | Shared CSS for HUD panels, controls, and overlays |

## How Games Import

```html
<script src="../4d_generic/quadray.js"></script>
<script src="../4d_generic/camera.js"></script>
<script src="../4d_generic/projection.js"></script>
<script src="../4d_generic/zoom.js"></script>
<script src="../4d_generic/synergetics.js"></script>
```

> **Exception:** `4d_doom` uses ES-module `import/export` syntax and retains its own quadray variant.

## Tests

| File | Assertions | Coverage |
|------|-----------|----------|
| `tests/test_quadray.js` | 16 | Constructor, clone, normalize, round-trip, distance, basis |
| `tests/test_synergetics.js` | 27 | Volume ratios, tetrahedral angle, geometric identities |

## Code Standards

- **Language**: ES6+ JavaScript
- **Purity**: Zero dependencies. Pure math logic.
- **Dual export**: Browser globals + `module.exports` for Node.js testing
- **Testing**: Rigorous validation of geometric identities

## Key Constants (Synergetics)

| Constant | Value | Description |
|----------|-------|-------------|
| `S3` | `√(9/8) ≈ 1.06066` | XYZ→Synergetics volume conversion |
| `TETRA_VOL` | 1 | Unit volume |
| `OCTA_VOL` | 4 | Relative to unit tetrahedron |
| `CUBO_VOL` | 20 | Cuboctahedron volume |
