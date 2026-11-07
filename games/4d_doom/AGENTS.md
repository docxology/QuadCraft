# 4D Doom Agent Guidelines (AGENTS.md)

## Shared Modules

> Doom uses ES-module `import/export` syntax. `js/quadray.js` bridges to the
> canonical `../4d_generic/quadray.js`; it is not a separate math implementation.

## Architecture

- **Synergetics FPS Engine**: DDA raycaster on IVM (Isotropic Vector Matrix) grid
- **World Model**: Sparse Map storage at integer Quadray coordinates (IVM vertices)
- **Geometry**: Fuller's Synergetics — tetravolumes, T:O:C=1:4:20 polyhedra ratios
- **Coordinates**: Quadray (a,b,c,d) — tetrahedral 4D, not Cartesian

## Module Map

- `doom_config.js` — IVM constants, 8 directions, cell types (TETRA_WALL, OCTA_WALL)
- `doom_board.js` — Sparse IVM grid, `getCell/setCell`, `getSlice(c,d)`, `cellParity`
- `doom_entities.js` — `Player`, `Enemy` utilizing purely native `Quadray.distance()`
- `doom_physics.js` — Grid-label DDA and line-of-sight routines
- `doom_renderer.js` — Distance-based 4D dynamic lighting projection |
- `doom_hud_synergetics.js` — `SynergeticsHUD` class (panel, compass, position, grid)
- `doom_synergetics.js` — `computeAllAnalysis`, geometric identity verification
- `doom_game.js` — `DoomGame` controller integrating all modules

## Key Patterns

1. **Raw-label adjacency**: 8 signed coordinate steps; distinct from the 12 FCC/IVM neighbor permutations
2. **Cell classification**: `(a+b+c+d) % 2` selects the game's tetra/octa label
3. **Tetravolume**: Per-cell = (1/√2)³ × S3 ≈ 0.375 tetravolumes
4. **Analysis Caching**: `markDirty()` invalidates, recompute only when needed (not per-frame)
5. **Slice Projection**: `getSlice(c,d)` returns 2D array for the DDA in (A,B) plane

## Testing

- Node: `node games/4d_doom/tests/test_doom.js` from repository root
- Browser: serve `games/` (or the repository root) and open `tests/test_doom.html`; the shared classic script must load before its module bridge
