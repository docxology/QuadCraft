# 4D Doom JavaScript maintenance

Use the [module map](README.md) and actual [HTML entrypoint](../index.html), not a generic game template, for dependency order and construction. Read [game-level instructions](../AGENTS.md) before editing this directory.

## Model/controller contract

Keep raw occupancy distinct from physical distance and AB-slice view distance. Preserve closed-boundary/tie semantics in firstObstruction/traceShot and consume elapsed input time exactly once. The ESM Quadray adapter must reuse the canonical shared class.

Doom has its own fixed 60 Hz accumulator, not BaseGame/GameLoop. `advanceFrame(elapsedMs)` takes milliseconds, caps each interval at 250 ms and retains fractional ticks. `settleTime(now)` consumes old-input time before live input changes. Movement, weapon cooldowns and enemy logic are per simulation tick; FX receive milliseconds.

## Rendering and input

`DoomRenderer` handles canvas wall-column DDA on the current AB slice, sprites, weapon/HUD/minimap and layered decorative geometry/FX.

Click Start or the canvas to construct DoomGame and request pointer lock. WASD moves/strafe in AB; Q/E or Left/Right turn; Z/X change D; Space/left Shift change C. Mouse looks while locked; primary click fires; 1–3 select owned weapons; G cycles grid overlays; R respawns only after death.

Keep browser-only DOM/Canvas work in its actual controller/renderer boundary. Doom uses explicit ES modules and a shared-math bridge. Its HTML must preload the shared classic-script globals before the module entrypoint; it is not a BaseGame subclass.

Use [tests](../tests/README.md) to select behavior checks and the [shared library guide](../../4d_generic/README.md) for common helpers. Preserve per-game semantics rather than importing unsupported shared features.
