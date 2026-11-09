# 4D Doom JavaScript — Raw-label dungeon traversal with an AB-slice raycaster

A first-person browser shooter using a sparse raw four-index dungeon and a two-dimensional AB raycast view at the player’s current C/D slice.

## Modules and entrypoint

The [game page](../index.html) loads sibling [shared modules](../../4d_generic/README.md) before the local game stack. Its local order is:

```text
doom_game.js (ES-module import; dependencies import explicitly)
```

| File | Actual responsibility |
| --- | --- |
| [doom_board.js](doom_board.js) | `DoomMap`: `DoomMap.cells` keys distinguish raw `(a,b,c,d)` labels, including physically gauge-equivalent labels. Missing/out-of-bounds cells are walls. Movement and line-of-sight traverse this raw occupancy; physical ranges and sphere-hit checks use the shared Quadray metric. Eight signed label neighbors and parity-based tetra/octa names are game metadata, not a regular physical tetrahedral tessellation. |
| [doom_renderer.js](doom_renderer.js) | `DoomRenderer`: Canvas wall-column DDA on the current AB slice, sprites, weapon/HUD/minimap and layered decorative geometry/FX. |
| [doom_game.js](doom_game.js) | `DoomGame`: input, lifecycle and HUD wiring |
| [doom_config.js](doom_config.js) | Cell/weapon/enemy/render constants and eight signed raw steps |
| [doom_entities.js](doom_entities.js) | Player, Enemy, Projectile, Particle and Pickup records |
| [quadray.js](quadray.js) | ES-module bridge to shared Quadray, ROOT2 and S3 |
| [doom_geometry.js](doom_geometry.js) | Standalone polyhedron/frequency/volume reference helpers |
| [doom_synergetics.js](doom_synergetics.js) | Cached raw-map summaries and geometric readouts |
| [doom_hud_synergetics.js](doom_hud_synergetics.js) | Analysis-panel, compass and coordinate overlays |
| [doom_fx.js](doom_fx.js) | Decorative geometry/starfield/floor/death overlays |
| [doom_logger.js](doom_logger.js) | Console logging levels and subsystem log helpers |

## Data and update boundary

Doom owns its fixed 60 Hz accumulator, not BaseGame/GameLoop. `advanceFrame(elapsedMs)` takes milliseconds, caps intervals at 250 ms and retains fractional ticks. `settleTime(now)` consumes complete old-input ticks before live input mutation; retained fractional time contributes to later ticks using then-current input. This is up-to-one-tick held-input quantization, not sub-tick splitting. Primary weapon press executes immediately after settlement. Movement/cooldowns/enemy logic are per tick; FX receive milliseconds. See [the game timing contract](../README.md#clock-and-lifecycle).

Keep raw occupancy distinct from physical distance and AB-slice view distance. Preserve closed-boundary/tie semantics in firstObstruction/traceShot and consume elapsed input time exactly once. The ESM Quadray adapter must reuse the canonical shared class.

## Limitations

The wall renderer is an AB DDA through `getSlice(c,d)`, not a simultaneous four-axis physical raycaster. `firstObstruction` traverses a closed raw four-index segment; `traceShot` casts an AB raw ray with physical enemy radius. Pointer-lock rejection is surfaced by the controller; keyboard turning remains available. There is no shared P-pause lifecycle here.

See the [game guide](../README.md) for controls, [logic tests](../tests/README.md) for coverage boundaries and [portfolio contracts](../../../docs/games.md) for geometry/time conventions. Shared modules are capabilities, not an automatic entity/physics/save/network layer for this game.
