# 4D Doom test maintenance

Read [suite scope and commands](README.md) and [game instructions](../AGENTS.md). The test files are JavaScript behavior checks, not proof that every shared module or browser path is covered.

## Behavior to preserve

Keep raw occupancy distinct from physical distance and AB-slice view distance. Preserve closed-boundary/tie semantics in firstObstruction/traceShot and consume elapsed input time exactly once. The ESM Quadray adapter must reuse the canonical shared class.

## Evidence limits

Configuration/entities/map generation, raw-label obstruction and line-of-sight, hitscan ordering/boundaries, fixed-step elapsed/input ownership and geometry/HUD/FX helpers. These do not establish a fully physical tessellation or unrestricted browser permission support.

Both `test.html` and `test_doom.html` preload the shared Quadray classic script before the ES-module suite. Serve the parent `games/` tree; Node-only and browser-only branches have different environments.

Prefer genuine consumer-visible state transitions and geometry checks over file-existence, source-text, wording or fixed-count assertions. Test actual game interfaces when changing them; helper objects do not establish controller integration. Keep suite output/exit status compatible with the [launcher test runner](../../src/qa/testing.py), and report only executed results. Browser interaction is a separate verification gate.
