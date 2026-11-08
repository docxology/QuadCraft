# 4D Lights Out maintenance — Canonical-cell toggle puzzles on the FCC graph

Read the [game guide](README.md), [repository instructions](../../AGENTS.md) and [portfolio contracts](../../docs/games.md) before changing behavior. This folder is a browser game, not the native QuadCraft runtime.

## Source ownership

- [index.html](index.html) is authoritative for script order, page controls and construction.
- [js/README.md](js/README.md) maps `LightsOutBoard`, `LightsOutRenderer` and `LightsOutGame` to their actual files.
- [tests/README.md](tests/README.md) records the actual source paths and historical browser-runner limitations.

## Preserve game-specific invariants

Keep canonical cells and normalized bounded-neighbor toggles aligned. Random generation must not get trapped by the player-facing won guard. Do not document unsupported ScoreManager low-score options as implemented.

Toggles are discrete actions; inherited `update()` does not simulate time. The shared loop updates camera/HUD/display.

## Supported scope

The controller supplies `key` and `highScoreMode` options that shared ScoreManager does not implement. Do not promise persistent lowest-move records: the board’s move count is authoritative, while that advertised Best-score mode is not wired to a supported scoring API.

Do not infer inherited APIs from scripts merely being loaded. Keep raw storage, normalized physical points, graph edges and display geometry separate. Link shared math rather than copying a conflicting distance formula or fabricated local `quadray.js` API.

## Verification expectations

From the QuadCraft root, use `python3.13 games/run_games.py --test --game lights_out` for the registered suites. Also validate the portfolio with `python3.13 games/run_games.py --validate` and inspect the served page for console errors, real controls, camera/zoom and reset behavior. Follow the [repository testing guide](../../docs/development/testing_guide.md); Node logic results alone do not establish browser correctness. Report only checks actually run, without permanent passing-count claims.
