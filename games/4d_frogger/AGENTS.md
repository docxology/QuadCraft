# 4D Frogger maintenance — Event-driven hops and logical-step lane hazards

Read the [game guide](README.md), [repository instructions](../../AGENTS.md) and [portfolio contracts](../../docs/games.md) before changing behavior. This folder is a browser game, not the native QuadCraft runtime.

## Source ownership

- [index.html](index.html) is authoritative for script order, page controls and construction.
- [js/README.md](js/README.md) maps `FroggerBoard`, `FroggerRenderer` and `FroggerGame` to their actual files.
- [tests/README.md](tests/README.md) records the actual source paths and historical browser-runner limitations.

## Preserve game-specific invariants

Preserve raw wrapped B/C/D state and bounded A progress. Keep timer/speed units per board step, and do not invent four-goal home slots or pause-gated hop ownership.

The shared loop calls one `board.step()` every 200 ms. `timeLeft` counts logical ticks, not seconds; obstacle speed is per step. Hop input is event-driven rather than a held-key continuous integrator.

## Supported scope

Hop callbacks guard game-over but not pause, so loop pause alone does not block hops. Collision is raw-coordinate arcade logic rather than physical sphere distance. Shared geometric readouts do not change the lane topology.

Do not infer inherited APIs from scripts merely being loaded. Keep raw storage, normalized physical points, graph edges and display geometry separate. Link shared math rather than copying a conflicting distance formula or fabricated local `quadray.js` API.

## Verification expectations

From the QuadCraft root, use `python3.13 games/run_games.py --test --game frogger` for the registered suites. Also validate the portfolio with `python3.13 games/run_games.py --validate` and inspect the served page for console errors, real controls, camera/zoom and reset behavior. Follow the [repository testing guide](../../docs/development/testing_guide.md); Node logic results alone do not establish browser correctness. Report only checks actually run, without permanent passing-count claims.
