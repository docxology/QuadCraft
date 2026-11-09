# 4D Doom maintenance — Raw-label dungeon traversal with an AB-slice raycaster

Read the [game guide](README.md), [repository instructions](../../AGENTS.md) and [portfolio contracts](../../docs/games.md) before changing behavior. This folder is a browser game, not the native QuadCraft runtime.

## Source ownership

- [index.html](index.html) is authoritative for script order, page controls and construction.
- [js/README.md](js/README.md) maps `DoomMap`, `DoomRenderer` and `DoomGame` to their actual files.
- [tests/README.md](tests/README.md) records the actual source paths and historical browser-runner limitations.

## Preserve game-specific invariants

Keep raw occupancy distinct from physical distance and AB-slice view distance. Preserve closed-boundary/tie semantics in firstObstruction/traceShot and consume elapsed input time exactly once. The ESM Quadray adapter must reuse the canonical shared class.

Doom owns a fixed 60 Hz accumulator, not BaseGame/GameLoop. `advanceFrame(elapsedMs)` takes milliseconds, caps each interval at 250 ms and retains fractional ticks. `settleTime(now)` consumes complete old-input ticks before live input changes; the retained fractional remainder contributes to subsequent ticks using then-current input. Preserve this up-to-one-tick held-input quantization, not a sub-tick split integrator. Primary weapon press remains immediate after settlement. Movement/cooldowns/enemy logic are per tick; FX receive milliseconds.

## Supported scope

The wall renderer is an AB DDA through `getSlice(c,d)`, not a simultaneous four-axis physical raycaster. `firstObstruction` traverses a closed raw four-index segment; `traceShot` casts an AB raw ray with physical enemy radius. Pointer-lock rejection is surfaced by the controller; keyboard turning remains available. There is no shared P-pause lifecycle here.

Do not infer inherited APIs from scripts merely being loaded. Keep raw storage, normalized physical points, graph edges and display geometry separate. Link shared math rather than copying a conflicting distance formula or fabricated local `quadray.js` API.

## Verification expectations

From the QuadCraft root, use `python3.13 games/run_games.py --test --game doom` for the registered suites. Also validate the portfolio with `python3.13 games/run_games.py --validate` and inspect the served page for console errors, real controls, camera/zoom and reset behavior. Follow the [repository testing guide](../../docs/development/testing_guide.md); Node logic results alone do not establish browser correctness. Report only checks actually run, without permanent passing-count claims.
