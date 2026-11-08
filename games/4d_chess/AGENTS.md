# 4D Quadray Chess maintenance — Directed piece moves on a canonical Quadray board

Read the [game guide](README.md), [repository instructions](../../AGENTS.md) and [portfolio contracts](../../docs/games.md) before changing behavior. This folder is a browser game, not the native QuadCraft runtime.

## Source ownership

- [index.html](index.html) is authoritative for script order, page controls and construction.
- [js/README.md](js/README.md) maps `Board`, `Renderer` and `Game` to their actual files.
- [tests/README.md](tests/README.md) records the actual source paths and historical browser-runner limitations.

## Preserve game-specific invariants

Preserve canonical keys, inclusive normalized bounds and directed piece offsets. Keep pseudo-legal move generation distinct from check detection. Audit real TurnManager records before claiming persistence/history compatibility.

Turns are discrete. A shared loop refreshes HUD/selected-piece view, while autoplay uses an independent browser interval (1000 ms by default). Loop pause does not stop that interval or globally gate click/key commands.

## Supported scope

This is not full orthodox chess: generated moves are not filtered for self-check; kings can be captured; castling, en passant and pawn promotion are absent. Save/Load and move-history analysis retain legacy flat records that do not match the controller’s TurnManager-wrapped history/getter-only state; do not rely on a working round-trip.

Do not infer inherited APIs from scripts merely being loaded. Keep raw storage, normalized physical points, graph edges and display geometry separate. Link shared math rather than copying a conflicting distance formula or fabricated local `quadray.js` API.

## Verification expectations

From the QuadCraft root, use `python3.13 games/run_games.py --test --game chess` for the registered suites. Also validate the portfolio with `python3.13 games/run_games.py --validate` and inspect the served page for console errors, real controls, camera/zoom and reset behavior. Follow the [repository testing guide](../../docs/development/testing_guide.md); Node logic results alone do not establish browser correctness. Report only checks actually run, without permanent passing-count claims.
