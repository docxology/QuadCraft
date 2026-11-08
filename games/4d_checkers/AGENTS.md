# 4D Checkers maintenance — Canonical-position jumps and promotion

Read the [game guide](README.md), [repository instructions](../../AGENTS.md) and [portfolio contracts](../../docs/games.md) before changing behavior. This folder is a browser game, not the native QuadCraft runtime.

## Source ownership

- [index.html](index.html) is authoritative for script order, page controls and construction.
- [js/README.md](js/README.md) maps `CheckersBoard`, `CheckersRenderer` and `CheckersGame` to their actual files.
- [tests/README.md](tests/README.md) records the actual source paths and historical browser-runner limitations.

## Preserve game-specific invariants

Use canonical piece keys consistently; bounds and promotion operate on normalized positions. Do not silently import mandatory-capture/multi-jump rules from standard checkers.

Piece moves are discrete actions; `update()` performs no simulation work. A shared render loop handles display and camera state, not automatic turns.

## Supported scope

Canonical `position.toKey()` merges common-offset aliases; this is not 256 physically distinct slots. Generated simple moves and single jumps do not implement mandatory captures or chained multi-jumps. The initial even-sum arrangement is not a separate general parity-validation API.

Do not infer inherited APIs from scripts merely being loaded. Keep raw storage, normalized physical points, graph edges and display geometry separate. Link shared math rather than copying a conflicting distance formula or fabricated local `quadray.js` API.

## Verification expectations

From the QuadCraft root, use `python3.13 games/run_games.py --test --game checkers` for the registered suites. Also validate the portfolio with `python3.13 games/run_games.py --validate` and inspect the served page for console errors, real controls, camera/zoom and reset behavior. Follow the [repository testing guide](../../docs/development/testing_guide.md); Node logic results alone do not establish browser correctness. Report only checks actually run, without permanent passing-count claims.
