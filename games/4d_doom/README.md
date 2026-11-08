# 4D DOOM — Synergetics Hyperdimensional FPS

A Wolfenstein-3D-style raycasting FPS operating in **4D Quadray tetrahedral coordinates** on an **IVM (Isotropic Vector Matrix) grid** — Fuller's Synergetics geometry brought to life as a playable first-person shooter.

We utilize a **True 4D DDA Raycaster** tracing rays across 4 intersecting IVM hyperplanes simultaneously, completely removing traditional 2D Euclidean fallbacks for collision, hit-scanning, spacing, and dynamic lighting. Rendered with a stunning high-fidelity vignette and active CRT-scanline atmospheric aesthetic overlay.

## Architecture

| Module | Role |
|--------|------|
| `doom_config.js` | IVM constants, cell types, weapons, rendering config |
| `doom_board.js` | IVM sparse map (Map-based), room generation, 4D slice extraction |
| `doom_entities.js` | Player/Enemy/Projectile with Quadray helpers |
| `doom_physics.js` | Pure Quadray distance algorithms and True 4D DDA raycasting |
| `doom_renderer.js` | True 4D dynamic lighting, IVM wall textures (tetra/octa) |
| `doom_hud_synergetics.js` | Synergetics analysis panel, animated hit-markers |
| `doom_synergetics.js` | Tetravolumes, IVM grid, coordination, polyhedra (T:O:C=1:4:20), 8 geometric identity checks |
| `doom_game.js` | Game controller wiring modules + Synergetics HUD |
| `quadray.js` | Quadray coordinate class with IVM utilities |

## Synergetics Features

- **IVM World Model**: Integer Quadray coordinates ARE IVM vertices — no cubic approximation
- **Tetravolume Metrics**: Live volume calculation using Fuller's unit (regular tetra = 1 tetravolume)
- **Polyhedra Detection**: Real-time T:O:C (1:4:20) identification in wall structure
- **8 Geometric Identity Checks**: Verified on startup (basis lengths, tetrahedral angles, round-trip conversion, S3 constant, etc.)
- **Synergetics HUD**: Tetravolumes · IVM fill · Coordination numbers · Polyhedra counts · Center of mass · Cell parity
- **Quadray Compass**: 4 color-coded tetrahedral axes (A=Red, B=Green, C=Blue, D=Yellow)
- **IVM Minimap**: Diagonal grid overlay showing tetrahedral structure

## Controls

| Key | Action |
|-----|--------|
| WASD | Move/Strafe |
| Mouse | Look |
| Left mouse button | Press to shoot; hold for automatic weapons (after mouse capture) |
| Q/E | Keyboard Turn |
| Z/X | Hyper-Strafe (D-axis) |
| Space/Shift | Elevate (C-axis) |
| 1/2/3 | Switch Weapon |
| R | Respawn (when dead) |

## Simulation and weapon queries

Gameplay advances in fixed **1/60-second ticks**, independently of display
refresh. `DoomGame.advanceFrame(elapsedMs)` accepts milliseconds, clamps each
elapsed interval to 250 ms, and retains fractional ticks. Movement, AI, weapon cooldowns,
particles and FX share those ticks; FX receives an explicit millisecond duration.
Rendering does not advance the world. Existing tuning is unchanged: forward
movement is 3.6 raw A/B units per second and the pistol cooldown is 200 ms.

`DoomGame.settleTime(now)` is the single wall-time entry point used by frames and
live input. It advances the previous input state first, then keyboard, look and
fire commands take effect. Elapsed time is consumed once, so a shot pressed at
240 ms after the previous frame is not aged through that preceding interval.
`shoot()` itself never reads a clock: automatic shots already belong to the
fixed-tick update. Respawn resets both the accumulator and wall-time baseline;
the replacement player advances only through time since respawn.

With the canvas captured, primary-button down fires once and enables held fire
for automatic weapons; up clears the hold without shooting. The subsequent
`click` only requests capture if needed, never fires a duplicate shot. Losing
mouse capture or window focus settles then clears all held movement/fire input.
The first uncaptured click requests mouse look rather than firing.

`Physics.firstObstruction(start, end)` traverses the closed raw four-index segment
in order and returns `{t, cell, position}` (fractional segment parameter) or
`null`. LOS and deployed weapon hitscan reuse this traversal. Cells remain
independent raw labels, including at simultaneous crossings and the map boundary.
`Physics.traceShot(origin, angle, enemies, maxRawDistance=20)` compares the first
wall against exact ray intersections with each living enemy's **0.8 Cartesian-unit
radius**; the earliest intersection wins, with walls winning ties. Its
`rawDistance` is an A/B ray parameter, not a physical Cartesian distance.


## Testing

Run `node games/4d_doom/tests/test_doom.js` from the repository root, or open
`tests/test_doom.html` in a browser. Behavioral regressions cover raw-cell LOS,
live thin/near/end-boundary weapon shots, enemy hit ordering and physical radius,
and equivalent simulation state under 60 Hz, 120 Hz and catch-up frame partitions.
Kernel regressions also exercise the same live-command methods used by listeners:
late shots, held automatic fire, releases, blur/capture-loss clearing, movement
press/release ownership and replacement-world movement after late respawn.
Actual pointer capture and deployed down/hold/up/blur routing require a real
browser with successful mouse capture; kernel checks do not substitute for that.
