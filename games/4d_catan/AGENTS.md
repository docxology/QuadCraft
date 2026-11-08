# 4D Catan maintenance — Turn phases, resource tiles and a local heuristic opponent

Read the [game guide](README.md), [repository instructions](../../AGENTS.md) and [portfolio contracts](../../docs/games.md) before changing behavior. This folder is a browser game, not the native QuadCraft runtime.

## Source ownership

- [index.html](index.html) is authoritative for script order, page controls and construction.
- [js/README.md](js/README.md) maps `CatanBoard`, `CatanRenderer` and `CatanGame` to their actual files.
- [tests/README.md](tests/README.md) records the actual source paths and historical browser-runner limitations.

## Preserve game-specific invariants

Keep board resource accounting separate from controller phases and helper effects. Preserve HTML load order: board constants precede card/trading/robber/AI helpers. Do not infer complete standard-Catan legality or pause ownership from the shared base.

This is an action-driven turn game, not continuous physics. After a human end-turn, a browser timeout schedules the AI after 500 ms; this timer is independent of the shared render-loop pause.

## Supported scope

Building/neighbor rules are this adaptation’s implementation, not standard Catan guarantees: neighbor tiles use a physical-distance threshold and road creation is not a full standard-road legality validator. Action handlers and pending AI timeouts are not globally frozen by loop pause.

Do not infer inherited APIs from scripts merely being loaded. Keep raw storage, normalized physical points, graph edges and display geometry separate. Link shared math rather than copying a conflicting distance formula or fabricated local `quadray.js` API.

## Verification expectations

From the QuadCraft root, use `python3.13 games/run_games.py --test --game catan` for the registered suites. Also validate the portfolio with `python3.13 games/run_games.py --validate` and inspect the served page for console errors, real controls, camera/zoom and reset behavior. Follow the [repository testing guide](../../docs/development/testing_guide.md); Node logic results alone do not establish browser correctness. Report only checks actually run, without permanent passing-count claims.
