# 4D Breakout maintenance — Logical-step ball motion and three-axis paddle control

Read the [game guide](README.md), [repository instructions](../../AGENTS.md) and [portfolio contracts](../../docs/games.md) before changing behavior. This folder is a browser game, not the native QuadCraft runtime.

## Source ownership

- [index.html](index.html) is authoritative for script order, page controls and construction.
- [js/README.md](js/README.md) maps `BreakoutBoard`, `BreakoutRenderer` and `BreakoutGame` to their actual files.
- [tests/README.md](tests/README.md) records the actual source paths and historical browser-runner limitations.

## Preserve game-specific invariants

Do not add a second seconds multiplier to per-step motion or describe rounded raw brick contact as physical collision. Keep score/life synchronization between board and controller.

The controller polls held paddle keys and calls `board.step()` every 20 ms. Ball velocity and the 0.5 paddle increment are per logical step; the callback ignores dt rather than integrating physical units per second.

## Supported scope

The collision model is rounded-cell/raw-component arcade logic, not the Asteroids swept-collision model or a general physics engine. Clearing bricks rebuilds the next level rather than ending a finite campaign.

Do not infer inherited APIs from scripts merely being loaded. Keep raw storage, normalized physical points, graph edges and display geometry separate. Link shared math rather than copying a conflicting distance formula or fabricated local `quadray.js` API.

## Verification expectations

From the QuadCraft root, use `python3.13 games/run_games.py --test --game breakout` for the registered suites. Also validate the portfolio with `python3.13 games/run_games.py --validate` and inspect the served page for console errors, real controls, camera/zoom and reset behavior. Follow the [repository testing guide](../../docs/development/testing_guide.md); Node logic results alone do not establish browser correctness. Report only checks actually run, without permanent passing-count claims.
