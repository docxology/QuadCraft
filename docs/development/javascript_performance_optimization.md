# Profile the real JavaScript loops before changing their contracts

[Development index](README.md) · [Runtime map](javascript_implementation.md) · [Testing](testing_guide.md)

## Separate the workloads

The historical geometry experiment and the portfolio do not share one renderer or update scheduler. [`src/browser/index.html`](../../src/browser/index.html) schedules via `setTimeout`, clamps elapsed seconds and rebuilds/sorts Canvas drawables. [`games/4d_generic/game_loop.js`](../../games/4d_generic/game_loop.js) accumulates milliseconds and advances fixed-seconds logic before rendering. Doom owns a separate 60 Hz accumulator.

Reducing render frequency must not multiply logical simulation time or change ownership of input transitions. A maximum frame-delta cap intentionally drops long-stall time; it is not proof of wall-clock-invariant simulation.

## Source-backed cost centers

| Implementation | Work visible in source |
|---|---|
| `CCPBallGrid.surfaceQuadrays()` | The newer page's cache branch is disabled; active enumeration walks occupied ranges point by point and queries neighbors |
| `mergeBrushes(a,b)` | Forms pairwise sums of offsets, so composition can expand combinatorially |
| `conePlaneIntersection` | Camera-basis construction and conic/eigen calculations per sphere; `paintBall` currently calls it even for circle mode |
| Portfolio `GridUtils.generateGrid(size)` | Enumerates `size^4` raw labels, including physical aliases |
| `GridUtils.generateCanonicalGrid(size)` | Emits unique zero-minimum physical labels but still scans the four nested coefficient loops |
| `ConservativeGraphField.step` | Edge flux pass plus site pass, with reusable workspace and optional caller-supplied output |

See [CCP](ccp_ball_grid_system.md), [brushes](paintbrush_system.md) and [conic rendering](cone_plane_intersection_rendering.md) for exact behavior and limitations.

## Measure a reproducible case

Choose the exact HTML/game entry, board size/scene, camera, input sequence, browser and device. Use browser performance/memory tools to distinguish script, Canvas paint, layout, allocations and network waits. Record elapsed time and visible output, not only an FPS counter. Warmup, garbage collection, tab visibility and display refresh can affect observations.

Use a seed only if the selected board accepts one. Asteroids/SimAnt own seeded streams; many other paths call `Math.random`. No benchmark result or cross-browser speedup is asserted in this page. The [Chromium gate](../../games/tests/browser/README.md) is an interaction/render regression gate, not a throughput benchmark.

## Changes must preserve semantics

- Do not normalize raw board keys merely to reduce memory: independent alias slots can be game rules.
- Do not replace physical periodic collision with a raw four-axis shortcut.
- Do not cache camera-dependent projections without invalidating for pose, scale, canvas size and geometry changes.
- Do not enable a surface cache without proving correct invalidation after edits/load/sync.
- Do not reuse graph output as input: the transport API rejects overlapping buffers to preserve synchronous updates.
- Distinguish render interpolation from a logic update; keep milliseconds at the accumulator boundary and seconds at the shared update callback.

## Optimization ideas, not shipped infrastructure

Object pooling, offscreen rendering, WebAssembly kernels, workers, spatial indexing and camera-basis caching can be investigated after measurement. The repository does not provide `FrameRateManager`, `OptimizedConePlaneRenderer`, `GCMonitor`, `SIMDMath`, a Wasm math loader or browser-specific optimization switches as described by older recipes. Such names must not be presented as supported imports or configuration.

Prefer local measured changes over a parallel abstraction layer, and verify actual state/render outcomes at the affected consumer boundary.
