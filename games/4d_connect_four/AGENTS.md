# 4D Connect Four maintenance — Raw-slot gravity, undo and local AI

Read the [game guide](README.md), [repository instructions](../../AGENTS.md) and [portfolio contracts](../../docs/games.md) before changing behavior. This folder is a browser game, not the native QuadCraft runtime.

## Source ownership

- [index.html](index.html) is authoritative for script order, page controls and construction.
- [js/README.md](js/README.md) maps `ConnectFourBoard`, `ConnectFourRenderer` and `ConnectFourGame` to their actual files.
- [tests/README.md](tests/README.md) records the actual source paths and historical browser-runner limitations.

## Preserve game-specific invariants

Never normalize slot keys or use gauge-aware equality for winning lines. Undo restores the preceding human decision when AI is enabled; preserve single-timeout ownership and fixed-P2 search evaluation.

Drops and turns are discrete. AI replies are queued with one 400 ms browser timeout; new/reset/undo and AI ownership changes cancel a pending reply. This timeout is separate from the render loop.

## Supported scope

Easy uses random choice after immediate win/block checks; medium uses position evaluation; hard uses depth-three alpha-beta. This is not a solved or measured-strength engine. A pending AI timeout is not paused by stopping the render loop.

Do not infer inherited APIs from scripts merely being loaded. Keep raw storage, normalized physical points, graph edges and display geometry separate. Link shared math rather than copying a conflicting distance formula or fabricated local `quadray.js` API.

## Verification expectations

From the QuadCraft root, use `python3.13 games/run_games.py --test --game connect_four` for the registered suites. Also validate the portfolio with `python3.13 games/run_games.py --validate` and inspect the served page for console errors, real controls, camera/zoom and reset behavior. Follow the [repository testing guide](../../docs/development/testing_guide.md); Node logic results alone do not establish browser correctness. Report only checks actually run, without permanent passing-count claims.
