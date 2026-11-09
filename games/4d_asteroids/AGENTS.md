# 4D Asteroids maintenance — Continuous wrapped flight and swept collisions

Read the [game guide](README.md), [repository instructions](../../AGENTS.md) and [portfolio contracts](../../docs/games.md) before changing behavior. This folder is a browser game, not the native QuadCraft runtime.

## Source ownership

- [index.html](index.html) is authoritative for script order, page controls and construction.
- [js/README.md](js/README.md) maps `AsteroidsBoard`, `AsteroidsRenderer` and `AsteroidsGame` to their actual files.
- [tests/README.md](tests/README.md) records the actual source paths and historical browser-runner limitations.

## Preserve game-specific invariants

Keep raw periodic state separate from physical nearest-image distance. Preserve the independent seeded RNG and event-time ordering, including residual fragment flight and pending respawn cancellation on reset.

`GameLoop` calls `update(dt)` with fixed seconds at a 16 ms tick. Sum held raw-axis acceleration before one thrust call and the existing coefficient-space speed cap; opposing W/S and A/D cancel before clamping. UFO fire, projectile expiry, shields and the 1.5-second respawn are simulation-time events. The shared loop caps catch-up at 250 ms. Pause rejects gameplay commands as well as updates.

## Supported scope

Raw labels are not four independent physical axes. Ship speed is capped in raw coefficient space, while collision radii are physical. Shift is both a hyperspace key and the camera-drag modifier.

Do not infer inherited APIs from scripts merely being loaded. Keep raw storage, normalized physical points, graph edges and display geometry separate. Link shared math rather than copying a conflicting distance formula or fabricated local `quadray.js` API.

## Verification expectations

From the QuadCraft root, use `python3.13 games/run_games.py --test --game asteroids` for the registered suites. Also validate the portfolio with `python3.13 games/run_games.py --validate` and inspect the served page for console errors, real controls, camera/zoom and reset behavior. Follow the [repository testing guide](../../docs/development/testing_guide.md); Node logic results alone do not establish browser correctness. Report only checks actually run, without permanent passing-count claims.
