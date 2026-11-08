# 4D Life maintenance — Raw four-label toroidal cellular automaton

Read the [game guide](README.md), [repository instructions](../../AGENTS.md) and [portfolio contracts](../../docs/games.md) before changing behavior. This folder is a browser game, not the native QuadCraft runtime.

## Source ownership

- [index.html](index.html) is authoritative for script order, page controls and construction.
- [js/README.md](js/README.md) maps `LifeBoard`, `LifeRenderer` and `LifeGame` to their actual files.
- [tests/README.md](tests/README.md) records the actual source paths and historical browser-runner limitations.

## Preserve game-specific invariants

Preserve the raw Set and 80-offset toroidal update rule; do not replace it with GridUtils’s twelve-neighbor graph. Keep the wall-clock speed gate distinct from the shared loop’s fixed-second callback units.

The shared loop has a 500 ms update tick. Inside `update()`, `performance.now()` gates at most one generation by the separate `speed` millisecond threshold (initially 200). Thus the displayed speed is not a guaranteed generation interval; this is not fixed-dt continuous integration.

## Supported scope

Raw common-offset aliases remain distinct automaton cells even when they project to the same physical point. Named patterns are seed shapes, not verified oscillators/gliders under these nonstandard B5/S4–8 rules. This is not ordinary Conway B3/S23 or a twelve-neighbor FCC automaton.

Do not infer inherited APIs from scripts merely being loaded. Keep raw storage, normalized physical points, graph edges and display geometry separate. Link shared math rather than copying a conflicting distance formula or fabricated local `quadray.js` API.

## Verification expectations

From the QuadCraft root, use `python3.13 games/run_games.py --test --game life` for the registered suites. Also validate the portfolio with `python3.13 games/run_games.py --validate` and inspect the served page for console errors, real controls, camera/zoom and reset behavior. Follow the [repository testing guide](../../docs/development/testing_guide.md); Node logic results alone do not establish browser correctness. Report only checks actually run, without permanent passing-count claims.
