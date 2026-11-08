# 4D Backgammon maintenance — Dice-driven race on a projected 24-point track

Read the [game guide](README.md), [repository instructions](../../AGENTS.md) and [portfolio contracts](../../docs/games.md) before changing behavior. This folder is a browser game, not the native QuadCraft runtime.

## Source ownership

- [index.html](index.html) is authoritative for script order, page controls and construction.
- [js/README.md](js/README.md) maps `BackgammonBoard`, `BackgammonRenderer` and `BackgammonGame` to their actual files.
- [tests/README.md](tests/README.md) records the actual source paths and historical browser-runner limitations.

## Preserve game-specific invariants

Keep point indices, bar/off sentinels and dice consumption distinct from projected coordinates. Audit the first-valid-move click policy separately from board move generation.

Turns change through board actions, not elapsed-time integration. The shared loop provides camera/HUD rendering; it does not roll dice or advance pieces automatically.

## Supported scope

Board-level bar/bearing-off support is broader than the point-click UI: the renderer hit test selects numbered track points. Do not describe this as a complete standard Backgammon interface or an automatic opponent.

Do not infer inherited APIs from scripts merely being loaded. Keep raw storage, normalized physical points, graph edges and display geometry separate. Link shared math rather than copying a conflicting distance formula or fabricated local `quadray.js` API.

## Verification expectations

From the QuadCraft root, use `python3.13 games/run_games.py --test --game backgammon` for the registered suites. Also validate the portfolio with `python3.13 games/run_games.py --validate` and inspect the served page for console errors, real controls, camera/zoom and reset behavior. Follow the [repository testing guide](../../docs/development/testing_guide.md); Node logic results alone do not establish browser correctness. Report only checks actually run, without permanent passing-count claims.
