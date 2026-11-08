# 4D Bomberman maintenance — Raw-grid bombs and logical-tick explosions

Read the [game guide](README.md), [repository instructions](../../AGENTS.md) and [portfolio contracts](../../docs/games.md) before changing behavior. This folder is a browser game, not the native QuadCraft runtime.

## Source ownership

- [index.html](index.html) is authoritative for script order, page controls and construction.
- [js/README.md](js/README.md) maps `BombermanBoard`, `BombermanRenderer` and `BombermanGame` to their actual files.
- [tests/README.md](tests/README.md) records the actual source paths and historical browser-runner limitations.

## Preserve game-specific invariants

Preserve raw keys and the eight signed movement/explosion directions. Keep logical bomb ticks separate from fixed-second loop callback units; examine paused event callbacks explicitly.

One `board.step()` runs per 200 ms loop tick. Bomb timers and enemy motion are logical-step quantities; they are not seconds passed to a continuous integrator.

## Supported scope

Pause stops scheduled steps, but movement/bomb key callbacks only guard game-over state, not pause. Shared pathfinding/entity scripts being loaded does not make every board action use them. This is not a physical tetrahedral tessellation.

Do not infer inherited APIs from scripts merely being loaded. Keep raw storage, normalized physical points, graph edges and display geometry separate. Link shared math rather than copying a conflicting distance formula or fabricated local `quadray.js` API.

## Verification expectations

From the QuadCraft root, use `python3.13 games/run_games.py --test --game bomberman` for the registered suites. Also validate the portfolio with `python3.13 games/run_games.py --validate` and inspect the served page for console errors, real controls, camera/zoom and reset behavior. Follow the [repository testing guide](../../docs/development/testing_guide.md); Node logic results alone do not establish browser correctness. Report only checks actually run, without permanent passing-count claims.
