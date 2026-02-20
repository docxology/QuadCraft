# Tests — Agent Instructions

## Overview

This directory contains the **shared module test suites** for the QuadCraft engine's `4d_generic/` modules. These tests verify the core math, rendering, and infrastructure libraries that all 22 games depend on.

## File Inventory

| File | Tests | Coverage |
|------|-------|----------|
| `shared/test_all_shared.js` | — | Integration runner — executes all shared test files |
| `shared/test_camera.js` | 8 | CameraController (rotation, zoom, reset, state) |
| `shared/test_projection.js` | 6 | projectQuadray(), drawQuadrayAxes() |
| `shared/test_zoom.js` | 5 | setupZoom() (wheel events, min/max clamping) |
| `shared/test_base_game.js` | 10 | BaseGame lifecycle (init, start, pause, reset, events) |
| `shared/test_base_renderer.js` | 10 | BaseRenderer (canvas setup, projection, axes) |
| `shared/test_grid_utils.js` | 8 | GridUtils (IVM neighbors, distance, depth sorting) |
| `shared/test_hud.js` | 6 | HUD rendering (panel layout, text, stats) |
| `shared/test_score_manager.js` | 8 | ScoreManager (win/loss tracking, persistence) |
| `test_config.py` | — | Python testing for `src.core.config` |
| `test_registry.py` | — | Python testing for `src.core.registry` |
| `test_validation.py` | — | Python testing for `src.qa.validation` |
| `space/test_geometry.py` | — | Python testing for src.space.geometry |

## Usage

```bash
# Run all shared module tests
node tests/shared/test_all_shared.js

# Run individual JS test suite
node tests/shared/test_camera.js

# Run Python infrastructure tests (mirrors src/ topology)
python3 -m pytest tests/
```
