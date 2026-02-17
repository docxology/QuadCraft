# Tests — Agent Instructions

## Overview

This directory contains the **shared module test suites** for the QuadCraft engine's `4d_generic/` modules. These tests verify the core math, rendering, and infrastructure libraries that all 22 games depend on.

## File Inventory

| File | Tests | Coverage |
|------|-------|----------|
| `test_all_shared.js` | — | Integration runner — executes all shared test files |
| `test_camera.js` | 8 | CameraController (rotation, zoom, reset, state) |
| `test_projection.js` | 6 | projectQuadray(), drawQuadrayAxes() |
| `test_zoom.js` | 5 | setupZoom() (wheel events, min/max clamping) |
| `test_base_game.js` | 10 | BaseGame lifecycle (init, start, pause, reset, events) |
| `test_base_renderer.js` | 10 | BaseRenderer (canvas setup, projection, axes) |
| `test_grid_utils.js` | 8 | GridUtils (IVM neighbors, distance, depth sorting) |
| `test_hud.js` | 6 | HUD rendering (panel layout, text, stats) |
| `test_score_manager.js` | 8 | ScoreManager (win/loss tracking, persistence) |
| `test_infrastructure.py` | — | Python infrastructure tests (registry, config) |

## Usage

```bash
# Run all shared module tests
node tests/test_all_shared.js

# Run individual test suite
node tests/test_camera.js
node tests/test_projection.js

# Run Python infrastructure tests
python3 -m pytest tests/test_infrastructure.py
```
