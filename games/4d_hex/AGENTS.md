# 4D Hex maintenance — Canonical FCC paths between opposing faces

Read the [game guide](README.md), [repository instructions](../../AGENTS.md) and [portfolio contracts](../../docs/games.md) before changing behavior. This folder is a browser game, not the native QuadCraft runtime.

## Source ownership

- [index.html](index.html) is authoritative for script order, page controls and construction.
- [js/README.md](js/README.md) maps `HexBoard`, `HexRenderer` and `HexGame` to their actual files.
- [tests/README.md](tests/README.md) records the actual source paths and historical browser-runner limitations.

## Preserve game-specific invariants

Preserve canonical cells and the exact face conditions. A winning fixture must follow real bounded-neighbor edges, not assume arbitrary coefficient-axis steps are FCC contacts.

Placement and win detection are discrete actions; no continuous board simulation runs in the inherited update hook.

## Supported scope

This is a bounded three-dimensional FCC connection adaptation, not ordinary planar Hex. Planar Hex’s no-draw theorem and standard strategy do not transfer automatically. It has no AI, network opponent or general analysis engine.

Do not infer inherited APIs from scripts merely being loaded. Keep raw storage, normalized physical points, graph edges and display geometry separate. Link shared math rather than copying a conflicting distance formula or fabricated local `quadray.js` API.

## Verification expectations

From the QuadCraft root, use `python3.13 games/run_games.py --test --game hex` for the registered suites. Also validate the portfolio with `python3.13 games/run_games.py --validate` and inspect the served page for console errors, real controls, camera/zoom and reset behavior. Follow the [repository testing guide](../../docs/development/testing_guide.md); Node logic results alone do not establish browser correctness. Report only checks actually run, without permanent passing-count claims.
