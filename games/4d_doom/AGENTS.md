# 4D Doom Agent Guidelines (AGENTS.md)

## Shared Modules

> **Note:** 4D Doom uses ES-module `import/export` syntax. It retains its own
> quadray variant in `js/`. Other shared modules are not yet integrated.

## Architecture

- **Synergetics FPS Engine**: DDA raycaster on IVM (Isotropic Vector Matrix) grid
- **World Model**: Sparse Map storage at integer Quadray coordinates (IVM vertices)
- **Geometry**: Fuller's Synergetics — tetravolumes, T:O:C=1:4:20 polyhedra ratios
- **Coordinates**: Quadray (a,b,c,d) — tetrahedral 4D, not Cartesian

## Module Map

- `doom_config.js` — IVM constants, 8 directions, cell types (TETRA_WALL, OCTA_WALL)
- `doom_map.js` — Sparse IVM grid, `getCell/setCell`, `getSlice(c,d)`, `cellParity`
- `doom_entities.js` — `Player`, `Enemy` utilizing purely native `Quadray.distance()`
- `doom_physics.js` — True 4D DDA line-of-sight algorithms across 4 hyperplanes
- `doom_render_fps.js` — Distance-based 4D dynamic lighting projection |
- `doom_hud_synergetics.js` — `SynergeticsHUD` class (panel, compass, position, grid)
- `doom_synergetics.js` — `computeAllAnalysis`, geometric identity verification
- `doom_main.js` — `DoomGame` controller integrating all modules

## Key Patterns

1. **IVM Adjacency**: 8-connected (±1 on each of 4 axes), not 4-connected cubic
2. **Cell Parity**: `(a+b+c+d) % 2` → 'tetra' (even) or 'octa' (odd) — IVM vertex type
3. **Tetravolume**: Per-cell = (1/√2)³ × S3 ≈ 0.375 tetravolumes
4. **Analysis Caching**: `markDirty()` invalidates, recompute only when needed (not per-frame)
5. **Slice Projection**: `getSlice(c,d)` returns 2D array for the DDA in (A,B) plane

## Testing

- 0 tests (ES module migration in progress) in `tests/test_doom.js` — open `test_doom.html` in browser
- 8 geometric identity checks verified on startup
