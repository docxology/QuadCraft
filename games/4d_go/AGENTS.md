# 4D Go maintenance — Canonical-cell groups, liberties and captures

Read the [game guide](README.md), [repository instructions](../../AGENTS.md) and [portfolio contracts](../../docs/games.md) before changing behavior. This folder is a browser game, not the native QuadCraft runtime.

## Source ownership

- [index.html](index.html) is authoritative for script order, page controls and construction.
- [js/README.md](js/README.md) maps `GoBoard`, `GoRenderer` and `GoGame` to their actual files.
- [tests/README.md](tests/README.md) records the actual source paths and historical browser-runner limitations.

## Preserve game-specific invariants

Keep one canonical cell per physical point. Capture/liberty traversal must use the same normalized bounded-neighbor graph; retain P as pass rather than silently restoring a base pause shortcut.

Placement/pass are discrete actions; inherited `update()` is empty. The shared loop only maintains display/HUD/camera state.

## Supported scope

Ko/superko, territory scoring, komi and a two-pass end condition are not implemented. Capture counts are not a complete standard-Go score or winner. Noncanonical shifted labels are not extra playable cells.

Do not infer inherited APIs from scripts merely being loaded. Keep raw storage, normalized physical points, graph edges and display geometry separate. Link shared math rather than copying a conflicting distance formula or fabricated local `quadray.js` API.

## Verification expectations

From the QuadCraft root, use `python3.13 games/run_games.py --test --game go` for the registered suites. Also validate the portfolio with `python3.13 games/run_games.py --validate` and inspect the served page for console errors, real controls, camera/zoom and reset behavior. Follow the [repository testing guide](../../docs/development/testing_guide.md); Node logic results alone do not establish browser correctness. Report only checks actually run, without permanent passing-count claims.
