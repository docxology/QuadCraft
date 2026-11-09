# 4D Doom — Raw-label dungeon traversal with an AB-slice raycaster

A first-person browser shooter using a sparse raw four-index dungeon and a two-dimensional AB raycast view at the player’s current C/D slice.

“4D” is the portfolio name. Physical Quadray projection has rank three; raw board labels may deliberately carry additional game state. See the [portfolio coordinate/time contract](../../docs/games.md).

## Quick Start

From the QuadCraft repository root, with Python 3.13 and a modern browser:

```bash
python3.13 games/run_games.py --game doom
```

Serve the parent `games/` tree, not this game directory alone: [index.html](index.html) loads sibling `../4d_generic/` assets. No JavaScript bundling step is needed. The static launcher is not a multiplayer backend.

## Game Mechanics

`DoomMap.cells` keys distinguish raw `(a,b,c,d)` labels, including physically gauge-equivalent labels. Missing/out-of-bounds cells are walls. Movement and line-of-sight traverse this raw occupancy; physical ranges and sphere-hit checks use the shared Quadray metric. Eight signed label neighbors and parity-based tetra/octa names are game metadata, not a regular physical tetrahedral tessellation.

### Clock and lifecycle

Doom has its own fixed 60 Hz accumulator, not BaseGame/GameLoop. `advanceFrame(elapsedMs)` takes milliseconds, caps each interval at 250 ms and retains fractional ticks. Before mutating live input, `settleTime(now)` consumes complete old-input ticks and keeps the fractional remainder; subsequent ticks use then-current input. Held-input transitions therefore have up to one tick of quantization, not sub-tick old/new integration. Primary weapon press remains immediate after settlement, rather than all commands waiting for the next tick. Movement, cooldowns and enemy logic are per simulation tick; FX receive milliseconds.

## Key Controls

Click Start or the canvas to construct DoomGame and request pointer lock. WASD moves/strafe in AB; Q/E or Left/Right turn; Z/X change D; Space/left Shift change C. Mouse looks while locked; primary click fires; 1–3 select owned weapons; G cycles grid overlays; R respawns only after death.

## Architecture

- [Model](js/doom_board.js): `DoomMap` owns dungeon occupancy; `DoomGame` owns actors and gameplay state.
- [Renderer](js/doom_renderer.js): `DoomRenderer` — Canvas wall-column DDA on the current AB slice, sprites, weapon/HUD/minimap and layered decorative geometry/FX.
- [Controller](js/doom_game.js): `DoomGame` wires input and lifecycle.
- [Module guide](js/README.md) describes additional helpers and load boundaries.

The wall renderer is an AB DDA through `getSlice(c,d)`, not a simultaneous four-axis physical raycaster. `firstObstruction` traverses a closed raw four-index segment; `traceShot` casts an AB raw ray with physical enemy radius. Pointer-lock rejection is surfaced by the controller; keyboard turning remains available. There is no shared P-pause lifecycle here.

## Testing

From the repository root:

```bash
python3.13 games/run_games.py --test --game doom
```

[Tests and limitations](tests/README.md) distinguish logic checks from actual browser interaction. No saved count or production-readiness claim replaces current results.

## Documentation

- [Maintenance instructions](AGENTS.md)
- [Shared modules](../4d_generic/README.md)
- [Game index](../GAMES_INDEX.md)
- [QuadCraft](../../README.md)
